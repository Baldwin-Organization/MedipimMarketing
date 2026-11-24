import { shiftIso } from './dates';
import { todosFromTemplate } from './schedule';
import type { IsoDate, Item, ItemStatus, ItemType, Todo } from './types';

interface SeedItem {
  type: ItemType;
  title: string;
  description: string;
  channel: string;
  /** Days from today. */
  day: number;
  /** Event length in days (inclusive). */
  days?: number;
  time?: string;
  location?: string;
  owner: string;
  campaign: string;
  status?: ItemStatus;
  /** Leave the most recent overdue to-do open so it rolls forward. */
  leaveLate?: boolean;
}

const SEED: SeedItem[] = [
  // Beurzen en conferenties
  { type: 'event', title: 'Apotheekbeurs Flanders Expo', description: 'Tweedaagse vakbeurs voor apothekers. Stand met live demo van de nieuwe productfiches en de PIM-koppeling met apotheeksoftware.', channel: 'Beurs', day: 12, days: 2, location: 'Gent, Flanders Expo · stand B14', owner: 'Sofie', campaign: 'Apotheek 2027', status: 'in_uitvoering', leaveLate: true },
  { type: 'event', title: 'Pharma Data Summit', description: 'Conferentie over productdata in de farmaketen. Olivier spreekt over datakwaliteit van geneesmiddelfiches.', channel: 'Conferentie', day: 44, days: 1, location: 'Brussel, Square', owner: 'Olivier', campaign: 'Datakwaliteit', status: 'gepland' },
  { type: 'event', title: 'Vitafoods Europe', description: 'Internationale beurs voor voedingssupplementen. Bezoek en meetings met fabrikanten die hun non-drug assortiment willen aanleveren.', channel: 'Beurs', day: 86, days: 3, location: 'Barcelona, Fira Gran Via', owner: 'Pieter', campaign: 'Industrie', status: 'gepland' },
  { type: 'event', title: 'APB Wetenschappelijk Congres', description: 'Congres van de Algemene Pharmaceutische Bond. Partnerstand en sessie over digitale bijsluiters.', channel: 'Congres', day: 150, days: 2, location: 'Antwerpen, ICC', owner: 'Sofie', campaign: 'Apotheek 2027', status: 'idee' },
  { type: 'event', title: 'Medipim Partnerdag', description: 'Netwerkevent met softwarepartners en groothandels.', channel: 'Netwerkevent', day: -19, days: 1, location: 'Mechelen, Lamot', owner: 'Ward', campaign: 'Partners', status: 'klaar' },

  // Social
  { type: 'social', title: 'Nieuwe productfiches live', description: 'Carrousel met de vernieuwde productfiche: bijsluiter, packshots en prijshistoriek op één plek.', channel: 'LinkedIn', day: 2, time: '09:30', owner: 'Lien', campaign: 'Productlancering', status: 'in_uitvoering', leaveLate: true },
  { type: 'social', title: 'Teaser apotheekbeurs', description: 'Kom langs op stand B14: korte video van de demo.', channel: 'Instagram', day: 6, time: '12:00', owner: 'Lien', campaign: 'Apotheek 2027', status: 'gepland' },
  { type: 'social', title: 'Klantverhaal Apotheek De Linde', description: 'Interview over tijdswinst bij het opzoeken van productinfo.', channel: 'LinkedIn', day: 9, time: '10:00', owner: 'Sofie', campaign: 'Klantverhalen', status: 'gepland' },
  { type: 'social', title: 'Tip van de week: zoeken op CNK', description: 'Korte how-to over zoeken op CNK-code.', channel: 'Facebook', day: 16, time: '08:30', owner: 'Lien', campaign: 'Tips', status: 'idee' },
  { type: 'social', title: 'Terugblik Partnerdag', description: 'Fotoreeks en quotes van partners.', channel: 'LinkedIn', day: -15, time: '11:00', owner: 'Ward', campaign: 'Partners', status: 'klaar' },
  { type: 'social', title: 'Datakwaliteit in cijfers', description: 'Infographic: 19.000 geneesmiddelen, 98% volledige fiches.', channel: 'LinkedIn', day: 23, time: '09:00', owner: 'Olivier', campaign: 'Datakwaliteit', status: 'idee' },

  // E-mailings
  { type: 'email', title: 'Nieuwsbrief december', description: 'Maandelijkse nieuwsbrief voor apothekers: nieuwe fiches, eindejaarsopening, beursuitnodiging.', channel: 'Nieuwsbrief apothekers', day: 8, time: '07:00', owner: 'Sofie', campaign: 'Nieuwsbrief', status: 'in_uitvoering', leaveLate: true },
  { type: 'email', title: 'Uitnodiging apotheekbeurs', description: 'Persoonlijke uitnodiging met gratis badge voor stand B14.', channel: 'Uitnodiging', day: 3, time: '10:00', owner: 'Sofie', campaign: 'Apotheek 2027', status: 'gepland' },
  { type: 'email', title: 'Productupdate Q1 voor fabrikanten', description: 'Nieuwe aanleverflow voor non-drug producten en validatieregels.', channel: 'Nieuwsbrief industrie', day: 27, time: '09:00', owner: 'Pieter', campaign: 'Industrie', status: 'idee' },
  { type: 'email', title: 'Nieuwsbrief januari', description: 'Jaaroverzicht en roadmap 2027.', channel: 'Nieuwsbrief apothekers', day: 40, time: '07:00', owner: 'Sofie', campaign: 'Nieuwsbrief', status: 'idee' },

  // Calls
  { type: 'call', title: 'Kwartaalcall Multipharma', description: 'Opvolging datakoppeling en feedback op de productfiches.', channel: 'Klantcall', day: 1, time: '14:00', owner: 'Ward', campaign: 'Klanten', status: 'gepland', leaveLate: true },
  { type: 'call', title: 'Webinar: zo lever je data aan', description: 'Webinar voor fabrikanten over de nieuwe aanleverflow.', channel: 'Webinar', day: 20, time: '11:00', owner: 'Pieter', campaign: 'Industrie', status: 'gepland' },
  { type: 'call', title: 'Partnercall Farmad', description: 'Afstemming gezamenlijke communicatie rond de beurs.', channel: 'Partnercall', day: 5, time: '15:30', owner: 'Olivier', campaign: 'Partners', status: 'gepland' },
  { type: 'call', title: 'Marketing weekstart', description: 'Wekelijkse planning van het marketingteam.', channel: 'Interne sync', day: 0, time: '09:00', owner: 'Olivier', campaign: 'Intern', status: 'gepland' },
];

export function buildSeed(today: IsoDate, makeId: () => string): { items: Item[]; todos: Todo[] } {
  const now = new Date().toISOString();
  const items: Item[] = [];
  const todos: Todo[] = [];
  for (const s of SEED) {
    const date = shiftIso(today, s.day);
    const item: Item = {
      id: makeId(),
      type: s.type,
      title: s.title,
      description: s.description,
      channel: s.channel,
      date,
      time: s.time,
      endDate: s.days && s.days > 1 ? shiftIso(date, s.days - 1) : s.type === 'event' ? date : undefined,
      location: s.location,
      status: s.status ?? 'gepland',
      owner: s.owner,
      campaign: s.campaign,
      createdAt: now,
      updatedAt: now,
    };
    items.push(item);
    const own = todosFromTemplate(item, makeId);
    const past = own.filter((t) => t.dueDate < today);
    const keepOpen = s.leaveLate ? past[past.length - 1]?.id : undefined;
    for (const t of own) {
      if (t.dueDate < today && t.id !== keepOpen) {
        t.done = true;
        t.doneAt = now;
      }
    }
    todos.push(...own);
  }
  return { items, todos };
}
