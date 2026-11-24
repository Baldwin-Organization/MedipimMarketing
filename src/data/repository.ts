import { t } from '../i18n';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Budget, Dataset, Item, Todo } from './types';

export interface Contents { items: Item[]; todos: Todo[]; budgets: Budget[] }

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
  saveBudget(budget: Budget): Promise<void>;
  replaceAll(data: Contents): Promise<void>;
  isEmpty(): Promise<boolean>;
}

interface CalendarDb extends DBSchema {
  items: { key: string; value: Item };
  todos: { key: string; value: Todo; indexes: { byItem: string } };
  budgets: { key: string; value: Budget };
}

const DB_NAME = 'medipim-marketing-calendar-v2';

export class IndexedDbRepository implements Repository {
  private db: Promise<IDBPDatabase<CalendarDb>>;

  constructor(name = DB_NAME) {
    this.db = openDB<CalendarDb>(name, 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore('items', { keyPath: 'id' });
          const todos = db.createObjectStore('todos', { keyPath: 'id' });
          todos.createIndex('byItem', 'itemId');
        }
        if (oldVersion < 2) db.createObjectStore('budgets', { keyPath: 'id' });
      },
    });
  }

  async load() {
    const db = await this.db;
    const [items, todos, budgets] = await Promise.all([db.getAll('items'), db.getAll('todos'), db.getAll('budgets')]);
    return { items: items.map(normalizeItem), todos, budgets };
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

  async saveBudget(budget: Budget) {
    await (await this.db).put('budgets', budget);
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

  async replaceAll({ items, todos, budgets }: Contents) {
    const db = await this.db;
    const tx = db.transaction(['items', 'todos', 'budgets'], 'readwrite');
    await tx.objectStore('items').clear();
    await tx.objectStore('todos').clear();
    await tx.objectStore('budgets').clear();
    await Promise.all([
      ...items.map((i) => tx.objectStore('items').put(i)),
      ...todos.map((t) => tx.objectStore('todos').put(t)),
      ...budgets.map((b) => tx.objectStore('budgets').put(b)),
      tx.done,
    ]);
  }
}

export function toDataset({ items, todos, budgets }: Contents): Dataset {
  return { version: 1, exportedAt: new Date().toISOString(), items, todos, budgets };
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
  return { ...(data as Dataset), items: data.items.map(normalizeItem), budgets: data.budgets ?? [] };
}

export const newId = (): string => crypto.randomUUID();
