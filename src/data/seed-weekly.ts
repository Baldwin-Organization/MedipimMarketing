import { addWeeks, startOfISOWeek } from 'date-fns';
import { daysBetween, fromIso, shiftIso, toIso } from './dates';
import type { Contents } from './repository';
import { todosFromTemplate } from './schedule';
import { MONTH_END_PIECES } from './seed-content';
import type { ContentPiece, IsoDate, Item, Todo } from './types';

export const WEEKLY_CHANNEL = 'LinkedIn · Medipim';
/** First and last day of the weekly rhythm. */
export const WEEKLY_FROM: IsoDate = '2026-12-01';
export const WEEKLY_TO: IsoDate = '2027-12-31';

/** Event posts that publish a content piece. */
const EVENT_POST_CONTENT: Record<string, string> = {
  'Kom ons bezoeken op PharmagoraPlus': 'content-pharmagora',
  'Terugblik op Expopharm': 'content-expopharm-recap',
};

/** Saturday and Sunday move to the Friday before, so preparation is done before the weekend. */
const beforeWeekend = (iso: IsoDate) => ({ 6: shiftIso(iso, -1), 0: shiftIso(iso, -2) } as Record<number, IsoDate>)[fromIso(iso).getDay()] ?? iso;

/** The Tuesday of every week in the rhythm that has no post on the Medipim page yet. */
function freeTuesdays(items: Item[]): IsoDate[] {
  const taken = new Set(items
    .filter((i) => i.type === 'social' && i.channel === WEEKLY_CHANNEL)
    .map((i) => toIso(startOfISOWeek(fromIso(i.date)))));
  const days: IsoDate[] = [];
  for (let week = startOfISOWeek(fromIso(WEEKLY_FROM)); toIso(week) <= WEEKLY_TO; week = addWeeks(week, 1)) {
    if (!taken.has(toIso(week))) days.push(shiftIso(toIso(week), 1));
  }
  return days;
}

/** By month; within a month alternating between pillars, with the pieces that close a month at its end. */
function inPublishingOrder(pieces: ContentPiece[], pillarOrder: string[]): ContentPiece[] {
  const months = [...new Set(pieces.map((p) => p.month!))].sort();
  return months.flatMap((month) => {
    const inMonth = pieces.filter((p) => p.month === month);
    const closing = MONTH_END_PIECES.flatMap((id) => inMonth.filter((p) => p.id === id));
    const queues = pillarOrder.map((id) => inMonth.filter((p) => p.pillarId === id && !closing.includes(p)));
    const alternating: ContentPiece[] = [];
    while (queues.some((q) => q.length)) for (const q of queues) if (q.length) alternating.push(q.shift()!);
    return [...alternating, ...closing];
  });
}

/**
 * One post a week on the Medipim page from December 2026 to December 2027: every planned piece without a
 * calendar item gets the next free week, in publishing order. A piece that moves to another month gets that month.
 */
export function scheduleWeekly(data: Pick<Contents, 'items' | 'content' | 'pillars'>, makeId: () => string): Pick<Contents, 'items' | 'todos' | 'content'> {
  const now = new Date().toISOString();
  const linked = data.items.flatMap((i) => {
    const contentId = EVENT_POST_CONTENT[i.title];
    return !i.contentId && contentId && data.content.some((p) => p.id === contentId) ? [{ ...i, contentId, updatedAt: now }] : [];
  });
  const published = new Set([...data.items, ...linked].map((i) => i.contentId).filter(Boolean));
  const open = data.content.filter((p) =>
    !p.recurring && p.status !== 'gedeeld' && p.format !== 'nieuwsbrief' && !published.has(p.id)
    && !!p.month && p.month >= WEEKLY_FROM.slice(0, 7) && p.month <= WEEKLY_TO.slice(0, 7));
  const pillarOrder = [...data.pillars].sort((a, b) => a.order - b.order).map((p) => p.id);
  const days = freeTuesdays(data.items);
  const pairs = inPublishingOrder(open, pillarOrder).slice(0, days.length).map((piece, n) => ({ piece, date: days[n] }));

  const items = pairs.map(({ piece, date }): Item => ({
    id: makeId(),
    type: 'social',
    title: piece.title,
    description: piece.description,
    channel: WEEKLY_CHANNEL,
    date,
    time: '10:00',
    status: 'gepland',
    owner: piece.owner,
    campaign: '',
    audiences: piece.audiences,
    productTypes: [],
    countries: [],
    translations: { en: { title: piece.translations?.en?.title, description: piece.translations?.en?.description } },
    contentId: piece.id,
    createdAt: now,
    updatedAt: now,
  }));
  const todos: Todo[] = items.flatMap((item) => todosFromTemplate(item, makeId).map((t) => {
    const dueDate = beforeWeekend(t.dueDate);
    return { ...t, dueDate, offsetDays: daysBetween(item.date, dueDate) };
  }));
  const content = pairs
    .filter(({ piece, date }) => piece.month !== date.slice(0, 7))
    .map(({ piece, date }) => ({ ...piece, month: date.slice(0, 7), updatedAt: now }));
  return { items: [...linked, ...items], todos, content };
}
