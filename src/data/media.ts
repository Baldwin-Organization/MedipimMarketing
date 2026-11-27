import type { Audience } from './types';

interface Text { nl: string; en: string }

export type MediaPriority = 'eerste_keuze' | 'interessant' | 'selectief';

/** One reach figure, e.g. label "Nieuwsbrief" with value "2.053 abonnees, wekelijks". */
export interface ReachFact { label: Text; value: Text }

/** A trade medium on the shortlist; `medium` is the name PR items use, so planned items can be counted per title. */
export interface TradeMedium {
  medium: string;
  /** Earlier names of the title; PR items saved under them still count. */
  formerly?: string[];
  publisher?: string;
  url: string;
  market: Text;
  /** ISO codes, copied onto a new PR item; empty for international titles. */
  countries: string[];
  /** Countries the title reaches, with the share of its readers where the publisher gives one. */
  geo: { code: string; share?: number }[];
  /** Reach the countries in `geo` leave out. */
  geoNote?: Text;
  audiences: Audience[];
  priority: MediaPriority;
  assessment: Text;
  /** Reach as the publisher reports it, as of `checked`. */
  reach: ReachFact[];
  /** Who reads it: job functions, company types, regions and language. */
  readers: Text;
  rates?: Text;
  /** What to ask the publisher before booking. */
  ask?: Text;
  sources: { label: Text; url: string }[];
  /** Month the figures were looked up, as YYYY-MM. */
  checked: string;
}

const PRODUCENTEN: Audience[] = ['producenten'];

const fact = (nl: string, en: string, valueNl: string, valueEn: string): ReachFact => ({ label: { nl, en }, value: { nl: valueNl, en: valueEn } });

/** Shortlist of trade media to reach manufacturers, in order of preference. */
export const TRADE_MEDIA: TradeMedium[] = [
  {
    medium: 'Pharmaceutiques',
    publisher: 'PR Éditions',
    url: 'https://www.pharmaceutiques.com',
    market: { nl: 'Frankrijk', en: 'France' },
    countries: ['FR'],
    geo: [{ code: 'FR' }],
    audiences: PRODUCENTEN,
    priority: 'eerste_keuze',
    assessment: {
      nl: 'Test een Franstalige klantcase via hun dagelijkse persoverzicht.',
      en: 'Test a French-language customer case through their daily press review.',
    },
    reach: [
      fact('Persoverzicht', 'Press review', 'dagelijks naar 20.000+ lezers; internationale editie op zaterdag naar ±5.000', 'daily to 20,000+ readers; international edition on Saturdays to about 5,000'),
      fact('Magazine', 'Magazine', '3.000 exemplaren op abonnement, 10 nummers per jaar; de uitgever rekent op 12.000 lezers', '3,000 subscription copies, 10 issues a year; the publisher counts 12,000 readers'),
      fact('Website', 'Website', '20.000 bezoekers per maand', '20,000 visitors a month'),
      fact('LinkedIn', 'LinkedIn', '13.000+ volgers', '13,000+ followers'),
    ],
    readers: {
      nl: '50% werkt in de gezondheidsindustrie (directie, regulatory, communicatie en public affairs, aankoop, marketing en sales), 28% bij overheid en instellingen, 22% bij dienstverleners. 43% van de lezers bij farmabedrijven zit in het directiecomité. Frans, alleen Frankrijk.',
      en: '50% work in the healthcare industry (management, regulatory, communication and public affairs, purchasing, marketing and sales), 28% in government and institutions, 22% at service providers. 43% of the readers at drug companies sit on the executive committee. French, France only.',
    },
    rates: {
      nl: 'Banner in het persoverzicht € 1.000–€ 2.100 per week, volle pagina € 3.600, advertorial € 4.200 (2026, excl. btw).',
      en: 'Press review banner € 1,000–€ 2,100 a week, full page € 3,600, advertorial € 4,200 (2026, excl. VAT).',
    },
    ask: { nl: 'Het tarief voor 2027 en welk deel van de industrielezers in marketing werkt.', en: 'The 2027 rate and what share of the industry readers work in marketing.' },
    sources: [{ label: { nl: 'Mediakit 2026', en: 'Media kit 2026' }, url: 'https://pharmaceutiques.com/wp-content/uploads/2026/05/KitMedia-contact-EM-en-FR-2026.pdf' }],
    checked: '2026-11',
  },
  {
    medium: 'Pharma Relations',
    publisher: 'Gesundheitsforen Leipzig',
    url: 'https://www.pharma-relations.de',
    market: { nl: 'Duitsland', en: 'Germany' },
    countries: ['DE'],
    geo: [{ code: 'DE' }],
    audiences: PRODUCENTEN,
    priority: 'eerste_keuze',
    assessment: {
      nl: 'Gericht op marketing- en communicatiebeslissers in pharma. Goede match voor een campagne over hoe merken hun productinformatie en packshots bij apotheken en webshops krijgen. Het bereik is klein maar zeer gericht.',
      en: 'Aimed at marketing and communication decision-makers in pharma. A good match for a campaign on how brands get their product information and packshots to pharmacies and web shops. Small but very targeted reach.',
    },
    reach: [
      fact('Magazine', 'Magazine', '1.500 exemplaren (IVW, Q3 2025; een jaar eerder 3.070) plus ±3.000 digitale ontvangers, 10 edities per jaar', '1,500 copies (IVW, Q3 2025; 3,070 a year earlier) plus about 3,000 digital recipients, 10 editions a year'),
      fact('Nieuwsbrief', 'Newsletter', '2.053 abonnees, wekelijks; open rate 24,5% (2024)', '2,053 subscribers, weekly; 24.5% open rate (2024)'),
      fact('Website', 'Website', '±4.500 paginaweergaven per maand', 'about 4,500 page views a month'),
      fact('LinkedIn', 'LinkedIn', '928 volgers', '928 followers'),
    ],
    readers: {
      nl: '80–85% industrie: directie, marketing, communicatie en sales bij farma- en gezondheidsbedrijven. Verder 10% agentschappen en consultants, 5% media en verenigingen, 5% zorgverzekeraars. Duits.',
      en: '80–85% industry: management, marketing, communication and sales at pharma and healthcare companies. Further 10% agencies and consultants, 5% media and associations, 5% health insurers. German.',
    },
    rates: {
      nl: 'Advertorial van 1 pagina € 1.650, nieuwsbriefbanner € 950–€ 1.990 per verzending, volle pagina € 3.490 (2026).',
      en: 'One-page advertorial € 1,650, newsletter banner € 950–€ 1,990 per send, full page € 3,490 (2026).',
    },
    ask: { nl: 'Waarom de IVW-oplage op een jaar halveerde, en hoeveel nieuwsbriefabonnees in marketing werken.', en: 'Why the IVW circulation halved in a year, and how many newsletter subscribers work in marketing.' },
    sources: [{ label: { nl: 'Mediadaten 2026', en: 'Media kit 2026' }, url: 'https://www.pharma-relations.de/pharma-relations.de/Mediadaten/2026_Mediadaten_Pharma-Relations_V02.pdf' }],
    checked: '2026-11',
  },
  {
    medium: 'PMFarma',
    publisher: 'Publicaciones y Medios Telemáticos',
    url: 'https://www.pmfarma.com',
    market: { nl: 'Spanje', en: 'Spain' },
    countries: ['ES'],
    geo: [{ code: 'ES' }],
    audiences: PRODUCENTEN,
    priority: 'eerste_keuze',
    assessment: {
      nl: 'Vakmedium voor farmaceutisch management en marketing, met digitale advertentie- en nieuwsbriefopties. Veruit het grootste bereik van de lijst, en goedkoop om te testen.',
      en: 'Trade medium for pharmaceutical management and marketing, with digital advertising and newsletter options. By far the largest reach on the list, and cheap to test.',
    },
    reach: [
      fact('Nieuwsbrief', 'Newsletter', '156.000+ abonnees, wekelijks', '156,000+ subscribers, weekly'),
      fact('Website', 'Website', '400.000 bezoeken per maand, 347.091 geregistreerde gebruikers', '400,000 visits a month, 347,091 registered users'),
      fact('Magazine en jaarboek', 'Magazine and yearbook', 'elk 3.500 exemplaren; magazine per kwartaal, jaarboek op naam naar 450 farmabedrijven', '3,500 copies each; magazine quarterly, yearbook sent by name to 450 drug companies'),
      fact('Sociale media', 'Social media', '47.035 volgers op LinkedIn, 14.200 op X', '47,035 followers on LinkedIn, 14,200 on X'),
    ],
    readers: {
      nl: 'Magazine en jaarboek: 80% farma-industrie, 20% dienstverleners. Ontvangers van het jaarboek: 25% productmanagers, 20% marketingdirecteurs, 19% CEO’s en algemeen directeurs, 14% commercieel directeurs, 6% communicatie. Nieuwsbrief en site bereiken ook apothekers. Spaans; geen verdeling tussen Spanje en Latijns-Amerika.',
      en: 'Magazine and yearbook: 80% pharma industry, 20% service providers. Yearbook recipients: 25% product managers, 20% marketing directors, 19% CEOs and general managers, 14% commercial directors, 6% communication. The newsletter and site also reach pharmacists. Spanish; no split between Spain and Latin America.',
    },
    rates: {
      nl: 'Artikel € 200–€ 500, video-interview € 1.200, betaalde socialemediacampagne € 500 voor 7 dagen en 27.000–35.000 professionals (2026, excl. btw).',
      en: 'Article € 200–€ 500, video interview € 1,200, paid social campaign € 500 for 7 days and 27,000–35,000 professionals (2026, excl. VAT).',
    },
    ask: { nl: 'Hoeveel van de nieuwsbriefabonnees in Spanje bij fabrikanten werken.', en: 'How many of the newsletter subscribers in Spain work for manufacturers.' },
    sources: [
      { label: { nl: 'Plan Comercial 2026', en: 'Plan Comercial 2026' }, url: 'https://www.pmfarma.com/tarifas/' },
      { label: { nl: 'Anuario 2027', en: 'Anuario 2027' }, url: 'https://www.pmfarma.com/anuario/' },
    ],
    checked: '2026-11',
  },
  {
    medium: 'AJP Insights',
    publisher: 'Australian Pharmaceutical Publishing Company',
    url: 'https://ajp.com.au/ajp-insights/',
    market: { nl: 'Australië', en: 'Australia' },
    countries: ['AU'],
    geo: [{ code: 'AU' }],
    audiences: PRODUCENTEN,
    priority: 'eerste_keuze',
    assessment: {
      nl: 'Het eerste mediacontact voor OTC-merkenteams in Australië. Een verhaal over hoe merken productinformatie en beelden bij Australische apotheken en webshops krijgen, past bij de doelgroep.',
      en: 'The first media contact for OTC brand teams in Australia. A story on how brands get product information and images to Australian pharmacies and web shops fits the audience.',
    },
    reach: [
      fact('Nieuwsbrief', 'Newsletter', 'maandelijks, voor marketeers in de apotheeksector; geen bereik gepubliceerd', 'monthly, for marketers in the pharmacy sector; no reach published'),
    ],
    readers: {
      nl: 'Marketeers bij merken die via de apotheek verkopen. De nieuwsbrief brengt trends in apotheek, marketing en consumenten en kondigt advertentiemogelijkheden in de AJP aan. Engels.',
      en: 'Marketers at brands that sell through pharmacy. The newsletter covers pharmacy, marketing and consumer trends and announces advertising opportunities in the AJP. English.',
    },
    ask: {
      nl: 'Het aantal abonnees, en of externe partijen een plaatsing in de nieuwsbrief kunnen boeken.',
      en: 'The number of subscribers, and whether third parties can book a placement in the newsletter.',
    },
    sources: [{ label: { nl: 'AJP Insights', en: 'AJP Insights' }, url: 'https://ajp.com.au/ajp-insights/' }],
    checked: '2026-11',
  },
  {
    medium: 'Retail Pharmacy',
    publisher: 'Retail Media',
    url: 'https://retailpharmacymagazine.com.au',
    market: { nl: 'Australië', en: 'Australia' },
    countries: ['AU'],
    geo: [{ code: 'AU' }],
    audiences: ['apothekers'],
    priority: 'eerste_keuze',
    assessment: {
      nl: 'De eerste keuze voor een Australische klantcase over catalogusbeheer, productfoto’s of de koppeling met een webshop of app. Het blad gaat over de bedrijfsvoering en de retailkant van apotheken.',
      en: 'The first choice for an Australian customer case on catalogue management, product photos or the link with a web shop or app. The magazine covers running the business and the retail side of pharmacies.',
    },
    reach: [
      fact('Magazine', 'Magazine', '15.148 lezers, maandelijks (CAB-geauditeerd)', '15,148 readers, monthly (CAB audited)'),
      fact('Nieuwsbrief', 'Newsletter', 'wekelijks; geen aantal gepubliceerd', 'weekly; no number published'),
      fact('Retail Media', 'Retail Media', '40.000+ beslissers in grocery, apotheek en convenience (alle titels samen)', '40,000+ decision-makers across grocery, pharmacy and convenience (all titles together)'),
    ],
    readers: {
      nl: 'Apothekers en apotheekeigenaars als ondernemers: retailmanagement, marketing, financiën, personeel en assortiment. Niet verbonden aan een beroepsvereniging. Zustertitel Retail Pharmacy Assistants voor apotheekassistenten. Engels.',
      en: 'Pharmacists and pharmacy owners as business operators: retail management, marketing, finance, staffing and range. Not tied to a professional association. Sister title Retail Pharmacy Assistants for pharmacy assistants. English.',
    },
    ask: { nl: 'De mediakit 2027, en of ze klantcases als redactioneel stuk of als advertorial plaatsen.', en: 'The 2027 media kit, and whether they run customer cases as editorial or as advertorial.' },
    sources: [
      { label: { nl: 'Over Retail Pharmacy', en: 'About Retail Pharmacy' }, url: 'https://retailpharmacymagazine.com.au/about-us/' },
      { label: { nl: 'Retail Media', en: 'Retail Media' }, url: 'https://www.retailmedia.com.au/' },
    ],
    checked: '2026-11',
  },
  {
    medium: 'pharmaphorum Deep Dive',
    publisher: 'pharmaphorum (EVERSANA)',
    url: 'https://pharmaphorum.com',
    market: { nl: 'VK / internationaal', en: 'UK / international' },
    countries: ['GB'],
    geo: [{ code: 'US', share: 45 }, { code: 'GB', share: 21 }],
    geoNote: { nl: 'Verder 27% elders in Europa, zonder landverdeling (mediakit 2024).', en: 'Another 27% elsewhere in Europe, without a country split (2024 media kit).' },
    audiences: PRODUCENTEN,
    priority: 'interessant',
    assessment: {
      nl: 'Interessant voor een Engelstalige case over productdata of digitale distributie. Het publiek omvat ook onderzoekers, zorgverleners en agentschappen. Boeken als ze een relevant segment binnen pharma kunnen aanbieden.',
      en: 'Interesting for an English-language case on product data or digital distribution. The audience also includes researchers, healthcare professionals and agencies. Book if they can offer a relevant segment within pharma.',
    },
    reach: [
      fact('Website', 'Website', '1 miljoen+ sessies en 558.760 lezers per jaar', '1 million+ sessions and 558,760 readers a year'),
      fact('Nieuwsbrief', 'Newsletter', '13.000 abonnees; dagelijks plus een wekelijkse Top Story', '13,000 subscribers; daily plus a weekly Top Story'),
      fact('Deep Dive', 'Deep Dive', 'digitaal magazine, 6 nummers per jaar, 8.888 geregistreerde lezers (2024)', 'digital magazine, 6 issues a year, 8,888 registered readers (2024)'),
      fact('LinkedIn', 'LinkedIn', '±11.000–13.000 volgers', 'about 11,000–13,000 followers'),
    ],
    readers: {
      nl: '90% pharma en biotech, 44% op niveau director of VP en hoger. Regio’s: 36,5% Amerika, 31,3% Europa en VK, 33,1% elders. Geen verdeling per functie. Engels.',
      en: '90% pharma and biotech, 44% director or VP level and above. Regions: 36.5% Americas, 31.3% Europe and UK, 33.1% elsewhere. No split by job function. English.',
    },
    rates: {
      nl: 'Nieuwsbriefsponsoring £ 1.950 per maand, gesponsord artikel £ 1.750, webinar £ 4.500, sponsoring van een Deep Dive-nummer £ 7.500 (tarieven 2024).',
      en: 'Newsletter sponsorship £ 1,950 a month, sponsored feature £ 1,750, webinar £ 4,500, sponsoring a Deep Dive issue £ 7,500 (2024 rates).',
    },
    ask: { nl: 'Of ze een segment binnen pharma in Europa kunnen aanbieden, en de mediakit 2027.', en: 'Whether they can offer a segment within pharma in Europe, and the 2027 media kit.' },
    sources: [
      { label: { nl: 'Advertise-pagina', en: 'Advertise page' }, url: 'https://pharmaphorum.com/advertise' },
      { label: { nl: 'Mediakit 2024', en: 'Media kit 2024' }, url: 'https://pharmaphorum.com/sites/default/files/2024-02/Pharmaphorum-Deep-Dive-2024-Media-Kit.pdf' },
    ],
    checked: '2026-11',
  },
  {
    medium: 'Generics Bulletin',
    publisher: 'Citeline',
    url: 'https://insights.citeline.com/generics-bulletin/',
    market: { nl: 'Internationaal', en: 'International' },
    countries: [],
    geo: [],
    geoNote: { nl: 'Wereldwijd, zonder landverdeling.', en: 'Worldwide, without a country split.' },
    audiences: PRODUCENTEN,
    priority: 'interessant',
    assessment: {
      nl: 'Sterk voor een gerichte campagne naar producenten van generieken en biosimilars. Ze bieden gesponsorde content en gerichte campagnes aan.',
      en: 'Strong for a targeted campaign to manufacturers of generics and biosimilars. They offer sponsored content and targeted campaigns.',
    },
    reach: [
      fact('Titel', 'Title', 'geen cijfers gepubliceerd; betaalmuur met bedrijfslicenties, dagelijks nieuws, 1.000+ artikels per jaar', 'no figures published; paywall with company licences, daily news, 1,000+ articles a year'),
      fact('Citeline News & Insights', 'Citeline News & Insights', '4.500+ abonnerende organisaties, 450.000+ paginaweergaven per maand, 75 van de top 100 biofarmabedrijven (alle titels samen)', '4,500+ subscribing organisations, 450,000+ page views a month, 75 of the top 100 biopharma companies (all titles together)'),
    ],
    readers: {
      nl: 'Beslissers bij producenten van generieken en biosimilars, API-leveranciers en CDMO’s: portfolio- en productstrategie, business development, juridisch en IP, productie en supply chain, regulatory. Geen percentages. Engels. De Global Generics & Biosimilars Awards stoppen na 2025.',
      en: 'Decision-makers at generics and biosimilar manufacturers, API suppliers and CDMOs: portfolio and product strategy, business development, legal and IP, manufacturing and supply chain, regulatory. No percentages. English. The Global Generics & Biosimilars Awards end after 2025.',
    },
    rates: {
      nl: 'Op aanvraag via Pharma Ignite: gesponsorde content, webinars en leadgeneratie met een gegarandeerd aantal leads.',
      en: 'On request through Pharma Ignite: sponsored content, webinars and lead generation with a guaranteed number of leads.',
    },
    ask: {
      nl: 'Het aantal abonnees en ontvangers van e-mailalerts voor Generics Bulletin, het aandeel Europa en de prijs per gegarandeerde lead.',
      en: 'The number of Generics Bulletin subscribers and email-alert recipients, the share in Europe, and the price per guaranteed lead.',
    },
    sources: [
      { label: { nl: 'Generics Bulletin', en: 'Generics Bulletin' }, url: 'https://citeline.com/products-services/generics-bulletin/' },
      { label: { nl: 'Pharma Ignite', en: 'Pharma Ignite' }, url: 'https://citeline.com/products-services/pharma-ignite/' },
    ],
    checked: '2026-11',
  },
  {
    medium: 'P3pharmacy',
    publisher: 'Communications International Group (CIG)',
    url: 'https://www.communicationsinternationalgroup.com',
    market: { nl: 'VK', en: 'UK' },
    countries: ['GB'],
    geo: [{ code: 'GB' }],
    audiences: ['apothekers'],
    priority: 'interessant',
    assessment: {
      nl: 'Britse vakuitgever voor de openbare apotheek, met P3pharmacy als ingang bij apotheekeigenaars en -ketens: een Britse klantcase over hoe een apotheekgroep productinformatie en -foto’s beheert over vestigingen en digitale kanalen. Daarnaast is CIG Healthcare Partnership, dat opleidingen maakt voor OTC-merken, een mogelijke partner en ingang bij die merken.',
      en: 'UK trade publisher for community pharmacy, with P3pharmacy as the way in to pharmacy owners and chains: a UK customer case on how a pharmacy group manages product information and images across branches and digital channels. CIG Healthcare Partnership, which makes training for OTC brands, is also a possible partner and a way in to those brands.',
    },
    reach: [
      fact('P3pharmacy', 'P3pharmacy', '14.002 exemplaren per nummer, 12 per jaar (ABC 2025); bedrijfsvoering van apotheken', '14,002 copies per issue, 12 a year (ABC 2025); running a pharmacy business'),
      fact('Pharmacy Magazine', 'Pharmacy Magazine', '13.897 per nummer, 12 per jaar (ABC 2025); nieuws, klinische praktijk en bijscholing', '13,897 per issue, 12 a year (ABC 2025); news, clinical practice and training'),
      fact('Independent Community Pharmacist', 'Independent Community Pharmacist', '7.024 per nummer, 10 per jaar (ABC 2025)', '7,024 per issue, 10 a year (ABC 2025)'),
      fact('Training Matters', 'Training Matters', 'geen audit; in een campagne van 2024 14.565 exemplaren naar elke Britse apotheek', 'no audit; 14,565 copies to every UK pharmacy in a 2024 campaign'),
      fact('The Pharmacy Network', 'The Pharmacy Network', '100.000+ apotheekmedewerkers met toegang via ketens en verenigingen', '100,000+ pharmacy staff with access through chains and associations'),
    ],
    readers: {
      nl: 'Eigenaars, managers, apothekers en assistenten in de openbare apotheek; de bladen gaan vrijwel volledig gratis naar apotheken. Eén apotheek kan meerdere titels krijgen, dus het unieke bereik is onbekend. Pharmacy Magazine gaat volgens ABC ook naar fabrikanten en marketeers in de farma-industrie, zonder aantallen. Op The Pharmacy Show 2025 kwam 62% van de 9.613 bezoekers uit de openbare apotheek en was 2,2% fabrikant of leverancier. Engels.',
      en: 'Owners, managers, pharmacists and assistants in community pharmacy; the titles go almost entirely free to pharmacies. One pharmacy can get several titles, so the unique reach is unknown. According to ABC, Pharmacy Magazine also goes to manufacturers and marketers in the pharma industry, without numbers. At The Pharmacy Show 2025, 62% of the 9,613 visitors came from community pharmacy and 2.2% were manufacturers or suppliers. English.',
    },
    rates: {
      nl: 'Geen publieke mediakit of tarieven. Naast advertenties maakt CIG opleidingen op maat voor OTC-merken en doet het marktonderzoek met panels van apothekers.',
      en: 'No public media kit or rates. Besides advertising, CIG makes bespoke training for OTC brands and runs market research with panels of pharmacists.',
    },
    ask: {
      nl: 'Uniek bereik per functie en type organisatie, de overlap tussen de titels, recente nieuwsbriefkliks, hoeveel mensen ze bij Britse OTC- en cosmeticamerken bereiken, en hun rol op The Pharmacy Show van 10–11 oktober 2027 (in 2026 waren ze mediapartner).',
      en: 'Unique reach by job function and type of organisation, the overlap between titles, recent newsletter clicks, how many people they reach at UK OTC and cosmetics brands, and their role at The Pharmacy Show on 10–11 October 2027 (media partner in 2026).',
    },
    sources: [
      { label: { nl: 'ABC P3pharmacy', en: 'ABC P3pharmacy' }, url: 'https://www.abc.org.uk/product/10420' },
      { label: { nl: 'ABC Pharmacy Magazine', en: 'ABC Pharmacy Magazine' }, url: 'https://www.abc.org.uk/product/7029' },
      { label: { nl: 'CIG Healthcare', en: 'CIG Healthcare' }, url: 'https://www.cighealthcare.co.uk/route-to-market/' },
      { label: { nl: 'The Pharmacy Show', en: 'The Pharmacy Show' }, url: 'https://www.thepharmacyshow.co.uk/partner/communications-international-group' },
    ],
    checked: '2026-11',
  },
  {
    medium: 'Pharma in Focus',
    publisher: 'Lush Media',
    url: 'https://pharmainfocus.com.au',
    market: { nl: 'Australië en Nieuw-Zeeland', en: 'Australia and New Zealand' },
    countries: ['AU'],
    geo: [{ code: 'AU' }, { code: 'NZ' }],
    audiences: PRODUCENTEN,
    priority: 'interessant',
    assessment: {
      nl: 'Voor geneesmiddelenfabrikanten: het nieuwsoverzicht van de Australische farma-industrie, met senior management onder de lezers.',
      en: 'For drug manufacturers: the news service of the Australian pharma industry, with senior management among its readers.',
    },
    reach: [
      fact('Nieuwsbrief', 'Newsletter', 'bijna 9.000 lezers, twee keer per werkdag plus breaking news', 'almost 9,000 readers, twice every business day plus breaking news'),
    ],
    readers: {
      nl: 'Mensen in de farma-industrie, van management tot C-suite, bij elk groot farmabedrijf in Australië en Nieuw-Zeeland, plus verwante bedrijven en de overheid. Geen verdeling per land of functie. Toegang via een betaald lidmaatschap. Engels.',
      en: 'People in the pharma industry, from management to C-suite, at every major drug company in Australia and New Zealand, plus related businesses and government. No split by country or function. Access through a paid membership. English.',
    },
    ask: { nl: 'Hoeveel lezers in Australië zelf zitten en welke functies ze hebben, en de tarieven.', en: 'How many readers are in Australia itself and what their functions are, and the rates.' },
    sources: [
      { label: { nl: 'Over Pharma in Focus', en: 'About Pharma in Focus' }, url: 'https://pharmainfocus.com.au/about.php' },
      { label: { nl: 'Adverteren', en: 'Advertise' }, url: 'https://pharmainfocus.com.au/advertise.php' },
    ],
    checked: '2026-11',
  },
  {
    medium: 'Australian Journal of Pharmacy',
    publisher: 'Australian Pharmaceutical Publishing Company',
    url: 'https://ajp.com.au',
    market: { nl: 'Australië', en: 'Australia' },
    countries: ['AU'],
    geo: [{ code: 'AU' }],
    audiences: ['apothekers'],
    priority: 'interessant',
    assessment: {
      nl: 'Voor brede bekendheid onder Australische apothekers: het blad met de grootste oplage in de sector. Biedt ook gesponsorde opleidingen aan.',
      en: 'For broad awareness among Australian pharmacists: the title with the largest circulation in the sector. Also offers sponsored education.',
    },
    reach: [
      fact('Magazine', 'Magazine', '19.446 exemplaren gemiddeld (netto printverspreiding juli 2025 – juni 2026), 11 nummers per jaar', '19,446 copies on average (net print distribution July 2025 – June 2026), 11 issues a year'),
      fact('AJP Daily', 'AJP Daily', '20.600+ abonnees (februari 2026)', '20,600+ subscribers (February 2026)'),
      fact('Website', 'Website', '40.000+ geregistreerde gebruikers; e-mag 36.500+ abonnees', '40,000+ registered users; e-mag 36,500+ subscribers'),
    ],
    readers: {
      nl: 'Openbare apothekers: volgens de uitgever krijgen 9 op de 10 het blad, en het staat eerst in een lezersonderzoek naar apotheekbladen. Nieuws, bedrijfsvoering en klinische updates. Engels.',
      en: 'Community pharmacists: according to the publisher 9 out of 10 receive the magazine, and it ranks first in a readership survey of pharmacy publications. News, business and clinical updates. English.',
    },
    rates: {
      nl: 'Advertenties in print en online, plus gesponsorde opleidingen, webinars en podcasts; tarieven in de mediakit op aanvraag.',
      en: 'Print and online advertising, plus sponsored education, webinars and podcasts; rates in the media kit on request.',
    },
    ask: { nl: 'De mediakit 2027 met tarieven, en wat een gesponsorde opleiding kost.', en: 'The 2027 media kit with rates, and what sponsored education costs.' },
    sources: [{ label: { nl: 'Adverteren in de AJP', en: 'Advertise with the AJP' }, url: 'https://ajp.com.au/advertise-with-us/' }],
    checked: '2026-11',
  },
  {
    medium: 'Pharmacy Daily',
    url: 'https://pharmacydaily.com.au',
    market: { nl: 'Australië', en: 'Australia' },
    countries: ['AU'],
    geo: [{ code: 'AU' }],
    geoNote: { nl: 'Ook lezers buiten Australië, zonder verdeling.', en: 'Also readers outside Australia, without a split.' },
    audiences: ['apothekers', 'groothandels', 'producenten'],
    priority: 'interessant',
    assessment: {
      nl: 'Voor een concreet nieuwsmoment, zoals een lokale samenwerking, een integratie of de uitbreiding van de Australische catalogus.',
      en: 'For a concrete news moment, such as a local partnership, an integration or the expansion of the Australian catalogue.',
    },
    reach: [
      fact('Nieuwsbrief', 'Newsletter', '20.000+ ontvangers, elke werkdag', '20,000+ recipients, every business day'),
    ],
    readers: {
      nl: 'Openbare apotheken, ziekenhuizen, overheid, beroepsorganisaties, groothandels, fabrikanten, studenten en opleidingen. Geen verdeling per groep. Engels.',
      en: 'Community pharmacies, hospitals, government, peak pharmacy groups, wholesalers, manufacturers, students and educational institutions. No split by group. English.',
    },
    rates: {
      nl: 'Advertenties van één tot vier kolommen of een volle pagina als bijlage; tarieven op aanvraag.',
      en: 'Ads from one to four columns wide, or a full page as an attachment; rates on request.',
    },
    ask: { nl: 'De tarieven, en hoeveel ontvangers in apotheken en hoeveel bij fabrikanten werken.', en: 'The rates, and how many recipients work in pharmacies and how many at manufacturers.' },
    sources: [{ label: { nl: 'Adverteren', en: 'Advertising' }, url: 'https://pharmacydaily.com.au/pharmacy-daily-advertising' }],
    checked: '2026-11',
  },
  {
    medium: 'PharmaManufacturingIQ',
    formerly: ['European Pharmaceutical Manufacturer'],
    publisher: 'ManufacturingIQ',
    url: 'https://www.pharmamanufacturingiq.com',
    market: { nl: 'Europa', en: 'Europe' },
    countries: [],
    geo: [{ code: 'GB', share: 26 }, { code: 'DE', share: 18 }, { code: 'IT', share: 13 }, { code: 'ES', share: 12 }, { code: 'FR', share: 12 }],
    geoNote: { nl: 'Verdeling van de printabonnees; de websitebezoekers komen vooral uit de VS en India.', en: 'Split of the print subscribers; website visitors come mostly from the US and India.' },
    audiences: PRODUCENTEN,
    priority: 'selectief',
    assessment: {
      nl: 'Sinds november 2026 de nieuwe naam van European Pharmaceutical Manufacturer. Interessant als er een concreet verhaal is over productie, verpakking of kwaliteitsbeheer. Voor de commerciële distributie van productdata eerst de titels hierboven testen.',
      en: 'Since November 2026 the new name of European Pharmaceutical Manufacturer. Interesting when there is a concrete story on manufacturing, packaging or quality management. For the commercial distribution of product data, test the titles above first.',
    },
    reach: [
      fact('Magazine', 'Magazine', '6.000 gekwalificeerde abonnees, 4 nummers per jaar', '6,000 qualified subscribers, 4 issues a year'),
      fact('Nieuwsbrief', 'Newsletter', '16.000 ontvangers, wekelijks; open rate 25%', '16,000 recipients, weekly; 25% open rate'),
      fact('Webinars', 'Webinars', 'gemiddeld 125 inschrijvingen en 46 live kijkers', 'on average 125 registrations and 46 live viewers'),
      fact('LinkedIn', 'LinkedIn', '±11.000 volgers', 'about 11,000 followers'),
    ],
    readers: {
      nl: 'Printlezers allemaal in Europa: VK 26%, Duitsland 18%, Italië 13%, Spanje 12%, Frankrijk 12%. Functies: 31% productie, 28% management, 15% kwaliteitsborging, 11% productontwerp, 9% R&D. De websitebezoekers komen vooral uit de VS en India. Engels.',
      en: 'Print readers all in Europe: UK 26%, Germany 18%, Italy 13%, Spain 12%, France 12%. Functions: 31% manufacturing, 28% management, 15% quality assurance, 11% product design, 9% R&D. Website visitors come mostly from the US and India. English.',
    },
    ask: { nl: 'De nieuwe mediakit onder de naam PharmaManufacturingIQ.', en: 'The new media kit under the PharmaManufacturingIQ name.' },
    sources: [
      { label: { nl: 'Mediakit EPM 2026', en: 'EPM media kit 2026' }, url: 'https://www.cphi-online.com/brochure/epm-media-kit-2026/file.pdf' },
      { label: { nl: 'Aankondiging nieuwe naam', en: 'Rename announcement' }, url: 'https://www.pharmamanufacturingiq.com/a-new-identity-a-global-outlook/' },
    ],
    checked: '2026-11',
  },
  {
    medium: 'European Pharmaceutical Review',
    publisher: 'Russell Publishing',
    url: 'https://www.europeanpharmaceuticalreview.com',
    market: { nl: 'Europa', en: 'Europe' },
    countries: [],
    geo: [],
    geoNote: { nl: 'Vooral Europa, zonder landverdeling.', en: 'Mainly Europe, without a country split.' },
    audiences: PRODUCENTEN,
    priority: 'selectief',
    assessment: {
      nl: 'Interessant als er een concreet verhaal is over productie, verpakking of kwaliteitsbeheer. Voor de commerciële distributie van productdata eerst de titels hierboven testen.',
      en: 'Interesting when there is a concrete story on manufacturing, packaging or quality management. For the commercial distribution of product data, test the titles above first.',
    },
    reach: [
      fact('Magazine', 'Magazine', '12.000 ontvangers per nummer, sinds 2026 nog 2 nummers per jaar; de uitgever schat 40.662 lezers per nummer', '12,000 recipients per issue, since 2026 only 2 issues a year; the publisher estimates 40,662 readers per issue'),
      fact('Website', 'Website', '±21.000–35.000 bezoeken per maand (schatting van derden)', 'about 21,000–35,000 visits a month (third-party estimate)'),
      fact('LinkedIn', 'LinkedIn', '±45.000 volgers', 'about 45,000 followers'),
      fact('Virtuele summit', 'Virtual summit', '600+ deelnemers (2024)', '600+ attendees (2024)'),
    ],
    readers: {
      nl: 'Senior beslissers, vooral in Europa, plus 1.000 gegarandeerde ontvangers in de VS. Geen verdeling per functie of land gepubliceerd. Engels.',
      en: 'Senior decision-makers, mainly in Europe, plus 1,000 guaranteed recipients in the US. No split by job function or country published. English.',
    },
    ask: { nl: 'De mediaplanner 2027 met nieuwsbriefcijfers, lezersverdeling en tarieven.', en: 'The 2027 media planner with newsletter figures, readership breakdown and rates.' },
    sources: [{ label: { nl: 'Over EPR', en: 'About EPR' }, url: 'https://www.europeanpharmaceuticalreview.com/about-us' }],
    checked: '2026-11',
  },
  {
    medium: 'Retail Beauty',
    publisher: 'The Intermedia Group',
    url: 'https://retailbeauty.com.au',
    market: { nl: 'Australië / Azië-Pacific', en: 'Australia / Asia-Pacific' },
    countries: ['AU'],
    geo: [{ code: 'AU' }],
    geoNote: { nl: 'Verder Azië-Pacific, zonder landverdeling.', en: 'Further Asia-Pacific, without a country split.' },
    audiences: ['producenten', 'apothekers'],
    priority: 'selectief',
    assessment: {
      nl: 'Voor dermocosmetica en verzorging, vooral om tegelijk merken en inkopers bij winkels en apotheken te bereiken.',
      en: 'For dermocosmetics and personal care, especially to reach brands and buyers at stores and pharmacies at the same time.',
    },
    reach: [
      fact('Magazine', 'Magazine', '5.500 exemplaren, 4 nummers per jaar; de uitgever schat 24.800 lezers, waaronder ±4.500 beautyassistenten in apotheken op naam', '5,500 copies, 4 issues a year; the publisher estimates 24,800 readers, including about 4,500 named pharmacy beauty assistants'),
      fact('Nieuwsbrief', 'Newsletter', '11.400 abonnees, wekelijks (mediakit 2022)', '11,400 subscribers, weekly (2022 media kit)'),
      fact('Website', 'Website', '10.000 unieke bezoekers per maand (mediakit 2022)', '10,000 unique visitors a month (2022 media kit)'),
    ],
    readers: {
      nl: 'Beautyadviseurs, counter managers, inkopers en management bij apotheken, warenhuizen en webwinkels, plus eigenaars, marketeers en sales bij beauty- en gezondheidsmerken. Engels.',
      en: 'Beauty advisors, counter managers, buyers and management at pharmacies, department stores and online stores, plus owners, marketers and sales at beauty and health brands. English.',
    },
    rates: {
      nl: 'Solo-mailing A$ 2.100, nieuwsbrief-takeover of gesponsord artikel A$ 1.600 voor 2 weken (mediakit 2022, excl. GST).',
      en: 'Solus email A$ 2,100, newsletter takeover or sponsored content A$ 1,600 for 2 weeks (2022 media kit, excl. GST).',
    },
    ask: { nl: 'De mediakit 2027, en welk deel van de lezers in Australië en in apotheken zit.', en: 'The 2027 media kit, and what share of the readers are in Australia and in pharmacies.' },
    sources: [
      { label: { nl: 'Retail Beauty bij Intermedia', en: 'Retail Beauty at Intermedia' }, url: 'https://intermedia.com.au/print/retailbeauty/' },
      { label: { nl: 'Mediakit 2022', en: 'Media kit 2022' }, url: 'https://intermedia-sites.s3.ap-southeast-2.amazonaws.com/Retail+Beauty/RBeauty+Media+kit+2022+v4.pdf' },
    ],
    checked: '2026-11',
  },
  {
    medium: 'Inside FMCG',
    publisher: 'Octomedia',
    url: 'https://insidefmcg.com.au',
    market: { nl: 'Australië', en: 'Australia' },
    countries: ['AU'],
    geo: [{ code: 'AU' }],
    audiences: PRODUCENTEN,
    priority: 'selectief',
    assessment: {
      nl: 'Voor consumentenmerken die via apotheken én andere retailkanalen verkopen. Apotheek is er één kanaal naast grocery en convenience.',
      en: 'For consumer brands that sell through pharmacies and other retail channels. Pharmacy is one channel next to grocery and convenience.',
    },
    reach: [
      fact('Nieuwsbrief', 'Newsletter', '26.000 abonnees, dagelijks', '26,000 subscribers, daily'),
      fact('Magazine', 'Magazine', 'per kwartaal; geen oplage gepubliceerd', 'quarterly; no circulation published'),
    ],
    readers: {
      nl: 'Leveranciers en retailers in grocery, convenience, apotheek en impulsaankopen. Geen verdeling per kanaal of functie. Engels.',
      en: 'Suppliers and retailers in grocery, convenience, pharmacy and impulse. No split by channel or function. English.',
    },
    ask: { nl: 'De mediakit, en hoeveel abonnees bij merken werken die via de apotheek verkopen.', en: 'The media kit, and how many subscribers work at brands that sell through pharmacy.' },
    sources: [
      { label: { nl: 'Inside FMCG bij Octomedia', en: 'Inside FMCG at Octomedia' }, url: 'https://octomedia.com.au/our-brands/inside-fmcg/' },
      { label: { nl: 'Adverteren', en: 'Advertise' }, url: 'https://insidefmcg.com.au/advertise-with-us/' },
    ],
    checked: '2026-11',
  },
  {
    medium: 'Australasian Pharmacy',
    formerly: ['In the Know'],
    publisher: 'Gold Cross (Pharmacy Guild of Australia)',
    url: 'https://australasianpharmacy.com.au',
    market: { nl: 'Australië en Nieuw-Zeeland', en: 'Australia and New Zealand' },
    countries: ['AU'],
    geo: [{ code: 'AU' }, { code: 'NZ' }],
    audiences: ['apothekers'],
    priority: 'selectief',
    assessment: {
      nl: 'Het vakblad van de Pharmacy Guild, tot 2024 In the Know. Interessant voor commerciële zichtbaarheid bij openbare apotheken, maar de oplage is onduidelijk.',
      en: 'The Pharmacy Guild’s trade journal, called In the Know until 2024. Interesting for commercial visibility with community pharmacies, but the circulation is unclear.',
    },
    reach: [
      fact('Magazine', 'Magazine', '6 nummers per jaar; de Guild meldde in 2022 een oplage van 11.000, het blad zelf drukte in september 2022 5.267 exemplaren', '6 issues a year; the Guild reported a circulation of 11,000 in 2022, while the magazine itself printed 5,267 copies in September 2022'),
      fact('Nieuwsbrief', 'Newsletter', 'wekelijks; geen aantal gepubliceerd', 'weekly; no number published'),
    ],
    readers: {
      nl: 'Apotheekeigenaars en -managers, apothekers en leveranciers. Werd vroeger naar elke Australische apotheek gestuurd, gemiddeld naar twee apothekers per apotheek; sinds de nieuwe naam ook Nieuw-Zeeland. Engels.',
      en: 'Pharmacy owners and managers, pharmacists and suppliers. Used to be sent to every Australian pharmacy, on average to two pharmacists per pharmacy; since the new name also New Zealand. English.',
    },
    ask: { nl: 'De actuele oplage per land, waar het verschil tussen 11.000 en 5.267 vandaan komt, en de tarieven.', en: 'The current circulation per country, where the gap between 11,000 and 5,267 comes from, and the rates.' },
    sources: [
      { label: { nl: 'In the Know bij de Guild (2022)', en: 'In the Know at the Guild (2022)' }, url: 'https://www.guild.org.au/about-us/guild-publications/in-the-know-itk' },
      { label: { nl: 'Gold Cross partnergids 2025', en: 'Gold Cross partner guide 2025' }, url: 'https://goldx.com.au/docs/goldxlibraries/d/endorsed-partner-booklet-20257ee5fee3-4f4b-4bc3-b0a1-0911d88aed7d.pdf?sfvrsn=5ba12c0b_1' },
    ],
    checked: '2026-11',
  },
];

/** Whether a PR item was planned in this medium, also under an earlier name. */
export const isInMedium = (m: TradeMedium, medium: string | undefined) => medium === m.medium || (!!medium && !!m.formerly?.includes(medium));
