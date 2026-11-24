import type { ContentPiece, ContentPillar } from './types';

/** `all`, or a year: pieces count in the year of their planned month; pieces without a month only under `all`. */
export type ContentPeriod = 'all' | `${number}`;

export const inPeriod = (piece: ContentPiece, period: ContentPeriod) => period === 'all' || piece.month?.startsWith(`${period}-`) === true;

export interface MixRow {
  pillar: ContentPillar;
  planned: number;
  shared: number;
  /** 0–100, of all planned or shared pieces. */
  plannedShare: number;
  sharedShare: number;
}

/** Per pillar: how many pieces are planned and shared, and their share of the total, next to the pillar's target. */
export function contentMix(pieces: ContentPiece[], pillars: ContentPillar[]): { rows: MixRow[]; planned: number; shared: number } {
  const planned = pieces.length;
  const shared = pieces.filter((p) => p.status === 'gedeeld').length;
  const share = (n: number, total: number) => (total ? (n / total) * 100 : 0);
  const rows = pillars.map((pillar) => {
    const mine = pieces.filter((p) => p.pillarId === pillar.id);
    const done = mine.filter((p) => p.status === 'gedeeld').length;
    return { pillar, planned: mine.length, shared: done, plannedShare: share(mine.length, planned), sharedShare: share(done, shared) };
  });
  return { rows, planned, shared };
}

export const targetTotal = (pillars: ContentPillar[]) => pillars.reduce((n, p) => n + p.target, 0);

/** Counts pieces per key; a piece with several keys counts once for each. */
export function countBy<K extends string>(pieces: ContentPiece[], keysOf: (p: ContentPiece) => K[]): Map<K, number> {
  const out = new Map<K, number>();
  for (const p of pieces) for (const k of keysOf(p)) out.set(k, (out.get(k) ?? 0) + 1);
  return out;
}
