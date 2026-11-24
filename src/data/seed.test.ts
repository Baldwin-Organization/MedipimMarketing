import { describe, expect, it } from 'vitest';
import { EXHIBITOR_BUDGET, addBudgetAndContent, addSeedTranslations, buildSeed, exhibitorBudgets, markExhibitors, markVisitors, addRetargeting } from './seed';
import { contentIdeasUpdate } from './seed-content';

const seed = () => {
  let n = 0;
  return buildSeed(() => `id${n++}`).items.filter((i) => i.type === 'event');
};

describe('event participation', () => {
  it('marks the three exhibitor events with their budget, GIRP as visited and leaves the rest undecided', () => {
    const events = seed();
    const exhibiting = events.filter((e) => e.participation === 'exposant');
    expect(exhibiting.map((e) => e.title).sort()).toEqual(['Expopharm', 'PharmagoraPlus', 'The Pharmacy Show']);
    expect(exhibiting.every((e) => e.status === 'gepland' && e.budgetPlanned === EXHIBITOR_BUDGET)).toBe(true);
    expect(events.filter((e) => e.participation === 'bezoeker').map((e) => [e.title, e.status])).toEqual([['GIRP PharmaConnect 2027', 'gepland']]);
    expect(events.filter((e) => !e.participation)).toHaveLength(events.length - 4);
    expect(events.filter((e) => e.budgetPlanned != null)).toHaveLength(3);
  });

  it('updates existing data that predates the decision, once', () => {
    const old = seed().map(({ participation: _, ...e }) => ({ ...e, status: 'idee' as const }));
    const updated = markExhibitors(old);
    expect(updated).toHaveLength(3);
    expect(updated.every((e) => e.participation === 'exposant' && e.status === 'gepland')).toBe(true);
    expect(markExhibitors(seed())).toHaveLength(0);
  });

  it('keeps a participation that was already chosen', () => {
    const events = seed().map((e) => (e.title === 'Expopharm' ? { ...e, participation: 'bezoeker' as const } : e));
    expect(markExhibitors(events).some((e) => e.title === 'Expopharm')).toBe(false);
  });
});

describe('exhibitor budgets', () => {
  /** Events as seeded when five events had a stand and none had an amount. */
  const fiveStands = () => seed().map(({ budgetPlanned: _, ...e }) =>
    ['APP Conference and Trade Exhibition', 'GIRP PharmaConnect 2027'].includes(e.title) ? { ...e, participation: 'exposant' as const, status: 'gepland' as const } : e);

  it('gives the three stands their budget and takes the other two off the exhibitor line', () => {
    const updated = new Map(exhibitorBudgets(fiveStands()).map((e) => [e.title, e]));
    expect([...updated.keys()].sort()).toEqual(['APP Conference and Trade Exhibition', 'Expopharm', 'GIRP PharmaConnect 2027', 'PharmagoraPlus', 'The Pharmacy Show']);
    for (const title of ['Expopharm', 'PharmagoraPlus', 'The Pharmacy Show']) {
      expect(updated.get(title)).toMatchObject({ participation: 'exposant', budgetPlanned: EXHIBITOR_BUDGET });
    }
    for (const title of ['APP Conference and Trade Exhibition', 'GIRP PharmaConnect 2027']) {
      expect(updated.get(title)!.participation).toBeUndefined();
      expect(updated.get(title)!.status).toBe('idee');
    }
    expect(exhibitorBudgets(seed())).toHaveLength(0);
  });

  it('keeps amounts and participation someone entered', () => {
    const events = fiveStands().map((e) => {
      if (e.title === 'Expopharm') return { ...e, budgetPlanned: 35000 };
      if (e.title === 'The Pharmacy Show') return { ...e, participation: 'bezoeker' as const };
      if (e.title === 'GIRP PharmaConnect 2027') return { ...e, budgetPlanned: 8000 };
      return e;
    });
    const titles = exhibitorBudgets(events).map((e) => e.title).sort();
    expect(titles).toEqual(['APP Conference and Trade Exhibition', 'PharmagoraPlus']);
  });
});

describe('visited conferences', () => {
  it('marks GIRP as visited once it is off the exhibitor line, and only once', () => {
    const fiveStands = seed().map(({ budgetPlanned: _, ...e }) =>
      e.title === 'GIRP PharmaConnect 2027' ? { ...e, participation: 'exposant' as const, status: 'gepland' as const } : e);
    const afterBudgets = fiveStands.map((e) => exhibitorBudgets(fiveStands).find((u) => u.id === e.id) ?? e);
    const updated = markVisitors(afterBudgets);
    expect(updated.map((e) => [e.title, e.participation, e.status])).toEqual([['GIRP PharmaConnect 2027', 'bezoeker', 'gepland']]);
    expect(markVisitors(seed())).toHaveLength(0);
  });

  it('keeps a participation that was already chosen', () => {
    const events = seed().map((e) => (e.title === 'GIRP PharmaConnect 2027' ? { ...e, participation: 'geen' as const } : e));
    expect(markVisitors(events)).toHaveLength(0);
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
      if (i.campaign === 'Nieuwe UX Belgisch platform') expect(en?.campaign).toBe('New UX Belgian platform');
      else if (i.campaign) expect(en?.campaign, i.title).toBeTruthy();
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

describe('budget plan and content mix', () => {
  const full = () => buildSeed(() => Math.random().toString(36));

  it('seeds the 2027 budget of € 189,294 and a content mix that adds up to 100%', () => {
    const { budgets, pillars, content, items } = full();
    expect(budgets.reduce((n, b) => n + b.amount, 0)).toBe(189294);
    expect(budgets.find((b) => b.line === 'beurzen_exposant')?.amount).toBe(60000);
    expect(pillars.reduce((n, p) => n + p.target, 0)).toBe(100);
    expect(content.every((c) => pillars.some((p) => p.id === c.pillarId) && c.translations?.en?.title)).toBe(true);
    expect(items.filter((i) => i.contentId)).toHaveLength(3);
  });

  it('adds them to existing data only where that part is still empty', () => {
    const { items, todos } = full();
    const old = { items: items.map(({ contentId: _c, ...i }) => i), todos, budgets: [], pillars: [], content: [] };
    const changes = addBudgetAndContent(old);
    expect(changes.budgets).toHaveLength(9);
    expect(changes.pillars).toHaveLength(5);
    expect(changes.items?.every((i) => i.contentId)).toBe(true);
    expect(changes.items).toHaveLength(3);

    const filled = full();
    const none = addBudgetAndContent(filled);
    expect([none.budgets, none.pillars, none.content, none.items].every((list) => list?.length === 0)).toBe(true);
  });
});

describe('content ideas from the team', () => {
  it('adds the new ideas and revises only seed pieces nobody edited', () => {
    const { content, pillars } = buildSeed(() => 'x');
    const before = content
      .filter((p) => !['content-did-you-know', 'content-photography'].includes(p.id))
      .map((p) => (p.id === 'content-customer-quotes' ? { ...p, title: 'old', description: 'Reeks van vier LinkedIn-posts met telkens één citaat van een klant en een portretfoto.' } : p))
      .map((p) => (p.id === 'content-behind-scenes' ? { ...p, description: 'Door het team aangepast' } : p));
    const changes = contentIdeasUpdate(before, pillars, '');
    expect(changes.map((p) => p.id).sort()).toEqual(['content-customer-quotes', 'content-did-you-know', 'content-photography']);
    expect(changes.find((p) => p.id === 'content-customer-quotes')).toMatchObject({ title: 'Een klant aan het woord', recurring: true });
    expect(contentIdeasUpdate(content, pillars, '')).toHaveLength(0);
  });
});

describe('Google retargeting campaign', () => {
  const build = () => { let n = 0; return buildSeed(() => `id${n++}`); };

  it('runs on Google Ads in the four markets, with its set-up to-dos', () => {
    const data = build();
    const campaign = data.items.find((i) => i.type === 'campaign' && i.channel === 'Google Ads')!;
    expect(campaign).toMatchObject({ countries: ['BE', 'FR', 'AU', 'DE'], date: '2026-12-01', endDate: '2027-12-31', status: 'gepland' });
    expect(campaign.translations?.en?.title).toBeTruthy();
    const todos = data.todos.filter((t) => t.itemId === campaign.id);
    expect(todos).toHaveLength(4);
    expect(todos.every((t) => t.translations?.en?.title && t.dueDate <= campaign.date)).toBe(true);
  });

  it('is added once to data that predates it', () => {
    const data = build();
    expect(addRetargeting(data)).toEqual({});
    const old = { ...data, items: data.items.filter((i) => i.type !== 'campaign'), todos: [] };
    const added = addRetargeting(old);
    expect(added.items).toHaveLength(1);
    expect(added.todos!.every((t) => t.itemId === added.items![0].id)).toBe(true);
  });
});
