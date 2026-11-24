import { t } from '../i18n';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Budget, ContentPiece, ContentPillar, Dataset, Item, Todo } from './types';

export interface Contents { items: Item[]; todos: Todo[]; budgets: Budget[]; pillars: ContentPillar[]; content: ContentPiece[] }

/**
 * The only seam between the app and storage. Swap `IndexedDbRepository` for an API-backed
 * implementation to move to a shared database; nothing else has to change.
 */
export interface Repository {
  load(): Promise<Contents>;
  saveItems(items: Item[]): Promise<void>;
  deleteItem(id: string): Promise<void>;
  saveTodos(todos: Todo[]): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  saveBudgets(budgets: Budget[]): Promise<void>;
  savePillars(pillars: ContentPillar[]): Promise<void>;
  deletePillar(id: string): Promise<void>;
  saveContent(pieces: ContentPiece[]): Promise<void>;
  deleteContent(id: string): Promise<void>;
  replaceAll(data: Contents): Promise<void>;
  isEmpty(): Promise<boolean>;
}

interface CalendarDb extends DBSchema {
  items: { key: string; value: Item };
  todos: { key: string; value: Todo; indexes: { byItem: string } };
  budgets: { key: string; value: Budget };
  pillars: { key: string; value: ContentPillar };
  content: { key: string; value: ContentPiece };
}

const DB_NAME = 'medipim-marketing-calendar-v2';

export class IndexedDbRepository implements Repository {
  private db: Promise<IDBPDatabase<CalendarDb>>;

  constructor(name = DB_NAME) {
    this.db = openDB<CalendarDb>(name, 3, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('items', { keyPath: 'id' });
          const todos = db.createObjectStore('todos', { keyPath: 'id' });
          todos.createIndex('byItem', 'itemId');
        }
        if (oldVersion < 2) db.createObjectStore('budgets', { keyPath: 'id' });
        if (oldVersion < 3) {
          db.createObjectStore('pillars', { keyPath: 'id' });
          db.createObjectStore('content', { keyPath: 'id' });
        }
      },
    });
  }

  async load() {
    const db = await this.db;
    const [items, todos, budgets, pillars, content] = await Promise.all([
      db.getAll('items'), db.getAll('todos'), db.getAll('budgets'), db.getAll('pillars'), db.getAll('content'),
    ]);
    return { items: items.map(normalizeItem), todos, budgets: budgets.filter(isLineBudget), pillars, content };
  }

  async isEmpty() {
    return (await (await this.db).count('items')) === 0;
  }

  async saveItems(items: Item[]) {
    const tx = (await this.db).transaction('items', 'readwrite');
    await Promise.all([...items.map((i) => tx.store.put(i)), tx.done]);
  }

  async saveTodos(todos: Todo[]) {
    const tx = (await this.db).transaction('todos', 'readwrite');
    await Promise.all([...todos.map((t) => tx.store.put(t)), tx.done]);
  }

  async saveBudgets(budgets: Budget[]) {
    await this.putAll('budgets', budgets);
  }

  async savePillars(pillars: ContentPillar[]) {
    await this.putAll('pillars', pillars);
  }

  async deletePillar(id: string) {
    await (await this.db).delete('pillars', id);
  }

  async saveContent(pieces: ContentPiece[]) {
    await this.putAll('content', pieces);
  }

  async deleteContent(id: string) {
    await (await this.db).delete('content', id);
  }

  private async putAll<S extends 'budgets' | 'pillars' | 'content'>(store: S, values: CalendarDb[S]['value'][]) {
    const tx = (await this.db).transaction(store, 'readwrite');
    await Promise.all([...values.map((v) => tx.store.put(v)), tx.done]);
  }

  async deleteTodo(id: string) {
    await (await this.db).delete('todos', id);
  }

  async deleteItem(id: string) {
    const db = await this.db;
    const tx = db.transaction(['items', 'todos'], 'readwrite');
    const linked = await tx.objectStore('todos').index('byItem').getAllKeys(id);
    await Promise.all([
      tx.objectStore('items').delete(id),
      ...linked.map((k) => tx.objectStore('todos').delete(k)),
      tx.done,
    ]);
  }

  async replaceAll({ items, todos, budgets, pillars, content }: Contents) {
    const db = await this.db;
    const tx = db.transaction(['items', 'todos', 'budgets', 'pillars', 'content'], 'readwrite');
    await Promise.all(['items', 'todos', 'budgets', 'pillars', 'content'].map((s) => tx.objectStore(s as 'items').clear()));
    await Promise.all([
      ...items.map((i) => tx.objectStore('items').put(i)),
      ...todos.map((t) => tx.objectStore('todos').put(t)),
      ...budgets.map((b) => tx.objectStore('budgets').put(b)),
      ...pillars.map((p) => tx.objectStore('pillars').put(p)),
      ...content.map((c) => tx.objectStore('content').put(c)),
      tx.done,
    ]);
  }
}

/** Budgets were set per item type before budget lines existed; those records no longer apply. */
const isLineBudget = (b: Budget) => typeof b.line === 'string';

export function toDataset({ items, todos, budgets, pillars, content }: Contents): Dataset {
  return { version: 1, exportedAt: new Date().toISOString(), items, todos, budgets, pillars, content };
}

/** Fills the dimension fields for items stored or exported before they existed. */
export function normalizeItem(item: Item): Item {
  return { ...item, audiences: item.audiences ?? [], productTypes: item.productTypes ?? [], countries: item.countries ?? [] };
}

export function parseDataset(json: string): Dataset & Contents {
  const data = JSON.parse(json) as Partial<Dataset>;
  if (data.version !== 1 || !Array.isArray(data.items) || !Array.isArray(data.todos)) {
    throw new Error(t.app.invalidFile);
  }
  return {
    ...(data as Dataset),
    items: data.items.map(normalizeItem),
    budgets: (data.budgets ?? []).filter(isLineBudget),
    pillars: data.pillars ?? [],
    content: data.content ?? [],
  };
}

export const newId = (): string => crypto.randomUUID();
