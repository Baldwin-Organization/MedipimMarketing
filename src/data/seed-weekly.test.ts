import { addWeeks, startOfISOWeek } from 'date-fns';
import { describe, expect, it } from 'vitest';
import { fromIso, toIso } from './dates';
import { buildSeed, fillAndScheduleWeekly } from './seed';
import type { Item } from './types';
import { WEEKLY_CHANNEL, WEEKLY_FROM, WEEKLY_TO, scheduleWeekly } from './seed-weekly';

const build = () => { let n = 0; return buildSeed(() => `id${n++}`); };
const weekOf = (iso: string) => toIso(startOfISOWeek(fromIso(iso)));
const isWeekly = (i: Item) => !!i.contentId && !i.campaign && i.channel === WEEKLY_CHANNEL;

describe('weekly rhythm on the Medipim page', () => {
  it('has a post in every week from December 2026 to December 2027', () => {
    const data = build();
    const weeks = new Set(data.items.filter((i) => i.type === 'social' && i.channel === WEEKLY_CHANNEL).map((i) => weekOf(i.date)));
    for (let w = startOfISOWeek(fromIso(WEEKLY_FROM)); toIso(w) <= WEEKLY_TO; w = addWeeks(w, 1)) expect(weeks).toContain(toIso(w));
  });

  it('gives every planned piece one post, with its month and weekday to-dos', () => {
    const data = build();
    const weekly = data.items.filter((i) => isWeekly(i));
    for (const post of weekly) {
      expect(data.content.find((p) => p.id === post.contentId)?.month).toBe(post.date.slice(0, 7));
      const todos = data.todos.filter((t) => t.itemId === post.id);
      expect(todos).toHaveLength(4);
      expect(todos.every((t) => ![0, 6].includes(fromIso(t.dueDate).getDay()))).toBe(true);
    }
    expect(new Set(weekly.map((i) => i.contentId)).size).toBe(weekly.length);
    expect(data.items.find((i) => i.title === 'Kom ons bezoeken op PharmagoraPlus')?.contentId).toBe('content-pharmagora');
  });

  it('fills data that predates it once, and leaves a full calendar alone', () => {
    const data = build();
    expect(scheduleWeekly(data, () => 'x')).toEqual({ items: [], todos: [], content: [] });

    const dec = ['content-new-ux-highlights', 'content-new-ux-question', 'content-year-greeting', 'content-2026-numbers', 'content-2027-numbers'];
    const old = {
      ...data,
      items: data.items.filter((i) => !isWeekly(i)).map((i) => (i.contentId === 'content-pharmagora' ? { ...i, contentId: undefined } : i)),
      content: data.content.filter((p) => !dec.includes(p.id)),
    };
    const changes = fillAndScheduleWeekly({ ...old, todos: [] });
    expect(changes.content?.filter((p) => dec.includes(p.id))).toHaveLength(5);
    expect(changes.items?.filter(isWeekly)).toHaveLength(data.items.filter(isWeekly).length);
  });
});
