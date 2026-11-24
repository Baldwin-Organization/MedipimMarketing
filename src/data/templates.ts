import type { ItemType } from './types';

export interface TodoTemplate {
  title: string;
  /** Days relative to the item date (negative = before). */
  offsetDays: number;
}

/** Default to-dos created with a new item, relative to its date. */
export const TODO_TEMPLATES: Record<ItemType, TodoTemplate[]> = {
  social: [
    { title: 'Copy schrijven', offsetDays: -7 },
    { title: 'Visual maken', offsetDays: -5 },
    { title: 'Goedkeuring vragen', offsetDays: -3 },
    { title: 'Inplannen in tool', offsetDays: -1 },
  ],
  email: [
    { title: 'Onderwerp en inhoud bepalen', offsetDays: -14 },
    { title: 'Tekst schrijven', offsetDays: -10 },
    { title: 'Template opmaken', offsetDays: -7 },
    { title: 'Testmail versturen', offsetDays: -2 },
    { title: 'Doelgroep en verzendlijst checken', offsetDays: -1 },
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
    { title: 'Uitnodigingen naar klanten sturen', offsetDays: -21 },
    { title: 'Social aankondiging', offsetDays: -7 },
    { title: 'Brochures en demo klaarzetten', offsetDays: -3 },
    { title: 'Leads opvolgen', offsetDays: 3 },
  ],
};
