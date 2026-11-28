import { describe, expect, it } from 'vitest';
import { applyJiraStatus, moveItem, moveTodo, rollForward, scopeTodos, todosFromTemplate, urgencyOf, itemOnDay } from './schedule';
import { buildSeed } from './seed';
import type { Item, Todo } from './types';

const item: Item = {
  id: 'i1', type: 'event', title: 'Beurs', description: '', channel: 'Beurs',
  date: '2026-12-10', endDate: '2026-12-11', status: 'gepland', owner: 'Nele', campaign: 'X', audiences: [], productTypes: [], countries: [], languages: [],
  createdAt: '', updatedAt: '',
};
const todo = (over: Partial<Todo>): Todo => ({
  id: 't', itemId: 'i1', title: 'x', dueDate: '2026-11-20', done: false, offsetDays: -20, ...over,
});

describe('rollForward', () => {
  it('moves an open overdue to-do to today and counts the days late', () => {
    const s = rollForward(todo({ dueDate: '2026-11-20' }), '2026-11-24');
    expect(s.displayDate).toBe('2026-11-24');
    expect(s.lateDays).toBe(4);
    expect(s.dueDate).toBe('2026-11-20');
  });
  it('leaves done and future to-dos where they are', () => {
    expect(rollForward(todo({ done: true }), '2026-11-24').displayDate).toBe('2026-11-20');
    expect(rollForward(todo({ dueDate: '2026-11-30' }), '2026-11-24')).toMatchObject({ displayDate: '2026-11-30', lateDays: 0 });
  });
});

describe('urgencyOf', () => {
  const today = '2026-11-24';
  it.each([
    ['2026-11-20', false, 'late'],
    ['2026-11-24', false, 'today'],
    ['2026-11-30', false, 'week'],
    ['2026-12-15', false, 'later'],
    ['2026-11-20', true, 'done'],
  ] as const)('%s done=%s → %s', (dueDate, done, expected) => {
    expect(urgencyOf(rollForward(todo({ dueDate, done }), today), today)).toBe(expected);
  });
});

describe('moveItem', () => {
  it('shifts the period and every open linked to-do by the same offset', () => {
    const todos = [todo({ id: 'a', dueDate: '2026-11-20' }), todo({ id: 'b', dueDate: '2026-11-01', done: true }), todo({ id: 'c', itemId: 'other' })];
    const r = moveItem(item, todos, '2026-12-17');
    expect(r.item).toMatchObject({ date: '2026-12-17', endDate: '2026-12-18' });
    expect(r.todos).toEqual([expect.objectContaining({ id: 'a', dueDate: '2026-11-27' })]);
  });
});

describe('moveTodo', () => {
  it('re-anchors the offset to the item date', () => {
    expect(moveTodo(todo({}), item, '2026-12-01')).toMatchObject({ dueDate: '2026-12-01', offsetDays: -9 });
  });
});

describe('templates and seed', () => {
  it('creates event to-dos from the template, the stand eight weeks ahead', () => {
    let n = 0;
    const t = todosFromTemplate(item, () => `id${n++}`);
    expect(t[0]).toMatchObject({ title: 'Stand boeken', dueDate: '2026-10-15', offsetDays: -56 });
  });
  it('seeds the 2027 conference calendar unassigned, to-dos only for events we attend, undecided events as ideas', () => {
    let n = 0;
    const { items, todos } = buildSeed(() => `id${n++}`);
    const events = items.filter((i) => i.type === 'event');
    expect(events.length).toBe(59);
    expect(todos.every((t) => !events.some((e) => e.id === t.itemId && !e.participation))).toBe(true);
    expect(events.every((i) => i.status === (i.participation ? 'gepland' : 'idee') && i.owner === '')).toBe(true);
    expect(events.every((i) => /^2027-\d\d-\d\d$/.test(i.date) && i.endDate! >= i.date && itemOnDay(i, i.date))).toBe(true);
  });

  it('seeds the UX launch communication with to-dos relative to each item', () => {
    let n = 0;
    const { items, todos } = buildSeed(() => `id${n++}`);
    const launch = items.filter((i) => i.campaign === 'Nieuwe UX Belgisch platform');
    expect(launch.map((i) => [i.date, i.channel, i.status])).toEqual([
      ['2026-11-23', 'LinkedIn · Maarten (CEO)', 'klaar'],
      ['2026-12-15', 'LinkedIn · Medipim', 'gepland'],
      ['2026-12-18', 'Nieuwsbrief apothekers', 'gepland'],
    ]);
    const mail = launch[2];
    expect(mail).toMatchObject({ time: '09:00', audiences: ['apothekers'], countries: ['BE'] });
    expect(todos.filter((t) => t.itemId === mail.id).map((t) => t.offsetDays)).toEqual([-14, -2, -1]);
  });
});

describe('to-dos per language and country', () => {
  const campaign: Item = { ...item, type: 'campaign', languages: ['nl', 'fr'], countries: ['BE', 'FR'] };

  it('repeats the steps that differ per language or country, once for each', () => {
    let n = 0;
    const todos = todosFromTemplate(campaign, () => `t${n++}`);
    const copy = todos.filter((t) => t.title === 'Advertentieteksten en visuals maken');
    const targeting = todos.filter((t) => t.title === 'Targeting en tracking instellen');
    expect(copy.map((t) => t.language)).toEqual(['nl', 'fr']);
    expect(targeting.map((t) => t.country)).toEqual(['BE', 'FR']);
    expect(todos.filter((t) => t.title === 'Resultaten rapporteren')).toHaveLength(1);
  });

  it('keeps one to-do per step while an item has no languages or countries', () => {
    const todos = todosFromTemplate({ ...campaign, languages: [], countries: [] }, () => 'x');
    expect(todos.every((t) => !t.language && !t.country)).toBe(true);
    expect(todos).toHaveLength(6);
  });

  it('adds the variants a new language needs, giving an unscoped to-do the first one', () => {
    let n = 0;
    const before = todosFromTemplate({ ...campaign, languages: [], countries: ['BE'] }, () => `t${n++}`);
    const after = scopeTodos({ ...campaign, countries: ['BE'] }, before, () => `new${n++}`);
    const copy = after.filter((t) => t.title === 'Advertentieteksten en visuals maken');
    expect(copy.map((t) => [t.id.startsWith('new'), t.language])).toEqual([[false, 'nl'], [true, 'fr']]);
    expect(after.filter((t) => t.title === 'Targeting en tracking instellen')).toHaveLength(1);
    expect(scopeTodos({ ...campaign, countries: ['BE'] }, after, () => 'again')).toEqual(after);
  });
});

describe('Jira status', () => {
  it('closes a to-do when its issue is done in Jira and reopens it otherwise', () => {
    const done = applyJiraStatus(todo({}), { key: 'MKT-1', status: 'Done', statusCategory: 'done' }, 'now');
    expect([done.done, done.doneAt, done.jira?.syncedAt]).toEqual([true, 'now', 'now']);
    const reopened = applyJiraStatus(done, { key: 'MKT-1', status: 'In Progress', statusCategory: 'indeterminate' }, 'later');
    expect([reopened.done, reopened.doneAt, reopened.jira?.status]).toEqual([false, undefined, 'In Progress']);
  });
});
