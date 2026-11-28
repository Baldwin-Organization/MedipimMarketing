import type { Item, Todo } from './types';

/** Who does which kind of work in the marketing team. */
export const TEAM = {
  tekst: 'Nele',
  visual: 'Kjell',
  inplannen: 'Ioana',
  mailing: 'Nele',
  advertenties: 'Ioana',
  outbound: 'Maarten',
  ceo: 'Maarten',
} as const;

type Role = keyof typeof TEAM;

export const CEO_CHANNEL = 'LinkedIn · Maarten (CEO)';

/** The kind of work behind a to-do title; approval is decided per item, see `ownerFor`. */
const ROLES: Record<string, Role | 'goedkeuring'> = {
  'Copy schrijven': 'tekst',
  'Tekst schrijven': 'tekst',
  'Tekst of visual maken': 'tekst',
  'Tekst en visuals maken': 'tekst',
  'Onderwerp en inhoud bepalen': 'tekst',
  'Medium en formaat kiezen': 'tekst',
  'Ruimte reserveren en deadline afspreken': 'tekst',
  'Aanleveren bij het medium': 'tekst',
  'Visual maken': 'visual',
  'Visual kiezen': 'visual',
  'Goedkeuring vragen': 'goedkeuring',
  'Inplannen in tool': 'inplannen',
  'Inplannen op de Medipim-pagina': 'inplannen',
  'Publicatie delen op social': 'inplannen',
  'Template opmaken': 'mailing',
  'Testmail versturen': 'mailing',
  'Doelgroep en verzendlijst checken': 'mailing',
  'Testmail versturen en goedkeuring vragen': 'mailing',
  'Verzending inplannen op vrijdag 9:00': 'mailing',
  'Mail schrijven en vertalen': 'mailing',
  'Voorbeeld per land of segment kiezen en mail schrijven': 'mailing',
  'Testmail versturen en lijst controleren': 'mailing',
  'Doel, doelgroep en KPI bepalen': 'advertenties',
  'Budget en looptijd vastleggen': 'advertenties',
  'Advertentieteksten en visuals maken': 'advertenties',
  'Targeting en tracking instellen': 'advertenties',
  'Tussentijdse evaluatie en bijsturen': 'advertenties',
  'Resultaten rapporteren': 'advertenties',
  'Matched audience uploaden en advertenties starten': 'advertenties',
  'Google-tag en Consent Mode v2 nakijken op medipim.com': 'advertenties',
  'Remarketingdoelgroep per land aanmaken (BE, FR, AU, DE)': 'advertenties',
  'Advertenties maken per taal (NL, FR, DE, EN)': 'advertenties',
  'Frequentielimiet instellen en campagne starten': 'advertenties',
  'Contacten verrijken in Bizzy: masterdata, e-commerce en marketing': 'outbound',
  'Bedrijvenlijst exporteren uit het CRM': 'outbound',
  'LinkedIn-profiel bekijken en connectieverzoek sturen': 'outbound',
  'Lijst bijwerken: wie reageerde gaat eruit': 'outbound',
  'Bellijst maken uit opens en LinkedIn-reacties': 'outbound',
  'Gebookte demo’s en uitkomsten in het CRM zetten': 'outbound',
};

/**
 * Who does a to-do, following the team roles; undefined when no role covers it (event logistics, for example).
 * Maarten writes and schedules the posts on his own profile; approval goes to whoever did not write the text.
 */
export function ownerFor(title: string, item: Pick<Item, 'type' | 'channel'>): string | undefined {
  const role = ROLES[title];
  if (!role) return undefined;
  const ownProfile = item.channel === CEO_CHANNEL;
  if (role === 'goedkeuring') return ownProfile ? TEAM.tekst : TEAM.ceo;
  if (ownProfile && (role === 'tekst' || role === 'inplannen')) return TEAM.ceo;
  if (item.type === 'email' && role === 'tekst') return TEAM.mailing;
  return TEAM[role];
}

/** Who is responsible for an item as a whole; undefined for events, which follow the team that attends. */
export function itemOwnerFor(item: Pick<Item, 'type' | 'channel'>): string | undefined {
  if (item.channel === CEO_CHANNEL) return TEAM.ceo;
  switch (item.type) {
    case 'social': return TEAM.tekst;
    case 'email': return item.channel === 'Outbound-sequentie' ? TEAM.outbound : TEAM.mailing;
    case 'campaign': return TEAM.advertenties;
    case 'call': return TEAM.outbound;
    case 'pr': return TEAM.tekst;
    default: return undefined;
  }
}

/** The to-do with the owner its role gives, unless someone already chose one. */
export const withOwner = (todo: Todo, item: Pick<Item, 'type' | 'channel'>): Todo => {
  const owner = todo.owner || ownerFor(todo.title, item);
  return owner ? { ...todo, owner } : todo;
};
