import { describe, expect, it } from 'vitest';
import { EXHIBITOR_BUDGET, addBudgetAndContent, agencyBudgets, addEvents, addSeedTranslations, buildSeed, distributorPays, droppedEvents, duplicateEvents, exhibitorBudgets, markExhibitors, markVisitors, addRetargeting, estimateEventBudgets, markViaMeditech, meditechAttends, reestimateVisits, removeMedimapper, startMidDecember } from './seed';
import { moveItem } from './schedule';
import type { Budget, Item } from './types';
import { contentIdeasUpdate, weeklyFillUpdate } from './seed-content';

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
    expect(events.filter((e) => e.participation === 'bezoeker').map((e) => [e.title, e.status])).toEqual([['World Health Expo Dubai', 'gepland'], ['APP Conference and Trade Exhibition', 'gepland'], ['GIRP PharmaConnect 2027', 'gepland'], ['Pharmacy Connect', 'gepland']]);
    expect(events.filter((e) => !e.participation)).toHaveLength(events.length - 7);
    expect(events.filter((e) => e.budgetPlanned)).toHaveLength(4);
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

  it('seeds the 2027 budget of € 208,223, the agency at 10% of the rest, and a content mix that adds up to 100%', () => {
    const { budgets, pillars, content, items } = full();
    expect(budgets.reduce((n, b) => n + b.amount, 0)).toBe(208223);
    expect(budgets.find((b) => b.line === 'agency')?.amount).toBe(Math.round(0.1 * 189294));
    expect(budgets.find((b) => b.line === 'beurzen_exposant')?.amount).toBe(60000);
    expect(pillars.reduce((n, p) => n + p.target, 0)).toBe(100);
    expect(content.every((c) => pillars.some((p) => p.id === c.pillarId) && c.translations?.en?.title)).toBe(true);
    expect(items.filter((i) => i.contentId === 'content-ux-launch')).toHaveLength(3);
  });

  it('adds them to existing data only where that part is still empty', () => {
    const { items, todos } = full();
    const old = { items: items.map(({ contentId: _c, ...i }) => i), todos, budgets: [], pillars: [], content: [], revenues: [] };
    const changes = addBudgetAndContent(old);
    expect(changes.budgets).toHaveLength(10);
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

describe('events in the Gulf region', () => {
  it('seeds DUPHAT and CPHI Middle East undecided, WHX via Meditech, and adds them once to older data', () => {
    let n = 0;
    const { items } = buildSeed(() => `id${n++}`);
    const gulf = items.filter((i) => ['World Health Expo Dubai', 'DUPHAT 2027', 'CPHI Middle East'].includes(i.title));
    expect(gulf.map((i) => [i.title, i.countries, i.participation, i.status])).toEqual([
      ['World Health Expo Dubai', ['AE'], 'bezoeker', 'gepland'],
      ['DUPHAT 2027', ['AE'], undefined, 'idee'],
      ['CPHI Middle East', ['SA'], undefined, 'idee'],
    ]);
    expect(gulf.every((i) => i.translations?.en?.description)).toBe(true);

    const old = items.filter((i) => !gulf.includes(i));
    expect(addEvents(old, () => 'new')).toHaveLength(3);
    expect(addEvents(items, () => 'new')).toHaveLength(0);
  });

  it('removes the copies a doubled update added, keeping the one someone worked on', () => {
    const events = seed();
    const copies = addEvents(events.filter((e) => !['World Health Expo Dubai', 'DUPHAT 2027', 'CPHI Middle East'].includes(e.title)), (() => {
      let n = 0;
      return () => `copy${n++}`;
    })());
    expect(duplicateEvents([...events, ...copies], [])).toEqual(copies.filter((c) => !c.participation).map((c) => c.id));
    expect(duplicateEvents(events, [])).toHaveLength(0);

    const duphat = events.find((e) => e.title === 'DUPHAT 2027')!;
    const copy = copies.find((e) => e.title === 'DUPHAT 2027')!;
    const edited = { ...copy, owner: 'Nele', updatedAt: 'later' };
    expect(duplicateEvents([duphat, edited], [])).toEqual([duphat.id]);
    expect(duplicateEvents([{ ...duphat, owner: 'Kjell', updatedAt: 'later' }, edited], [])).toEqual([]);
  });
});

describe('Pharmacy Connect', () => {
  it('seeds it in Sydney, Meditech going, and adds only it once to older data', () => {
    let n = 0;
    const { items } = buildSeed(() => `id${n++}`);
    const pc = items.find((i) => i.title === 'Pharmacy Connect')!;
    expect([pc.date, pc.endDate, pc.countries, pc.participation, pc.status]).toEqual(['2027-09-07', '2027-09-09', ['AU'], 'bezoeker', 'gepland']);
    expect(pc.translations?.en?.location).toBe('Sydney, Australia');

    const old = items.filter((i) => i !== pc);
    expect(addEvents(old, () => 'new', ['Pharmacy Connect']).map((i) => i.title)).toEqual(['Pharmacy Connect']);
    expect(addEvents(items, () => 'new', ['Pharmacy Connect'])).toHaveLength(0);
  });
});

describe('weekly rhythm 2027', () => {
  it('adds the single posts per pillar once, to data that predates them', () => {
    const { content, pillars } = buildSeed(() => 'x');
    const fill = content.filter((p) => /^content-(dyk|sq|mf|cq|team)-|^content-(autumn-fairs|year-review)$/.test(p.id));
    expect(fill).toHaveLength(28);
    const perPillar = Object.fromEntries(pillars.map((p) => [p.id, fill.filter((c) => c.pillarId === p.id).length]));
    expect(perPillar).toEqual({ 'pillar-product': 11, 'pillar-data': 3, 'pillar-customers': 8, 'pillar-sector': 2, 'pillar-team': 4 });
    expect(fill.every((p) => p.month?.startsWith('2027') && !p.recurring && p.translations?.en?.title)).toBe(true);

    const old = content.filter((p) => !fill.includes(p));
    expect(weeklyFillUpdate(old, pillars, '')).toHaveLength(28);
    expect(weeklyFillUpdate(content, pillars, '')).toHaveLength(0);
  });
});

describe('Google retargeting campaign', () => {
  const build = () => { let n = 0; return buildSeed(() => `id${n++}`); };

  it('runs on Google Ads in the four markets, with its set-up to-dos', () => {
    const data = build();
    const campaign = data.items.find((i) => i.type === 'campaign' && i.channel === 'Google Ads')!;
    expect(campaign).toMatchObject({ countries: ['BE', 'FR', 'AU', 'DE'], date: '2026-12-17', endDate: '2027-12-31', status: 'gepland' });
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

describe('Medipim only', () => {
  it('seeds no Medimapper anywhere, and rewrites it to Medipim in older data', () => {
    let n = 0;
    const data = buildSeed(() => `id${n++}`);
    expect(JSON.stringify(data)).not.toMatch(/Medimapper/);

    const piece = data.content.find((p) => p.id === 'content-medimapper-numbers')!;
    const pillar = data.pillars.find((p) => p.id === 'pillar-data')!;
    const todo = data.todos[0];
    const old = {
      items: [{ ...data.items[0], description: 'Uitnodiging om af te spreken over Medimapper en grensoverschrijdende productdata.' }],
      todos: [{ ...todo, title: 'Medimapper-demo en one-pager klaarzetten', translations: { en: { title: 'Prepare the Medimapper demo and one-pager' } } }],
      content: [{ ...piece, title: 'Medimapper: de Europese markt in cijfers', translations: { en: { title: 'Medimapper: the European market in numbers' } } }],
      pillars: [{ ...pillar, description: 'Kwaliteit van productdata, standaarden zoals GS1 en SNOMED, regelgeving en marktinzichten uit Medimapper.' }],
    };
    const changes = removeMedimapper(old);
    expect(JSON.stringify(changes)).not.toMatch(/Medimapper/);
    expect(changes.items?.[0].description).toBe('Uitnodiging om af te spreken over Medipim en grensoverschrijdende productdata.');
    expect([changes.todos?.[0].title, changes.todos?.[0].translations?.en?.title]).toEqual(['Medipim-demo en one-pager klaarzetten', 'Prepare the Medipim demo and one-pager']);
    expect([changes.content?.[0].title, changes.content?.[0].translations?.en?.title]).toEqual([piece.title, piece.translations?.en?.title]);
    expect(changes.pillars?.[0].description).toBe(pillar.description);
    expect(removeMedimapper(data)).toEqual({ items: [], todos: [], content: [], pillars: [] });
  });
});

describe('start in the week of 14 December 2026', () => {
  const build = () => { let n = 0; return buildSeed(() => `id${n++}`); };

  it('plans nothing and no to-do before 14 December', () => {
    const data = build();
    expect(data.items.every((i) => i.date >= '2026-12-14')).toBe(true);
    expect(data.todos.every((t) => t.dueDate >= '2026-12-14')).toBe(true);
    expect(data.content.filter((p) => ['content-ux-tour', 'content-new-ux-highlights', 'content-new-ux-question'].includes(p.id)).every((p) => !p.month)).toBe(true);
  });

  it('moves older data to the same start, and leaves items someone moved alone', () => {
    const fresh = build();
    const old: Record<string, string> = {
      'Aankondiging nieuwe UX Belgisch platform': '2026-11-23',
      'Nieuwe UX Belgisch platform – post Medipim-pagina': '2026-11-25',
      'Nieuwsbrief: nieuwe UX van het platform': '2026-11-27',
    };
    let todos = fresh.todos;
    const items = fresh.items.map((i) => {
      if (!old[i.title]) return i;
      const back = moveItem(i, todos, old[i.title]);
      todos = todos.map((t) => back.todos.find((b) => b.id === t.id) ?? t);
      return back.item;
    });
    const followUp = { ...items.find((i) => i.title === 'Eindejaarsgroet van het team')!, id: 'follow-up', date: '2026-12-01', contentId: 'content-ux-tour' };
    const moved = { ...items.find((i) => i.type === 'campaign' && i.channel === 'Google Ads')!, date: '2026-12-03' };
    const content = fresh.content.map((p) => (p.id === 'content-ux-tour' ? { ...p, month: '2026-12' } : p.id === 'content-ux-launch' ? { ...p, month: '2026-11', status: 'gedeeld' as const } : p));

    const changes = startMidDecember({ items: [...items.map((i) => (i.id === moved.id ? moved : i)), followUp], todos, content });
    expect(changes.items!.map((i) => [i.title, i.date])).toEqual(Object.keys(old).map((t) => [t, fresh.items.find((i) => i.title === t)!.date]));
    for (const t of changes.todos!) expect(t.dueDate).toBe(fresh.todos.find((f) => f.id === t.id)!.dueDate);
    expect(changes.todos).toHaveLength(6);
    expect(changes.deleteItems).toEqual(['follow-up']);
    expect(changes.content!.map((p) => [p.id, p.month, p.status])).toEqual([['content-ux-launch', '2026-12', 'klaar'], ['content-ux-tour', undefined, 'idee']]);
  });
});

describe('event budgets from the decisions', () => {
  it('gives every attended event an amount, and fills older data without touching entered amounts', () => {
    let n = 0;
    const { items } = buildSeed(() => `id${n++}`);
    const attended = items.filter((i) => i.type === 'event' && (i.participation === 'exposant' || i.participation === 'bezoeker'));
    expect(attended.map((i) => [i.title, i.budgetPlanned])).toEqual([
      ['World Health Expo Dubai', 0],
      ['PharmagoraPlus', 20000],
      ['APP Conference and Trade Exhibition', 0],
      ['GIRP PharmaConnect 2027', 4000],
      ['Pharmacy Connect', 0],
      ['Expopharm', 20000],
      ['The Pharmacy Show', 20000],
    ]);
    expect(estimateEventBudgets(items)).toEqual([]);

    const older = items.map((i) => {
      if (i.title === 'GIRP PharmaConnect 2027') return { ...i, budgetPlanned: undefined };
      if (i.title === 'DMEA') return { ...i, participation: 'bezoeker' as const };
      if (i.title === 'CPHI China') return { ...i, participation: 'campagne' as const, budgetActual: 800 };
      if (i.title === 'Infarma') return { ...i, participation: 'geen' as const };
      return i;
    });
    expect(estimateEventBudgets(older).map((i) => [i.title, i.budgetPlanned])).toEqual([['DMEA', 2500], ['GIRP PharmaConnect 2027', 4000]]);
  });
});

describe('agency budget', () => {
  it('adds the agency at 10% of the other lines to years without it, once', () => {
    const budgets: Budget[] = [
      { id: '2027:linkedin', year: 2027, line: 'linkedin', amount: 18000 },
      { id: '2027:google', year: 2027, line: 'google', amount: 22005 },
      { id: '2028:linkedin', year: 2028, line: 'linkedin', amount: 5000 },
      { id: '2028:agency', year: 2028, line: 'agency', amount: 1234 },
    ];
    expect(agencyBudgets(budgets)).toEqual([{ id: '2027:agency', year: 2027, line: 'agency', amount: 4001 }]);
    expect(agencyBudgets([...budgets, ...agencyBudgets(budgets)])).toEqual([]);
  });
});

describe('dropped events', () => {
  it('leaves GS1 Global Healthcare out of the seed and removes it with its posts from older data', () => {
    let n = 0;
    const { items } = buildSeed(() => `id${n++}`);
    expect(items.some((i) => i.title.startsWith('GS1 Global Healthcare') || i.campaign.startsWith('GS1 Global Healthcare'))).toBe(false);
    expect(droppedEvents(items)).toEqual([]);
    const gs1 = { ...items.find((i) => i.title === 'GS1 Connect')!, id: 'gs1', title: 'GS1 Global Healthcare Conference', participation: 'bezoeker' as const };
    const post = { ...items.find((i) => i.type === 'social')!, id: 'post', campaign: 'GS1 Global Healthcare Conference' };
    expect(droppedEvents([...items, gs1, post])).toEqual(['gs1', 'post']);
  });
});

describe('visits re-estimated', () => {
  it('moves a visit still at the earlier estimate to the new one and leaves entered amounts', () => {
    let n = 0;
    const { items } = buildSeed(() => `id${n++}`);
    const visit = (title: string, budgetPlanned: number) => ({ ...items.find((i) => i.title === title)!, participation: 'bezoeker' as const, budgetPlanned });
    const older = [visit('Cann-Reg 2027', 3500), visit('DMEA', 2500), { ...visit('Cann-Reg 2027', 3000), id: 'edited' }];
    expect(reestimateVisits(older).map((i) => [i.id, i.budgetPlanned])).toEqual([[older[0].id, 2500]]);
    expect(reestimateVisits(reestimateVisits(older))).toEqual([]);
  });
});

describe('events Meditech attends', () => {
  it('are visits at no cost to Medipim, with the visitor plan, also in older data unless someone decided already', () => {
    let n = 0;
    const { items, todos } = buildSeed(() => `id${n++}`);
    const via = items.filter((i) => ['World Health Expo Dubai', 'Pharmacy Connect'].includes(i.title));
    expect(via.map((i) => [i.participation, i.budgetPlanned, i.status])).toEqual([['bezoeker', 0, 'gepland'], ['bezoeker', 0, 'gepland']]);
    expect(via.every((i) => i.description.toLowerCase().endsWith('budgetneutraal voor medipim.') && i.translations?.en?.description?.toLowerCase().endsWith('budget-neutral for medipim.'))).toBe(true);
    expect(via.find((i) => i.title === 'Pharmacy Connect')!.description).toContain('distributeur in Australië');
    expect(via.every((i) => !i.description.includes('Meditech') || i.title === 'World Health Expo Dubai')).toBe(true);
    expect(via.every((i) => todos.some((t) => t.itemId === i.id))).toBe(true);
    expect(estimateEventBudgets(via)).toEqual([]);

    const older = via.map(({ participation: _, budgetPlanned: _b, ...i }, k) => ({ ...i, status: 'idee' as const, ...(k === 1 && { participation: 'exposant' as const }) }));
    expect(markViaMeditech(older).map((i) => i.title)).toEqual(['World Health Expo Dubai']);
  });

  it('turns the earlier "not going" into a visit with its posts and preparation, once', () => {
    let n = 0;
    const data = buildSeed(() => `id${n++}`);
    const ids = new Set(data.items.filter((i) => ['World Health Expo Dubai', 'Pharmacy Connect'].includes(i.title)).map((i) => i.id));
    const before = {
      items: data.items
        .filter((i) => !(ids.has(i.id) ? false : ['World Health Expo Dubai', 'Pharmacy Connect'].includes(i.campaign)))
        .map((i) => (ids.has(i.id) ? {
          ...i,
          participation: 'geen' as const,
          description: i.description.replace(/Beslissing: .*$/, 'Beslissing: budgetneutraal voor Medipim, Meditech gaat.'),
          translations: { en: { ...i.translations?.en, description: i.translations?.en?.description?.replace(/Decision: .*$/, 'Decision: budget-neutral for Medipim, Meditech attends.') } },
        } : i)),
      todos: data.todos.filter((t) => !ids.has(t.itemId) && !data.items.some((i) => i.id === t.itemId && ['World Health Expo Dubai', 'Pharmacy Connect'].includes(i.campaign))),
    };
    let m = 0;
    const changes = meditechAttends(before, () => `m${m++}`);
    const events = changes.items.filter((i) => ids.has(i.id));
    expect(events.map((i) => [i.participation, i.budgetPlanned])).toEqual([['bezoeker', 0], ['bezoeker', 0]]);
    expect(events.every((i) => i.description.endsWith('budgetneutraal voor Medipim.') && i.translations?.en?.description?.endsWith('budget-neutral for Medipim.'))).toBe(true);
    expect(changes.items.filter((i) => i.type === 'social').map((i) => i.campaign).sort()).toEqual(['Pharmacy Connect', 'Pharmacy Connect', 'World Health Expo Dubai', 'World Health Expo Dubai']);
    expect(changes.todos.every((t) => t.dueDate >= '2026-12-14')).toBe(true);
    expect(meditechAttends({ items: [...before.items.filter((i) => !ids.has(i.id)), ...changes.items], todos: [...before.todos, ...changes.todos] }, () => 'x')).toEqual({ items: [], todos: [] });
  });
});

describe('APP Conference, paid by the distributor', () => {
  const APP = 'APP Conference and Trade Exhibition';

  it('is a visit at no cost to Medipim in the seed', () => {
    let n = 0;
    const { items, todos } = buildSeed(() => `id${n++}`);
    const app = items.find((i) => i.title === APP)!;
    expect(app).toMatchObject({ participation: 'bezoeker', budgetPlanned: 0, status: 'gepland' });
    expect(app.description).toContain('distributeur in Australië betaalt de kosten');
    expect(app.translations?.en?.description).toContain('distributor in Australia pays the costs');
    expect(todos.some((t) => t.itemId === app.id)).toBe(true);
  });

  it('sets older data to no cost, keeps a chosen stand, plans an undecided one, once', () => {
    let n = 0;
    const data = buildSeed(() => `id${n++}`);
    const seeded = data.items.find((i) => i.title === APP)!;
    const strip = (i: Item): Item => ({ ...i, participation: undefined, budgetPlanned: undefined, status: 'idee', description: i.description.replace(/\n\nBeslissing: .*$/, '') });
    const others = data.items.filter((i) => i.id !== seeded.id && i.campaign !== APP);
    const todos = data.todos.filter((t) => t.itemId !== seeded.id && !data.items.some((i) => i.id === t.itemId && i.campaign === APP));

    let m = 0;
    const undecided = distributorPays({ items: [...others, strip(seeded)], todos }, () => `m${m++}`);
    expect(undecided.items.find((i) => i.id === seeded.id)).toMatchObject({ participation: 'bezoeker', budgetPlanned: 0, status: 'gepland' });
    expect(undecided.todos.length).toBeGreaterThan(0);

    const stand = { ...strip(seeded), participation: 'exposant' as const, status: 'gepland' as const, budgetPlanned: 30000 };
    const standTodos = [...todos, { id: 't', itemId: seeded.id, title: 'x', dueDate: '2027-01-10', done: false, offsetDays: -67 }];
    const exhibiting = distributorPays({ items: [...others, stand], todos: standTodos }, () => 'x');
    expect(exhibiting.items).toHaveLength(1);
    expect(exhibiting.items[0]).toMatchObject({ participation: 'exposant', budgetPlanned: 0 });
    expect(exhibiting.todos).toEqual([]);

    expect(distributorPays({ items: [...others, ...exhibiting.items], todos: standTodos }, () => 'x')).toEqual({ items: [], todos: [] });
  });

  it('takes Pharmacy Connect over from Meditech in older data, swapping the note, once', () => {
    let n = 0;
    const data = buildSeed(() => `id${n++}`);
    const pc = data.items.find((i) => i.title === 'Pharmacy Connect')!;
    const strip = (text = '') => text.replace(/\n\n(Beslissing|Decision): .*$/, '');
    const viaMeditech = {
      ...pc,
      description: `${strip(pc.description)}\n\nBeslissing: iemand van Medipim gaat mee met Meditech, budgetneutraal voor Medipim.`,
      translations: { en: { ...pc.translations?.en, description: `${strip(pc.translations?.en?.description)}\n\nDecision: someone from Medipim attends together with Meditech, budget-neutral for Medipim.` } },
    };
    const items = data.items.map((i) => (i.id === pc.id ? viaMeditech : i));
    const changes = distributorPays({ items, todos: data.todos }, () => 'x');
    expect(changes.items).toHaveLength(1);
    expect(changes.items[0]).toMatchObject({ participation: 'bezoeker', budgetPlanned: 0 });
    expect(changes.items[0].description).toBe(pc.description);
    expect(changes.items[0].translations?.en?.description).toBe(pc.translations?.en?.description);
    expect(changes.todos).toEqual([]);
  });
});
