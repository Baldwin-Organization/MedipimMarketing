import type { IsoDate, ItemType, TodoPhase } from './types';

export interface TodoTemplate {
  title: string;
  /** Days relative to the item date (negative = before); a weekend day moves to the Friday before. */
  offsetDays: number;
  /** Done once for every language or every country of the item, instead of once for the item. */
  per?: 'language' | 'country';
  phase?: TodoPhase;
}

/** Content is made and approved two weeks before it goes out; distributing it happens in the days before. */
export const PRODUCTION_LEAD = 14;
/** The first production week; no preparation is planned before it. */
export const PREP_FROM: IsoDate = '2026-11-30';

/** Default to-dos created with a new item, relative to its date. */
export const TODO_TEMPLATES: Record<ItemType, TodoTemplate[]> = {
  social: [
    { title: 'Copy schrijven', offsetDays: -PRODUCTION_LEAD, per: 'language', phase: 'maken' },
    { title: 'Visual maken', offsetDays: -PRODUCTION_LEAD + 1, per: 'language', phase: 'maken' },
    { title: 'Goedkeuring vragen', offsetDays: -PRODUCTION_LEAD + 3, phase: 'maken' },
    { title: 'Inplannen in tool', offsetDays: -1, phase: 'verdelen' },
  ],
  email: [
    { title: 'Onderwerp en inhoud bepalen', offsetDays: -PRODUCTION_LEAD - 7, phase: 'maken' },
    { title: 'Tekst schrijven', offsetDays: -PRODUCTION_LEAD, per: 'language', phase: 'maken' },
    { title: 'Template opmaken', offsetDays: -PRODUCTION_LEAD + 1, per: 'language', phase: 'maken' },
    { title: 'Testmail versturen', offsetDays: -2, per: 'language', phase: 'verdelen' },
    { title: 'Doelgroep en verzendlijst checken', offsetDays: -1, per: 'country', phase: 'verdelen' },
  ],
  call: [
    { title: 'Uitnodiging versturen', offsetDays: -7 },
    { title: 'Agenda opstellen', offsetDays: -3 },
    { title: 'Verslag en opvolging', offsetDays: 1 },
  ],
  event: [
    { title: 'Stand boeken', offsetDays: -56 },
    { title: 'Standontwerp en materiaal bestellen', offsetDays: -35 },
    { title: 'Team en planning vastleggen', offsetDays: -28 },
    { title: 'Uitnodigingen naar klanten sturen', offsetDays: -21, per: 'language' },
    { title: 'Social aankondiging', offsetDays: -7, per: 'language' },
    { title: 'Brochures en demo klaarzetten', offsetDays: -3, per: 'language' },
    { title: 'Leads opvolgen', offsetDays: 3 },
  ],
  campaign: [
    { title: 'Doel, doelgroep en KPI bepalen', offsetDays: -PRODUCTION_LEAD - 14, phase: 'maken' },
    { title: 'Budget en looptijd vastleggen', offsetDays: -PRODUCTION_LEAD - 7, phase: 'maken' },
    { title: 'Advertentieteksten en visuals maken', offsetDays: -PRODUCTION_LEAD, per: 'language', phase: 'maken' },
    { title: 'Targeting en tracking instellen', offsetDays: -3, per: 'country', phase: 'verdelen' },
    { title: 'Tussentijdse evaluatie en bijsturen', offsetDays: 7 },
    { title: 'Resultaten rapporteren', offsetDays: 30 },
  ],
  pr: [
    { title: 'Medium en formaat kiezen', offsetDays: -42 },
    { title: 'Ruimte reserveren en deadline afspreken', offsetDays: -28 },
    { title: 'Tekst of visual maken', offsetDays: -PRODUCTION_LEAD, per: 'language', phase: 'maken' },
    { title: 'Goedkeuring vragen', offsetDays: -10, phase: 'maken' },
    { title: 'Aanleveren bij het medium', offsetDays: -7, phase: 'verdelen' },
    { title: 'Publicatie delen op social', offsetDays: 1, phase: 'verdelen' },
  ],
};

/** Template offsets before the production weeks, by `${type}:${title}`; only steps that moved. */
export const PREVIOUS_OFFSETS: Record<string, number> = {
  'social:Copy schrijven': -7,
  'social:Visual maken': -5,
  'social:Goedkeuring vragen': -3,
  'email:Onderwerp en inhoud bepalen': -14,
  'email:Tekst schrijven': -10,
  'email:Template opmaken': -7,
  'campaign:Doel, doelgroep en KPI bepalen': -21,
  'campaign:Budget en looptijd vastleggen': -14,
  'campaign:Advertentieteksten en visuals maken': -10,
};
