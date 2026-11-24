import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { todayIso } from './dates';
import { IndexedDbRepository, newId, parseDataset, toDataset, type Repository } from './repository';
import { moveItem, moveTodo, rollForward, todosFromTemplate, type ScheduledTodo } from './schedule';
import { buildSeed } from './seed';
import type { IsoDate, Item, Todo } from './types';

export type ItemDraft = Omit<Item, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

interface Store {
  ready: boolean;
  today: IsoDate;
  items: Item[];
  itemsById: Map<string, Item>;
  todos: ScheduledTodo[];
  todosFor(itemId: string): ScheduledTodo[];
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
  const repo = useRef<Repository>(repository ?? new IndexedDbRepository()).current;
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [rawTodos, setRawTodos] = useState<Todo[]>([]);
  const [today, setToday] = useState(todayIso);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (await repo.isEmpty()) await repo.replaceAll(buildSeed(newId));
      const data = await repo.load();
      if (!alive) return;
      setItems(data.items);
      setRawTodos(data.todos);
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

  const todos = useMemo(() => rawTodos.map((t) => rollForward(t, today)), [rawTodos, today]);
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
          endDate: draft.type === 'event' ? draft.endDate || draft.date : undefined,
          location: draft.type === 'event' ? draft.location : undefined,
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
      exportJson: () => JSON.stringify(toDataset(items, rawTodos), null, 2),
      async importJson(json) {
        const data = parseDataset(json);
        await repo.replaceAll(data);
        setItems(data.items);
        setRawTodos(data.todos);
      },
      async resetToSeed() {
        const data = buildSeed(newId);
        await repo.replaceAll(data);
        setItems(data.items);
        setRawTodos(data.todos);
      },
    };
  }, [ready, today, items, itemsById, todos, rawTodos, repo, upsertItems, upsertTodos]);

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}
