import { describe, expect, it } from 'vitest';
import { byAudience, byMarket, byQuarter, byType, quarterOf } from './budget';
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
  const budgets: Budget[] = [{ id: '2027:campaign', year: 2027, type: 'campaign', amount: 5000 }];

  it('assigns quarters from the start date', () => {
    expect(quarterOf(item({ date: '2027-03-31' }))).toBe(1);
    expect(quarterOf(item({ date: '2027-04-01' }))).toBe(2);
    expect(quarterOf(item({ date: '2027-12-31' }))).toBe(4);
  });

  it('totals per type for the selected year only', () => {
    const rows = byType(items, budgets, 2027);
    expect(rows.find((r) => r.type === 'campaign')).toMatchObject({ budget: 5000, planned: 1000, actual: 800 });
    expect(rows.find((r) => r.type === 'event')).toMatchObject({ budget: 0, planned: 3000, actual: 3200 });
    expect(rows.find((r) => r.type === 'social')).toMatchObject({ planned: 0, actual: 0 });
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
