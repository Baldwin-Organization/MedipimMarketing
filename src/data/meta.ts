import type { IconName } from '../icons.generated';
import type { ItemStatus, ItemType, Participation } from './types';

export const ITEM_TYPES: ItemType[] = ['social', 'email', 'call', 'event', 'campaign', 'pr'];

/** Types that run over a period (start and end date) instead of a single day. */
export const HAS_PERIOD: ItemType[] = ['event', 'campaign'];

/** Labels live in the dictionaries, see `typeLabel` in `src/i18n`. */
export const TYPE_META: Record<ItemType, { icon: IconName; accent: string }> = {
  social: { icon: 'forum', accent: '5' },
  email: { icon: 'mail', accent: '6' },
  call: { icon: 'phone_iphone', accent: '1' },
  event: { icon: 'storefront', accent: '4' },
  campaign: { icon: 'ads_click', accent: '3' },
  pr: { icon: 'article', accent: '2' },
};

export const PARTICIPATIONS: Participation[] = ['exposant', 'bezoeker', 'campagne', 'geen'];

/** Filter and colour key for events without a participation yet. */
export const UNDECIDED = 'open';
export type ParticipationKey = Participation | typeof UNDECIDED;
export const participationKey = (p?: Participation): ParticipationKey => p ?? UNDECIDED;

export const STATUSES: ItemStatus[] = ['idee', 'gepland', 'in_uitvoering', 'klaar'];

export const STATUS_META: Record<ItemStatus, { tone: 'neutral' | 'info' | 'warning' | 'success' }> = {
  idee: { tone: 'neutral' },
  gepland: { tone: 'info' },
  in_uitvoering: { tone: 'warning' },
  klaar: { tone: 'success' },
};

export const CHANNELS: Record<ItemType, string[]> = {
  social: ['LinkedIn · Medipim', 'LinkedIn · Maarten (CEO)', 'LinkedIn · Medipim Australia', 'LinkedIn · Medipim USA'],
  email: ['Nieuwsbrief apothekers', 'Nieuwsbrief industrie', 'Productupdate', 'Uitnodiging'],
  call: ['Klantcall', 'Partnercall', 'Webinar', 'Interne sync'],
  event: ['Beurs', 'Conferentie', 'Congres', 'Netwerkevent'],
  campaign: ['LinkedIn Ads', 'Google Ads', 'ChatGPT Ads'],
  pr: ['Advertentie', 'Advertorial', 'Persbericht', 'Interview', 'Vakartikel', 'Opiniestuk'],
};

export const OWNERS = ['Nele', 'Maarten', 'Ioana', 'Kjell'];
