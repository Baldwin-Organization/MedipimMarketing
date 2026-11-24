/** ISO calendar date, `YYYY-MM-DD`, always in local time. */
export type IsoDate = string;

export type ItemType = 'social' | 'email' | 'call' | 'event';

export type ItemStatus = 'idee' | 'gepland' | 'in_uitvoering' | 'klaar';

export type Audience = 'groothandels' | 'producenten' | 'apothekers' | 'ziekenhuizen';

export type ProductType = 'geneesmiddelen' | 'cannabis' | 'cosmetica' | 'voeding' | 'baby';

export interface Item {
  id: string;
  type: ItemType;
  title: string;
  description: string;
  channel: string;
  /** Publication, send or call date; the first day of an event. */
  date: IsoDate;
  /** `HH:mm`, optional. */
  time?: string;
  /** Last day of an event (inclusive). Only events have a period. */
  endDate?: IsoDate;
  location?: string;
  status: ItemStatus;
  owner: string;
  campaign: string;
  audiences: Audience[];
  productTypes: ProductType[];
  /** ISO 3166-1 alpha-2 codes; whether a country is an existing or new market follows from `EXISTING_MARKETS`. */
  countries: string[];
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
}

export interface Dataset {
  version: 1;
  exportedAt: string;
  items: Item[];
  todos: Todo[];
}
