import { describe, expect, it } from 'vitest';
import { seedRevenues } from './potential';
import type { MarketRevenue } from './types';

describe('seedRevenues', () => {
  it('fills revenue 2024–2026 and targets 2027–2029 for the active markets', () => {
    const seeded = seedRevenues([]);
    expect(seeded).toHaveLength(8 * 6);
    expect(seeded.find((r) => r.id === '2026:BE')).toEqual({ id: '2026:BE', year: 2026, country: 'BE', revenue: 1040464 });
    expect(seeded.find((r) => r.id === '2029:FR')).toEqual({ id: '2029:FR', year: 2029, country: 'FR', target: 1061856 });
  });

  it('keeps what someone entered and only returns records it changes', () => {
    const existing: MarketRevenue[] = [
      { id: '2026:BE', year: 2026, country: 'BE', revenue: 1000000, target: 990000 },
      { id: '2027:FR', year: 2027, country: 'FR', revenue: 1 },
    ];
    const seeded = seedRevenues(existing);
    expect(seeded.some((r) => r.id === '2026:BE')).toBe(false);
    expect(seeded.find((r) => r.id === '2027:FR')).toEqual({ id: '2027:FR', year: 2027, country: 'FR', revenue: 1, target: 510664 });
    expect(seedRevenues([...seeded, ...existing.filter((e) => !seeded.some((s) => s.id === e.id))])).toEqual([]);
  });
});
