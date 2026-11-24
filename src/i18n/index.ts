import { enGB, nl as nlDates } from 'date-fns/locale';
import { participationKey } from '../data/meta';
import type { Audience, ItemStatus, ItemType, Participation, ProductType } from '../data/types';
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
export const todoLabel = (title: string) => t.todoTitles[title] ?? title;
