/** ISO calendar date, `YYYY-MM-DD`, always in local time. */
export type IsoDate = string;

export type ItemType = 'social' | 'email' | 'call' | 'event' | 'campaign' | 'pr';

export type ItemStatus = 'idee' | 'gepland' | 'in_uitvoering' | 'klaar';

export type Audience = 'groothandels' | 'producenten' | 'apothekers' | 'ziekenhuizen';

export type ProductType = 'geneesmiddelen' | 'cannabis' | 'cosmetica' | 'voeding' | 'baby';

/** How Medipim takes part in an event; absent while still undecided. */
export type Participation = 'exposant' | 'bezoeker' | 'campagne' | 'geen';

/** English text of an item; an empty field falls back to the Dutch text on the item itself. */
export interface ItemText {
  title?: string;
  description?: string;
  location?: string;
  campaign?: string;
}

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  channel: string;
  /** Publication, send or call date; the first day of an event or campaign. */
  date: IsoDate;
  /** `HH:mm`, optional. */
  time?: string;
  /** Last day (inclusive) for types with a period, see `HAS_PERIOD`. */
  endDate?: IsoDate;
  location?: string;
  /** Events only. */
  participation?: Participation;
  /** PR & vakmedia: the publication or outlet. */
  medium?: string;
  /** Overrides the budget line that follows from type, channel and participation; `geen` keeps the item out of every line. */
  budgetLine?: BudgetLine | 'geen';
  /** Euro, excl. btw. */
  budgetPlanned?: number;
  /** Euro, excl. btw. */
  budgetActual?: number;
  status: ItemStatus;
  owner: string;
  campaign: string;
  audiences: Audience[];
  productTypes: ProductType[];
  /** ISO 3166-1 alpha-2 codes; whether a country is an existing or new market follows from `EXISTING_MARKETS`. */
  countries: string[];
  /** The plain text fields are Dutch; this holds the English version. */
  translations?: { en?: ItemText };
  /** The content piece this item publishes or shares. */
  contentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  itemId: string;
  title: string;
  /** The planned due date. Open to-dos past this date roll forward to today in the views. */
  dueDate: IsoDate;
  done: boolean;
  doneAt?: string;
  /** Days relative to the item date; kept so a moved item can carry its to-dos along. */
  offsetDays: number;
  owner?: string;
  /** `title` is Dutch; this holds the English version. */
  translations?: { en?: { title?: string } };
}

export type BudgetLine =
  | 'beurzen_exposant'
  | 'beurzen_bezoeker'
  | 'email'
  | 'linkedin'
  | 'google'
  | 'vakmedia'
  | 'lidmaatschappen'
  | 'chatgpt'
  | 'reserve';

/** Annual budget for one budget line. */
export interface Budget {
  /** `${year}:${line}` */
  id: string;
  year: number;
  line: BudgetLine;
  amount: number;
}

/** A theme in the content mix, with the share of content it should get. */
export interface ContentPillar {
  id: string;
  /** Dutch; `translations.en` holds the English. */
  name: string;
  description: string;
  /** Target share of all content, in percent. */
  target: number;
  /** `--mp-accent-*` number. */
  accent: string;
  order: number;
  translations?: { en?: { name?: string; description?: string } };
}

export type ContentFormat = 'post' | 'artikel' | 'case' | 'video' | 'infographic' | 'whitepaper' | 'webinar' | 'nieuwsbrief';

export type ContentStatus = 'idee' | 'in_productie' | 'klaar' | 'gedeeld';

/** Something worth sharing, independent of where and when it is published; calendar items point to it via `contentId`. */
export interface ContentPiece {
  id: string;
  /** Dutch; `translations.en` holds the English. */
  title: string;
  description: string;
  pillarId: string;
  format: ContentFormat;
  status: ContentStatus;
  audiences: Audience[];
  owner: string;
  /** Planned month, `YYYY-MM`. */
  month?: string;
  translations?: { en?: { title?: string; description?: string } };
  createdAt: string;
  updatedAt: string;
}

export interface Dataset {
  version: 1;
  exportedAt: string;
  items: Item[];
  todos: Todo[];
  /** Absent in exports made before budgets existed. */
  budgets?: Budget[];
  /** Absent in exports made before the content page existed. */
  pillars?: ContentPillar[];
  content?: ContentPiece[];
}
