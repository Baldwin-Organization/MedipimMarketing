import { describe, expect, it } from 'vitest';
import { actionsIn, bySource, change, daysOf, funnel, perWeek, type Deal, type TeamleaderData } from './impact';
import type { Item } from './types';

const deal = (over: Partial<Deal>): Deal => ({ id: 'd', title: 'Deal', customer: null, country: null, created: '2026-11-03', status: 'open', phase: 'p1', source: null, value: 0, url: '', ...over });

describe('impact', () => {
  it('compares with the period before, and gives up when that was empty', () => {
    expect(change(150, 100)).toBe(0.5);
    expect(change(5, 0)).toBeNull();
  });

  it('counts deals and their value per phase in pipeline order', () => {
    const data: TeamleaderData = {
      phases: [{ id: 'p2', name: 'Demo gepland', order: 2, pipeline: 'Sales' }, { id: 'p1', name: 'Nieuw', order: 0, pipeline: 'Sales' }],
      deals: [deal({ id: 'a', phase: 'p1', value: 100 }), deal({ id: 'b', phase: 'p1', value: 50 }), deal({ id: 'c', phase: 'p2', value: 900 })],
    };
    expect(funnel(data).map((s) => [s.phase.name, s.count, s.value])).toEqual([['Nieuw', 2, 150], ['Demo gepland', 1, 900]]);
  });

  it('lists sources by count with deals without a source last', () => {
    const deals = [deal({ source: null }), deal({ source: 'Website' }), deal({ source: 'Website' }), deal({ source: 'Expopharm' }), deal({ source: null })];
    expect(bySource(deals)).toEqual([{ source: 'Website', count: 2 }, { source: 'Expopharm', count: 1 }, { source: null, count: 2 }]);
  });

  it('buckets per week from Monday and keeps empty weeks', () => {
    expect(perWeek(['2026-11-03', '2026-11-08', '2026-11-20'], '2026-11-01', '2026-11-22')).toEqual([
      { week: '2026-10-26', count: 0 }, { week: '2026-11-02', count: 2 }, { week: '2026-11-09', count: 0 }, { week: '2026-11-16', count: 1 },
    ]);
  });

  it('marks mails, campaigns and events taken part in, but no social posts or skipped events', () => {
    const item = (over: Partial<Item>) => ({ id: over.title, type: 'email', date: '2026-11-10', ...over }) as Item;
    const items = [
      item({ title: 'mail' }),
      item({ title: 'post', type: 'social' }),
      item({ title: 'fair', type: 'event', participation: 'exposant', date: '2026-11-05' }),
      item({ title: 'skipped', type: 'event', participation: 'geen' }),
      item({ title: 'later', date: '2026-12-01' }),
    ];
    expect(actionsIn(items, '2026-11-01', '2026-11-30').map((i) => i.title)).toEqual(['fair', 'mail']);
  });

  it('has a slot for every day of the period', () => {
    expect(daysOf('2026-11-29', '2026-12-02')).toEqual(['2026-11-29', '2026-11-30', '2026-12-01', '2026-12-02']);
  });
});
