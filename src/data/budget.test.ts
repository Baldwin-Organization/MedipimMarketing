import { describe, expect, it } from 'vitest';
import { autoBudgetLine, byAudience, byCountry, byLine, byMarket, byQuarter, eventEstimate, quarterOf, withParticipation } from './budget';
import { EXISTING_MARKETS } from './dimensions';
import type { Budget, Item, MarketRevenue } from './types';

const item = (over: Partial<Item>): Item => ({
  id: Math.random().toString(36),
  type: 'campaign',
  title: 'x',
  date: '2027-02-10',
  channel: 'LinkedIn Ads',
  status: 'gepland',
  owner: '',
  campaign: '',
  description: '',
  audiences: [],
  productTypes: [],
  countries: [],
  languages: [],
  createdAt: '',
  updatedAt: '',
  ...over,
});

describe('budget', () => {
  const items = [
    item({ date: '2027-02-10', budgetPlanned: 1000, budgetActual: 800, audiences: ['groothandels', 'producenten'], countries: ['BE'] }),
    item({ type: 'pr', date: '2027-05-01', budgetPlanned: 600, countries: ['BE', 'IT'] }),
    item({ type: 'event', date: '2027-11-20', budgetPlanned: 3000, budgetActual: 3200, audiences: ['apothekers'] }),
    item({ date: '2026-12-01', budgetPlanned: 9999 }),
  ];
  const budgets: Budget[] = [{ id: '2027:linkedin', year: 2027, line: 'linkedin', amount: 5000 }];

  it('assigns quarters from the start date', () => {
    expect(quarterOf(item({ date: '2027-03-31' }))).toBe(1);
    expect(quarterOf(item({ date: '2027-04-01' }))).toBe(2);
    expect(quarterOf(item({ date: '2027-12-31' }))).toBe(4);
  });

  it('derives the budget line from type, channel and participation', () => {
    expect(autoBudgetLine(item({ type: 'event', participation: 'exposant' }))).toBe('beurzen_exposant');
    expect(autoBudgetLine(item({ type: 'event', participation: 'bezoeker' }))).toBe('beurzen_bezoeker');
    expect(autoBudgetLine(item({ type: 'event' }))).toBeUndefined();
    expect(autoBudgetLine(item({ channel: 'Google Ads' }))).toBe('google');
    expect(autoBudgetLine(item({ channel: 'ChatGPT Ads' }))).toBe('chatgpt');
    expect(autoBudgetLine(item({ channel: 'Gezamenlijke campagne' }))).toBe('vakmedia');
    expect(autoBudgetLine(item({ type: 'pr' }))).toBe('vakmedia');
    expect(autoBudgetLine(item({ type: 'call' }))).toBeUndefined();
  });

  it('totals per budget line for the selected year only, with an override and the unassigned rest', () => {
    const { rows, unassigned } = byLine([...items, item({ type: 'pr', budgetPlanned: 400, budgetLine: 'lidmaatschappen' })], budgets, 2027);
    expect(rows.find((r) => r.line === 'linkedin')).toMatchObject({ budget: 5000, planned: 1000, actual: 800 });
    expect(rows.find((r) => r.line === 'vakmedia')).toMatchObject({ budget: 0, planned: 600 });
    expect(rows.find((r) => r.line === 'lidmaatschappen')).toMatchObject({ planned: 400 });
    expect(unassigned).toEqual({ planned: 3000, actual: 3200 });
  });

  it('totals per quarter', () => {
    expect(byQuarter(items, 2027).map((q) => q.planned)).toEqual([1000, 600, 0, 3000]);
  });

  it('splits amounts evenly over audiences and markets, so groups add up to the total', () => {
    const a = byAudience(items, 2027);
    expect(a.get('groothandels')?.planned).toBe(500);
    expect(a.get('producenten')?.planned).toBe(500);
    expect(a.get('apothekers')?.actual).toBe(3200);
    expect(a.get('geen')?.planned).toBe(600);

    const m = byMarket(items, 2027);
    expect(m.get('bestaand')?.planned).toBe(1300);
    expect(m.get('nieuw')?.planned).toBe(300);
    expect(m.get('geen')?.planned).toBe(3000);
    const sum = [...m.values()].reduce((n, t) => n + t.planned, 0);
    expect(sum).toBe(4600);
  });

  it('counts costs per country next to last year\'s revenue and this year\'s target', () => {
    const revenues: MarketRevenue[] = [
      { id: '2026:BE', year: 2026, country: 'BE', revenue: 900000, target: 1 },
      { id: '2027:BE', year: 2027, country: 'BE', target: 1000000 },
      { id: '2027:NL', year: 2027, country: 'NL', target: 50000 },
    ];
    const { rows, none } = byCountry([...items, item({ countries: ['JP'] })], revenues, 2027);
    expect(rows.find((r) => r.country === 'BE')).toMatchObject({ planned: 1300, actual: 800, revenueBefore: 900000, target: 1000000 });
    expect(rows.find((r) => r.country === 'IT')).toMatchObject({ planned: 300, actual: 0 });
    expect(rows.find((r) => r.country === 'NL')).toMatchObject({ planned: 0, target: 50000 });
    expect(rows.find((r) => r.country === 'FR')).toMatchObject({ planned: 0, revenueBefore: undefined, target: undefined });
    expect(rows.some((r) => r.country === 'JP')).toBe(false);
    expect(rows).toHaveLength(EXISTING_MARKETS.length + 2);
    expect(none).toEqual({ planned: 3000, actual: 3200 });
  });

  it('estimates an event from the decision, region, kind of event and length', () => {
    const girp = item({ type: 'event', channel: 'Conferentie', countries: ['BG'], date: '2027-05-19', endDate: '2027-05-20' });
    expect(eventEstimate({ ...girp, participation: 'bezoeker' })).toBe(4000);
    expect(eventEstimate({ ...girp, participation: 'exposant' })).toBe(20000);
    const app = item({ type: 'event', channel: 'Beurs', countries: ['AU'], date: '2027-03-18', endDate: '2027-03-20' });
    expect(eventEstimate({ ...app, participation: 'bezoeker' })).toBe(5500);
    expect(eventEstimate({ ...app, participation: 'exposant' })).toBe(30000);
    expect(eventEstimate({ ...app, participation: 'campagne' })).toBe(2500);
    expect(eventEstimate({ ...app, participation: 'geen' })).toBeUndefined();
    expect(eventEstimate(app)).toBeUndefined();
    expect(autoBudgetLine({ ...app, participation: 'campagne' })).toBe('linkedin');
  });

  it('lets the planned amount follow a new decision unless someone changed it', () => {
    const fair = item({ type: 'event', channel: 'Beurs', countries: ['DE'], date: '2027-09-28', endDate: '2027-09-30' });
    const exhibiting = withParticipation(fair, 'exposant');
    expect(exhibiting.budgetPlanned).toBe(20000);
    expect(withParticipation(exhibiting, 'bezoeker').budgetPlanned).toBe(eventEstimate({ ...fair, participation: 'bezoeker' }));
    expect(withParticipation(exhibiting, 'geen').budgetPlanned).toBeUndefined();
    expect(withParticipation({ ...exhibiting, budgetPlanned: 17500 }, 'bezoeker')).toMatchObject({ participation: 'bezoeker', budgetPlanned: 17500 });
  });
});
