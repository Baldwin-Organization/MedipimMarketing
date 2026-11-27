import { describe, expect, it } from 'vitest';
import { buildSeed } from './seed';
import { OUTBOUND, WAVE_ADS_BUDGET, addOutbound } from './seed-outbound';
import { autoBudgetLine } from './budget';

const isoWeekday = (d: string) => new Date(`${d}T12:00:00Z`).getUTCDay() || 7;
const build = () => { let n = 0; return buildSeed(() => `id${n++}`); };

describe('CRM outbound', () => {
  it('runs four waves of two mails, a call round and LinkedIn Ads, plus a quarterly newsletter', () => {
    const items = build().items.filter((i) => i.campaign === OUTBOUND);
    const count = (type: string, channel: string) => items.filter((i) => i.type === type && i.channel === channel).length;
    expect(count('email', 'Outbound-sequentie')).toBe(8);
    expect(count('call', 'Klantcall')).toBe(4);
    expect(count('campaign', 'LinkedIn Ads')).toBe(4);
    expect(count('email', 'Nieuwsbrief industrie')).toBe(4);
    expect(items.every((i) => i.translations?.en?.title && i.translations.en.campaign && i.date.startsWith('2027'))).toBe(true);
  });

  it('starts with the national wholesalers in January and reaches the labs after the summer', () => {
    const firsts = build().items.filter((i) => i.campaign === OUTBOUND && i.title.includes('mail 1')).map((i) => [i.date, i.audiences.join()]);
    expect(firsts).toEqual([['2027-01-12', 'groothandels'], ['2027-03-09', 'groothandels'], ['2027-05-11', 'groothandels'], ['2027-09-07', 'producenten']]);
  });

  it('books Bizzy credits on email and the ads on LinkedIn', () => {
    const items = build().items.filter((i) => i.campaign === OUTBOUND && i.budgetPlanned);
    const sum = (line: string) => items.filter((i) => autoBudgetLine(i) === line).reduce((s, i) => s + (i.budgetPlanned ?? 0), 0);
    expect(sum('email')).toBe(3000);
    expect(sum('linkedin')).toBe(4 * WAVE_ADS_BUDGET);
  });

  it('puts every mail, call and to-do on a weekday', () => {
    const data = build();
    const items = data.items.filter((i) => i.campaign === OUTBOUND);
    const todos = data.todos.filter((t) => items.some((i) => i.id === t.itemId));
    expect(todos.length).toBeGreaterThan(items.length);
    expect([...items.filter((i) => i.type !== 'campaign').map((i) => i.date), ...todos.map((t) => t.dueDate)].every((d) => isoWeekday(d) <= 5)).toBe(true);
  });

  it('is added once to data seeded before it existed', () => {
    const data = build();
    const without = { items: data.items.filter((i) => i.campaign !== OUTBOUND) };
    let n = 0;
    const added = addOutbound(without, () => `x${n++}`);
    expect(added.items).toHaveLength(20);
    expect(addOutbound({ items: [...without.items, ...added.items] }, () => 'y').items).toHaveLength(0);
  });
});
