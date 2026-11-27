import { describe, expect, it } from 'vitest';
import { autoBudgetLine, byAudience, byLine, byMarket, byQuarter, quarterOf } from './budget';
import type { Budget, Item } from './types';

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
});
