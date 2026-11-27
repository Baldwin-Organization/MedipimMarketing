import { daysBetween } from './dates';
import type { IsoDate, Item, ItemType } from './types';

/** Shapes of the answers of /api/impact/*, see `server/`. */
export interface SearchMetrics { clicks: number; impressions: number; ctr: number; position: number }
export interface SearchData {
  site: string;
  total: SearchMetrics;
  previous: SearchMetrics;
  days: { date: IsoDate; clicks: number; impressions: number; position: number }[];
  queries: { query: string; clicks: number; impressions: number; position: number; before: number | null }[];
}

export interface AnalyticsMetrics { sessions: number; totalUsers: number; keyEvents: number }
export interface AnalyticsData {
  property: string;
  total: AnalyticsMetrics;
  previous: AnalyticsMetrics;
  days: ({ date: IsoDate } & AnalyticsMetrics)[];
  channels: ({ channel: string } & AnalyticsMetrics)[];
  pages: ({ page: string } & AnalyticsMetrics)[];
  countries: ({ country: string } & AnalyticsMetrics)[];
}

export interface Deal { id: string; title: string; customer: string | null; country: string | null; created: IsoDate; status: string; phase: string | null; source: string | null; value: number; url: string }
export interface DealPhase { id: string; name: string; order: number; pipeline: string }
export interface TeamleaderData { phases: DealPhase[]; deals: Deal[] }

/** The answer of one source: its data, or why there is none. */
export type Source<T> =
  | { state: 'loading' }
  | { state: 'ready'; data: T }
  | { state: 'not_configured' | 'no_access' | 'error'; message?: string };

export async function fetchSource<T>(route: 'search' | 'analytics' | 'teamleader', from: IsoDate, to: IsoDate, fresh = false): Promise<Source<T>> {
  try {
    const res = await fetch(`/api/impact/${route}?from=${from}&to=${to}${fresh ? '&fresh=1' : ''}`);
    const body = await res.json().catch(() => ({}));
    if (res.ok) return { state: 'ready', data: body as T };
    const state = body.error === 'not_configured' || body.error === 'no_access' ? body.error : 'error';
    return { state, message: body.message };
  } catch (err) {
    return { state: 'error', message: err instanceof Error ? err.message : String(err) };
  }
}

/** Relative change against the previous period; null when there is nothing to compare with. */
export function change(now: number, before: number): number | null {
  return before ? (now - before) / before : null;
}

/** Deals per phase in pipeline order, with their count and estimated value. */
export function funnel(data: TeamleaderData) {
  return [...data.phases]
    .sort((a, b) => a.pipeline.localeCompare(b.pipeline) || a.order - b.order)
    .map((phase) => {
      const deals = data.deals.filter((d) => d.phase === phase.id);
      return { phase, count: deals.length, value: deals.reduce((n, d) => n + d.value, 0) };
    });
}

/** Deals per source, most first; deals without a source come last under `null`. */
export function bySource(deals: Deal[]) {
  const counts = new Map<string | null, number>();
  for (const d of deals) counts.set(d.source, (counts.get(d.source) ?? 0) + 1);
  return [...counts].map(([source, count]) => ({ source, count }))
    .sort((a, b) => (a.source === null ? 1 : b.source === null ? -1 : b.count - a.count));
}

/** Counts per week (starting Monday) between two dates, so empty weeks show too. */
export function perWeek(dates: IsoDate[], from: IsoDate, to: IsoDate): { week: IsoDate; count: number }[] {
  const monday = (iso: IsoDate) => {
    const d = new Date(`${iso}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  };
  const weeks: { week: IsoDate; count: number }[] = [];
  for (let w = monday(from); w <= to; w = new Date(Date.parse(w) + 7 * 86_400_000).toISOString().slice(0, 10)) weeks.push({ week: w, count: 0 });
  for (const date of dates) {
    const week = weeks.find((w) => w.week === monday(date));
    if (week) week.count++;
  }
  return weeks;
}

/** Planner actions that can move traffic or leads; weekly social posts would drown the rest. */
const MARKED: ItemType[] = ['email', 'campaign', 'event', 'pr', 'call'];

/** The actions from the planner that started within the period, for the marks on the charts. */
export function actionsIn(items: Item[], from: IsoDate, to: IsoDate): Item[] {
  return items
    .filter((i) => MARKED.includes(i.type) && i.date >= from && i.date <= to && (i.type !== 'event' || i.participation === 'exposant' || i.participation === 'bezoeker'))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** Days from `from` to `to` inclusive, so a chart has a slot for days without data. */
export function daysOf(from: IsoDate, to: IsoDate): IsoDate[] {
  const n = daysBetween(from, to);
  return Array.from({ length: n + 1 }, (_, i) => new Date(Date.parse(`${from}T12:00:00Z`) + i * 86_400_000).toISOString().slice(0, 10));
}
