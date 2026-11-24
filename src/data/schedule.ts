import { daysBetween, shiftIso } from './dates';
import { TODO_TEMPLATES } from './templates';
import type { IsoDate, Item, Todo } from './types';

export interface ScheduledTodo extends Todo {
  /** The day the to-do shows on: its due date, or today when it is open and overdue. */
  displayDate: IsoDate;
  /** Days past the due date (0 when not late). */
  lateDays: number;
}

export type Urgency = 'late' | 'today' | 'week' | 'later' | 'done';

/**
 * Rolls every open, overdue to-do forward to today without touching its stored due date,
 * so the original date (and how late it is) stays known.
 */
export function rollForward(todo: Todo, today: IsoDate): ScheduledTodo {
  if (todo.done || todo.dueDate >= today) return { ...todo, displayDate: todo.dueDate, lateDays: 0 };
  return { ...todo, displayDate: today, lateDays: daysBetween(todo.dueDate, today) };
}

export function urgencyOf(todo: ScheduledTodo, today: IsoDate): Urgency {
  if (todo.done) return 'done';
  if (todo.lateDays > 0) return 'late';
  const n = daysBetween(today, todo.dueDate);
  if (n === 0) return 'today';
  if (n <= 7) return 'week';
  return 'later';
}

/** Moves an item to a new start date; an event keeps its length, linked to-dos keep their offset. */
export function moveItem(item: Item, todos: Todo[], newDate: IsoDate): { item: Item; todos: Todo[] } {
  const delta = daysBetween(item.date, newDate);
  if (delta === 0) return { item, todos };
  const moved: Item = {
    ...item,
    date: newDate,
    endDate: item.endDate ? shiftIso(item.endDate, delta) : undefined,
  };
  const shifted = todos
    .filter((t) => t.itemId === item.id && !t.done)
    .map((t) => ({ ...t, dueDate: shiftIso(t.dueDate, delta) }));
  return { item: moved, todos: shifted };
}

/** Moving a to-do by hand re-anchors its offset to the item. */
export function moveTodo(todo: Todo, item: Item | undefined, newDate: IsoDate): Todo {
  return {
    ...todo,
    dueDate: newDate,
    offsetDays: item ? daysBetween(item.date, newDate) : todo.offsetDays,
  };
}

export function todosFromTemplate(item: Item, makeId: () => string): Todo[] {
  return TODO_TEMPLATES[item.type].map((t) => ({
    id: makeId(),
    itemId: item.id,
    title: t.title,
    dueDate: shiftIso(item.date, t.offsetDays),
    offsetDays: t.offsetDays,
    done: false,
    owner: item.owner,
  }));
}

/** True when the item occupies `day` (events span their period). */
export function itemOnDay(item: Item, day: IsoDate): boolean {
  return item.endDate ? item.date <= day && day <= item.endDate : item.date === day;
}
