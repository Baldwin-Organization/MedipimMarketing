import { describe, expect, it } from 'vitest';
import { addSeedTranslations, buildSeed, markExhibitors } from './seed';

const seed = () => {
  let n = 0;
  return buildSeed(() => `id${n++}`).items.filter((i) => i.type === 'event');
};

describe('event participation', () => {
  it('marks the five exhibitor events and leaves the rest undecided', () => {
    const events = seed();
    const exhibiting = events.filter((e) => e.participation === 'exposant').map((e) => e.title).sort();
    expect(exhibiting).toEqual(['APP Conference and Trade Exhibition', 'Expopharm', 'GIRP PharmaConnect 2027', 'PharmagoraPlus', 'The Pharmacy Show']);
    expect(events.filter((e) => e.participation === 'exposant').every((e) => e.status === 'gepland')).toBe(true);
    expect(events.filter((e) => !e.participation)).toHaveLength(events.length - 5);
  });

  it('updates existing data that predates the decision, once', () => {
    const old = seed().map(({ participation: _, ...e }) => ({ ...e, status: 'idee' as const }));
    const updated = markExhibitors(old);
    expect(updated).toHaveLength(5);
    expect(updated.every((e) => e.participation === 'exposant' && e.status === 'gepland')).toBe(true);
    expect(markExhibitors(seed())).toHaveLength(0);
  });

  it('keeps a participation that was already chosen', () => {
    const events = seed().map((e) => (e.title === 'Expopharm' ? { ...e, participation: 'bezoeker' as const } : e));
    expect(markExhibitors(events).some((e) => e.title === 'Expopharm')).toBe(false);
  });
});

describe('bilingual seed', () => {
  const all = () => {
    let n = 0;
    return buildSeed(() => `id${n++}`).items;
  };

  it('has English text for every seed item', () => {
    for (const i of all()) {
      const en = i.translations?.en;
      expect(en?.title, i.title).toBeTruthy();
      expect(en?.description, i.title).toBeTruthy();
      expect(en?.description).not.toBe(i.description);
      if (i.type === 'event') expect(en?.location, i.title).toBeTruthy();
      if (i.campaign) expect(en?.campaign).toBe('New UX Belgian platform');
    }
    expect(all().find((i) => i.title.endsWith('(datum te bevestigen)'))?.translations?.en?.title).toMatch(/\(date to be confirmed\)$/);
  });

  it('adds translations to data seeded before them, except for edited text', () => {
    const old = all().map(({ translations: _, ...i }) => i);
    old[0] = { ...old[0], description: 'Eigen notitie' };
    const updated = addSeedTranslations(old);
    expect(updated).toHaveLength(old.length);
    expect(updated[0].translations?.en?.title).toBe(old[0].title);
    expect(updated[0].translations?.en?.description).toBeUndefined();
    expect(updated[1].translations?.en?.description).toBeTruthy();
    expect(addSeedTranslations(all())).toHaveLength(0);
  });
});
