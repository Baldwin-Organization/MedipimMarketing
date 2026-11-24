import { describe, expect, it } from 'vitest';
import { contentMix, countBy, inPeriod, targetTotal } from './content';
import type { ContentPiece, ContentPillar } from './types';

const pillar = (id: string, target: number): ContentPillar => ({ id, name: id, description: '', target, accent: '1', order: 0 });
const piece = (over: Partial<ContentPiece>): ContentPiece => ({
  id: Math.random().toString(36), title: 'x', description: '', pillarId: 'a', format: 'post', status: 'idee',
  audiences: [], owner: '', createdAt: '', updatedAt: '', ...over,
});

describe('content mix', () => {
  const pillars = [pillar('a', 60), pillar('b', 40)];
  const pieces = [
    piece({ pillarId: 'a', status: 'gedeeld', month: '2027-01', audiences: ['apothekers', 'producenten'] }),
    piece({ pillarId: 'a', month: '2027-02', audiences: ['apothekers'] }),
    piece({ pillarId: 'a', format: 'video', month: '2026-12' }),
    piece({ pillarId: 'b', status: 'gedeeld' }),
  ];

  it('shares per pillar of planned and of shared pieces', () => {
    const mix = contentMix(pieces, pillars);
    expect(mix).toMatchObject({ planned: 4, shared: 2 });
    expect(mix.rows[0]).toMatchObject({ planned: 3, shared: 1, plannedShare: 75, sharedShare: 50 });
    expect(mix.rows[1]).toMatchObject({ planned: 1, shared: 1, plannedShare: 25, sharedShare: 50 });
    expect(contentMix([], pillars).rows[0].plannedShare).toBe(0);
    expect(targetTotal(pillars)).toBe(100);
  });

  it('scopes pieces to the year of their month; pieces without a month only count under all', () => {
    expect(pieces.filter((p) => inPeriod(p, '2027'))).toHaveLength(2);
    expect(pieces.filter((p) => inPeriod(p, 'all'))).toHaveLength(4);
  });

  it('counts a piece once for each of its keys', () => {
    const byAudience = countBy(pieces, (p) => p.audiences);
    expect(byAudience.get('apothekers')).toBe(2);
    expect(byAudience.get('producenten')).toBe(1);
    expect(countBy(pieces, (p) => [p.format]).get('video')).toBe(1);
  });
});
