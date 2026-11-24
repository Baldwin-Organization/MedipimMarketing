import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Dataset, Item, Todo } from './types';

/**
 * The only seam between the app and storage. Swap `IndexedDbRepository` for an API-backed
 * implementation to move to a shared database; nothing else has to change.
 */
export interface Repository {
  load(): Promise<{ items: Item[]; todos: Todo[] }>;
  saveItems(items: Item[]): Promise<void>;
  deleteItem(id: string): Promise<void>;
  saveTodos(todos: Todo[]): Promise<void>;
  deleteTodo(id: string): Promise<void>;
  replaceAll(data: { items: Item[]; todos: Todo[] }): Promise<void>;
  isEmpty(): Promise<boolean>;
}

interface CalendarDb extends DBSchema {
  items: { key: string; value: Item };
  todos: { key: string; value: Todo; indexes: { byItem: string } };
}

const DB_NAME = 'medipim-marketing-calendar';

export class IndexedDbRepository implements Repository {
  private db: Promise<IDBPDatabase<CalendarDb>>;

  constructor(name = DB_NAME) {
    this.db = openDB<CalendarDb>(name, 1, {
      upgrade(db) {
        db.createObjectStore('items', { keyPath: 'id' });
        const todos = db.createObjectStore('todos', { keyPath: 'id' });
        todos.createIndex('byItem', 'itemId');
      },
    });
  }

  async load() {
    const db = await this.db;
    const [items, todos] = await Promise.all([db.getAll('items'), db.getAll('todos')]);
    return { items, todos };
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

  async replaceAll({ items, todos }: { items: Item[]; todos: Todo[] }) {
    const db = await this.db;
    const tx = db.transaction(['items', 'todos'], 'readwrite');
    await tx.objectStore('items').clear();
    await tx.objectStore('todos').clear();
    await Promise.all([
      ...items.map((i) => tx.objectStore('items').put(i)),
      ...todos.map((t) => tx.objectStore('todos').put(t)),
      tx.done,
    ]);
  }
}

export function toDataset(items: Item[], todos: Todo[]): Dataset {
  return { version: 1, exportedAt: new Date().toISOString(), items, todos };
}

export function parseDataset(json: string): Dataset {
  const data = JSON.parse(json) as Partial<Dataset>;
  if (data.version !== 1 || !Array.isArray(data.items) || !Array.isArray(data.todos)) {
    throw new Error('Dit is geen geldig exportbestand van de marketingkalender.');
  }
  return data as Dataset;
}

export const newId = (): string => crypto.randomUUID();
