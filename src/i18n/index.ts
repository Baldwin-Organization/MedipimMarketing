import { enGB, nl as nlDates } from 'date-fns/locale';
import { participationKey } from '../data/meta';
import type { Audience, Item, ItemStatus, ItemText, ItemType, Participation, ProductType, Todo } from '../data/types';
import { en } from './en';
import { nl, type Dict } from './nl';

export type Lang = 'nl' | 'en';
export const LANGS: Lang[] = ['nl', 'en'];

const DICTS: Record<Lang, Dict> = { nl, en };
const STORAGE_KEY = 'mc-lang';

function initialLang(): Lang {
  const stored = typeof localStorage === 'undefined' ? null : localStorage.getItem(STORAGE_KEY);
  return stored === 'en' || stored === 'nl' ? stored : 'nl';
}

/**
 * Current language and dictionary. Live bindings: the app remounts its tree on a language
 * switch (see `App`), so every render reads the new values.
 */
export let lang: Lang = initialLang();
export let t: Dict = DICTS[lang];

export function setLang(next: Lang) {
  lang = next;
  t = DICTS[next];
  localStorage.setItem(STORAGE_KEY, next);
  document.documentElement.lang = next;
}

export const dateLocale = () => (lang === 'en' ? enGB : nlDates);

export const typeLabel = (type: ItemType) => t.types[type].label;
export const typePlural = (type: ItemType) => t.types[type].plural;
export const statusLabel = (status: ItemStatus) => t.status[status];
export const participationLabel = (p?: Participation) => t.participation[participationKey(p)].label;
export const participationShort = (p?: Participation) => t.participation[participationKey(p)].short;
export const audienceLabel = (a: Audience) => t.audiences[a];
export const productLabel = (p: ProductType) => t.products[p];
export const channelLabel = (channel: string) => t.channels[channel] ?? channel;

export type TextField = keyof ItemText;
type Texts = Pick<Item, 'title' | 'description' | 'location' | 'campaign' | 'translations'>;

export const otherLang = (l: Lang = lang): Lang => (l === 'nl' ? 'en' : 'nl');

/** The item's own text in one language, without fallback. */
export const textIn = (item: Texts, l: Lang, field: TextField): string => (l === 'nl' ? item[field] : item.translations?.en?.[field]) ?? '';

/** The item's text in the current language, or in the other language when it has none. */
export const itemText = (item: Texts, field: TextField): string => textIn(item, lang, field) || textIn(item, otherLang(), field);
export const itemTitle = (item: Texts) => itemText(item, 'title');

/** Template to-dos are stored in Dutch and translated through the dictionary. */
export const todoTextIn = (todo: Pick<Todo, 'title' | 'translations'>, l: Lang): string =>
  l === 'nl' ? todo.title : todo.translations?.en?.title || en.todoTitles[todo.title] || '';
export const todoText = (todo: Pick<Todo, 'title' | 'translations'>): string => todoTextIn(todo, lang) || todoTextIn(todo, otherLang());
