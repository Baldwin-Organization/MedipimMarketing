import { describe, expect, it } from 'vitest';
import { buildSeed, seedUpdates } from './seed';

const seed = () => {
  let n = 0;
  return buildSeed(() => `id${n++}`).items.filter((i) => i.type === 'event');
};

describe('event participation', () => {
  it('marks the five exhibitor events and leaves the rest undecided', () => {
    const events = seed();
    const exhibiting = events.filter((e) => e.participation === 'exposant').map((e) => e.title).sort();
    expect(exhibiting).toEqual(['APP Conference and Trade Exhibition', 'Expopharm', 'GIRP PharmaConnect 2027', 'PharmagoraPlus', 'The Pharmacy Show']);
    expect(events.filter((e) => e.participation === 'exposant').every((e) => e.status === 'gepland')).toBe(true);
    expect(events.filter((e) => !e.participation)).toHaveLength(events.length - 5);
  });

  it('updates existing data that predates the decision, once', () => {
    const old = seed().map(({ participation: _, ...e }) => ({ ...e, status: 'idee' as const }));
    const updated = seedUpdates(old);
    expect(updated).toHaveLength(5);
    expect(updated.every((e) => e.participation === 'exposant' && e.status === 'gepland')).toBe(true);
    expect(seedUpdates(seed())).toHaveLength(0);
  });

  it('keeps a participation that was already chosen', () => {
    const events = seed().map((e) => (e.title === 'Expopharm' ? { ...e, participation: 'bezoeker' as const } : e));
    expect(seedUpdates(events).some((e) => e.title === 'Expopharm')).toBe(false);
  });
});
