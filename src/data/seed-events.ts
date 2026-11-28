import { daysBetween, fromIso, shiftIso, workdayAfter, workdayBefore } from './dates';
import type { Contents } from './repository';
import { COUNTRY_LANGUAGES } from './dimensions';
import { todosFromTemplate } from './schedule';
import { PREP_FROM } from './templates';
import type { Audience, Item, ItemType, Todo } from './types';

interface Text { nl: string; en: string }

interface PlannedPost {
  type: Extract<ItemType, 'social' | 'email'>;
  channel: string;
  /** Days from the first day of the event; `end` counts from its last day instead. */
  offset: number;
  from?: 'end';
  time?: string;
  title: (event: string) => Text;
  description: (event: string, place: Text, who: Text) => Text;
}

interface PlannedTodo extends Text {
  offset: number;
  from?: 'end';
}

const EXHIBITOR_POSTS: PlannedPost[] = [
  {
    type: 'email', channel: 'Uitnodiging', offset: -21, time: '09:00',
    title: (e) => ({ nl: `Uitnodiging: bezoek Medipim op ${e}`, en: `Invitation: visit Medipim at ${e}` }),
    description: (e, p) => ({
      nl: `Uitnodiging aan klanten en prospects om langs te komen op onze stand op ${e} in ${p.nl}, met de vraag om vooraf een demo of gesprek in te plannen.`,
      en: `Invitation to customers and prospects to visit our stand at ${e} in ${p.en}, asking them to book a demo or meeting in advance.`,
    }),
  },
  {
    type: 'social', channel: 'LinkedIn · Medipim', offset: -10,
    title: (e) => ({ nl: `Kom ons bezoeken op ${e}`, en: `Come and see us at ${e}` }),
    description: (e, p) => ({
      nl: `Aankondiging dat Medipim met een stand op ${e} in ${p.nl} staat: data, standnummer en een oproep om een demo in te plannen.`,
      en: `Announcement that Medipim has a stand at ${e} in ${p.en}: dates, stand number and a call to book a demo.`,
    }),
  },
  {
    type: 'social', channel: 'LinkedIn · Medipim', offset: 0,
    title: (e) => ({ nl: `Live vanop ${e}`, en: `Live from ${e}` }),
    description: (e) => ({
      nl: `Foto's van de stand en het team op de eerste dag van ${e}, met wat we tonen en een oproep om langs te komen.`,
      en: `Photos of the stand and the team on the first day of ${e}, with what we are showing and a call to drop by.`,
    }),
  },
  {
    type: 'social', channel: 'LinkedIn · Medipim', offset: 2, from: 'end',
    title: (e) => ({ nl: `Terugblik op ${e}`, en: `Looking back on ${e}` }),
    description: (e) => ({
      nl: `Terugblik op ${e} met de belangrijkste gesprekken en inzichten, en een bedankje aan iedereen die langskwam.`,
      en: `Looking back on ${e} with the main conversations and insights, and thanks to everyone who came by.`,
    }),
  },
];

const EXHIBITOR_TODOS: PlannedTodo[] = [
  { nl: 'Stand en standnummer bevestigen', en: 'Confirm the stand and stand number', offset: -70 },
  { nl: 'Reis en hotel boeken', en: 'Book travel and hotel', offset: -60 },
  { nl: 'Standontwerp en materiaal bestellen', en: 'Order the stand design and materials', offset: -35 },
  { nl: 'Team en standplanning vastleggen', en: 'Set the team and stand schedule', offset: -28 },
  { nl: 'Afspraken met klanten en prospects inplannen', en: 'Schedule meetings with customers and prospects', offset: -14 },
  { nl: 'Demo, brochures en leadformulier klaarzetten', en: 'Prepare the demo, brochures and lead form', offset: -3 },
  { nl: 'Leads opvolgen', en: 'Follow up on leads', offset: 3, from: 'end' },
];

const VISITOR_POSTS: PlannedPost[] = [
  {
    type: 'social', channel: 'LinkedIn · Maarten (CEO)', offset: -7,
    title: (e) => ({ nl: `Medipim op ${e}`, en: `Medipim at ${e}` }),
    description: (e, p, w) => ({
      nl: `Aankondiging dat Maarten naar ${e} in ${p.nl} gaat, met een uitnodiging aan ${w.nl} om af te spreken over Medipim en hun productdata.`,
      en: `Announcement that Maarten is attending ${e} in ${p.en}, inviting ${w.en} to meet about Medipim and their product data.`,
    }),
  },
  {
    type: 'social', channel: 'LinkedIn · Maarten (CEO)', offset: 2, from: 'end',
    title: (e) => ({ nl: `Terugblik op ${e}`, en: `Looking back on ${e}` }),
    description: (e, _p, w) => ({
      nl: `Wat Maarten meeneemt van ${e}: de belangrijkste thema's voor ${w.nl} en wat dat betekent voor productdata.`,
      en: `What Maarten takes away from ${e}: the main themes for ${w.en} and what they mean for product data.`,
    }),
  },
];

const VISITOR_TODOS: PlannedTodo[] = [
  { nl: 'Registreren en ticket kopen', en: 'Register and buy a ticket', offset: -70 },
  { nl: 'Reis en hotel boeken', en: 'Book travel and hotel', offset: -60 },
  { nl: 'Deelnemerslijst doornemen en afspraken aanvragen', en: 'Go through the attendee list and request meetings', offset: -28 },
  { nl: 'Medipim-demo en one-pager klaarzetten', en: 'Prepare the Medipim demo and one-pager', offset: -5 },
  { nl: 'Contacten opvolgen', en: 'Follow up on contacts', offset: 3, from: 'end' },
];

/** Saturday moves to Friday and Sunday to Monday, so nothing is sent or due in the weekend. */
const workday = (iso: string) => ({ 6: shiftIso(iso, -1), 0: shiftIso(iso, 1) } as Record<number, string>)[fromIso(iso).getDay()] ?? iso;
const dayOf = (event: Item, offset: number, from?: 'end') => {
  const day = shiftIso(from === 'end' ? event.endDate ?? event.date : event.date, offset);
  return offset === 0 && !from ? day : workday(day);
};
const AUDIENCE_TEXT: Record<Audience, Text> = {
  groothandels: { nl: 'groothandels', en: 'wholesalers' },
  producenten: { nl: 'fabrikanten', en: 'manufacturers' },
  apothekers: { nl: 'apothekers', en: 'pharmacists' },
  ziekenhuizen: { nl: 'ziekenhuisapothekers', en: 'hospital pharmacists' },
};
const and = { nl: 'en', en: 'and' };
/** The audiences of an event in a sentence, "groothandels en apothekers". */
const audienceText = (event: Item): Text => {
  const words = (event.audiences.length ? event.audiences : ['groothandels' as const]).map((a) => AUDIENCE_TEXT[a]);
  const join = (lang: keyof Text) => {
    const list = words.map((w) => w[lang]);
    return list.length > 1 ? `${list.slice(0, -1).join(', ')} ${and[lang]} ${list.at(-1)}` : list[0];
  };
  return { nl: join('nl'), en: join('en') };
};

/** The languages of the countries an event takes place in, for mails to its visitors. */
export const eventLanguages = (event: Item) => [...new Set(event.countries.flatMap((c) => COUNTRY_LANGUAGES[c] ?? []))];

const notBeforePrep = (iso: string) => (iso < PREP_FROM ? PREP_FROM : iso);
/** The day of an event's preparation or follow-up to-do: a working day, not before the first production week. */
const todoDay = (event: Item, t: PlannedTodo) => {
  const day = dayOf(event, t.offset, t.from);
  return notBeforePrep(t.offset > 0 ? workdayAfter(day) : workdayBefore(day));
};
const place = (event: Item): Text => ({ nl: event.location ?? '', en: event.translations?.en?.location || event.location || '' });

/** Posts and preparation for one event Medipim attends: posts and mails as their own items, the preparation as to-dos on the event. */
function planEvent(event: Item, makeId: () => string, now: string): { items: Item[]; todos: Todo[] } {
  const exhibiting = event.participation === 'exposant';
  const name = event.translations?.en?.title || event.title;
  const who = audienceText(event);
  const items = (exhibiting ? EXHIBITOR_POSTS : VISITOR_POSTS).map((p): Item => {
    const where = place(event);
    return {
      id: makeId(),
      type: p.type,
      title: p.title(event.title).nl,
      description: p.description(event.title, where, who).nl,
      channel: p.channel,
      date: dayOf(event, p.offset, p.from),
      ...(p.time && { time: p.time }),
      status: 'gepland',
      owner: '',
      campaign: event.title,
      audiences: event.audiences,
      productTypes: event.productTypes,
      countries: event.countries,
      languages: p.type === 'email' ? eventLanguages(event) : [],
      translations: { en: { title: p.title(name).en, description: p.description(name, where, who).en, campaign: name } },
      createdAt: now,
      updatedAt: now,
    };
  });
  const todos: Todo[] = [
    ...(exhibiting ? EXHIBITOR_TODOS : VISITOR_TODOS).map((t) => {
      const dueDate = todoDay(event, t);
      return { id: makeId(), itemId: event.id, title: t.nl, dueDate, done: false, offsetDays: daysBetween(event.date, dueDate), translations: { en: { title: t.en } } };
    }),
    ...items.flatMap((i) => todosFromTemplate(i, makeId).map((t) => {
      const dueDate = notBeforePrep(t.dueDate);
      return { ...t, dueDate, offsetDays: daysBetween(i.date, dueDate) };
    })),
  ];
  return { items, todos };
}

/**
 * Posts and preparation for every event Medipim exhibits at or visits. An event is skipped once it has
 * to-dos or items grouped under its name, so planning someone already started is left alone.
 */
export function planEvents(data: Pick<Contents, 'items' | 'todos'>, makeId: () => string): Pick<Contents, 'items' | 'todos'> {
  const now = new Date().toISOString();
  const planned = data.items.filter((e) =>
    e.type === 'event'
    && (e.participation === 'exposant' || e.participation === 'bezoeker')
    && !data.todos.some((t) => t.itemId === e.id)
    && !data.items.some((i) => i.type !== 'event' && i.campaign === e.title));
  const plans = planned.map((e) => planEvent(e, makeId, now));
  return { items: plans.flatMap((p) => p.items), todos: plans.flatMap((p) => p.todos) };
}

/** The day an event's preparation to-do falls on, by its title; undefined for to-dos the plan does not know. */
export function eventTodoDay(event: Item, title: string): string | undefined {
  const t = [...EXHIBITOR_TODOS, ...VISITOR_TODOS].find((p) => p.nl === title);
  return t && todoDay(event, t);
}

/** The visitor post texts before they followed the audiences of the event, Dutch and English. */
const VISITOR_TEXT_BEFORE: ((e: string, p: Text) => Text)[] = [
  (e, p) => ({
    nl: `Aankondiging dat Maarten naar ${e} in ${p.nl} gaat, met een uitnodiging aan groothandels om af te spreken over Medipim en grensoverschrijdende productdata.`,
    en: `Announcement that Maarten is attending ${e} in ${p.en}, inviting wholesalers to meet about Medipim and cross-border product data.`,
  }),
  (e) => ({
    nl: `Wat Maarten meeneemt van ${e}: de belangrijkste thema's voor Europese groothandels en wat dat betekent voor productdata.`,
    en: `What Maarten takes away from ${e}: the main themes for European wholesalers and what they mean for product data.`,
  }),
];

/** The visitor posts with texts for the audiences of their event, for data seeded before; texts someone edited stay. */
export function visitorPostTexts(items: Item[]): Item[] {
  const now = new Date().toISOString();
  return items.flatMap((post): Item[] => {
    const event = items.find((e) => e.type === 'event' && e.participation === 'bezoeker' && e.title === post.campaign);
    const k = VISITOR_POSTS.findIndex((p) => p.title(event?.title ?? '').nl === post.title);
    if (!event || k < 0 || post.type !== 'social') return [];
    const name = event.translations?.en?.title || event.title;
    const where = place(event);
    const before = VISITOR_TEXT_BEFORE[k];
    const after = VISITOR_POSTS[k].description;
    const nl = post.description === before(event.title, where).nl ? after(event.title, where, audienceText(event)).nl : post.description;
    const enBefore = post.translations?.en?.description;
    const en = enBefore === before(name, where).en ? after(name, where, audienceText(event)).en : enBefore;
    if (nl === post.description && en === enBefore) return [];
    return [{ ...post, description: nl, translations: { ...post.translations, en: { ...post.translations?.en, description: en } }, updatedAt: now }];
  });
}
