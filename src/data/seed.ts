import { eventEstimate } from './budget';
import { HOLIDAYS, daysBetween, shiftIso, workdayAfter, workdayBefore } from './dates';
import { EXISTING_MARKETS, countryCode } from './dimensions';
import { newId, type Contents } from './repository';
import { seedRevenues } from './potential';
import { eventLanguages, eventTodoDay, planEvents, visitorPostTexts } from './seed-events';
import { addOutbound, buildOutbound, outboundProduction, outboundWaveDates } from './seed-outbound';
import { AGENCY_SHARE, BUDGET_2027_AGENCY_ON_TOP, SEED_BUDGETS, SEED_PILLARS, UX_LAUNCH_CONTENT_ID, academyLanguages, academyUpdate, buildSeedContent, contentIdeasUpdate, decemberFillUpdate, weeklyFillUpdate } from './seed-content';
import { moveItem, scopeTodos } from './schedule';
import { WEEKLY_CHANNEL, WEEKLY_FROM, scheduleWeekly } from './seed-weekly';
import { PREP_FROM, PREVIOUS_OFFSETS, TODO_TEMPLATES } from './templates';
import { itemOwnerFor, withOwner } from './team';
import { ACTIONS_EN, EVENTS_EN, RELEVANCE_EN, TENTATIVE_EN, UX_LAUNCH_EN, VIA_DISTRIBUTOR_EN, VIA_MEDITECH_EN, VIA_MEDITECH_EN_BEFORE } from './seed-en';
import type { Audience, Budget, ContentPiece, IsoDate, Item, ItemStatus, ItemType, ProductType, Todo, TodoPhase } from './types';

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
  { title: 'World Health Expo Dubai', date: '2027-01-25', endDate: '2027-01-28', location: 'Dubai, Verenigde Arabische Emiraten', channel: 'Beurs', audiences: ['producenten', 'groothandels', 'ziekenhuizen'], relevance: 'Middel; vooral om de regio te verkennen', description: 'De vroegere Arab Health: een grote zorgbeurs over twee locaties met een Pharma Zone voor productie, verpakking, supply chain en regelgeving. Tegelijk loopt WHX Tech (26–28 januari) over digitale zorg en AI.' },

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
  { title: 'DUPHAT 2027', date: '2027-03-30', endDate: '2027-04-01', location: 'Dubai, Verenigde Arabische Emiraten', channel: 'Beurs', audiences: ['producenten', 'groothandels', 'apothekers'], products: ['geneesmiddelen', 'cosmetica', 'voeding', 'baby'], relevance: 'Hoog voor het Midden-Oosten en Afrika', description: 'De grootste farmabeurs en -conferentie van het Midden-Oosten en Afrika in het Dubai World Trade Centre: zo’n 1.100 exposanten en 25.000 bezoekers. Fabrikanten, groothandels, apotheekketens en regelgevers, met een startupzone voor farmadata en analytics en een zone voor parafarmacie.' },

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
  { title: 'CPHI Middle East', date: '2027-04-26', endDate: '2027-04-28', location: 'Riyad, Saoedi-Arabië', channel: 'Beurs', audiences: PRODUCENTEN, relevance: 'Middel; vooral fabrikanten in de Golfregio', description: 'Grote farmabeurs voor de hele productieketen, met steun van het Saoedische ministerie van Volksgezondheid. Verplaatst van december 2026 naar april 2027.' },

  // Mei 2027
  { title: 'Vital Annual Conference', date: '2027-05-02', endDate: '2027-05-05', location: 'Québec City, Canada', channel: 'Conferentie', audiences: GROOTHANDELS, relevance: 'Hoog voor Canadese distributiecontacten', description: 'Vierdaags congres in het Fairmont Le Château Frontenac dat distributeurs, fabrikanten en dienstverleners uit de Canadese farmaceutische keten samenbrengt rond strategische inzichten, trends en nieuwe samenwerkingen. Ticket voor niet-leden: CAD 5.250 plus 5% GST bij vroege inschrijving, daarna CAD 5.750.' },
  { title: 'CSHP Professional Practice Conference', date: '2027-05-07', endDate: '2027-05-09', location: 'Toronto, Canada', channel: 'Congres', audiences: ZIEKENHUIZEN, relevance: 'Middel', description: 'Canadees congres voor ziekenhuisapothekers. Relevant als Medipim ziekenhuisfarmacie of institutionele medicatiegegevens wil verkennen.' },
  { title: 'GIRP PharmaConnect 2027', date: '2027-05-19', endDate: '2027-05-20', location: 'Sofia, Bulgarije', channel: 'Conferentie', audiences: GROOTHANDELS, relevance: 'Zeer hoog voor Europese groothandels', description: 'GIRP brengt groothandels, fabrikanten en andere Europese supplychainpartijen samen. Inhoudelijk een bijzonder sterke gelegenheid om Medipim te positioneren rond grensoverschrijdende productdata en marktvergelijking.' },
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
  { title: 'Pharmacy Connect', date: '2027-09-07', endDate: '2027-09-09', location: 'Sydney, Australië', channel: 'Beurs', audiences: ['apothekers', 'producenten'], relevance: 'Hoog voor Australië', description: 'Jaarcongres van The Pharmacy Guild of Australia in het Hyatt Regency Sydney, met meer dan 1.300 apothekers, apotheekhouders, apotheekassistenten en mensen uit de industrie. Naast tweeënhalve dag programma een vakbeurs met 90 stands, in 2026 uitverkocht, met onder meer Haleon, Pfizer, Bayer, Galderma, Arrotex en groothandel Symbion.' },
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

  // November 2027
  { title: 'HDA Research Foundation CEO Roundtable', date: '2027-11-04', location: 'Washington, Verenigde Staten', channel: 'Netwerkevent', audiences: GROOTHANDELS, relevance: 'Aanvullend, vooral voor senior netwerkcontacten', description: 'Jaarlijkse bijeenkomst ten bate van de HDA Research Foundation, met senior contacten uit de Amerikaanse distributiesector.' },
  { title: 'CPHI Frankfurt', date: '2027-11-09', endDate: '2027-11-11', location: 'Frankfurt, Duitsland', channel: 'Beurs', audiences: PRODUCENTEN, relevance: 'Middel voor fabrikantdata', description: 'Belangrijke beurs voor producenten en leveranciers. Valt net buiten de periode van de eventkalender (tot 4 november 2027).' },
];

/** Events where Medipim has a stand; together they make up the exhibitor budget line. */
const EXHIBITING = ['PharmagoraPlus', 'Expopharm', 'The Pharmacy Show'];
/** Planned per exhibitor event, stand, travel and stay included. */
export const EXHIBITOR_BUDGET = 20000;
/** Marked as exhibitor before the stands were narrowed down to `EXHIBITING`. */
const NO_LONGER_EXHIBITING = ['APP Conference and Trade Exhibition', 'GIRP PharmaConnect 2027'];
/** Conferences Medipim attends without a stand; they fall under the visitor budget line. */
const VISITING = ['GIRP PharmaConnect 2027', 'Vital Annual Conference'];
/** Someone from Medipim attends together with partner Meditech, at no cost to Medipim. */
const VIA_MEDITECH = ['World Health Expo Dubai'];
/** Events the earlier Meditech updates handled; Pharmacy Connect went to the distributor afterwards. */
const MEDITECH_BEFORE = [...VIA_MEDITECH, 'Pharmacy Connect'];
const VIA_MEDITECH_NL = 'Beslissing: iemand van Medipim gaat mee met Meditech, budgetneutraal voor Medipim.';
const VIA_MEDITECH_NL_BEFORE = 'Beslissing: budgetneutraal voor Medipim, Meditech gaat.';

/** The events Meditech attends, for data seeded before that decision. Leaves events someone already decided on or budgeted. */
export function markViaMeditech(items: Item[]): Item[] {
  const now = new Date().toISOString();
  return items
    .filter((i) => i.type === 'event' && MEDITECH_BEFORE.includes(i.title) && !i.participation && i.budgetPlanned == null && i.budgetActual == null)
    .map((i) => ({ ...viaMeditech(i), updatedAt: now }));
}

/**
 * An earlier update marked the Meditech events as not attended; Medipim does attend. Turns them into visits at no cost,
 * with the visitor posts and preparation, unless someone changed the decision since.
 */
export function meditechAttends(data: Pick<Contents, 'items' | 'todos'>, makeId: () => string): Pick<Contents, 'items' | 'todos'> {
  const now = new Date().toISOString();
  const swap = (text: string | undefined, before: string, after: string) => text?.replace(before, after);
  const events = data.items
    .filter((i) => i.type === 'event' && MEDITECH_BEFORE.includes(i.title) && i.participation === 'geen' && i.description.includes(VIA_MEDITECH_NL_BEFORE))
    .map((i): Item => ({
      ...i,
      participation: 'bezoeker',
      description: swap(i.description, VIA_MEDITECH_NL_BEFORE, VIA_MEDITECH_NL)!,
      translations: { ...i.translations, en: { ...i.translations?.en, description: swap(i.translations?.en?.description, VIA_MEDITECH_EN_BEFORE, VIA_MEDITECH_EN) } },
      updatedAt: now,
    }));
  const plan = planEvents({ items: [...events, ...data.items.filter((i) => i.type !== 'event')], todos: data.todos }, makeId);
  return { items: [...events, ...plan.items], todos: plan.todos };
}

const viaMeditech = (i: Item) => budgetNeutral(i, VIA_MEDITECH_NL, VIA_MEDITECH_EN);

/** Earlier decision notes, removed when another partner takes over the costs. */
const PARTNER_NOTES = [VIA_MEDITECH_NL, VIA_MEDITECH_NL_BEFORE, VIA_MEDITECH_EN, VIA_MEDITECH_EN_BEFORE];
const withoutPartnerNotes = (text = '') => PARTNER_NOTES.reduce((t, note) => t.replace(`\n\n${note}`, ''), text);

/** Medipim attends at no cost because a partner pays; keeps a stand someone chose, otherwise a visit. */
function budgetNeutral(i: Item, nl: string, en: string): Item {
  return {
    ...i,
    participation: i.participation === 'exposant' ? 'exposant' : 'bezoeker',
    status: i.status === 'idee' ? 'gepland' : i.status,
    budgetPlanned: 0,
    description: `${withoutPartnerNotes(i.description)}\n\n${nl}`,
    translations: { ...i.translations, en: { ...i.translations?.en, description: `${withoutPartnerNotes(i.translations?.en?.description)}\n\n${en}`.trim() } },
  };
}

/** Our distributor in Australia pays for Medipim's presence at these events. */
const VIA_DISTRIBUTOR = ['APP Conference and Trade Exhibition', 'Pharmacy Connect'];
const VIA_DISTRIBUTOR_NL = 'Beslissing: Medipim gaat, onze distributeur in Australië betaalt de kosten. Budgetneutraal voor Medipim.';
const viaDistributor = (i: Item) => budgetNeutral(i, VIA_DISTRIBUTOR_NL, VIA_DISTRIBUTOR_EN);

/**
 * The distributor events at no cost for data seeded before that decision, whatever amount they had, with the posts and
 * preparation of a visit when they had no decision yet. Events already carrying the decision stay as they are.
 */
export function distributorPays(data: Pick<Contents, 'items' | 'todos'>, makeId: () => string): Pick<Contents, 'items' | 'todos'> {
  const now = new Date().toISOString();
  const events = data.items
    .filter((i) => i.type === 'event' && VIA_DISTRIBUTOR.some((t) => i.title.startsWith(t)) && !i.description.includes(VIA_DISTRIBUTOR_NL))
    .map((i) => ({ ...viaDistributor(i), updatedAt: now }));
  const plan = planEvents({ items: [...events, ...data.items.filter((i) => i.type !== 'event')], todos: data.todos }, makeId);
  return { items: [...events, ...plan.items], todos: plan.todos };
}

/** The visited conferences, for data seeded before they were chosen. Leaves any participation someone already set. */
export function markVisitors(items: Item[]): Item[] {
  const now = new Date().toISOString();
  return items
    .filter((i) => i.type === 'event' && !i.participation && VISITING.includes(i.title))
    .map((i) => ({ ...i, participation: 'bezoeker', status: i.status === 'idee' ? 'gepland' : i.status, updatedAt: now }));
}

/** The exhibitor events, for data seeded before that decision. Returns only the items that change. */
export function markExhibitors(items: Item[]): Item[] {
  const now = new Date().toISOString();
  return items
    .filter((i) => i.type === 'event' && !i.participation && EXHIBITING.includes(i.title))
    .map((i) => ({ ...i, participation: 'exposant', status: i.status === 'idee' ? 'gepland' : i.status, updatedAt: now }));
}

/**
 * The three stands with their planned budget, for data seeded with five exhibitor events.
 * Only touches what still matches the seed: a chosen participation or an amount someone entered stays.
 */
export function exhibitorBudgets(items: Item[]): Item[] {
  const now = new Date().toISOString();
  return items.flatMap((i): Item[] => {
    if (i.type !== 'event') return [];
    if (EXHIBITING.includes(i.title) && (!i.participation || i.participation === 'exposant') && i.budgetPlanned == null) {
      return [{ ...i, participation: 'exposant', status: i.status === 'idee' ? 'gepland' : i.status, budgetPlanned: EXHIBITOR_BUDGET, updatedAt: now }];
    }
    if (NO_LONGER_EXHIBITING.includes(i.title) && i.participation === 'exposant' && i.budgetPlanned == null && i.budgetActual == null) {
      const { participation: _, ...rest } = i;
      return [{ ...rest, status: i.status === 'gepland' ? 'idee' : i.status, updatedAt: now }];
    }
    return [];
  });
}

/**
 * English text for seed items that predate translations. A field is only translated while its
 * Dutch text is still the seed text, so edited items never get a translation that no longer matches.
 */
export function addSeedTranslations(items: Item[]): Item[] {
  const now = new Date().toISOString();
  let n = 0;
  const seed = new Map(buildSeed(() => `seed${n++}`).items.map((i) => [`${i.type}|${i.title}`, i]));
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

/** Records to save, plus ids of items to delete together with their to-dos. */
export type SeedChanges = Partial<Contents> & { deleteItems?: string[] };

/**
 * Events with the same title and start date that a doubled seed update added twice. The copy someone
 * worked on stays; a duplicate is only removed while it is untouched, so nothing entered gets lost.
 */
export function duplicateEvents(items: Item[], todos: Todo[]): string[] {
  const untouched = (i: Item) =>
    i.createdAt === i.updatedAt && !i.participation && !i.owner && i.budgetPlanned == null && i.budgetActual == null && !todos.some((t) => t.itemId === i.id);
  const groups = new Map<string, Item[]>();
  for (const i of items) {
    if (i.type !== 'event') continue;
    const key = `${i.title}|${i.date}`;
    groups.set(key, [...(groups.get(key) ?? []), i]);
  }
  return [...groups.values()].flatMap((group) => {
    if (group.length < 2) return [];
    const keep = group.find((i) => !untouched(i)) ?? group.reduce((a, b) => (b.createdAt < a.createdAt ? b : a));
    return group.filter((i) => i !== keep && untouched(i)).map((i) => i.id);
  });
}

/** Seed changes applied once to data that already exists in a browser, in order. Each returns only the records that change. */
export const SEED_UPDATES: { key: string; apply: (data: Contents) => SeedChanges }[] = [
  { key: 'mc-seed-updates-1', apply: (data) => ({ items: markExhibitors(data.items) }) },
  { key: 'mc-seed-updates-2', apply: (data) => ({ items: addSeedTranslations(data.items) }) },
  { key: 'mc-seed-updates-3', apply: addBudgetAndContent },
  { key: 'mc-seed-updates-4', apply: (data) => ({ content: contentIdeasUpdate(data.content, data.pillars, new Date().toISOString()) }) },
  { key: 'mc-seed-updates-5', apply: (data) => ({ items: exhibitorBudgets(data.items) }) },
  { key: 'mc-seed-updates-6', apply: (data) => ({ items: markVisitors(data.items) }) },
  { key: 'mc-seed-updates-7', apply: addRetargeting },
  { key: 'mc-seed-updates-8', apply: (data) => planEvents(data, newId) },
  { key: 'mc-seed-updates-9', apply: (data) => ({ content: weeklyFillUpdate(data.content, data.pillars, new Date().toISOString()) }) },
  { key: 'mc-seed-updates-10', apply: fillAndScheduleWeekly },
  { key: 'mc-seed-updates-11', apply: (data) => ({ items: addEvents(data.items, newId) }) },
  { key: 'mc-seed-updates-12', apply: (data) => ({ deleteItems: duplicateEvents(data.items, data.todos) }) },
  { key: 'mc-seed-updates-14', apply: (data) => ({ items: addEvents(data.items, newId, ['Pharmacy Connect']) }) },
  { key: 'mc-seed-updates-15', apply: (data) => academyUpdate(data, new Date().toISOString()) },
  { key: 'mc-seed-updates-16', apply: (data) => ({ items: academyLanguages(data.items, new Date().toISOString()) }) },
  { key: 'mc-seed-updates-17', apply: removeMedimapper },
  { key: 'mc-seed-updates-18', apply: startMidDecember },
  { key: 'mc-seed-updates-19', apply: (data) => ({ items: estimateEventBudgets(data.items) }) },
  { key: 'mc-seed-updates-20', apply: (data) => ({ items: markViaMeditech(data.items) }) },
  { key: 'mc-seed-updates-21', apply: (data) => meditechAttends(data, newId) },
  { key: 'mc-seed-updates-22', apply: (data) => ({ revenues: seedRevenues(data.revenues) }) },
  { key: 'mc-seed-updates-23', apply: (data) => distributorPays(data, newId) },
  { key: 'mc-seed-updates-24', apply: (data) => ({ items: reestimateVisits(data.items) }) },
  { key: 'mc-seed-updates-25', apply: (data) => distributorPays(data, newId) },
  { key: 'mc-seed-updates-26', apply: (data) => ({ deleteItems: droppedEvents(data.items) }) },
  { key: 'mc-seed-updates-27', apply: (data) => ({ budgets: agencyBudgets(data.budgets) }) },
  { key: 'mc-seed-updates-28', apply: (data) => addOutbound(data, newId) },
  { key: 'mc-seed-updates-29', apply: (data) => ({ budgets: agencyWithinBudget(data.budgets) }) },
  { key: 'mc-seed-updates-30', apply: (data) => visitVital(data, newId) },
  { key: 'mc-seed-updates-31', apply: (data) => productionWeeks(data, newId) },
  { key: 'mc-seed-updates-32', apply: (data) => teamChanges(data) },
  { key: 'mc-seed-updates-33', apply: retargetingInAllMarkets },
  { key: 'mc-seed-updates-34', apply: (data) => ({ items: visitorPostTexts(data.items) }) },
  { key: 'mc-seed-updates-35', apply: (data) => mailLanguages(data, newId) },
  { key: 'mc-seed-updates-36', apply: (data) => ({ todos: offHolidays(data) }) },
  { key: 'mc-seed-updates-37', apply: outboundWaveDates },
];

/** The agency's service fee for every year with a budget and no agency line yet, at its share of the other lines. */
export function agencyBudgets(budgets: Budget[]): Budget[] {
  const years = [...new Set(budgets.map((b) => b.year))].filter((y) => !budgets.some((b) => b.year === y && b.line === 'agency'));
  return years.map((year) => ({
    id: `${year}:agency`,
    year,
    line: 'agency' as const,
    amount: Math.round(AGENCY_SHARE * budgets.filter((b) => b.year === year).reduce((n, b) => n + b.amount, 0)),
  })).filter((b) => b.amount > 0);
}

/**
 * The agency fee comes out of the 2027 total instead of on top: the lines it is taken from get the seeded lower
 * amount, but only while they still hold the amount from before, so edited lines stay as they are.
 */
export function agencyWithinBudget(budgets: Budget[]): Budget[] {
  return budgets.flatMap((b) => {
    const before = BUDGET_2027_AGENCY_ON_TOP[b.line];
    const after = SEED_BUDGETS.find((s) => s.line === b.line)?.amount;
    return b.year === 2027 && before === b.amount && after !== undefined && after !== b.amount ? [{ ...b, amount: after }] : [];
  });
}

/** Events taken off the calendar, too expensive for what they bring. */
const RETARGETING_TITLE = 'Google retargeting websitebezoekers (9 markten)';
/** The retargeting campaign when it ran in four markets, with the to-do titles that named them. */
const RETARGETING_TITLE_BEFORE = 'Google retargeting websitebezoekers (BE, FR, AU, DE)';
const RETARGETING_TODOS_BEFORE: Record<string, string> = {
  'Remarketingdoelgroep per land aanmaken (BE, FR, AU, DE)': 'Remarketingdoelgroep per markt aanmaken',
  'Advertenties maken per taal (NL, FR, DE, EN)': 'Advertenties maken per taal (NL, FR, DE, EN, ES)',
};
/** Every item and open to-do without an owner gets the one its role gives; owners someone chose stay. */
function assignTeam(data: Pick<Contents, 'items' | 'todos'>): Pick<Contents, 'items' | 'todos'> {
  const items = data.items.map((i) => (i.owner ? i : { ...i, owner: itemOwnerFor(i) ?? '' }));
  const byId = new Map(items.map((i) => [i.id, i]));
  const todos = data.todos.map((t) => (t.done || !byId.has(t.itemId) ? t : withOwner(t, byId.get(t.itemId)!)));
  return { items, todos };
}

/** The team roles for data seeded before them: only the items and to-dos that get an owner. */
export function teamChanges(data: Pick<Contents, 'items' | 'todos'>): SeedChanges {
  const now = new Date().toISOString();
  const team = assignTeam(data);
  return {
    items: team.items.filter((i, k) => i.owner !== data.items[k].owner).map((i) => ({ ...i, updatedAt: now })),
    todos: team.todos.filter((t, k) => t.owner !== data.todos[k].owner),
  };
}

const UX_ANNOUNCEMENT = 'Aankondiging nieuwe UX Belgisch platform';
const UX_ANNOUNCED: IsoDate = '2026-11-23';
/** Due dates of the seeded launch and retargeting to-dos before the production weeks, by item title and to-do title. */
const PREVIOUS_DUE: Record<string, Record<string, IsoDate>> = {
  'Nieuwe UX Belgisch platform – post Medipim-pagina': { 'Tekst schrijven': '2026-12-14', 'Visual kiezen': '2026-12-14', 'Inplannen op de Medipim-pagina': '2026-12-15' },
  'Nieuwsbrief: nieuwe UX van het platform': { 'Tekst en visuals maken': '2026-12-16', 'Testmail versturen en goedkeuring vragen': '2026-12-17', 'Verzending inplannen op vrijdag 9:00': '2026-12-17' },
  [RETARGETING_TITLE_BEFORE]: { 'Google-tag en Consent Mode v2 nakijken op medipim.com': '2026-12-14', 'Remarketingdoelgroep per land aanmaken (BE, FR, AU, DE)': '2026-12-15', 'Advertenties maken per taal (NL, FR, DE, EN)': '2026-12-16' },
};

/** The new date and phase of a to-do in production weeks, or undefined when it stays as it is. */
function inProductionWeeks(t: Todo, item: Item): Pick<Todo, 'dueDate' | 'phase'> | undefined {
  const open = !t.done && !t.jira;
  const seeded = [...ACTIONS, { title: RETARGETING_TITLE, todos: RETARGETING_TODOS }, { title: RETARGETING_TITLE_BEFORE, todos: RETARGETING_TODOS }]
    .find((a) => a.title === item.title)?.todos?.find((s) => s.title === t.title || s.title === RETARGETING_TODOS_BEFORE[t.title]);
  if (seeded) {
    const dueDate = open && PREVIOUS_DUE[item.title]?.[t.title] === t.dueDate ? seeded.dueDate : t.dueDate;
    return dueDate !== t.dueDate || seeded.phase !== t.phase ? { dueDate, phase: seeded.phase } : undefined;
  }
  if (item.type === 'event') {
    const day = open && t.dueDate === WEEKLY_FROM ? eventTodoDay(item, t.title) : undefined;
    return day && day !== t.dueDate ? { dueDate: day, phase: t.phase } : undefined;
  }
  const template = TODO_TEMPLATES[item.type].find((s) => s.title === t.title);
  if (!template) return undefined;
  const previous = PREVIOUS_OFFSETS[`${item.type}:${t.title}`];
  const untouched = previous != null && open && item.date >= PREP_FROM
    && ([previous, previous - 1, previous - 2].includes(t.offsetDays) || (t.dueDate === WEEKLY_FROM && shiftIso(item.date, previous) <= WEEKLY_FROM));
  const day = workdayBefore(shiftIso(item.date, template.offsetDays));
  const dueDate = untouched ? (day < PREP_FROM ? PREP_FROM : day) : t.dueDate;
  return dueDate !== t.dueDate || template.phase !== t.phase ? { dueDate, phase: template.phase } : undefined;
}

/**
 * Production weeks for data seeded before: content is made two weeks before it goes out and preparation starts on
 * 30 November 2026. Moves the open to-dos that are still on their planned day, gives every known step its phase, and
 * puts the UX announcement back on 23 November, when it went out. To-dos someone moved, finished or linked to Jira keep their date.
 */
export function productionWeeks(data: Pick<Contents, 'items' | 'todos' | 'content'>, makeId: () => string): SeedChanges {
  const now = new Date().toISOString();
  const byId = new Map(data.items.map((i) => [i.id, i]));
  const outbound = outboundProduction(data, makeId);
  const todos = data.todos.flatMap((t): Todo[] => {
    const item = byId.get(t.itemId);
    const change = item && !outbound.some((o) => o.id === t.id) && inProductionWeeks(t, item);
    if (!change) return [];
    const { phase: _, ...rest } = t;
    return [{ ...rest, dueDate: change.dueDate, offsetDays: daysBetween(item.date, change.dueDate), ...(change.phase && { phase: change.phase }) }];
  });
  const announced = data.items
    .filter((i) => i.title === UX_ANNOUNCEMENT && i.date === WEEKLY_FROM)
    .map((i) => ({ ...i, date: UX_ANNOUNCED, status: 'klaar' as const, updatedAt: now }));
  const content = data.content
    .filter((p) => p.id === UX_LAUNCH_CONTENT_ID && p.month === '2026-12' && p.status === 'klaar' && announced.length)
    .map((p) => ({ ...p, month: '2026-11', status: 'gedeeld' as const, updatedAt: now }));
  return { items: announced, todos: [...outbound, ...todos], content };
}

const VITAL = 'Vital Annual Conference';
/** The Vital texts before the conference dates were known, Dutch and English. */
const VITAL_BEFORE = [
  'Meerdaagse bijeenkomst die de Canadese farmaceutische keten samenbrengt voor sectorbesprekingen en samenwerking. 2 mei is de startdatum volgens de organisator; controleer de volledige congresdata bij Vital.',
  'Multi-day event that brings the Canadian pharmaceutical supply chain together for industry discussions and collaboration. 2 May is the start date according to the organiser; check the full conference dates with Vital.',
];

/**
 * Vital Annual Conference as a visit, with its full dates, the visitor estimate and the visitor posts and preparation,
 * for data seeded before. Dates, texts, a participation and amounts someone changed stay.
 */
export function visitVital(data: Pick<Contents, 'items' | 'todos'>, makeId: () => string): Pick<Contents, 'items' | 'todos'> {
  const now = new Date().toISOString();
  const seeded = EVENTS.find((e) => e.title === VITAL)!;
  const en = EVENTS_EN[VITAL];
  const events = data.items
    .filter((i) => i.type === 'event' && i.title === VITAL && (!i.participation || (i.date === seeded.date && i.endDate === seeded.date)))
    .map((i): Item => {
      const endDate = i.date === seeded.date && i.endDate === seeded.date ? seeded.endDate : i.endDate;
      const participation = i.participation ?? 'bezoeker';
      const visit = { ...i, endDate, participation, status: i.status === 'idee' ? 'gepland' as const : i.status };
      return {
        ...visit,
        budgetPlanned: i.budgetPlanned == null && i.budgetActual == null ? eventEstimate(visit) : i.budgetPlanned,
        description: i.description.replace(VITAL_BEFORE[0], seeded.description),
        translations: { ...i.translations, en: { ...i.translations?.en, description: i.translations?.en?.description?.replace(VITAL_BEFORE[1], en.description) } },
        updatedAt: now,
      };
    });
  const plan = planEvents({ items: [...events, ...data.items.filter((i) => i.type !== 'event')], todos: data.todos }, makeId);
  return { items: [...events, ...plan.items], todos: plan.todos };
}

const DROPPED_EVENTS = ['GS1 Global Healthcare Conference'];

/** The dropped events with their posts and mails; to-dos go along with each item. */
export function droppedEvents(items: Item[]): string[] {
  return items
    .filter((i) => (i.type === 'event' && DROPPED_EVENTS.includes(i.title)) || (i.type !== 'event' && DROPPED_EVENTS.includes(i.campaign)))
    .map((i) => i.id);
}

/** The visitor estimate before Belgium counted as home and before published ticket prices. */
const previousVisitEstimate = (i: Item) => eventEstimate({ ...i, title: '', countries: i.countries.map((c) => (c === 'BE' ? 'NL' : c)) });

/** Visits whose planned amount is still the earlier estimate, at the current estimate; amounts someone entered stay. */
export function reestimateVisits(items: Item[]): Item[] {
  const now = new Date().toISOString();
  return items
    .filter((i) => i.type === 'event' && i.participation === 'bezoeker' && i.budgetPlanned != null
      && i.budgetPlanned === previousVisitEstimate(i) && i.budgetPlanned !== eventEstimate(i))
    .map((i) => ({ ...i, budgetPlanned: eventEstimate(i), updatedAt: now }));
}

/** The planner is about Medipim only: Medimapper phrases from earlier seeds and what replaces them, most specific first. */
const MEDIMAPPER_TEXT: [string, string][] = [
  ['Medimapper: de Europese markt in cijfers', 'Medipim in Europa: verschillen tussen markten in cijfers'],
  ['Medimapper: the European market in numbers', 'Medipim in Europe: differences between markets in numbers'],
  ['kerncijfers uit Medimapper: aantal producten, landen en', 'kerncijfers uit Medipim: aantal producten per land en'],
  ['key figures from Medimapper: number of products, countries and', 'key figures from Medipim: number of products per country and'],
  [' en marktinzichten uit Medimapper', ' en marktinzichten'],
  [' and market insights from Medimapper', ' and market insights'],
  ['Medimappers datamodel', 'het datamodel van Medipim'],
  ['Medimapper’s data model', 'Medipim’s data model'],
  ['Medimapper', 'Medipim'],
];

/** The record with every Medimapper phrase in its text replaced; the phrases hold no characters JSON escapes. */
const withoutMedimapper = <T>(record: T): T =>
  JSON.parse(MEDIMAPPER_TEXT.reduce((json, [from, to]) => json.replaceAll(from, to), JSON.stringify(record)));

/** Items, to-dos, content pieces and pillars that still mention Medimapper, rewritten to Medipim. */
export function removeMedimapper(data: Pick<Contents, 'items' | 'todos' | 'content' | 'pillars'>): Partial<Contents> {
  const now = new Date().toISOString();
  const mentions = (r: object) => JSON.stringify(r).includes('Medimapper');
  return {
    items: data.items.filter(mentions).map((i) => ({ ...withoutMedimapper(i), updatedAt: now })),
    todos: data.todos.filter(mentions).map(withoutMedimapper),
    content: data.content.filter(mentions).map((p) => ({ ...withoutMedimapper(p), updatedAt: now })),
    pillars: data.pillars.filter(mentions).map(withoutMedimapper),
  };
}

/** Follow-up posts on the new UX that no longer fit December; they stay as ideas without a date. */
const UX_FOLLOW_UPS = ['content-ux-tour', 'content-new-ux-highlights', 'content-new-ux-question'];

/**
 * Everything starts in the week of 14 December 2026: the UX launch and the retargeting campaign move there with their
 * seeded to-dos, and the weekly UX follow-ups before Christmas leave the calendar. Items someone moved stay put.
 */
export function startMidDecember(data: Pick<Contents, 'items' | 'todos' | 'content'>): SeedChanges {
  const now = new Date().toISOString();
  /** Seeded items that started before the week of 14 December 2026, by title, with their old date. */
  const earlyDates: Record<string, IsoDate> = {
    'Aankondiging nieuwe UX Belgisch platform': '2026-11-23',
    'Nieuwe UX Belgisch platform – post Medipim-pagina': '2026-11-25',
    'Nieuwsbrief: nieuwe UX van het platform': '2026-11-27',
    [RETARGETING_TITLE_BEFORE]: '2026-12-01',
  };
  const seeded = [
    ...ACTIONS.map((a) => ({ title: a.title, date: a.date, todos: a.todos ?? [] })),
    { title: RETARGETING_TITLE_BEFORE, date: RETARGETING_START, todos: RETARGETING_TODOS },
  ];
  const items: Item[] = [];
  const todos: Todo[] = [];
  for (const item of data.items) {
    const seed = seeded.find((s) => s.title === item.title);
    if (!seed || earlyDates[item.title] !== item.date || seed.date === item.date) continue;
    const moved = moveItem(item, data.todos, seed.date);
    items.push({ ...moved.item, endDate: item.type === 'campaign' ? item.endDate : moved.item.endDate, updatedAt: now });
    for (const t of data.todos.filter((t) => t.itemId === item.id)) {
      const dueDate = seed.todos.find((s) => s.title === t.title)?.dueDate ?? moved.todos.find((m) => m.id === t.id)?.dueDate;
      if (dueDate) todos.push({ ...t, dueDate, offsetDays: daysBetween(seed.date, dueDate) });
    }
  }
  const followUps = data.items.filter((i) =>
    i.type === 'social' && i.channel === WEEKLY_CHANNEL && UX_FOLLOW_UPS.includes(i.contentId ?? '') && ['idee', 'gepland'].includes(i.status));
  const content = data.content.flatMap((p): ContentPiece[] => {
    if (UX_FOLLOW_UPS.includes(p.id) && p.month === '2026-12') {
      const { month: _, ...undated } = p;
      return [{ ...undated, updatedAt: now }];
    }
    if (p.id === UX_LAUNCH_CONTENT_ID && p.month === '2026-11') return [{ ...p, month: '2026-12', status: 'klaar', updatedAt: now }];
    return [];
  });
  return { items, todos, content, deleteItems: followUps.map((i) => i.id) };
}

/** Events with a decision but no amounts yet get the estimate for that decision; amounts someone entered stay. */
export function estimateEventBudgets(items: Item[]): Item[] {
  const now = new Date().toISOString();
  return items.flatMap((i) => {
    const budgetPlanned = i.budgetPlanned == null && i.budgetActual == null ? eventEstimate(i) : undefined;
    return budgetPlanned == null ? [] : [{ ...i, budgetPlanned, updatedAt: now }];
  });
}

/** The December pieces, then one post a week in the calendar. */
export function fillAndScheduleWeekly(data: Contents): Partial<Contents> {
  const added = decemberFillUpdate(data.content, data.pillars, new Date().toISOString());
  const plan = scheduleWeekly({ ...data, content: [...data.content, ...added] }, newId);
  return { items: plan.items, todos: plan.todos, content: mergeById(added, plan.content) };
}

/** `base` with every record in `changes` replacing the one with its id, or appended. */
function mergeById<T extends { id: string }>(base: T[], changes: T[]): T[] {
  const byId = new Map(changes.map((r) => [r.id, r]));
  return [...base.map((r) => byId.get(r.id) ?? r), ...changes.filter((r) => !base.some((b) => b.id === r.id))];
}

/** Events added to the calendar after it was first seeded, still undecided. */
const GULF_EVENTS = ['World Health Expo Dubai', 'DUPHAT 2027', 'CPHI Middle East'];

/** The added events, for data seeded before them; an event already in the calendar under that title is left alone. */
export function addEvents(items: Item[], makeId: () => string, titles = GULF_EVENTS): Item[] {
  const now = new Date().toISOString();
  return EVENTS
    .filter((e) => titles.includes(e.title) && !items.some((i) => i.type === 'event' && i.title === e.title))
    .map((e) => eventItem(e, makeId(), now));
}

function eventItem(e: SeedEvent, id: string, now: string): Item {
  const en = EVENTS_EN[e.title];
  const item: Item = {
    id,
    type: 'event',
    title: e.tentative ? `${e.title} (datum te bevestigen)` : e.title,
    description: `${e.description}\n\nRelevantie voor Medipim: ${e.relevance}.`,
    channel: e.channel,
    date: e.date,
    endDate: e.endDate ?? e.date,
    location: e.location,
    ...(EXHIBITING.includes(e.title)
      ? { participation: 'exposant' as const, status: 'gepland' as const, budgetPlanned: EXHIBITOR_BUDGET }
      : VISITING.includes(e.title)
        ? { participation: 'bezoeker' as const, status: 'gepland' as const }
        : { status: 'idee' as const }),
    owner: '',
    campaign: '',
    audiences: e.audiences,
    productTypes: e.products ?? ['geneesmiddelen'],
    countries: [countryCode(e.location.split(',').pop()!)].filter((c): c is string => !!c),
    languages: [],
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
  if (VIA_MEDITECH.includes(e.title)) return viaMeditech(item);
  if (VIA_DISTRIBUTOR.includes(e.title)) return viaDistributor(item);
  return VISITING.includes(e.title) ? { ...item, budgetPlanned: eventEstimate(item) } : item;
}

/** The starting content: the 2027 conference calendar, unassigned and without to-dos, enriched with audience, product type and country; the 2027 budget plan and the content mix. */
export function buildSeed(makeId: () => string): Contents {
  const now = new Date().toISOString();
  const items = EVENTS.map((e) => eventItem(e, makeId(), now));
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
      languages: a.languages ?? [],
      translations: { en: { ...ACTIONS_EN[a.title], campaign: UX_LAUNCH_EN } },
      contentId: UX_LAUNCH_CONTENT_ID,
      createdAt: now,
      updatedAt: now,
    });
    for (const t of a.todos ?? []) {
      todos.push({ id: makeId(), itemId: id, title: t.title, dueDate: t.dueDate, done: false, offsetDays: daysBetween(a.date, t.dueDate), ...(t.phase && { phase: t.phase }), ...(t.language && { language: t.language }) });
    }
  }
  const retargeting = buildRetargeting(makeId, now);
  const events = planEvents({ items, todos }, makeId);
  const outbound = buildOutbound(makeId, now);
  const planned = [...items, retargeting.item, ...events.items, ...outbound.items];
  const content = buildSeedContent(now);
  const weekly = scheduleWeekly({ items: planned, content, pillars: SEED_PILLARS }, makeId);
  const team = assignTeam({ items: mergeById(planned, weekly.items), todos: [...todos, ...retargeting.todos, ...events.todos, ...outbound.todos, ...weekly.todos] });
  return {
    items: team.items,
    todos: team.todos,
    budgets: SEED_BUDGETS,
    pillars: SEED_PILLARS,
    content: mergeById(content, weekly.content),
    revenues: seedRevenues([]),
  };
}

const RETARGETING_START = '2026-12-17';
const RETARGETING_TODOS: { title: string; en: string; dueDate: IsoDate; phase?: TodoPhase }[] = [
  { title: 'Google-tag en Consent Mode v2 nakijken op medipim.com', en: 'Check the Google tag and Consent Mode v2 on medipim.com', dueDate: '2026-12-01' },
  { title: 'Remarketingdoelgroep per markt aanmaken', en: 'Create a remarketing audience per market', dueDate: '2026-12-02' },
  { title: 'Advertenties maken per taal (NL, FR, DE, EN, ES)', en: 'Create ads per language (NL, FR, DE, EN, ES)', dueDate: '2026-12-03', phase: 'maken' },
  { title: 'Frequentielimiet instellen en campagne starten', en: 'Set a frequency cap and start the campaign', dueDate: RETARGETING_START, phase: 'verdelen' },
];

/** The whole Google Ads line of 2027: retargeting is the only Google campaign. */
const RETARGETING_BUDGET = 16470;
const RETARGETING_TEXT = {
  title: RETARGETING_TITLE,
  description: 'Doorlopende Google Ads-campagne die iedereen die de Medipim-website bezocht opnieuw bereikt in de negen markten: België, Frankrijk, Duitsland, het Verenigd Koninkrijk, Luxemburg, Oostenrijk, Spanje, de Verenigde Staten en Australië. Per markt een eigen remarketingdoelgroep en advertenties in de taal van dat land. Het is de enige Google-campagne en krijgt het volledige Google-budget. De campagne loopt permanent: de einddatum is het einde van budgetjaar 2027 en schuift elk jaar mee op.',
  countries: EXISTING_MARKETS,
  languages: ['nl', 'fr', 'de', 'en', 'es'],
  translations: {
    en: {
      title: 'Google retargeting of website visitors (9 markets)',
      description: 'Always-on Google Ads campaign that reaches everyone who visited the Medipim website again in the nine markets: Belgium, France, Germany, the United Kingdom, Luxembourg, Austria, Spain, the United States and Australia. A remarketing audience per market and ads in the language of that country. It is the only Google campaign and gets the whole Google budget. The campaign runs permanently: the end date is the end of budget year 2027 and moves along every year.',
    },
  },
};

/** The always-on Google retargeting campaign; the end date is the last budget year and moves along each year. */
function buildRetargeting(makeId: () => string, now: string): { item: Item; todos: Todo[] } {
  const id = makeId();
  return {
    item: {
      id,
      type: 'campaign',
      ...RETARGETING_TEXT,
      channel: 'Google Ads',
      date: RETARGETING_START,
      endDate: '2027-12-31',
      status: 'gepland',
      budgetPlanned: RETARGETING_BUDGET,
      owner: '',
      campaign: '',
      audiences: ALL_AUDIENCES,
      productTypes: ALL_PRODUCTS,
      createdAt: now,
      updatedAt: now,
    },
    todos: RETARGETING_TODOS.map((t) => ({
      id: makeId(),
      itemId: id,
      title: t.title,
      dueDate: t.dueDate,
      done: false,
      offsetDays: daysBetween(RETARGETING_START, t.dueDate),
      ...(t.phase && { phase: t.phase }),
      translations: { en: { title: t.en } },
    })),
  };
}

/** The retargeting campaign, for data seeded before it existed; skipped when a campaign with that title is already there. */
export function addRetargeting(data: Contents): Partial<Contents> {
  if (data.items.some((i) => i.type === 'campaign' && [RETARGETING_TITLE, RETARGETING_TITLE_BEFORE].includes(i.title))) return {};
  const { item, todos } = buildRetargeting(newId, new Date().toISOString());
  return { items: [item], todos };
}

/**
 * Retargeting in all nine markets with the whole Google budget, for data seeded with four markets. A title, countries
 * or a planned amount someone changed stay; so do to-dos someone renamed.
 */
export function retargetingInAllMarkets(data: Pick<Contents, 'items' | 'todos'>): Pick<Contents, 'items' | 'todos'> {
  const now = new Date().toISOString();
  const before = data.items.filter((i) => i.type === 'campaign' && i.title === RETARGETING_TITLE_BEFORE && i.countries.join() === 'BE,FR,AU,DE');
  const items = before.map((i) => ({
    ...i,
    ...RETARGETING_TEXT,
    translations: { ...i.translations, en: { ...i.translations?.en, ...RETARGETING_TEXT.translations.en } },
    budgetPlanned: i.budgetPlanned ?? RETARGETING_BUDGET,
    updatedAt: now,
  }));
  const todos = data.todos
    .filter((t) => before.some((i) => i.id === t.itemId) && RETARGETING_TODOS_BEFORE[t.title])
    .map((t) => {
      const seeded = RETARGETING_TODOS.find((s) => s.title === RETARGETING_TODOS_BEFORE[t.title])!;
      return { ...t, title: seeded.title, translations: { ...t.translations, en: { ...t.translations?.en, title: seeded.en } } };
    });
  return { items, todos };
}

/**
 * Mails in the language of their readers, for data seeded before: the invitations to an exhibitor event in the
 * languages of its country, the UX newsletter to Belgian pharmacists in Dutch and French. Steps that differ per
 * language get a to-do for each. Mails that already have languages stay as they are.
 */
export function mailLanguages(data: Pick<Contents, 'items' | 'todos'>, makeId: () => string): Pick<Contents, 'items' | 'todos'> {
  const now = new Date().toISOString();
  const newsletter = ACTIONS.find((a) => a.type === 'email')!;
  const items: Item[] = [];
  const todos: Todo[] = [];
  for (const mail of data.items.filter((i) => i.type === 'email' && !i.languages.length)) {
    const own = data.todos.filter((t) => t.itemId === mail.id);
    const event = mail.channel === 'Uitnodiging' && data.items.find((e) => e.type === 'event' && e.title === mail.campaign);
    if (event) {
      const languages = eventLanguages(event);
      if (!languages.length) continue;
      const item = { ...mail, languages, updatedAt: now };
      items.push(item);
      todos.push(...scopeTodos(item, own, makeId).filter((t) => !own.includes(t)));
    } else if (mail.title === newsletter.title) {
      const languages = newsletter.languages!;
      items.push({ ...mail, languages, updatedAt: now });
      for (const t of own.filter((t) => !t.language && newsletter.todos!.some((s) => s.title === t.title && s.language))) {
        todos.push({ ...t, language: languages[0] });
        for (const language of languages.slice(1)) todos.push({ ...t, id: makeId(), language, done: false, doneAt: undefined, jira: undefined });
      }
    }
  }
  return { items, todos };
}

/** Open to-dos on a public holiday move to the working day before, a follow-up to the one after; Jira-linked ones stay. */
export function offHolidays(data: Pick<Contents, 'items' | 'todos'>): Todo[] {
  const byId = new Map(data.items.map((i) => [i.id, i]));
  return data.todos.flatMap((t) => {
    const item = byId.get(t.itemId);
    if (t.done || t.jira || !item || !HOLIDAYS.includes(t.dueDate)) return [];
    const dueDate = t.offsetDays > 0 ? workdayAfter(t.dueDate) : workdayBefore(t.dueDate);
    return [{ ...t, dueDate, offsetDays: daysBetween(item.date, dueDate) }];
  });
}

const UX_LAUNCH = 'Nieuwe UX Belgisch platform';
const ALL_AUDIENCES: Audience[] = ['groothandels', 'producenten', 'apothekers', 'ziekenhuizen'];
const ALL_PRODUCTS: ProductType[] = ['geneesmiddelen', 'cannabis', 'cosmetica', 'voeding', 'baby'];

/** Communication around the launch of the new UX of the Belgian platform: announced on 23 November 2026, the follow-ups in the week of 14 December. */
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
  languages?: string[];
  todos?: { title: string; dueDate: IsoDate; phase?: TodoPhase; language?: string }[];
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
    languages: ['en'],
  },
  {
    type: 'social',
    title: 'Nieuwe UX Belgisch platform – post Medipim-pagina',
    description: 'Tweede LinkedIn-post over de nieuwe UX, nu vanuit de Europese bedrijfspagina Medipim.',
    channel: 'LinkedIn · Medipim',
    date: '2026-12-15',
    status: 'gepland',
    owner: '',
    audiences: ALL_AUDIENCES,
    countries: [],
    todos: [
      { title: 'Tekst schrijven', dueDate: '2026-12-01', phase: 'maken' },
      { title: 'Visual kiezen', dueDate: '2026-12-02', phase: 'maken' },
      { title: 'Inplannen op de Medipim-pagina', dueDate: '2026-12-14', phase: 'verdelen' },
    ],
  },
  {
    type: 'email',
    title: 'Nieuwsbrief: nieuwe UX van het platform',
    description: 'Nieuwsbrief aan de Belgische apothekers over de nieuwe UX van het platform.',
    channel: 'Nieuwsbrief apothekers',
    date: '2026-12-18',
    time: '09:00',
    status: 'gepland',
    owner: '',
    audiences: ['apothekers'],
    countries: ['BE'],
    languages: ['nl', 'fr'],
    todos: [
      { title: 'Tekst en visuals maken', dueDate: '2026-12-04', phase: 'maken', language: 'nl' },
      { title: 'Tekst en visuals maken', dueDate: '2026-12-04', phase: 'maken', language: 'fr' },
      { title: 'Testmail versturen en goedkeuring vragen', dueDate: '2026-12-16', phase: 'verdelen', language: 'nl' },
      { title: 'Testmail versturen en goedkeuring vragen', dueDate: '2026-12-16', phase: 'verdelen', language: 'fr' },
      { title: 'Verzending inplannen op vrijdag 9:00', dueDate: '2026-12-17', phase: 'verdelen' },
    ],
  },
];
