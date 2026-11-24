import { isExistingMarket } from './dimensions';
import { ITEM_TYPES } from './meta';
import type { Audience, Budget, Item, ItemType } from './types';

/** An item's costs count in the year (and quarter) of its start date. */
export const yearOf = (item: Item) => Number(item.date.slice(0, 4));
export const quarterOf = (item: Item) => Math.floor((Number(item.date.slice(5, 7)) - 1) / 3) + 1;

export interface Totals { planned: number; actual: number }

const sum = (items: Item[]): Totals => ({
  planned: items.reduce((n, i) => n + (i.budgetPlanned ?? 0), 0),
  actual: items.reduce((n, i) => n + (i.budgetActual ?? 0), 0),
});

export interface TypeRow extends Totals { type: ItemType; budget: number }

export function byType(items: Item[], budgets: Budget[], year: number): TypeRow[] {
  const inYear = items.filter((i) => yearOf(i) === year);
  return ITEM_TYPES.map((type) => ({
    type,
    budget: budgets.find((b) => b.year === year && b.type === type)?.amount ?? 0,
    ...sum(inYear.filter((i) => i.type === type)),
  }));
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

const euroFormat = new Intl.NumberFormat('nl-BE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
export const euro = (n: number) => euroFormat.format(n);
