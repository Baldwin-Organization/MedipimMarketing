import type { ItemType } from './types';

export interface TodoTemplate {
  title: string;
  /** Days relative to the item date (negative = before). */
  offsetDays: number;
  /** Done once for every language or every country of the item, instead of once for the item. */
  per?: 'language' | 'country';
}

/** Default to-dos created with a new item, relative to its date. */
export const TODO_TEMPLATES: Record<ItemType, TodoTemplate[]> = {
  social: [
    { title: 'Copy schrijven', offsetDays: -7, per: 'language' },
    { title: 'Visual maken', offsetDays: -5, per: 'language' },
    { title: 'Goedkeuring vragen', offsetDays: -3 },
    { title: 'Inplannen in tool', offsetDays: -1 },
  ],
  email: [
    { title: 'Onderwerp en inhoud bepalen', offsetDays: -14 },
    { title: 'Tekst schrijven', offsetDays: -10, per: 'language' },
    { title: 'Template opmaken', offsetDays: -7, per: 'language' },
    { title: 'Testmail versturen', offsetDays: -2, per: 'language' },
    { title: 'Doelgroep en verzendlijst checken', offsetDays: -1, per: 'country' },
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
    { title: 'Doel, doelgroep en KPI bepalen', offsetDays: -21 },
    { title: 'Budget en looptijd vastleggen', offsetDays: -14 },
    { title: 'Advertentieteksten en visuals maken', offsetDays: -10, per: 'language' },
    { title: 'Targeting en tracking instellen', offsetDays: -3, per: 'country' },
    { title: 'Tussentijdse evaluatie en bijsturen', offsetDays: 7 },
    { title: 'Resultaten rapporteren', offsetDays: 30 },
  ],
  pr: [
    { title: 'Medium en formaat kiezen', offsetDays: -42 },
    { title: 'Ruimte reserveren en deadline afspreken', offsetDays: -28 },
    { title: 'Tekst of visual maken', offsetDays: -14, per: 'language' },
    { title: 'Goedkeuring vragen', offsetDays: -10 },
    { title: 'Aanleveren bij het medium', offsetDays: -7 },
    { title: 'Publicatie delen op social', offsetDays: 1 },
  ],
};
