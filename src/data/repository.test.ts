import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { IndexedDbRepository, parseDataset, toDataset } from './repository';
import { todosFromTemplate } from './schedule';
import { buildSeed } from './seed';

describe('IndexedDbRepository', () => {
  it('stores, deletes with linked to-dos and replaces everything', async () => {
    const repo = new IndexedDbRepository('test-db');
    expect(await repo.isEmpty()).toBe(true);
    let n = 0;
    const { items } = buildSeed(() => `id${n++}`);
    const seed = { items, todos: items.flatMap((i) => todosFromTemplate(i, () => `id${n++}`)), budgets: [{ id: '2027:email', year: 2027, line: 'email' as const, amount: 15000 }], pillars: [], content: [] };
    await repo.replaceAll(seed);
    const loaded = await repo.load();
    expect(loaded.items).toHaveLength(seed.items.length);
    expect(loaded.todos).toHaveLength(seed.todos.length);
    expect(loaded.budgets).toEqual(seed.budgets);

    const first = seed.items[0];
    await repo.deleteItem(first.id);
    const after = await repo.load();
    expect(after.items.find((i) => i.id === first.id)).toBeUndefined();
    expect(after.todos.some((t) => t.itemId === first.id)).toBe(false);
  });

  it('round-trips a JSON export and rejects foreign files', () => {
    const json = JSON.stringify(toDataset({ items: [], todos: [], budgets: [], pillars: [], content: [] }));
    expect(parseDataset(json).version).toBe(1);
    const old = parseDataset('{"version":1,"items":[],"todos":[],"budgets":[{"id":"2027:event","year":2027,"type":"event","amount":1}]}');
    expect(old.budgets).toEqual([]);
    expect(old.content).toEqual([]);
    expect(() => parseDataset('{"foo":1}')).toThrow();
  });
});
