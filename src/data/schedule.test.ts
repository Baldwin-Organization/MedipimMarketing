import { describe, expect, it } from 'vitest';
import { moveItem, moveTodo, rollForward, todosFromTemplate, urgencyOf, itemOnDay } from './schedule';
import { buildSeed } from './seed';
import type { Item, Todo } from './types';

const item: Item = {
  id: 'i1', type: 'event', title: 'Beurs', description: '', channel: 'Beurs',
  date: '2026-12-10', endDate: '2026-12-11', status: 'gepland', owner: 'Nele', campaign: 'X', audiences: [], productTypes: [], countries: [],
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
  it('seeds the 2027 conference calendar as unassigned ideas without to-dos', () => {
    let n = 0;
    const { items, todos } = buildSeed(() => `id${n++}`);
    expect(items.length).toBe(56);
    expect(todos).toEqual([]);
    expect(items.every((i) => i.type === 'event' && i.status === 'idee' && i.owner === '')).toBe(true);
    expect(items.every((i) => /^2027-\d\d-\d\d$/.test(i.date) && i.endDate! >= i.date && itemOnDay(i, i.date))).toBe(true);
  });
});
