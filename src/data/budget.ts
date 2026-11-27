import { t } from '../i18n';
import { EXISTING_MARKETS, byCountryName, isExistingMarket } from './dimensions';
import { BUDGET_LINES } from './meta';
import { daysBetween } from './dates';
import type { Audience, Budget, BudgetLine, IsoDate, Item, MarketRevenue, Participation } from './types';

/** An item's costs count in the year (and quarter) of its start date. */
export const yearOf = (item: Item) => Number(item.date.slice(0, 4));
export const quarterOf = (item: Item) => Math.floor((Number(item.date.slice(5, 7)) - 1) / 3) + 1;

/** The current year, or next year when only that one has a budget yet. */
export function budgetYear(budgets: Budget[], today: IsoDate): number {
  const current = Number(today.slice(0, 4));
  const hasBudget = (y: number) => budgets.some((b) => b.year === y && b.amount > 0);
  return !hasBudget(current) && hasBudget(current + 1) ? current + 1 : current;
}

export interface Totals { planned: number; actual: number }

const sum = (items: Item[]): Totals => ({
  planned: items.reduce((n, i) => n + (i.budgetPlanned ?? 0), 0),
  actual: items.reduce((n, i) => n + (i.budgetActual ?? 0), 0),
});

/** Not attending but running ads around an event counts as LinkedIn advertising. */
const EVENT_LINES: Partial<Record<Participation, BudgetLine>> = { exposant: 'beurzen_exposant', bezoeker: 'beurzen_bezoeker', campagne: 'linkedin' };

const CAMPAIGN_LINES: Record<string, BudgetLine> = {
  'LinkedIn Ads': 'linkedin',
  'Google Ads': 'google',
  'ChatGPT Ads': 'chatgpt',
  'Gezamenlijke campagne': 'vakmedia',
};

/** The line an item's costs count against when nobody picked one: follows from type, channel and participation. */
export function autoBudgetLine(item: Pick<Item, 'type' | 'channel' | 'participation'>): BudgetLine | undefined {
  switch (item.type) {
    case 'event':
      return item.participation && EVENT_LINES[item.participation];
    case 'email':
      return 'email';
    case 'social':
      return 'linkedin';
    case 'campaign':
      return CAMPAIGN_LINES[item.channel];
    case 'pr':
      return 'vakmedia';
    default:
      return undefined;
  }
}

/** Within reach by train or car from Belgium. */
const NEARBY = ['BE', 'NL', 'LU', 'FR', 'DE'];
const EUROPE = ['AT', 'CH', 'GB', 'IE', 'ES', 'PT', 'IT', 'MT', 'GR', 'PL', 'CZ', 'SK', 'HU', 'SI', 'HR', 'RO', 'BG', 'DK', 'SE', 'NO', 'FI', 'EE', 'LV', 'LT'];
type Region = 'nearby' | 'europe' | 'far';
const regionOf = (countries: string[]): Region =>
  countries.some((c) => !NEARBY.includes(c) && !EUROPE.includes(c)) ? 'far' : countries.some((c) => EUROPE.includes(c)) ? 'europe' : 'nearby';

/** Assumptions behind the estimates, euro excl. btw. */
export const ESTIMATE = {
  /** Stand, build, materials, travel and stay for the team. */
  exhibitor: { nearby: 20000, europe: 20000, far: 30000 },
  visitors: 2,
  ticket: { Beurs: 150, Conferentie: 900, Congres: 900, Netwerkevent: 600 } as Record<string, number>,
  travel: { nearby: 250, europe: 450, far: 1500 },
  hotelPerNight: 220,
  allowancePerDay: 60,
  /** LinkedIn ads around an event we do not attend. */
  campaign: 2500,
};

const roundUp = (n: number) => Math.ceil(n / 500) * 500;

/**
 * Estimated cost of an event following from the decision: a stand as exhibitor, ticket, travel and stay for two as visitor,
 * ads as campaign. Undecided and not going cost nothing.
 */
export function eventEstimate(item: Pick<Item, 'type' | 'participation' | 'countries' | 'channel' | 'date' | 'endDate'>): number | undefined {
  if (item.type !== 'event') return undefined;
  const region = regionOf(item.countries);
  switch (item.participation) {
    case 'exposant':
      return ESTIMATE.exhibitor[region];
    case 'bezoeker': {
      const days = daysBetween(item.date, item.endDate ?? item.date) + 1;
      const nights = days + (region === 'far' ? 1 : 0);
      const perPerson = (ESTIMATE.ticket[item.channel] ?? ESTIMATE.ticket.Conferentie) + ESTIMATE.travel[region]
        + nights * ESTIMATE.hotelPerNight + days * ESTIMATE.allowancePerDay;
      return roundUp(ESTIMATE.visitors * perPerson);
    }
    case 'campagne':
      return ESTIMATE.campaign;
    default:
      return undefined;
  }
}

/** The event with a new decision; a planned amount nobody changed by hand follows the estimate for that decision. */
export function withParticipation<T extends Pick<Item, 'type' | 'participation' | 'countries' | 'channel' | 'date' | 'endDate' | 'budgetPlanned'>>(item: T, participation: Item['participation']): T {
  const untouched = item.budgetPlanned == null || item.budgetPlanned === eventEstimate(item);
  const next = { ...item, participation };
  return untouched ? { ...next, budgetPlanned: eventEstimate(next) } : next;
}

export const budgetLineOf = (item: Pick<Item, 'type' | 'channel' | 'participation' | 'budgetLine'>): BudgetLine | undefined =>
  item.budgetLine === 'geen' ? undefined : item.budgetLine ?? autoBudgetLine(item);

export interface LineRow extends Totals { line: BudgetLine; budget: number }

/** Every budget line for the year, plus the costs of items that fall under none of them. */
export function byLine(items: Item[], budgets: Budget[], year: number): { rows: LineRow[]; unassigned: Totals } {
  const inYear = items.filter((i) => yearOf(i) === year);
  return {
    rows: BUDGET_LINES.map((line) => ({
      line,
      budget: budgets.find((b) => b.year === year && b.line === line)?.amount ?? 0,
      ...sum(inYear.filter((i) => budgetLineOf(i) === line)),
    })),
    unassigned: sum(inYear.filter((i) => !budgetLineOf(i))),
  };
}

export function byQuarter(items: Item[], year: number): (Totals & { quarter: number })[] {
  const inYear = items.filter((i) => yearOf(i) === year);
  return [1, 2, 3, 4].map((quarter) => ({ quarter, ...sum(inYear.filter((i) => quarterOf(i) === quarter)) }));
}

/**
 * Splits each item's amounts evenly over its groups, so the groups add up to the total.
 * Items without a group land in `none`.
 */
function splitOver<K extends string>(items: Item[], groupsOf: (i: Item) => K[], none: K): Map<K, Totals> {
  const out = new Map<K, Totals>();
  const add = (k: K, planned: number, actual: number) => {
    const t = out.get(k) ?? { planned: 0, actual: 0 };
    out.set(k, { planned: t.planned + planned, actual: t.actual + actual });
  };
  for (const i of items) {
    const groups = groupsOf(i);
    const keys = groups.length ? groups : [none];
    keys.forEach((k) => add(k, (i.budgetPlanned ?? 0) / keys.length, (i.budgetActual ?? 0) / keys.length));
  }
  return out;
}

export function byAudience(items: Item[], year: number) {
  return splitOver<Audience | 'geen'>(items.filter((i) => yearOf(i) === year), (i) => i.audiences, 'geen');
}

export type MarketGroup = 'bestaand' | 'nieuw' | 'geen';

export function byMarket(items: Item[], year: number) {
  return splitOver<MarketGroup>(
    items.filter((i) => yearOf(i) === year),
    (i) => [...new Set(i.countries.map((c): MarketGroup => (isExistingMarket(c) ? 'bestaand' : 'nieuw')))],
    'geen',
  );
}

export interface CountryRow extends Totals {
  country: string;
  /** Revenue achieved the year before. */
  revenueBefore?: number;
  /** Revenue target for the year. */
  target?: number;
}

/**
 * Costs per country for the year, with last year's revenue and this year's target. The active markets always get a row,
 * other countries once they have costs or figures. Costs of items without a country land in `none`.
 */
export function byCountry(items: Item[], revenues: MarketRevenue[], year: number): { rows: CountryRow[]; none: Totals } {
  const costs = splitOver<string>(items.filter((i) => yearOf(i) === year), (i) => i.countries, '');
  const figure = (y: number, country: string) => revenues.find((r) => r.year === y && r.country === country);
  const withFigures = revenues
    .filter((r) => (r.year === year && r.target != null) || (r.year === year - 1 && r.revenue != null))
    .map((r) => r.country);
  const withCosts = [...costs].filter(([c, t]) => c && (t.planned || t.actual)).map(([c]) => c);
  const countries = [...new Set([...EXISTING_MARKETS, ...withCosts, ...withFigures])].sort(byCountryName);
  return {
    rows: countries.map((country) => ({
      country,
      ...(costs.get(country) ?? { planned: 0, actual: 0 }),
      revenueBefore: figure(year - 1, country)?.revenue,
      target: figure(year, country)?.target,
    })),
    none: costs.get('') ?? { planned: 0, actual: 0 },
  };
}

export const euro = (n: number) =>
  new Intl.NumberFormat(t.numberLocale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
