import { describe, expect, it } from 'vitest';
import { buildSeed } from './seed';
import { ACADEMY_CONTENT, ACADEMY_THEME, academyUpdate } from './seed-content';

const build = () => { let n = 0; return buildSeed(() => `id${n++}`); };
const OLD_TITLE = 'Integraties met apotheeksoftware uitgelegd';
const OLD_DESCRIPTION = 'Welke apotheeksoftware Medipim-data gebruikt en wat de apotheker daar concreet van merkt.';

describe('Medipim Academy posts', () => {
  it('spreads them over 2027 from January, under the Academy theme', () => {
    const { items } = build();
    const posts = items.filter((i) => ACADEMY_CONTENT.includes(i.contentId ?? '')).sort((a, b) => a.date.localeCompare(b.date));
    expect(posts).toHaveLength(ACADEMY_CONTENT.length);
    expect(posts[0].date).toBe('2027-01-05');
    expect(new Set(posts.map((i) => i.date.slice(0, 7))).size).toBeGreaterThanOrEqual(8);
    expect(posts.every((i) => i.campaign === ACADEMY_THEME && i.translations?.en?.campaign === ACADEMY_THEME)).toBe(true);
  });

  it('rewrites the replaced pieces and their posts once in older data, keeping dates and edits', () => {
    const data = build();
    const old = {
      content: data.content.map((p) => (p.id === 'content-integrations' ? { ...p, title: OLD_TITLE, description: OLD_DESCRIPTION } : p)),
      items: data.items.map((i) => {
        if (i.contentId === 'content-integrations') return { ...i, title: OLD_TITLE, description: OLD_DESCRIPTION, campaign: '' };
        if (i.contentId === 'content-why-data') return { ...i, title: 'Onze eigen titel', campaign: '' };
        return i;
      }),
    };
    const { content, items } = academyUpdate(old, 'now');
    expect(content.map((p) => p.id)).toEqual(['content-integrations']);
    expect(content[0].format).toBe('video');
    expect(items).toHaveLength(1);
    const post = data.items.find((i) => i.contentId === 'content-integrations')!;
    expect([items[0].title, items[0].date, items[0].campaign]).toEqual([post.title, post.date, ACADEMY_THEME]);

    expect(academyUpdate(data, 'now')).toEqual({ content: [], items: [] });
  });
});
