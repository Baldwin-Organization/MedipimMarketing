import type { IconName } from '../icons.generated';
import type { BudgetLine } from './types';

/** The groups the marketing mix aims at; broader than `Audience`, which has no software builders. */
export type Target = 'apotheken' | 'merken' | 'groothandels' | 'softwarebouwers';

export const TARGETS: { id: Target; icon: IconName; accent: string }[] = [
  { id: 'apotheken', icon: 'medication', accent: '4' },
  { id: 'merken', icon: 'sell', accent: '3' },
  { id: 'groothandels', icon: 'local_shipping', accent: '6' },
  { id: 'softwarebouwers', icon: 'code', accent: '1' },
];

export type ChannelId = 'beurzen' | 'linkedin' | 'email' | 'vakmedia' | 'google' | 'chatgpt' | 'lidmaatschappen';

/** A channel in the marketing mix, the budget lines it spends and the groups it is meant to reach. Labels live in the dictionaries. */
export interface MixChannel {
  id: ChannelId;
  icon: IconName;
  /** Page where the channel is planned. */
  to: string;
  lines: BudgetLine[];
  targets: Target[];
}

export const CHANNEL_MIX: MixChannel[] = [
  { id: 'beurzen', icon: 'storefront', to: '/beurzen', lines: ['beurzen_exposant', 'beurzen_bezoeker'], targets: ['apotheken', 'merken', 'groothandels', 'softwarebouwers'] },
  { id: 'linkedin', icon: 'forum', to: '/content', lines: ['linkedin'], targets: ['apotheken', 'merken', 'groothandels', 'softwarebouwers'] },
  { id: 'email', icon: 'mail', to: '/kalender', lines: ['email'], targets: ['apotheken', 'merken', 'groothandels'] },
  { id: 'vakmedia', icon: 'article', to: '/pr', lines: ['vakmedia'], targets: ['apotheken', 'merken'] },
  { id: 'google', icon: 'ads_click', to: '/campagnes', lines: ['google'], targets: ['apotheken', 'merken'] },
  { id: 'chatgpt', icon: 'smart_toy', to: '/campagnes', lines: ['chatgpt'], targets: ['apotheken', 'merken'] },
  { id: 'lidmaatschappen', icon: 'verified', to: '/budget', lines: ['lidmaatschappen'], targets: ['groothandels', 'softwarebouwers'] },
];
