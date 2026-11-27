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
    medium: 'pharmaphorum Deep Dive',
    publisher: 'pharmaphorum (EVERSANA)',
    url: 'https://pharmaphorum.com',
    market: { nl: 'VK / internationaal', en: 'UK / international' },
    countries: ['GB'],
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
    medium: 'PharmaManufacturingIQ',
    formerly: ['European Pharmaceutical Manufacturer'],
    publisher: 'ManufacturingIQ',
    url: 'https://www.pharmamanufacturingiq.com',
    market: { nl: 'Europa', en: 'Europe' },
    countries: [],
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
];

/** Whether a PR item was planned in this medium, also under an earlier name. */
export const isInMedium = (m: TradeMedium, medium: string | undefined) => medium === m.medium || (!!medium && !!m.formerly?.includes(medium));
