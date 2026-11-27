import { describe, expect, it } from 'vitest';
import { buildSeed } from './seed';
import { planEvents } from './seed-events';

const build = () => { let n = 0; return buildSeed(() => `id${n++}`); };

describe('event planning', () => {
  it('plans posts and preparation for the three stands and the three visits, and nothing else', () => {
    const data = build();
    const grouped = new Set(data.items.filter((i) => i.type !== 'event' && i.campaign && !['Nieuwe UX Belgisch platform', 'Medipim Academy'].includes(i.campaign)).map((i) => i.campaign));
    expect([...grouped].sort()).toEqual(['Expopharm', 'GIRP PharmaConnect 2027', 'Pharmacy Connect', 'PharmagoraPlus', 'The Pharmacy Show', 'World Health Expo Dubai']);
    const withTodos = data.items.filter((i) => i.type === 'event' && data.todos.some((t) => t.itemId === i.id)).map((i) => i.title).sort();
    expect(withTodos).toEqual(['Expopharm', 'GIRP PharmaConnect 2027', 'Pharmacy Connect', 'PharmagoraPlus', 'The Pharmacy Show', 'World Health Expo Dubai']);
  });

  it('places an exhibitor’s invitation, announcement, live post and recap around the event', () => {
    const data = build();
    const event = data.items.find((i) => i.title === 'PharmagoraPlus')!;
    const posts = data.items.filter((i) => i.campaign === 'PharmagoraPlus').sort((a, b) => a.date.localeCompare(b.date));
    expect(posts.map((p) => [p.type, p.date])).toEqual([['email', '2027-02-19'], ['social', '2027-03-03'], ['social', event.date], ['social', '2027-03-16']]);
    expect(posts.every((p) => p.countries.join() === event.countries.join() && p.translations?.en?.title && p.status === 'gepland')).toBe(true);
    expect(posts.every((p) => data.todos.some((t) => t.itemId === p.id))).toBe(true);
    const prep = data.todos.filter((t) => t.itemId === event.id);
    expect(prep.every((t) => t.translations?.en?.title && t.offsetDays !== undefined)).toBe(true);
    expect(prep.at(-1)).toMatchObject({ dueDate: '2027-03-17' });
  });

  it('keeps posts, mails and preparation off the weekend, except the live post on the first day', () => {
    const data = build();
    const planned = data.items.filter((i) => i.type !== 'event' && i.campaign && i.campaign !== 'Nieuwe UX Belgisch platform' && i.channel !== 'Google Ads');
    const events = new Map(data.items.filter((i) => i.type === 'event').map((e) => [e.title, e]));
    const weekend = (iso: string) => [0, 6].includes(new Date(`${iso}T00:00`).getDay());
    expect(planned.filter((p) => weekend(p.date) && p.date !== events.get(p.campaign)!.date)).toEqual([]);
    const prep = data.todos.filter((t) => [...events.values()].some((e) => e.id === t.itemId));
    expect(prep.filter((t) => weekend(t.dueDate))).toEqual([]);
  });

  it('gives a visited conference two CEO posts', () => {
    const posts = build().items.filter((i) => i.campaign === 'GIRP PharmaConnect 2027');
    expect(posts.map((p) => p.channel)).toEqual(['LinkedIn · Maarten (CEO)', 'LinkedIn · Maarten (CEO)']);
  });

  it('adds the plan once to data that predates it, and leaves started planning alone', () => {
    const data = build();
    expect(planEvents(data, () => 'x')).toEqual({ items: [], todos: [] });
    const eventIds = new Set(data.items.filter((i) => i.type === 'event').map((i) => i.id));
    const old = { items: data.items.filter((i) => i.type === 'event' || !i.campaign || i.campaign === 'Nieuwe UX Belgisch platform'), todos: data.todos.filter((t) => !eventIds.has(t.itemId)) };
    let n = 0;
    const added = planEvents(old, () => `new${n++}`);
    expect(new Set(added.items.map((i) => i.campaign)).size).toBe(6);
    const expopharm = old.items.find((i) => i.title === 'Expopharm')!;
    const started = { ...old, todos: [...old.todos, { id: 't', itemId: expopharm.id, title: 'Al bezig', dueDate: '2027-09-01', done: false, offsetDays: -27 }] };
    expect(planEvents(started, () => 'y').items.some((i) => i.campaign === 'Expopharm')).toBe(false);
  });
});
