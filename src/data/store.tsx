import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { todayIso } from './dates';
import { IndexedDbRepository, newId, parseDataset, toDataset, type Contents, type Repository } from './repository';
import { moveItem, moveTodo, rollForward, todosFromTemplate, type ScheduledTodo } from './schedule';
import { SEED_UPDATES, buildSeed } from './seed';
import { HAS_PERIOD } from './meta';
import type { Budget, BudgetLine, ContentPiece, ContentPillar, IsoDate, Item, Todo } from './types';

export type ItemDraft = Omit<Item, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };
export type ContentDraft = Omit<ContentPiece, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

interface Store {
  ready: boolean;
  /** Another tab still runs an older version and holds the database. */
  blocked: boolean;
  today: IsoDate;
  items: Item[];
  itemsById: Map<string, Item>;
  todos: ScheduledTodo[];
  todosFor(itemId: string): ScheduledTodo[];
  budgets: Budget[];
  setBudget(year: number, line: BudgetLine, amount: number): Promise<void>;
  /** Sorted by `order`. */
  pillars: ContentPillar[];
  savePillars(pillars: ContentPillar[]): Promise<void>;
  deletePillar(id: string): Promise<void>;
  content: ContentPiece[];
  saveContent(draft: ContentDraft): Promise<ContentPiece>;
  /** Also unlinks the calendar items that shared it. */
  deleteContent(id: string): Promise<void>;
  saveItem(draft: ItemDraft, todos: Todo[], opts?: { applyTemplate?: boolean }): Promise<Item>;
  deleteItem(id: string): Promise<void>;
  toggleTodo(id: string): Promise<void>;
  moveItemTo(id: string, date: IsoDate): Promise<number>;
  moveTodoTo(id: string, date: IsoDate): Promise<void>;
  exportJson(): string;
  importJson(json: string): Promise<void>;
  resetToSeed(): Promise<void>;
  templateTodos(draft: ItemDraft): Todo[];
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children, repository }: { children: ReactNode; repository?: Repository }) {
  const [blocked, setBlocked] = useState(false);
  const [repo] = useState<Repository>(() => repository ?? new IndexedDbRepository(undefined, () => setBlocked(true)));
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [rawTodos, setRawTodos] = useState<Todo[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [pillars, setPillars] = useState<ContentPillar[]>([]);
  const [content, setContent] = useState<ContentPiece[]>([]);
  const [today, setToday] = useState(todayIso);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (await repo.isEmpty()) await repo.replaceAll(buildSeed(newId));
      const data = await repo.load();
      for (const update of SEED_UPDATES) {
        if (typeof localStorage === 'undefined' || localStorage.getItem(update.key)) continue;
        const changes = update.apply(data);
        if (changes.items?.length) await repo.saveItems(changes.items);
        if (changes.budgets?.length) await repo.saveBudgets(changes.budgets);
        if (changes.pillars?.length) await repo.savePillars(changes.pillars);
        if (changes.content?.length) await repo.saveContent(changes.content);
        for (const key of ['items', 'budgets', 'pillars', 'content'] as const) {
          data[key] = merge(data[key] as { id: string }[], (changes[key] ?? []) as { id: string }[]) as never;
        }
        localStorage.setItem(update.key, '1');
      }
      if (!alive) return;
      apply(data);
      setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [repo]);

  // Roll overdue to-dos forward when the day changes while the app stays open.
  useEffect(() => {
    const t = window.setInterval(() => setToday(todayIso()), 60_000);
    return () => window.clearInterval(t);
  }, []);

  const apply = (data: Contents) => {
    setItems(data.items);
    setRawTodos(data.todos);
    setBudgets(data.budgets);
    setPillars(data.pillars);
    setContent(data.content);
  };

  const todos = useMemo(() => rawTodos.map((t) => rollForward(t, today)), [rawTodos, today]);
  const sortedPillars = useMemo(() => [...pillars].sort((a, b) => a.order - b.order), [pillars]);
  const itemsById = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const upsertItems = useCallback(async (next: Item[]) => {
    await repo.saveItems(next);
    setItems((prev) => {
      const map = new Map(prev.map((i) => [i.id, i]));
      next.forEach((i) => map.set(i.id, i));
      return [...map.values()];
    });
  }, [repo]);

  const upsertTodos = useCallback(async (next: Todo[]) => {
    if (!next.length) return;
    await repo.saveTodos(next);
    setRawTodos((prev) => {
      const map = new Map(prev.map((t) => [t.id, t]));
      next.forEach((t) => map.set(t.id, t));
      return [...map.values()];
    });
  }, [repo]);

  const store = useMemo<Store>(() => {
    const strip = (t: Todo | ScheduledTodo): Todo => {
      const { displayDate: _d, lateDays: _l, ...rest } = t as ScheduledTodo;
      return rest;
    };
    return {
      ready,
      blocked,
      today,
      items,
      itemsById,
      todos,
      todosFor: (itemId) => todos.filter((t) => t.itemId === itemId).sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
      templateTodos: (draft) => todosFromTemplate({ ...draft, id: draft.id ?? 'draft', createdAt: '', updatedAt: '' }, newId),
      async saveItem(draft, nextTodos, opts) {
        const now = new Date().toISOString();
        const existing = draft.id ? itemsById.get(draft.id) : undefined;
        const item: Item = {
          ...draft,
          id: draft.id ?? newId(),
          endDate: HAS_PERIOD.includes(draft.type) ? draft.endDate || draft.date : undefined,
          location: draft.type === 'event' ? draft.location : undefined,
          medium: draft.type === 'pr' ? draft.medium : undefined,
          createdAt: existing?.createdAt ?? now,
          updatedAt: now,
        };
        let finalTodos = nextTodos.map((t) => ({ ...strip(t), itemId: item.id }));
        if (opts?.applyTemplate) finalTodos = [...finalTodos, ...todosFromTemplate(item, newId)];
        const removed = rawTodos.filter((t) => t.itemId === item.id && !finalTodos.some((n) => n.id === t.id));
        await Promise.all(removed.map((t) => repo.deleteTodo(t.id)));
        setRawTodos((prev) => prev.filter((t) => !removed.some((r) => r.id === t.id)));
        await upsertItems([item]);
        await upsertTodos(finalTodos);
        return item;
      },
      async deleteItem(id) {
        await repo.deleteItem(id);
        setItems((prev) => prev.filter((i) => i.id !== id));
        setRawTodos((prev) => prev.filter((t) => t.itemId !== id));
      },
      async toggleTodo(id) {
        const t = rawTodos.find((x) => x.id === id);
        if (!t) return;
        await upsertTodos([{ ...t, done: !t.done, doneAt: t.done ? undefined : new Date().toISOString() }]);
      },
      async moveItemTo(id, date) {
        const item = itemsById.get(id);
        if (!item) return 0;
        const r = moveItem(item, rawTodos, date);
        await upsertItems([{ ...r.item, updatedAt: new Date().toISOString() }]);
        await upsertTodos(r.todos);
        return r.todos.length;
      },
      async moveTodoTo(id, date) {
        const t = rawTodos.find((x) => x.id === id);
        if (!t) return;
        await upsertTodos([moveTodo(t, itemsById.get(t.itemId), date)]);
      },
      budgets,
      async setBudget(year, line, amount) {
        const budget: Budget = { id: `${year}:${line}`, year, line, amount };
        await repo.saveBudgets([budget]);
        setBudgets((prev) => merge(prev, [budget]));
      },
      pillars: sortedPillars,
      async savePillars(next) {
        await repo.savePillars(next);
        setPillars((prev) => merge(prev, next));
      },
      async deletePillar(id) {
        await repo.deletePillar(id);
        setPillars((prev) => prev.filter((p) => p.id !== id));
      },
      content,
      async saveContent(draft) {
        const now = new Date().toISOString();
        const existing = draft.id ? content.find((c) => c.id === draft.id) : undefined;
        const piece: ContentPiece = { ...draft, id: draft.id ?? newId(), createdAt: existing?.createdAt ?? now, updatedAt: now };
        await repo.saveContent([piece]);
        setContent((prev) => merge(prev, [piece]));
        return piece;
      },
      async deleteContent(id) {
        await repo.deleteContent(id);
        setContent((prev) => prev.filter((c) => c.id !== id));
        const now = new Date().toISOString();
        await upsertItems(items.filter((i) => i.contentId === id).map(({ contentId: _c, ...i }) => ({ ...i, updatedAt: now })));
      },
      exportJson: () => JSON.stringify(toDataset({ items, todos: rawTodos, budgets, pillars, content }), null, 2),
      async importJson(json) {
        const data = parseDataset(json);
        await repo.replaceAll(data);
        apply(data);
      },
      async resetToSeed() {
        const data = buildSeed(newId);
        await repo.replaceAll(data);
        apply(data);
      },
    };
  }, [ready, blocked, today, items, itemsById, todos, rawTodos, budgets, pillars, sortedPillars, content, repo, upsertItems, upsertTodos]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

/** `prev` with `next` replacing records of the same id and appended otherwise. */
function merge<T extends { id: string }>(prev: T[], next: T[]): T[] {
  const map = new Map(prev.map((r) => [r.id, r]));
  next.forEach((r) => map.set(r.id, r));
  return [...map.values()];
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
