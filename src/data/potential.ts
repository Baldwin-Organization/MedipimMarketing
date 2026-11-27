import type { MarketRevenue } from './types';

/** Community pharmacies per country, latest published figures (2025–2026); sources in the README. */
export const PHARMACIES: Record<string, number> = {
  BE: 4581,
  FR: 19990,
  DE: 16444,
  GB: 13779,
  AT: 1415,
  LU: 100,
  ES: 22220,
  US: 51706,
  AU: 6013,
  IT: 19759,
  PL: 12891,
  GR: 10541,
  PT: 2920,
  HU: 2260,
  NL: 1996,
  IE: 1905,
  CZ: 2471,
};

/** Belgium sets the potential per pharmacy: its revenue is assumed to be this share of its full potential. */
export const BENCHMARK = { country: 'BE', penetration: 0.9 };

/** What Medipim could earn per pharmacy, from the benchmark country's revenue in that year; undefined without that revenue. */
export function potentialPerPharmacy(revenues: MarketRevenue[], year: number): number | undefined {
  const revenue = revenues.find((r) => r.year === year && r.country === BENCHMARK.country)?.revenue;
  return revenue ? revenue / PHARMACIES[BENCHMARK.country] / BENCHMARK.penetration : undefined;
}

/** Price indexation per year, as used for the revenue targets; the potential per pharmacy grows along. */
export const INDEXATION: Record<number, number> = { 2027: 0.04, 2028: 0.03, 2029: 0.03 };

/** A country's full potential at a given potential per pharmacy; undefined when its pharmacies are unknown. */
export const potentialOf = (country: string, perPharmacy?: number) =>
  perPharmacy && PHARMACIES[country] ? Math.round(PHARMACIES[country] * perPharmacy) : undefined;

/** Revenue 2024–2026 and targets 2027–2029 per active market, from the budget overview of November 2026. */
const FIGURES: Record<string, { revenue: [number, number, number]; target: [number, number, number] }> = {
  BE: { revenue: [887967, 1005768, 1040464], target: [1125366, 1182309, 1242134] },
  FR: { revenue: [121825, 224105, 350731], target: [510664, 736377, 1061856] },
  DE: { revenue: [69513, 73960, 86843], target: [108380, 128376, 152061] },
  AT: { revenue: [40242, 50647, 68218], target: [85136, 100844, 119449] },
  LU: { revenue: [0, 12324, 20776], target: [22687, 26873, 31831] },
  AU: { revenue: [43, 5110, 16789], target: [24445, 28955, 34297] },
  ES: { revenue: [11812, 10006, 11146], target: [11940, 14143, 16752] },
  US: { revenue: [0, 1947, 7328], target: [10669, 12637, 14969] },
};

/** The known revenue figures and targets added to `existing`, without overwriting what someone entered; only changed records. */
export function seedRevenues(existing: MarketRevenue[]): MarketRevenue[] {
  const changed = new Map<string, MarketRevenue>();
  const fill = (year: number, country: string, field: 'revenue' | 'target', amount: number) => {
    const id = `${year}:${country}`;
    const record = changed.get(id) ?? existing.find((r) => r.id === id);
    if (record?.[field] != null) return;
    changed.set(id, { ...(record ?? { id, year, country }), [field]: amount });
  };
  for (const [country, { revenue, target }] of Object.entries(FIGURES)) {
    revenue.forEach((amount, n) => fill(2024 + n, country, 'revenue', amount));
    target.forEach((amount, n) => fill(2027 + n, country, 'target', amount));
  }
  return [...changed.values()];
}
