import { daysBetween, shiftIso } from './dates';
import { todosFromTemplate } from './schedule';
import type { Audience, IsoDate, Item, ItemType, Todo } from './types';

/**
 * Outbound to wholesalers and labs in Europe from the CRM database (CRM-business-medimapper): per wave a first mail,
 * a LinkedIn touch, a follow-up mail and a call round to book Medipim demos, with LinkedIn Ads on the company list
 * alongside. Who does not reply after four touches only gets the ads and the quarterly newsletter.
 */
export const OUTBOUND = 'Outbound Europa: groothandels en labo’s';
const OUTBOUND_EN = 'Outbound Europe: wholesalers and labs';
export const OUTBOUND_CHANNEL = 'Outbound-sequentie';

const WHOLESALE: Audience[] = ['groothandels'];
const LABS: Audience[] = ['producenten'];

interface Wave {
  n: number;
  /** Tuesday of the first mail. */
  start: IsoDate;
  nl: string;
  en: string;
  who: { nl: string; en: string };
  audiences: Audience[];
  countries: string[];
  /** Enrichment credits in Bizzy for this wave, an estimate. */
  enrichment: number;
}

const WAVES: Wave[] = [
  {
    n: 1, start: '2027-01-12', nl: 'nationale groothandels', en: 'national wholesalers',
    who: { nl: '218 nationale full-line groothandels die lid zijn van een GIRP-vereniging en geen deel van een keten', en: '218 national full-line wholesalers that belong to a GIRP association and are not part of a chain' },
    audiences: WHOLESALE,
    countries: ['GR', 'IT', 'ES', 'PL', 'PT', 'HU', 'DE', 'AT', 'GB', 'BE', 'HR', 'NL', 'RO', 'SK', 'BG', 'FR', 'IE', 'CZ', 'EE', 'LV', 'LU'],
    enrichment: 500,
  },
  {
    n: 2, start: '2027-03-09', nl: 'ketens en parallelimporteurs', en: 'chains and parallel importers',
    who: { nl: '11 groepen op groepsniveau, zoals PHOENIX, Cencora/Alliance Healthcare, Galenica, Oriola, Orifarm en Abacus Medicine', en: '11 groups at group level, such as PHOENIX, Cencora/Alliance Healthcare, Galenica, Oriola, Orifarm and Abacus Medicine' },
    audiences: WHOLESALE,
    countries: ['DE', 'FR', 'GB', 'NL', 'BE', 'IT', 'ES', 'AT', 'CH', 'SE', 'DK', 'FI', 'PL', 'CZ'],
    enrichment: 500,
  },
  {
    n: 3, start: '2027-05-11', nl: 'landen zonder vereniging', en: 'countries without an association',
    who: { nl: '48 groothandels uit de registers van Zwitserland, Denemarken, Cyprus, Malta, Litouwen, Slovenië, Luxemburg en Finland', en: '48 wholesalers from the registers of Switzerland, Denmark, Cyprus, Malta, Lithuania, Slovenia, Luxembourg and Finland' },
    audiences: WHOLESALE,
    countries: ['CH', 'DK', 'CY', 'MT', 'LT', 'SI', 'LU', 'FI'],
    enrichment: 500,
  },
  {
    n: 4, start: '2027-09-07', nl: 'labo’s', en: 'labs',
    who: { nl: 'een selectie uit de 2.715 labo’s en fabrikanten in de bronlijst, eerst de grootste vergunninghouders in onze markten', en: 'a selection from the 2,715 labs and manufacturers in the source list, the largest marketing authorisation holders in our markets first' },
    audiences: LABS,
    countries: ['BE', 'NL', 'DE', 'FR', 'IT', 'ES', 'GB', 'CH', 'AT', 'IE', 'DK'],
    enrichment: 1500,
  },
];

/** LinkedIn Ads on the company list of a wave, an estimate. */
export const WAVE_ADS_BUDGET = 2000;

const CONSENT = {
  nl: 'Alleen waar koude B2B-mail mag; in landen die vooraf toestemming vragen start de golf met LinkedIn en telefoon.',
  en: 'Only where cold B2B email is allowed; in countries that require prior consent the wave starts with LinkedIn and the phone.',
};

interface Step {
  type: ItemType;
  channel: string;
  offset: number;
  endOffset?: number;
  time?: string;
  title: (w: Wave) => { nl: string; en: string };
  description: (w: Wave) => { nl: string; en: string };
  budget?: (w: Wave) => number;
  todos: { offset: number; nl: string; en: string }[];
}

const STEPS: Step[] = [
  {
    type: 'campaign', channel: 'LinkedIn Ads', offset: -7, endOffset: 42,
    title: (w) => ({ nl: `Golf ${w.n} · LinkedIn Ads op de bedrijvenlijst (${w.nl})`, en: `Wave ${w.n} · LinkedIn Ads on the company list (${w.en})` }),
    description: (w) => ({
      nl: `LinkedIn-advertenties op een matched audience van de bedrijven uit golf ${w.n}: ${w.who.nl}. Loopt een week voor de eerste mail tot na de belronde, zodat de mails op een bekende naam landen. Wie na vier contactmomenten niet reageerde, blijft de advertenties zien. Budget is een inschatting.`,
      en: `LinkedIn ads on a matched audience of the companies in wave ${w.n}: ${w.who.en}. Runs from a week before the first mail until after the call round, so the mails land on a familiar name. Whoever did not reply after four touches keeps seeing the ads. The budget is an estimate.`,
    }),
    budget: () => WAVE_ADS_BUDGET,
    todos: [
      { offset: -4, nl: 'Bedrijvenlijst exporteren uit het CRM', en: 'Export the company list from the CRM' },
      { offset: -1, nl: 'Matched audience uploaden en advertenties starten', en: 'Upload the matched audience and start the ads' },
    ],
  },
  {
    type: 'email', channel: OUTBOUND_CHANNEL, offset: 0, time: '09:00',
    title: (w) => ({ nl: `Golf ${w.n} · mail 1: kennismaking met Medipim (${w.nl})`, en: `Wave ${w.n} · mail 1: introducing Medipim (${w.en})` }),
    description: (w) => ({
      nl: `Eerste mail aan ${w.who.nl}: wat Medipim met hun productdata doet, met een voorstel voor een demo van twintig minuten. ${CONSENT.nl} Het budget dekt de Bizzy-credits om contacten te verrijken: naast CEO's en handel ook masterdata, e-commerce en marketing (inschatting).`,
      en: `First mail to ${w.who.en}: what Medipim does with their product data, proposing a twenty-minute demo. ${CONSENT.en} The budget covers the Bizzy credits to enrich contacts: besides CEOs and trade also master data, e-commerce and marketing (estimate).`,
    }),
    budget: (w) => w.enrichment,
    todos: [
      { offset: -14, nl: 'Contacten verrijken in Bizzy: masterdata, e-commerce en marketing', en: 'Enrich contacts in Bizzy: master data, e-commerce and marketing' },
      { offset: -6, nl: 'Mail schrijven en vertalen', en: 'Write and translate the mail' },
      { offset: -1, nl: 'Testmail versturen en lijst controleren', en: 'Send a test mail and check the list' },
      { offset: 2, nl: 'LinkedIn-profiel bekijken en connectieverzoek sturen', en: 'View the LinkedIn profile and send a connection request' },
    ],
  },
  {
    type: 'email', channel: OUTBOUND_CHANNEL, offset: 14, time: '09:00',
    title: (w) => ({ nl: `Golf ${w.n} · mail 2: opvolging met een voorbeeld uit hun markt (${w.nl})`, en: `Wave ${w.n} · mail 2: follow-up with an example from their market (${w.en})` }),
    description: () => ({
      nl: `Tweede mail aan wie niet reageerde, met een concreet voorbeeld uit hun land of hun assortiment en dezelfde vraag naar een demo. ${CONSENT.nl}`,
      en: `Second mail to whoever did not reply, with a concrete example from their country or range and the same demo request. ${CONSENT.en}`,
    }),
    todos: [
      { offset: -5, nl: 'Voorbeeld per land of segment kiezen', en: 'Choose an example per country or segment' },
      { offset: -1, nl: 'Lijst bijwerken: wie reageerde gaat eruit', en: 'Update the list: whoever replied comes off' },
    ],
  },
  {
    type: 'call', channel: 'Klantcall', offset: 16,
    title: (w) => ({ nl: `Golf ${w.n} · belronde: demo's inplannen (${w.nl})`, en: `Wave ${w.n} · call round: book demos (${w.en})` }),
    description: () => ({
      nl: `Telefonische opvolging door het salesteam van wie de mails opende of op LinkedIn reageerde, met als doel een demo van Medipim. Daarna stopt de reeks; wie niet reageerde, krijgt alleen nog advertenties en de nieuwsbrief.`,
      en: `Phone follow-up by the sales team of whoever opened the mails or responded on LinkedIn, aiming for a Medipim demo. The sequence stops there; whoever did not reply only gets the ads and the newsletter.`,
    }),
    todos: [
      { offset: -1, nl: 'Bellijst maken uit opens en LinkedIn-reacties', en: 'Build the call list from opens and LinkedIn responses' },
      { offset: 4, nl: 'Gebookte demo’s en uitkomsten in het CRM zetten', en: 'Log booked demos and outcomes in the CRM' },
    ],
  },
];

/** Quarterly nurture newsletter to wholesalers and labs who opted in or are customers. */
const NEWSLETTERS: { date: IsoDate; nl: string; en: string }[] = [
  { date: '2027-02-18', nl: 'Q1', en: 'Q1' },
  { date: '2027-05-20', nl: 'Q2', en: 'Q2' },
  { date: '2027-09-23', nl: 'Q3', en: 'Q3' },
  { date: '2027-11-18', nl: 'Q4', en: 'Q4' },
];

const ALL_WAVE_COUNTRIES = [...new Set(WAVES.flatMap((w) => w.countries))];

/** The outbound campaign as items with their to-dos. */
export function buildOutbound(makeId: () => string, now: string): { items: Item[]; todos: Todo[] } {
  const items: Item[] = [];
  const todos: Todo[] = [];
  const base = (type: ItemType, channel: string, audiences: Audience[], countries: string[]) => ({
    id: makeId(),
    type,
    channel,
    status: 'gepland' as const,
    owner: '',
    campaign: OUTBOUND,
    audiences,
    productTypes: [],
    countries,
    languages: ['en'],
    createdAt: now,
    updatedAt: now,
  });
  for (const w of WAVES) {
    for (const s of STEPS) {
      const date = shiftIso(w.start, s.offset);
      const title = s.title(w);
      const description = s.description(w);
      const item: Item = {
        ...base(s.type, s.channel, w.audiences, w.countries),
        title: title.nl,
        description: description.nl,
        date,
        ...(s.endOffset !== undefined && { endDate: shiftIso(w.start, s.endOffset) }),
        ...(s.time && { time: s.time }),
        ...(s.budget && { budgetPlanned: s.budget(w) }),
        translations: { en: { title: title.en, description: description.en, campaign: OUTBOUND_EN } },
      };
      items.push(item);
      for (const t of s.todos) {
        const dueDate = shiftIso(w.start, s.offset + t.offset);
        todos.push({ id: makeId(), itemId: item.id, title: t.nl, dueDate, done: false, offsetDays: daysBetween(date, dueDate), translations: { en: { title: t.en } } });
      }
    }
  }
  for (const n of NEWSLETTERS) {
    const item: Item = {
      ...base('email', 'Nieuwsbrief industrie', [...WHOLESALE, ...LABS], ALL_WAVE_COUNTRIES),
      title: `Nieuwsbrief groothandels en labo’s ${n.nl} 2027`,
      description: 'Nieuwsbrief aan groothandels en labo’s die zich inschreven of klant zijn: nieuwe functies, cijfers over productdata in Europa en een uitnodiging voor een demo. Houdt wie niet op de outbound reageerde warm.',
      date: n.date,
      time: '09:00',
      translations: {
        en: {
          title: `Newsletter wholesalers and labs ${n.en} 2027`,
          description: 'Newsletter to wholesalers and labs who subscribed or are customers: new features, figures on product data in Europe and an invitation to a demo. Keeps whoever did not reply to the outbound warm.',
          campaign: OUTBOUND_EN,
        },
      },
    };
    items.push(item);
    todos.push(...todosFromTemplate(item, makeId));
  }
  return { items, todos };
}

/** The outbound campaign, for data seeded before it existed; skipped once anything is grouped under it. */
export function addOutbound(data: { items: Item[] }, makeId: () => string): { items: Item[]; todos: Todo[] } {
  if (data.items.some((i) => i.campaign === OUTBOUND)) return { items: [], todos: [] };
  return buildOutbound(makeId, new Date().toISOString());
}
