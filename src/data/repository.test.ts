import 'fake-indexeddb/auto';
import { describe, expect, it } from 'vitest';
import { IndexedDbRepository, parseDataset, toDataset } from './repository';
import { buildSeed } from './seed';

describe('IndexedDbRepository', () => {
  it('stores, deletes with linked to-dos and replaces everything', async () => {
    const repo = new IndexedDbRepository('test-db');
    expect(await repo.isEmpty()).toBe(true);
    let n = 0;
    const seed = buildSeed('2026-11-24', () => `id${n++}`);
    await repo.replaceAll(seed);
    const loaded = await repo.load();
    expect(loaded.items).toHaveLength(seed.items.length);
    expect(loaded.todos).toHaveLength(seed.todos.length);

    const first = seed.items[0];
    await repo.deleteItem(first.id);
    const after = await repo.load();
    expect(after.items.find((i) => i.id === first.id)).toBeUndefined();
    expect(after.todos.some((t) => t.itemId === first.id)).toBe(false);
  });

  it('round-trips a JSON export and rejects foreign files', () => {
    const json = JSON.stringify(toDataset([], []));
    expect(parseDataset(json).version).toBe(1);
    expect(() => parseDataset('{"foo":1}')).toThrow();
  });
});
