import { t } from '../i18n';
import { EXISTING_MARKETS, byCountryName, isExistingMarket } from './dimensions';
import { BUDGET_LINES } from './meta';
import type { Audience, Budget, BudgetLine, IsoDate, Item, MarketRevenue } from './types';

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
      return item.participation === 'exposant' ? 'beurzen_exposant' : item.participation === 'bezoeker' ? 'beurzen_bezoeker' : undefined;
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
