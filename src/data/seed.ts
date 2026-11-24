import { daysBetween } from './dates';
import { countryCode } from './dimensions';
import type { Contents } from './repository';
import { SEED_BUDGETS, SEED_PILLARS, UX_LAUNCH_CONTENT_ID, buildSeedContent, contentIdeasUpdate } from './seed-content';
import { ACTIONS_EN, EVENTS_EN, RELEVANCE_EN, TENTATIVE_EN, UX_LAUNCH_EN } from './seed-en';
import type { Audience, IsoDate, Item, ItemStatus, ItemType, ProductType, Todo } from './types';

interface SeedEvent {
  title: string;
  date: IsoDate;
  /** Last day (inclusive); omitted for one-day events. */
  endDate?: IsoDate;
  /** `City, Country` in Dutch; the country after the last comma becomes the item's country. */
  location: string;
  channel: 'Beurs' | 'Conferentie' | 'Congres' | 'Netwerkevent';
  audiences: Audience[];
  /** Defaults to medicines. */
  products?: ProductType[];
  relevance: string;
  description: string;
  /** The organiser has not confirmed the date yet; `date` is then a placeholder. */
  tentative?: boolean;
}

const GROOTHANDELS: Audience[] = ['groothandels'];
const APOTHEKERS: Audience[] = ['apothekers'];
const PRODUCENTEN: Audience[] = ['producenten'];
const ZIEKENHUIZEN: Audience[] = ['ziekenhuizen'];
const DATAPARTNERS: Audience[] = ['producenten', 'groothandels'];
const CANNABIS: ProductType[] = ['cannabis'];
const RETAIL: ProductType[] = ['geneesmiddelen', 'cosmetica', 'voeding'];

/** Source: Medipim eventkalender 2027 (4 november 2026 – 4 november 2027, plus CPHI Frankfurt). */
const EVENTS: SeedEvent[] = [
  // Januari 2027
  { title: 'Vital Executive Conference', date: '2027-01-11', location: 'Montréal, Canada', channel: 'Conferentie', audiences: GROOTHANDELS, relevance: 'Hoog voor Canadese groothandelscontacten', description: 'Exclusieve bijeenkomst voor strategische uitwisseling en relatieopbouw binnen de Canadese farmaceutische keten. Goede ingang naar distributiebedrijven en hun handelspartners.' },
  { title: 'pharmacon Schladming', date: '2027-01-17', endDate: '2027-01-21', location: 'Schladming, Oostenrijk', channel: 'Congres', audiences: APOTHEKERS, relevance: 'Middel', description: 'Farmaceutische nascholing en netwerk in de Duitstalige markt; vooral een congres, minder een grote commerciële beurs.' },
  { title: 'Pharmapack Europe', date: '2027-01-27', endDate: '2027-01-28', location: 'Parijs, Frankrijk', channel: 'Beurs', audiences: PRODUCENTEN, relevance: 'Aanvullend', description: 'Verpakking en drug delivery staan centraal. Interessant voor fabrikantcontacten, maar minder direct gericht op apotheken.' },

  // Februari 2027
  { title: 'Health Expo Athens', date: '2027-02-20', endDate: '2027-02-21', location: 'Athene, Griekenland', channel: 'Beurs', audiences: APOTHEKERS, relevance: 'Middel', description: 'Brengt onder meer distributeurs, fabrikanten en apotheekhouders samen. Mogelijkheid om de Griekse markt en lokale datapartners te verkennen.' },
  { title: 'Cann-Reg 2027', date: '2027-02-24', endDate: '2027-02-25', location: 'Brussel, België', channel: 'Conferentie', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Middel', description: 'Specifiek over regelgeving, kwaliteit, supply chain en medische toepassingen van cannabis. Bezoekers zijn onder meer regelgevers, zorgprofessionals en bedrijven.' },
  { title: 'Singapore Pharmacy Congress', date: '2027-02-26', endDate: '2027-02-28', location: 'Singapore', channel: 'Congres', audiences: APOTHEKERS, relevance: 'Middel', description: 'Regionaal congres over apotheekpraktijk en de farmaceutische industrie. Interessant voor Aziatisch netwerk, maar geen klassieke vakbeurs.' },
  { title: 'Cannabinoid Innovation Forum', date: '2027-02-01', tentative: true, location: 'Mexico-Stad, Mexico', channel: 'Conferentie', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Aanvullend', description: 'Zakelijk en wetenschappelijk forum over cannabinoïden, geneeskunde, regelgeving en marktontwikkeling. Gepland in februari; de exacte datum is nog niet bevestigd.' },

  // Maart 2027
  { title: 'Cannabis Europa Warsaw', date: '2027-03-03', location: 'Warschau, Polen', channel: 'Conferentie', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Middel', description: 'Eendaagse bijeenkomst over de Poolse markt voor medicinale cannabis en de ontwikkeling in Centraal- en Oost-Europa.' },
  { title: 'HDA Distribution Management Conference and Expo', date: '2027-03-07', endDate: '2027-03-10', location: 'Palm Desert, Verenigde Staten', channel: 'Conferentie', audiences: GROOTHANDELS, relevance: 'Zeer hoog voor Amerikaanse distributiepartners', description: 'HDA’s grote supplychainbijeenkomst brengt honderden fabrikanten, distributeurs, consultants en dienstverleners samen. Directe kans om Amerikaanse groothandels en hun partners te ontmoeten.' },
  { title: 'United in Compassion (UIC) 2027', date: '2027-03-11', endDate: '2027-03-13', location: 'Gold Coast, Australië', channel: 'Conferentie', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Hoog voor cannabisdata', description: 'Brengt clinici, onderzoekers, beleidsmakers en industrie samen rond cannabis als geneesmiddel. Sponsoring en exposeren zijn voorzien.' },
  { title: 'Spannabis Bilbao en World Cannabis Conference', date: '2027-03-12', endDate: '2027-03-14', location: 'Bilbao, Spanje', channel: 'Beurs', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Aanvullend', description: 'Brede cannabisbeurs met een conferentieprogramma, waaronder medische onderwerpen. Minder specifiek dan een medische cannabisconferentie.' },
  { title: 'PharmagoraPlus', date: '2027-03-13', endDate: '2027-03-14', location: 'Parijs, Frankrijk', channel: 'Beurs', audiences: APOTHEKERS, relevance: 'Hoog', description: 'Rechtstreeks gericht op openbare apotheken, apothekers en leveranciers. Kans om Medipim en software-integraties aan apotheekbezoekers te tonen.' },
  { title: 'DIA Europe 2027', date: '2027-03-16', endDate: '2027-03-18', location: 'Basel, Zwitserland', channel: 'Conferentie', audiences: PRODUCENTEN, relevance: 'Middel voor datapartners', description: 'Farmabedrijven, regelgevers en life-sciencespecialisten bespreken productontwikkeling, regelgeving, geneesmiddelenveiligheid en toegang.' },
  { title: 'Infarma', date: '2027-03-16', endDate: '2027-03-18', location: 'Barcelona, Spanje', channel: 'Beurs', audiences: APOTHEKERS, relevance: 'Hoog', description: 'Sterke kandidaat voor rechtstreeks contact met Spaanse openbare apotheken en bedrijven uit de apotheeksector.' },
  { title: 'Asian Pharma Supply Chain and Logistics Forum', date: '2027-03-17', endDate: '2027-03-18', location: 'Singapore', channel: 'Conferentie', audiences: GROOTHANDELS, relevance: 'Middel, regionale verkenning', description: 'Bijeenkomst voor professionals in farmaceutische supply chain, logistiek, kwaliteit, regelgeving en distributie. Controleer vooraf welke groothandels aan de editie deelnemen.' },
  { title: 'EAHP Congress', date: '2027-03-17', endDate: '2027-03-19', location: 'Wenen, Oostenrijk', channel: 'Congres', audiences: ZIEKENHUIZEN, relevance: 'Middel', description: 'Europees congres voor ziekenhuisapothekers. Relevant als Medipim ziekenhuisfarmacie wil verkennen.' },
  { title: 'APP Conference and Trade Exhibition', date: '2027-03-18', endDate: '2027-03-20', location: 'Gold Coast, Australië', channel: 'Beurs', audiences: APOTHEKERS, relevance: 'Hoog', description: 'Grote Australische apotheekbijeenkomst met een uitgebreide vakbeurs. Directe toegang tot apothekers, apotheekteams en leveranciers.' },
  { title: 'APhA Annual Meeting and Exposition', date: '2027-03-19', endDate: '2027-03-22', location: 'Charlotte, Verenigde Staten', channel: 'Congres', audiences: APOTHEKERS, relevance: 'Middel tot hoog', description: 'Grote Amerikaanse bijeenkomst van apothekers. Geschikt om de markt te leren kennen en contacten met apotheekprofessionals te leggen.' },

  // April 2027
  { title: 'Global Cannabis Regulatory Summit', date: '2027-04-05', endDate: '2027-04-07', location: 'Zürich, Zwitserland', channel: 'Conferentie', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Middel, strategisch', description: 'Internationaal forum voor regelgevers, zorgprofessionals, onderzoekers, patiëntenorganisaties en industrie. Deelname is op uitnodiging; geen gewone vakbeurs.' },
  { title: 'IFPW CEO Roundtable', date: '2027-04-12', endDate: '2027-04-13', location: 'Londen, Verenigd Koninkrijk', channel: 'Netwerkevent', audiences: GROOTHANDELS, relevance: 'Zeer hoog voor internationale introducties; toegang vooraf afstemmen', description: 'Jaarlijkse ontmoeting van CEO’s uit groothandels en nationale distributieorganisaties. IFPW vermeldt dat deelname ledengebonden is en op uitnodiging verloopt; informeer naar partner- of gasttoegang.' },
  { title: 'DMEA', date: '2027-04-13', endDate: '2027-04-15', location: 'München, Duitsland', channel: 'Beurs', audiences: ZIEKENHUIZEN, relevance: 'Middel', description: 'Digitale zorg, health IT, data en interoperabiliteit. Interessant voor software- en integratiepartners buiten de apotheeksector.' },
  { title: 'Zorg & ICT', date: '2027-04-13', endDate: '2027-04-15', location: 'Utrecht, Nederland', channel: 'Beurs', audiences: ZIEKENHUIZEN, relevance: 'Middel', description: 'Nederlandse beurs voor zorgtechnologie en ICT. Mogelijke contacten met digitale zorg- en softwarepartners.' },
  { title: 'ICBC Berlin', date: '2027-04-13', endDate: '2027-04-15', location: 'Berlijn, Duitsland', channel: 'Beurs', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Middel voor cannabisdata', description: 'Brede cannabisindustriebeurs met aandacht voor medicinale cannabis en Europese regelgeving.' },
  { title: 'Cosmofarma', date: '2027-04-15', endDate: '2027-04-17', location: 'Bologna, Italië', channel: 'Beurs', audiences: APOTHEKERS, products: RETAIL, relevance: 'Hoog', description: 'Jaarlijkse bijeenkomst van de Italiaanse apotheeksector. Interessant voor apotheekteams en marktontwikkeling in Italië.' },
  { title: 'NACDS Annual Meeting', date: '2027-04-18', endDate: '2027-04-20', location: 'Palm Beach, Verenigde Staten', channel: 'Netwerkevent', audiences: APOTHEKERS, relevance: 'Hoog voor ketenpartners', description: 'Besloten, afspraakgerichte bijeenkomst met leidinggevenden van Amerikaanse apotheekketens en leveranciers. Geschikt voor strategische introducties.' },
  { title: 'Asian Conference on Clinical Pharmacy', date: '2027-04-22', endDate: '2027-04-25', location: 'Penang, Maleisië', channel: 'Congres', audiences: APOTHEKERS, relevance: 'Aanvullend', description: 'Congres rond klinische farmacie en innovatie in de apotheekpraktijk. Meer professioneel en wetenschappelijk dan commercieel.' },
  { title: 'Pharmacy Expo Poland', date: '2027-04-27', endDate: '2027-04-29', location: 'Polen', channel: 'Beurs', audiences: APOTHEKERS, relevance: 'Middel tot hoog', description: 'Bevat apotheeksoftware, e-pharmacy, automatisering en technologie. Kans om Poolse leveranciers en apotheekpartners te ontmoeten.' },
  { title: 'Pharmacy U Toronto', date: '2027-04-01', tentative: true, location: 'Toronto, Canada', channel: 'Congres', audiences: APOTHEKERS, relevance: 'Middel, datum onzeker', description: 'Lijkt gericht op apothekers en apotheekteams. Voor 2027 is een datum in april genoemd, maar nog niet officieel bevestigd.' },

  // Mei 2027
  { title: 'Vital Annual Conference', date: '2027-05-02', location: 'Québec City, Canada', channel: 'Conferentie', audiences: GROOTHANDELS, relevance: 'Hoog voor Canadese distributiecontacten', description: 'Meerdaagse bijeenkomst die de Canadese farmaceutische keten samenbrengt voor sectorbesprekingen en samenwerking. 2 mei is de startdatum volgens de organisator; controleer de volledige congresdata bij Vital.' },
  { title: 'CSHP Professional Practice Conference', date: '2027-05-07', endDate: '2027-05-09', location: 'Toronto, Canada', channel: 'Congres', audiences: ZIEKENHUIZEN, relevance: 'Middel', description: 'Canadees congres voor ziekenhuisapothekers. Relevant als Medipim ziekenhuisfarmacie of institutionele medicatiegegevens wil verkennen.' },
  { title: 'GIRP PharmaConnect 2027', date: '2027-05-19', endDate: '2027-05-20', location: 'Sofia, Bulgarije', channel: 'Conferentie', audiences: GROOTHANDELS, relevance: 'Zeer hoog voor Europese groothandels', description: 'GIRP brengt groothandels, fabrikanten en andere Europese supplychainpartijen samen. Inhoudelijk een bijzonder sterke gelegenheid om Medimapper te positioneren rond grensoverschrijdende productdata en marktvergelijking.' },
  { title: 'Congresso Brasileiro da Cannabis Medicinal en Cannabis Fair', date: '2027-05-20', endDate: '2027-05-22', location: 'São Paulo, Brazilië', channel: 'Congres', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Hoog voor cannabisdata', description: 'Combineert medische onderwerpen met een beurs voor de cannabiswaardeketen, waaronder farmaceutische industrie, technologie en distributie.' },
  { title: 'Florida Medical Cannabis Conference and Exhibition', date: '2027-05-21', endDate: '2027-05-23', location: 'Orlando, Verenigde Staten', channel: 'Conferentie', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Middel tot hoog voor cannabisdata', description: 'Gericht op bewijs, klinische toepassingen en medische professionals, met deelname van bedrijven uit de sector.' },
  { title: 'GS1 Connect', date: '2027-05-24', endDate: '2027-05-26', location: 'Denver, Verenigde Staten', channel: 'Conferentie', audiences: DATAPARTNERS, relevance: 'Hoog voor datastandaarden', description: 'Sterke inhoudelijke match rond productdatakwaliteit, masterdatabeheer, interoperabiliteit en traceerbaarheid, inclusief onderwerpen uit de geneesmiddelenketen.' },

  // Juni 2027
  { title: 'Mary Jane Berlin', date: '2027-06-03', endDate: '2027-06-06', location: 'Berlijn, Duitsland', channel: 'Beurs', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Aanvullend', description: 'Brede cannabisbeurs met een aparte B2B-dag en aanbod voor toegelaten medische leveranciers. Minder medisch gefocust dan Cann-Reg of UIC.' },
  { title: 'HIMSS Europe', date: '2027-06-08', endDate: '2027-06-10', location: 'Barcelona, Spanje', channel: 'Conferentie', audiences: ZIEKENHUIZEN, relevance: 'Middel', description: 'Zorgtechnologie, data, interoperabiliteit en digitale transformatie. Interessant voor bredere healthtech- en integratiepartners.' },
  { title: 'HDA Business and Leadership Conference', date: '2027-06-13', endDate: '2027-06-16', location: 'San Antonio, Verenigde Staten', channel: 'Conferentie', audiences: GROOTHANDELS, relevance: 'Hoog voor Amerikaanse wholesalerleiders', description: 'Besloten HDA-bijeenkomst met senior managers en beslissers uit de Amerikaanse gezondheidszorgketen. Gericht op strategische gesprekken en één-op-ééncontacten; deelname verloopt via HDA-lidmaatschap.' },
  { title: 'CPHI China', date: '2027-06-16', endDate: '2027-06-18', location: 'Shanghai, China', channel: 'Beurs', audiences: PRODUCENTEN, relevance: 'Middel voor fabrikantdata', description: 'Grote bijeenkomst voor farmaceutische producenten en leveranciers. Interessant voor producenten- en datapartners, minder voor rechtstreeks apothekerscontact.' },
  { title: 'Cannabis Europa London', date: '2027-06-23', endDate: '2027-06-24', location: 'Londen, Verenigd Koninkrijk', channel: 'Conferentie', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Hoog voor cannabisdata', description: 'Trekt beslissers, investeerders, regelgevers, clinici en farmaceutische leiders uit de Europese cannabisindustrie aan.' },

  // Juli en augustus 2027
  { title: 'ICRS Symposium on the Cannabinoids', date: '2027-07-04', endDate: '2027-07-08', location: 'Banff, Canada', channel: 'Congres', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Aanvullend', description: 'Sterk wetenschappelijk profiel rond cannabinoïden en endocannabinoïden; bruikbaar voor onderzoekscontacten, niet als klassieke verkoopbeurs.' },
  { title: 'CPHI South East Asia', date: '2027-07-13', endDate: '2027-07-15', location: 'Kuala Lumpur, Maleisië', channel: 'Beurs', audiences: PRODUCENTEN, relevance: 'Middel, regionale marktverkenning', description: 'Regionale beurs voor de farmaceutische keten in Zuidoost-Azië. Breder en meer producentgericht dan een wholesalereünie, maar bruikbaar voor distributeurs- en datapartners in ASEAN.' },
  { title: 'Japan Drugstore Show', date: '2027-07-30', endDate: '2027-08-01', location: 'Tokio, Japan', channel: 'Beurs', audiences: APOTHEKERS, products: ['cosmetica', 'voeding', 'baby'], relevance: 'Middel, retailgericht', description: 'Gericht op drogisterijen, OTC en consumentenproducten. Kan relevant zijn voor retailproductdata en distributiepartners.' },
  { title: 'NACDS Total Store Expo', date: '2027-08-14', endDate: '2027-08-16', location: 'San Diego, Verenigde Staten', channel: 'Beurs', audiences: APOTHEKERS, products: RETAIL, relevance: 'Hoog voor ketenpartners', description: 'Brengt grote retailers en leveranciers samen, met beslissers uit apotheek, digitalisering, logistiek en supply chain.' },

  // September 2027
  { title: 'HDA Annual Board and Membership Meeting', date: '2027-09-12', endDate: '2027-09-15', location: 'Park City, Verenigde Staten', channel: 'Netwerkevent', audiences: GROOTHANDELS, relevance: 'Hoog voor Amerikaanse strategische contacten', description: 'HDA-leden bespreken hier de koers van de organisatie en ontwikkelingen in beleid en farmaceutische distributie. Vooral geschikt voor senior relaties en bestaande introducties.' },
  { title: 'FIP World Congress of Pharmacy and Pharmaceutical Sciences', date: '2027-09-12', endDate: '2027-09-15', location: 'Kuala Lumpur, Maleisië', channel: 'Congres', audiences: APOTHEKERS, relevance: 'Middel tot hoog voor internationaal netwerk', description: 'Brengt apotheekleiders, apothekers, docenten en farmaceutische wetenschappers uit de hele wereld samen.' },
  { title: 'Vital Member Forum', date: '2027-09-14', location: 'Angus Glen, Canada', channel: 'Netwerkevent', audiences: GROOTHANDELS, relevance: 'Middel tot hoog voor netwerk in Canada', description: 'Kleinschaliger ledenforum met briefings en gesprekken over actuele operationele en beleidsmatige thema’s in de Canadese supply chain.' },
  { title: 'Agential Cannabis', date: '2027-09-22', endDate: '2027-09-23', location: 'Bangkok, Thailand', channel: 'Beurs', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Hoog voor cannabisdata', description: 'Specifiek voor de medicinale-cannabisketen in Azië-Pacific, van productie en kwaliteit tot markttoegang.' },
  { title: 'Cannabis Europa Paris', date: '2027-09-23', location: 'Parijs, Frankrijk', channel: 'Conferentie', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Middel tot hoog voor cannabisdata', description: 'Eendaagse bijeenkomst over de Franse markt en de ontwikkeling van medicinale cannabis in West-Europa.' },
  { title: 'Expopharm', date: '2027-09-28', endDate: '2027-09-30', location: 'Düsseldorf, Duitsland', channel: 'Beurs', audiences: APOTHEKERS, relevance: 'Hoog', description: 'Grote Europese apotheekbeurs met apothekers, beslissers en leveranciers. Sterk voor softwarepartners, integraties en zichtbaarheid bij apotheken.' },

  // Oktober 2027
  { title: 'The Pharmacy Show', date: '2027-10-10', endDate: '2027-10-11', location: 'Birmingham, Verenigd Koninkrijk', channel: 'Beurs', audiences: APOTHEKERS, relevance: 'Hoog', description: 'Britse vakbeurs voor openbare apotheken en eerstelijnszorg. Directe toegang tot apotheekprofessionals en leveranciers.' },
  { title: 'Pharmanology', date: '2027-10-12', tentative: true, location: 'Antwerpen, België', channel: 'Beurs', audiences: APOTHEKERS, relevance: 'Hoog', description: 'Apothekers en hun partners ontmoeten elkaar rond innovatie en praktijkwerking. Goede Belgische gelegenheid voor software- en leverancierscontacten.' },
  { title: 'SNOMED CT Expo', date: '2027-10-20', endDate: '2027-10-22', location: 'St Julian’s, Malta', channel: 'Congres', audiences: DATAPARTNERS, relevance: 'Middel, technisch', description: 'Trekt experts in terminologie, interoperabiliteit en gezondheids-IT. Relevant voor datamapping en semantische koppelingen; technisch van aard.' },
  { title: 'Mediterranean Cannabis Summit', date: '2027-10-22', endDate: '2027-10-23', location: 'Ta’ Qali, Malta', channel: 'Conferentie', audiences: PRODUCENTEN, products: CANNABIS, relevance: 'Aanvullend', description: 'Brede cannabisbijeenkomst met medische en wetenschappelijke onderdelen, naast industrie, beleid en investeringen.' },
  { title: 'GS1 Global Healthcare Conference', date: '2027-10-25', endDate: '2027-10-27', location: 'Sydney, Australië', channel: 'Conferentie', audiences: DATAPARTNERS, relevance: 'Hoog voor data- en standaardisatiepartners', description: 'Internationale bijeenkomst over interoperabiliteit, GS1-standaarden, traceerbaarheid en datadeling. Geen groothandelsbeurs, maar inhoudelijk relevant voor Medimappers datamodel en partnerschappen rond productdata.' },

  // November 2027
  { title: 'HDA Research Foundation CEO Roundtable', date: '2027-11-04', location: 'Washington, Verenigde Staten', channel: 'Netwerkevent', audiences: GROOTHANDELS, relevance: 'Aanvullend, vooral voor senior netwerkcontacten', description: 'Jaarlijkse bijeenkomst ten bate van de HDA Research Foundation, met senior contacten uit de Amerikaanse distributiesector.' },
  { title: 'CPHI Frankfurt', date: '2027-11-09', endDate: '2027-11-11', location: 'Frankfurt, Duitsland', channel: 'Beurs', audiences: PRODUCENTEN, relevance: 'Middel voor fabrikantdata', description: 'Belangrijke beurs voor producenten en leveranciers. Valt net buiten de periode van de eventkalender (tot 4 november 2027).' },
];

/** Events where Medipim has a stand. */
const EXHIBITING = ['PharmagoraPlus', 'APP Conference and Trade Exhibition', 'GIRP PharmaConnect 2027', 'Expopharm', 'The Pharmacy Show'];

/** The five exhibitor events, for data seeded before that decision. Returns only the items that change. */
export function markExhibitors(items: Item[]): Item[] {
  const now = new Date().toISOString();
  return items
    .filter((i) => i.type === 'event' && !i.participation && EXHIBITING.includes(i.title))
    .map((i) => ({ ...i, participation: 'exposant', status: i.status === 'idee' ? 'gepland' : i.status, updatedAt: now }));
}

/**
 * English text for seed items that predate translations. A field is only translated while its
 * Dutch text is still the seed text, so edited items never get a translation that no longer matches.
 */
export function addSeedTranslations(items: Item[]): Item[] {
  const now = new Date().toISOString();
  const seed = new Map(buildSeed(() => '').items.map((i) => [`${i.type}|${i.title}`, i]));
  return items.flatMap((i) => {
    const s = seed.get(`${i.type}|${i.title}`);
    if (!s?.translations?.en || i.translations?.en) return [];
    const en = s.translations.en;
    return [{
      ...i,
      translations: {
        en: {
          title: en.title,
          ...(i.description === s.description && { description: en.description }),
          ...(i.location === s.location && { location: en.location }),
          ...(i.campaign === s.campaign && { campaign: en.campaign }),
        },
      },
      updatedAt: now,
    }];
  });
}

/**
 * The 2027 budget plan, the content mix and its starter ideas, for data seeded before they existed.
 * Each part is only added while that part is still empty, so nothing the team entered is overwritten.
 */
export function addBudgetAndContent(data: Contents): Partial<Contents> {
  const now = new Date().toISOString();
  const seedPillars = !data.pillars.length;
  return {
    budgets: data.budgets.some((b) => b.year === 2027) ? [] : SEED_BUDGETS,
    pillars: seedPillars ? SEED_PILLARS : [],
    content: seedPillars && !data.content.length ? buildSeedContent(now) : [],
    items: seedPillars
      ? data.items
        .filter((i) => !i.contentId && ACTIONS.some((a) => a.type === i.type && a.title === i.title))
        .map((i) => ({ ...i, contentId: UX_LAUNCH_CONTENT_ID, updatedAt: now }))
      : [],
  };
}

/** Seed changes applied once to data that already exists in a browser, in order. Each returns only the records that change. */
export const SEED_UPDATES: { key: string; apply: (data: Contents) => Partial<Contents> }[] = [
  { key: 'mc-seed-updates-1', apply: (data) => ({ items: markExhibitors(data.items) }) },
  { key: 'mc-seed-updates-2', apply: (data) => ({ items: addSeedTranslations(data.items) }) },
  { key: 'mc-seed-updates-3', apply: addBudgetAndContent },
  { key: 'mc-seed-updates-4', apply: (data) => ({ content: contentIdeasUpdate(data.content, data.pillars, new Date().toISOString()) }) },
];

/** The starting content: the 2027 conference calendar, unassigned and without to-dos, enriched with audience, product type and country; the 2027 budget plan and the content mix. */
export function buildSeed(makeId: () => string): Contents {
  const now = new Date().toISOString();
  const items = EVENTS.map((e): Item => {
    const en = EVENTS_EN[e.title];
    return {
    id: makeId(),
    type: 'event',
    title: e.tentative ? `${e.title} (datum te bevestigen)` : e.title,
    description: `${e.description}\n\nRelevantie voor Medipim: ${e.relevance}.`,
    channel: e.channel,
    date: e.date,
    endDate: e.endDate ?? e.date,
    location: e.location,
    ...(EXHIBITING.includes(e.title) ? { participation: 'exposant' as const, status: 'gepland' as const } : { status: 'idee' as const }),
    owner: '',
    campaign: '',
    audiences: e.audiences,
    productTypes: e.products ?? ['geneesmiddelen'],
    countries: [countryCode(e.location.split(',').pop()!)].filter((c): c is string => !!c),
    translations: {
      en: {
        title: e.tentative ? `${e.title} ${TENTATIVE_EN}` : en.title ?? e.title,
        description: `${en.description}\n\n${RELEVANCE_EN}: ${en.relevance}.`,
        location: en.location,
      },
    },
    createdAt: now,
    updatedAt: now,
    };
  });
  const todos: Todo[] = [];
  for (const a of ACTIONS) {
    const id = makeId();
    items.push({
      id,
      type: a.type,
      title: a.title,
      description: a.description,
      channel: a.channel,
      date: a.date,
      time: a.time,
      status: a.status,
      owner: a.owner,
      campaign: UX_LAUNCH,
      audiences: a.audiences,
      productTypes: ALL_PRODUCTS,
      countries: a.countries,
      translations: { en: { ...ACTIONS_EN[a.title], campaign: UX_LAUNCH_EN } },
      contentId: UX_LAUNCH_CONTENT_ID,
      createdAt: now,
      updatedAt: now,
    });
    for (const t of a.todos ?? []) {
      todos.push({ id: makeId(), itemId: id, title: t.title, dueDate: t.dueDate, done: false, offsetDays: daysBetween(a.date, t.dueDate) });
    }
  }
  return { items, todos, budgets: SEED_BUDGETS, pillars: SEED_PILLARS, content: buildSeedContent(now) };
}

const UX_LAUNCH = 'Nieuwe UX Belgisch platform';
const ALL_AUDIENCES: Audience[] = ['groothandels', 'producenten', 'apothekers', 'ziekenhuizen'];
const ALL_PRODUCTS: ProductType[] = ['geneesmiddelen', 'cannabis', 'cosmetica', 'voeding', 'baby'];

/** Communication around the launch of the new UX of the Belgian platform (November 2026). */
const ACTIONS: {
  type: ItemType;
  title: string;
  description: string;
  channel: string;
  date: IsoDate;
  time?: string;
  status: ItemStatus;
  owner: string;
  audiences: Audience[];
  countries: string[];
  todos?: { title: string; dueDate: IsoDate }[];
}[] = [
  {
    type: 'social',
    title: 'Aankondiging nieuwe UX Belgisch platform',
    description: 'LinkedIn-post in het Engels vanuit het profiel van Maarten (CEO), voor een internationaal publiek.',
    channel: 'LinkedIn · Maarten (CEO)',
    date: '2026-11-23',
    status: 'klaar',
    owner: 'Maarten',
    audiences: ALL_AUDIENCES,
    countries: [],
  },
  {
    type: 'social',
    title: 'Nieuwe UX Belgisch platform – post Medipim-pagina',
    description: 'Tweede LinkedIn-post over de nieuwe UX, nu vanuit de Europese bedrijfspagina Medipim.',
    channel: 'LinkedIn · Medipim',
    date: '2026-11-25',
    status: 'gepland',
    owner: '',
    audiences: ALL_AUDIENCES,
    countries: [],
    todos: [
      { title: 'Tekst schrijven', dueDate: '2026-11-24' },
      { title: 'Visual kiezen', dueDate: '2026-11-24' },
      { title: 'Inplannen op de Medipim-pagina', dueDate: '2026-11-25' },
    ],
  },
  {
    type: 'email',
    title: 'Nieuwsbrief: nieuwe UX van het platform',
    description: 'Nieuwsbrief aan de Belgische apothekers over de nieuwe UX van het platform.',
    channel: 'Nieuwsbrief apothekers',
    date: '2026-11-27',
    time: '09:00',
    status: 'gepland',
    owner: '',
    audiences: ['apothekers'],
    countries: ['BE'],
    todos: [
      { title: 'Tekst en visuals maken', dueDate: '2026-11-25' },
      { title: 'Testmail versturen en goedkeuring vragen', dueDate: '2026-11-26' },
      { title: 'Verzending inplannen op vrijdag 9:00', dueDate: '2026-11-26' },
    ],
  },
];
