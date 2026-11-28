import { beforeWeekend, daysBetween, shiftIso } from './dates';
import { TODO_TEMPLATES, type TodoTemplate } from './templates';
import type { IsoDate, Item, JiraLink, Todo } from './types';

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

type Scope = Pick<Todo, 'language' | 'country'>;

/** The language or country variants a template step needs for this item; one unscoped to-do when it has none. */
function scopesFor(template: TodoTemplate, item: Item): Scope[] {
  if (template.per === 'language' && item.languages?.length) return item.languages.map((language) => ({ language }));
  if (template.per === 'country' && item.countries.length) return item.countries.map((country) => ({ country }));
  return [{}];
}

const sameScope = (todo: Todo, scope: Scope) => todo.language === scope.language && todo.country === scope.country;

function fromTemplate(item: Item, template: TodoTemplate, scope: Scope, makeId: () => string): Todo {
  const dueDate = beforeWeekend(shiftIso(item.date, template.offsetDays));
  return {
    id: makeId(),
    itemId: item.id,
    title: template.title,
    dueDate,
    offsetDays: daysBetween(item.date, dueDate),
    ...(template.phase && { phase: template.phase }),
    done: false,
    owner: item.owner,
    ...scope,
  };
}

/** The default to-dos of a new item: steps that differ per language or country come once for each. */
export function todosFromTemplate(item: Item, makeId: () => string): Todo[] {
  return TODO_TEMPLATES[item.type].flatMap((t) => scopesFor(t, item).map((scope) => fromTemplate(item, t, scope, makeId)));
}

/**
 * Brings an item's to-dos in line with its languages and countries after they changed: every default step that
 * differs per language or country gets the variants it is missing. A to-do of that step without a language or
 * country takes the first missing one, so it is not done twice. Other to-dos stay as they are.
 */
export function scopeTodos(item: Item, todos: Todo[], makeId: () => string): Todo[] {
  const result = [...todos];
  for (const template of TODO_TEMPLATES[item.type].filter((t) => t.per)) {
    const missing = scopesFor(template, item).filter((s) =>
      !result.some((t) => t.title === template.title && (sameScope(t, s) || (!s.language && !s.country))));
    for (const scope of missing) {
      const unscoped = result.findIndex((t) => t.title === template.title && !t.language && !t.country);
      if (unscoped >= 0 && (scope.language || scope.country)) result[unscoped] = { ...result[unscoped], ...scope };
      else result.push(fromTemplate(item, template, scope, makeId));
    }
  }
  return result;
}

/** Takes over the status of the to-do's Jira issue; a status in Jira's done category closes the to-do, any other reopens it. */
export function applyJiraStatus(todo: Todo, jira: JiraLink, now: string): Todo {
  const done = jira.statusCategory ? jira.statusCategory === 'done' : todo.done;
  return { ...todo, jira: { ...jira, syncedAt: now }, done, doneAt: done ? todo.doneAt ?? now : undefined };
}

/** True when the item occupies `day` (events span their period). */
export function itemOnDay(item: Item, day: IsoDate): boolean {
  return item.endDate ? item.date <= day && day <= item.endDate : item.date === day;
}
