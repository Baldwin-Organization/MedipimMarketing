import type { Audience } from './types';

interface Text { nl: string; en: string }

export type MediaPriority = 'eerste_keuze' | 'interessant' | 'selectief';

/** A trade medium on the shortlist; `medium` is the name PR items use, so planned items can be counted per title. */
export interface TradeMedium {
  medium: string;
  publisher?: string;
  url: string;
  market: Text;
  /** ISO codes, copied onto a new PR item; empty for international titles. */
  countries: string[];
  audiences: Audience[];
  priority: MediaPriority;
  assessment: Text;
  /** What to ask the publisher before booking. */
  ask?: Text;
}

const PRODUCENTEN: Audience[] = ['producenten'];

/** Shortlist of trade media to reach manufacturers, in order of preference. */
export const TRADE_MEDIA: TradeMedium[] = [
  {
    medium: 'Pharmaceutiques',
    publisher: 'PR Éditions',
    url: 'https://www.pharmaceutiques.com',
    market: { nl: 'Frankrijk', en: 'France' },
    countries: ['FR'],
    audiences: PRODUCENTEN,
    priority: 'eerste_keuze',
    assessment: {
      nl: 'Test een Franstalige klantcase via hun dagelijkse persoverzicht. De mediakit van 2025 vermeldt € 1.000–€ 2.100 excl. btw voor een week nieuwsbriefplaatsing.',
      en: 'Test a French-language customer case through their daily press review. The 2025 media kit lists € 1,000–€ 2,100 excl. VAT for a week in the newsletter.',
    },
    ask: { nl: 'Het tarief en de lezersverdeling voor 2027.', en: 'The 2027 rate and readership breakdown.' },
  },
  {
    medium: 'Pharma Relations',
    url: 'https://www.pharma-relations.de',
    market: { nl: 'Duitsland', en: 'Germany' },
    countries: ['DE'],
    audiences: PRODUCENTEN,
    priority: 'eerste_keuze',
    assessment: {
      nl: 'Gericht op marketing- en communicatiebeslissers in pharma. Goede match voor een campagne over hoe merken hun productinformatie en packshots bij apotheken en webshops krijgen. De mediakit vermeldt een IVW-gecontroleerde printoplage.',
      en: 'Aimed at marketing and communication decision-makers in pharma. A good match for a campaign on how brands get their product information and packshots to pharmacies and web shops. The media kit lists an IVW-audited print run.',
    },
    ask: { nl: 'Aparte cijfers voor de nieuwsbrief.', en: 'Separate figures for the newsletter.' },
  },
  {
    medium: 'PMFarma',
    publisher: 'Publicaciones y Medios Telemáticos',
    url: 'https://www.pmfarma.com',
    market: { nl: 'Spanje', en: 'Spain' },
    countries: ['ES'],
    audiences: PRODUCENTEN,
    priority: 'eerste_keuze',
    assessment: {
      nl: 'Vakmedium voor farmaceutisch management en marketing, met digitale advertentie- en nieuwsbriefopties.',
      en: 'Trade medium for pharmaceutical management and marketing, with digital advertising and newsletter options.',
    },
    ask: { nl: 'Hoeveel ontvangers in Spanje bij fabrikanten werken.', en: 'How many recipients in Spain work for manufacturers.' },
  },
  {
    medium: 'pharmaphorum Deep Dive',
    publisher: 'pharmaphorum',
    url: 'https://pharmaphorum.com',
    market: { nl: 'VK / internationaal', en: 'UK / international' },
    countries: ['GB'],
    audiences: PRODUCENTEN,
    priority: 'interessant',
    assessment: {
      nl: 'Interessant voor een Engelstalige case over productdata of digitale distributie. Het publiek omvat ook onderzoekers, zorgverleners en agentschappen. Boeken als ze een relevant segment binnen pharma kunnen aanbieden.',
      en: 'Interesting for an English-language case on product data or digital distribution. The audience also includes researchers, healthcare professionals and agencies. Book if they can offer a relevant segment within pharma.',
    },
    ask: { nl: 'Of ze een segment binnen pharma kunnen aanbieden.', en: 'Whether they can offer a segment within pharma.' },
  },
  {
    medium: 'Generics Bulletin',
    publisher: 'Citeline',
    url: 'https://insights.citeline.com/generics-bulletin/',
    market: { nl: 'Internationaal', en: 'International' },
    countries: [],
    audiences: PRODUCENTEN,
    priority: 'interessant',
    assessment: {
      nl: 'Sterk voor een gerichte campagne naar producenten van generieken en biosimilars. Ze bieden gesponsorde content en gerichte campagnes aan.',
      en: 'Strong for a targeted campaign to manufacturers of generics and biosimilars. They offer sponsored content and targeted campaigns.',
    },
    ask: { nl: 'Hoeveel bereik ze hebben in onze Europese doelmarkten.', en: 'How much reach they have in our European target markets.' },
  },
  {
    medium: 'European Pharmaceutical Manufacturer',
    url: 'https://www.epmmagazine.com',
    market: { nl: 'Europa', en: 'Europe' },
    countries: [],
    audiences: PRODUCENTEN,
    priority: 'selectief',
    assessment: {
      nl: 'Interessant als er een concreet verhaal is over productie, verpakking of kwaliteitsbeheer. Voor de commerciële distributie van productdata eerst de titels hierboven testen.',
      en: 'Interesting when there is a concrete story on manufacturing, packaging or quality management. For the commercial distribution of product data, test the titles above first.',
    },
  },
  {
    medium: 'European Pharmaceutical Review',
    url: 'https://www.europeanpharmaceuticalreview.com',
    market: { nl: 'Europa', en: 'Europe' },
    countries: [],
    audiences: PRODUCENTEN,
    priority: 'selectief',
    assessment: {
      nl: 'Interessant als er een concreet verhaal is over productie, verpakking of kwaliteitsbeheer. Voor de commerciële distributie van productdata eerst de titels hierboven testen.',
      en: 'Interesting when there is a concrete story on manufacturing, packaging or quality management. For the commercial distribution of product data, test the titles above first.',
    },
  },
];
