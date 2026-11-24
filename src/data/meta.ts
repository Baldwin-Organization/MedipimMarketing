import type { IconName } from '../icons.generated';
import type { ItemStatus, ItemType } from './types';

export const ITEM_TYPES: ItemType[] = ['social', 'email', 'call', 'event', 'campaign', 'pr'];

/** Types that run over a period (start and end date) instead of a single day. */
export const HAS_PERIOD: ItemType[] = ['event', 'campaign'];

export const TYPE_META: Record<ItemType, { label: string; plural: string; icon: IconName; accent: string }> = {
  social: { label: 'Social post', plural: "Social posts", icon: 'forum', accent: '5' },
  email: { label: 'E-mailing', plural: 'E-mailings', icon: 'mail', accent: '6' },
  call: { label: 'Call', plural: 'Calls', icon: 'phone_iphone', accent: '1' },
  event: { label: 'Beurs / conferentie', plural: 'Beurzen & conferenties', icon: 'storefront', accent: '4' },
  campaign: { label: 'Campagne', plural: 'Campagnes', icon: 'ads_click', accent: '3' },
  pr: { label: 'PR & vakmedia', plural: 'PR & vakmedia', icon: 'article', accent: '2' },
};

export const STATUSES: ItemStatus[] = ['idee', 'gepland', 'in_uitvoering', 'klaar'];

export const STATUS_META: Record<ItemStatus, { label: string; tone: 'neutral' | 'info' | 'warning' | 'success' }> = {
  idee: { label: 'Idee', tone: 'neutral' },
  gepland: { label: 'Gepland', tone: 'info' },
  in_uitvoering: { label: 'In uitvoering', tone: 'warning' },
  klaar: { label: 'Klaar', tone: 'success' },
};

export const CHANNELS: Record<ItemType, string[]> = {
  social: ['LinkedIn', 'Instagram', 'Facebook', 'X'],
  email: ['Nieuwsbrief apothekers', 'Nieuwsbrief industrie', 'Productupdate', 'Uitnodiging'],
  call: ['Klantcall', 'Partnercall', 'Webinar', 'Interne sync'],
  event: ['Beurs', 'Conferentie', 'Congres', 'Netwerkevent'],
  campaign: ['LinkedIn Ads', 'Google Ads', 'ChatGPT Ads'],
  pr: ['Advertentie', 'Advertorial', 'Persbericht', 'Interview', 'Vakartikel', 'Opiniestuk'],
};

export const OWNERS = ['Nele', 'Maarten', 'Ioana', 'Kjell'];
