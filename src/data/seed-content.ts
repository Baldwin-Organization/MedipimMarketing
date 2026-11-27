import type { Audience, Budget, BudgetLine, ContentFormat, ContentPiece, ContentPillar, ContentStatus, Item } from './types';

/** Marketing budget 2027, excl. VAT; total € 189,294. */
const BUDGET_2027: Record<BudgetLine, number> = {
  beurzen_exposant: 60000,
  beurzen_bezoeker: 22000,
  email: 15000,
  linkedin: 18000,
  google: 20000,
  vakmedia: 20000,
  lidmaatschappen: 10000,
  chatgpt: 12000,
  reserve: 12294,
};

export const SEED_BUDGETS: Budget[] = Object.entries(BUDGET_2027).map(([line, amount]) => ({
  id: `2027:${line}`,
  year: 2027,
  line: line as BudgetLine,
  amount,
}));

/** Proposed content mix; the targets add up to 100%. Stable ids so seed updates can find them again. */
export const SEED_PILLARS: ContentPillar[] = [
  {
    id: 'pillar-product',
    name: 'Product & platform',
    description: 'Nieuwe functies, de nieuwe UX, integraties met apotheeksoftware en hoe Medipim werkt.',
    target: 25,
    accent: '1',
    order: 0,
    translations: { en: { name: 'Product & platform', description: 'New features, the new UX, integrations with pharmacy software and how Medipim works.' } },
  },
  {
    id: 'pillar-data',
    name: 'Data & expertise',
    description: 'Kwaliteit van productdata, standaarden zoals GS1 en SNOMED, regelgeving en marktinzichten uit Medimapper.',
    target: 25,
    accent: '6',
    order: 1,
    translations: { en: { name: 'Data & expertise', description: 'Product data quality, standards such as GS1 and SNOMED, regulation and market insights from Medimapper.' } },
  },
  {
    id: 'pillar-customers',
    name: 'Klanten & cases',
    description: 'Verhalen van apothekers, groothandels en fabrikanten die met Medipim werken.',
    target: 20,
    accent: '5',
    order: 2,
    translations: { en: { name: 'Customers & cases', description: 'Stories from pharmacists, wholesalers and manufacturers who work with Medipim.' } },
  },
  {
    id: 'pillar-sector',
    name: 'Sector & events',
    description: 'Beurzen en congressen waar we zijn, sectornieuws en onze kijk erop.',
    target: 20,
    accent: '4',
    order: 3,
    translations: { en: { name: 'Industry & events', description: 'Trade fairs and congresses we attend, industry news and our take on it.' } },
  },
  {
    id: 'pillar-team',
    name: 'Team & cultuur',
    description: 'De mensen achter Medipim, achter de schermen en vacatures.',
    target: 10,
    accent: '3',
    order: 4,
    translations: { en: { name: 'Team & culture', description: 'The people behind Medipim, behind the scenes and vacancies.' } },
  },
];

const PHARMACISTS: Audience[] = ['apothekers'];
const INDUSTRY: Audience[] = ['producenten', 'groothandels'];
const EVERYONE: Audience[] = ['groothandels', 'producenten', 'apothekers', 'ziekenhuizen'];

/** Id of the piece the UX launch items in the calendar share. */
export const UX_LAUNCH_CONTENT_ID = 'content-ux-launch';

interface SeedPiece {
  id: string;
  pillar: string;
  format: ContentFormat;
  recurring?: boolean;
  status?: ContentStatus;
  month: string;
  audiences: Audience[];
  owner?: string;
  title: string;
  description: string;
  en: { title: string; description: string };
}

const PIECES: SeedPiece[] = [
  // Product & platform
  { id: UX_LAUNCH_CONTENT_ID, pillar: 'pillar-product', format: 'post', status: 'gedeeld', month: '2026-11', audiences: EVERYONE, owner: 'Maarten', title: 'Lancering nieuwe UX Belgisch platform', description: 'Aankondiging van de nieuwe UX: LinkedIn-posts van Maarten en de Medipim-pagina, en een nieuwsbrief aan de apothekers.', en: { title: 'Launch of the new UX of the Belgian platform', description: 'Announcing the new UX: LinkedIn posts by Maarten and the Medipim page, and a newsletter to pharmacists.' } },
  { id: 'content-ux-tour', pillar: 'pillar-product', format: 'video', month: '2026-12', audiences: PHARMACISTS, title: 'Rondleiding door de nieuwe UX', description: 'Korte schermopname (2 minuten) die de belangrijkste schermen van het vernieuwde platform toont.', en: { title: 'A tour of the new UX', description: 'Short screen recording (2 minutes) showing the main screens of the redesigned platform.' } },
  { id: 'content-integrations', pillar: 'pillar-product', format: 'video', month: '2027-01', audiences: PHARMACISTS, title: 'Medipim Academy: wat zie je via de Medipim-knop in je apotheeksoftware?', description: 'Lancering van de Medipim Academy met de eerste video (2 à 3 minuten): wat het API-scherm is, hoe je het opent vanuit Farmad, Greenock, CareConnect Pharmacist, Officinall of Pharmony, en welke productinformatie erin staat.', en: { title: 'Medipim Academy: what do you see behind the Medipim button in your pharmacy software?', description: 'Launch of the Medipim Academy with the first video (2 to 3 minutes): what the API screen is, how to open it from Farmad, Greenock, CareConnect Pharmacist, Officinall or Pharmony, and what product information it holds.' } },
  { id: 'content-product-update', pillar: 'pillar-product', format: 'nieuwsbrief', month: '2027-03', audiences: EVERYONE, title: 'Productupdate eerste kwartaal', description: 'Overzicht van wat er in het eerste kwartaal nieuw is op het platform.', en: { title: 'Product update first quarter', description: 'Overview of what is new on the platform in the first quarter.' } },

  // Data & expertise
  { id: 'content-why-data', pillar: 'pillar-data', format: 'video', month: '2027-01', audiences: PHARMACISTS, title: 'Medipim Academy: tijdelijk onbeschikbaar of einde commercialisatie?', description: 'Video over beschikbaarheid: waar je ziet of een product tijdelijk onbeschikbaar is of uit de handel gaat, en waarom. De info komt van Farmastatus (FAGG), die ze van de firma\'s krijgt; kijk dus altijd ook je eigen stock of je groothandel na.', en: { title: 'Medipim Academy: temporarily unavailable or discontinued?', description: 'Video on availability: where you see whether a product is temporarily unavailable or being discontinued, and why. The information comes from Farmastatus (FAMHP), which gets it from the companies, so always check your own stock or your wholesaler too.' } },
  { id: 'content-medimapper-numbers', pillar: 'pillar-data', format: 'infographic', month: '2027-02', audiences: INDUSTRY, title: 'Medimapper: de Europese markt in cijfers', description: 'Visual met kerncijfers uit Medimapper: aantal producten, landen en verschillen tussen markten.', en: { title: 'Medimapper: the European market in numbers', description: 'Visual with key figures from Medimapper: number of products, countries and differences between markets.' } },
  { id: 'content-webinar-manufacturers', pillar: 'pillar-data', format: 'webinar', month: '2027-04', audiences: ['producenten'], title: 'Webinar: productdata aanleveren als fabrikant', description: 'Praktisch webinar voor fabrikanten: hoe lever je volledige en correcte productdata aan, en wat levert het op.', en: { title: 'Webinar: supplying product data as a manufacturer', description: 'Practical webinar for manufacturers: how to supply complete and correct product data, and what it brings.' } },
  { id: 'content-gs1-whitepaper', pillar: 'pillar-data', format: 'whitepaper', month: '2027-05', audiences: INDUSTRY, title: 'Whitepaper: GS1-standaarden en productdata in de farmaketen', description: 'Hoe standaarden de uitwisseling van productdata tussen fabrikant, groothandel en apotheek vereenvoudigen. Klaar voor GS1 Connect.', en: { title: 'Whitepaper: GS1 standards and product data in the pharma supply chain', description: 'How standards simplify the exchange of product data between manufacturer, wholesaler and pharmacy. Ready for GS1 Connect.' } },

  // Customers & cases
  { id: 'content-case-pharmacy', pillar: 'pillar-customers', format: 'case', month: '2027-02', audiences: PHARMACISTS, title: 'Case: hoe een apotheek tijd wint met Medipim', description: 'Interview met een Belgische apotheker over de dagelijkse tijdswinst, met foto en citaten.', en: { title: 'Case: how a pharmacy saves time with Medipim', description: 'Interview with a Belgian pharmacist about daily time savings, with photo and quotes.' } },
  { id: 'content-customer-quotes', pillar: 'pillar-customers', format: 'case', recurring: true, month: '2027-03', audiences: ['producenten', 'groothandels'], title: 'Een klant aan het woord', description: 'Vertel samen met een softwarepartner, producent of groothandel wat die met Medipim heeft opgelost. Eén concreet probleem en één resultaat volstaan.', en: { title: 'A customer speaking', description: 'Tell, together with a software partner, manufacturer or wholesaler, what they solved with Medipim. One concrete problem and one result are enough.' } },
  { id: 'content-case-wholesaler', pillar: 'pillar-customers', format: 'case', month: '2027-04', audiences: ['groothandels'], title: 'Case groothandel: één bron voor productdata', description: 'Hoe een groothandel productdata centraliseert via Medipim en wat dat oplevert voor de klanten.', en: { title: 'Wholesaler case: one source for product data', description: 'How a wholesaler centralises product data through Medipim, and what it brings its customers.' } },

  // Industry & events
  { id: 'content-events-preview', pillar: 'pillar-sector', format: 'post', month: '2027-01', audiences: EVERYONE, title: 'Vooruitblik: hier vind je ons in 2027', description: 'Overzicht van de beurzen waar we als exposant staan, met een uitnodiging om af te spreken.', en: { title: 'Preview: where to find us in 2027', description: 'Overview of the trade fairs where we exhibit, with an invitation to meet.' } },
  { id: 'content-pharmagora', pillar: 'pillar-sector', format: 'post', month: '2027-03', audiences: PHARMACISTS, title: 'Kom langs op PharmagoraPlus', description: 'Uitnodiging in het Frans voor onze stand op PharmagoraPlus in Parijs.', en: { title: 'Visit us at PharmagoraPlus', description: 'Invitation in French to our stand at PharmagoraPlus in Paris.' } },
  { id: 'content-girp-trends', pillar: 'pillar-sector', format: 'artikel', month: '2027-05', audiences: ['groothandels'], title: 'Trends bij Europese groothandels na GIRP PharmaConnect', description: 'Onze belangrijkste lessen uit GIRP PharmaConnect in Sofia, als artikel op LinkedIn en de website.', en: { title: 'Trends among European wholesalers after GIRP PharmaConnect', description: 'Our key takeaways from GIRP PharmaConnect in Sofia, as an article on LinkedIn and the website.' } },
  { id: 'content-expopharm-recap', pillar: 'pillar-sector', format: 'video', month: '2027-10', audiences: PHARMACISTS, title: 'Recap Expopharm', description: 'Korte aftermovie van onze stand op Expopharm in Düsseldorf.', en: { title: 'Expopharm recap', description: 'Short aftermovie of our stand at Expopharm in Düsseldorf.' } },

  // Team & culture
  { id: 'content-meet-team', pillar: 'pillar-team', format: 'post', recurring: true, month: '2027-02', audiences: EVERYONE, title: 'Maak kennis met het team', description: 'Maandelijkse post die één collega voorstelt: wat doe je, en waarom bij Medipim?', en: { title: 'Meet the team', description: 'Monthly post introducing one colleague: what do you do, and why at Medipim?' } },
  { id: 'content-behind-scenes', pillar: 'pillar-team', format: 'video', month: '2027-03', audiences: EVERYONE, title: 'Achter de schermen bij Medipim: één product van binnenkomst tot publicatie', description: 'Volg één product van binnenkomst tot publicatie. Laat de collega die een barcode controleert, een categorie kiest of een packshot maakt zelf vertellen waarom.', en: { title: 'Behind the scenes at Medipim: one product from intake to publication', description: 'Follow one product from intake to publication. Let the colleague who checks a barcode, picks a category or shoots a packshot explain why, in their own words.' } },

  // Ideas from the team, November 2026
  { id: 'content-did-you-know', pillar: 'pillar-product', format: 'post', recurring: true, month: '2027-01', audiences: EVERYONE, title: 'Wist je dat …', description: 'Kleine functies toegelicht: wat je met onze data of het platform kan doen. Eén functie per post, met een schermafbeelding.', en: { title: 'Did you know …', description: 'Small features explained: what you can do with our data or the platform. One feature per post, with a screenshot.' } },
  { id: 'content-sheet-closer-look', pillar: 'pillar-data', format: 'post', month: '2027-01', audiences: ['apothekers', 'producenten'], title: 'Eén productfiche onder de loep', description: 'Toon een fiche vóór en na verrijking. Welke informatie ontbrak, en wat kan een apotheek of webshop er nu mee?', en: { title: 'One product sheet under the magnifying glass', description: 'Show a sheet before and after enrichment. What information was missing, and what can a pharmacy or webshop do with it now?' } },
  { id: 'content-one-product-three-users', pillar: 'pillar-data', format: 'infographic', month: '2027-02', audiences: ['producenten', 'groothandels', 'apothekers'], title: 'Eén product, drie gebruikers', description: 'Laat zien wat een fabrikant aanlevert, wat een groothandel nodig heeft en wat een apotheker uiteindelijk ziet.', en: { title: 'One product, three users', description: 'Show what a manufacturer supplies, what a wholesaler needs and what a pharmacist finally sees.' } },
  { id: 'content-missing-field', pillar: 'pillar-data', format: 'post', recurring: true, month: '2027-02', audiences: EVERYONE, title: 'Wat loopt er mis als één veld ontbreekt?', description: 'Een verkeerde verpakkingshoeveelheid, een ontbrekende barcode of een verouderde foto. Vertel per post wat het gevolg is in de praktijk.', en: { title: 'What goes wrong when one field is missing?', description: 'A wrong pack size, a missing barcode or an outdated photo. Tell per post what the consequence is in practice.' } },
  { id: 'content-sales-question', pillar: 'pillar-product', format: 'post', recurring: true, month: '2027-03', audiences: ['groothandels', 'producenten'], title: 'Een vraag die sales vaak krijgt', description: 'Bijvoorbeeld: "Kunnen we alleen gewijzigde producten ophalen via de API?" Beantwoord één vraag per post, liefst met een kort voorbeeld.', en: { title: 'A question sales often gets', description: 'For example: "Can we fetch only changed products through the API?" Answer one question per post, preferably with a short example.' } },
  { id: 'content-event-presence', pillar: 'pillar-sector', format: 'post', recurring: true, month: '2027-03', audiences: EVERYONE, title: 'Hier zijn we: deelname aan beurzen en conferenties', description: 'Per beurs of conferentie een post: we staan er als exposant of we zijn er als bezoeker. Met standnummer of een uitnodiging om af te spreken.', en: { title: 'Where we are: trade fairs and conferences', description: 'One post per trade fair or conference: we exhibit or we attend as visitors. With the stand number or an invitation to meet.' } },
  { id: 'content-event-takeaway', pillar: 'pillar-sector', format: 'post', recurring: true, month: '2027-03', audiences: EVERYONE, title: 'Wat we meenemen van een beurs', description: 'Deel achteraf één vraag of observatie die vaker terugkwam in gesprekken. Zo hebben ook mensen die er niet waren iets aan de post.', en: { title: 'What we take away from a trade fair', description: 'Afterwards, share one question or observation that came up often in conversations, so people who were not there also get something out of the post.' } },
  { id: 'content-two-countries', pillar: 'pillar-data', format: 'post', month: '2027-04', audiences: INDUSTRY, title: 'Hetzelfde product in twee landen', description: 'Leg twee verpakkingen naast elkaar en toon wat verschilt in naam, productcode, taal of inhoud. Een concrete manier om onze internationale expertise te tonen.', en: { title: 'The same product in two countries', description: 'Put two packs side by side and show what differs in name, product code, language or content. A concrete way to show our international expertise.' } },
  { id: 'content-ai-in-practice', pillar: 'pillar-data', format: 'video', month: '2027-04', audiences: EVERYONE, title: 'AI in de praktijk', description: 'Geef een AI-assistent dezelfde vraag met een onvolledige en een verrijkte productfiche. Toon wat hij in elk geval kan terugvinden, bijvoorbeeld over de verpakking of de ingrediënten.', en: { title: 'AI in practice', description: 'Give an AI assistant the same question with an incomplete and an enriched product sheet. Show what it can find in each case, for example about the pack or the ingredients.' } },
  { id: 'content-ai-foundation', pillar: 'pillar-data', format: 'artikel', month: '2027-05', audiences: INDUSTRY, title: 'Goede productdata als basis voor AI', description: 'Waarom AI maar zo goed is als de productdata eronder, en wat fabrikanten, groothandels en apotheken nu al kunnen doen om er klaar voor te zijn.', en: { title: 'Good product data as the foundation for AI', description: 'Why AI is only as good as the product data underneath, and what manufacturers, wholesalers and pharmacies can already do to be ready.' } },
  { id: 'content-photography', pillar: 'pillar-data', format: 'artikel', month: '2027-06', audiences: ['producenten', 'apothekers'], title: 'Het belang van productfotografie', description: 'Wat goede packshots opleveren in een webshop of op een apotheekscherm, en wat er misloopt met een verouderde of ontbrekende foto.', en: { title: 'Why product photography matters', description: 'What good packshots bring in a webshop or on a pharmacy screen, and what goes wrong with an outdated or missing photo.' } },

  // Single posts from the series, so the Medipim page gets one post a week in 2027 in the proportions of the content mix
  { id: 'content-dyk-search-code', pillar: 'pillar-product', format: 'infographic', month: '2027-02', audiences: PHARMACISTS, title: 'Medipim Academy: Medipim-, ATC- of BCFI-categorie, wat is het verschil?', description: 'Carrousel en korte video over de drie indelingen: waarvoor elk dient, en hoe de therapeutische categorie helpt om bij een onbeschikbaar geneesmiddel sneller een alternatief voor te stellen aan de arts.', en: { title: 'Medipim Academy: Medipim, ATC or BCFI category, what is the difference?', description: 'Carousel and short video on the three classifications: what each is for, and how the therapeutic category helps you suggest an alternative to the doctor faster when a medicine is unavailable.' } },
  { id: 'content-dyk-photos', pillar: 'pillar-product', format: 'post', month: '2027-06', audiences: PHARMACISTS, title: 'Wist je dat … je in Medipim ook de pil zelf ziet?', description: 'Uit de reeks "Wist je dat …": de afbeelding van de pil, de galenische vorm en de kleur van een tablet. Handig als een patiënt twijfelt welk geneesmiddel hij in handen heeft.', en: { title: 'Did you know … Medipim also shows the pill itself?', description: 'From the "Did you know …" series: the image of the pill, the dosage form and the colour of a tablet. Handy when a patient is unsure which medicine they are holding.' } },
  { id: 'content-dyk-documents', pillar: 'pillar-product', format: 'post', month: '2027-07', audiences: PHARMACISTS, title: 'Wist je dat … de bijsluiters in Medipim uit SAMv2 en pharma.be komen?', description: 'Uit de reeks "Wist je dat …": bijsluiters komen uit SAMv2, de nationale databank, of van pharma.be, en de beschrijvingen in het API-scherm zijn eruit gehaald.', en: { title: 'Did you know … the leaflets in Medipim come from SAMv2 and pharma.be?', description: 'From the "Did you know …" series: leaflets come from SAMv2, the Belgian national database, or from pharma.be, and the descriptions in the API screen are extracted from them.' } },
  { id: 'content-dyk-languages', pillar: 'pillar-product', format: 'video', month: '2027-08', audiences: PHARMACISTS, title: 'Medipim Academy: VOS Switch, NO VOS en NO VOS NO SWITCH uitgelegd', description: 'Video over wat de drie aanduidingen betekenen en hoe je ze in de apotheek gebruikt. Het script moet nog geschreven worden.', en: { title: 'Medipim Academy: VOS Switch, NO VOS and NO VOS NO SWITCH explained', description: 'Video on what the three labels mean and how to use them in the pharmacy. The script still needs to be written.' } },
  { id: 'content-dyk-changes', pillar: 'pillar-product', format: 'post', month: '2027-09', audiences: INDUSTRY, title: 'Wist je dat … je kan zien wat er aan een product veranderd is?', description: 'Uit de reeks "Wist je dat …": wijzigingen aan productinformatie opvolgen.', en: { title: 'Did you know … you can see what changed on a product?', description: 'From the "Did you know …" series: keeping track of changes to product information.' } },
  { id: 'content-dyk-export', pillar: 'pillar-product', format: 'post', month: '2027-11', audiences: INDUSTRY, title: 'Wist je dat … je productdata naar je eigen systeem exporteert?', description: 'Uit de reeks "Wist je dat …": een selectie producten exporteren om verder te gebruiken.', en: { title: 'Did you know … you can export product data to your own system?', description: 'From the "Did you know …" series: exporting a selection of products to use further.' } },
  { id: 'content-sq-api-changes', pillar: 'pillar-product', format: 'post', month: '2027-05', audiences: INDUSTRY, title: 'Vraag van sales: kunnen we alleen gewijzigde producten ophalen via de API?', description: 'Uit de reeks "Een vraag die sales vaak krijgt", met een kort voorbeeld.', en: { title: 'A sales question: can we fetch only changed products through the API?', description: 'From the "A question sales often gets" series, with a short example.' } },
  { id: 'content-sq-update-frequency', pillar: 'pillar-product', format: 'video', month: '2027-06', audiences: EVERYONE, title: 'Vraag van sales: hoe blijft de productdata correct en up-to-date?', description: 'Uit de reeks "Een vraag die sales vaak krijgt", met de Academy-video over de feedbackknop: zie je een fout of ontbrekende info, dan meld je die rechtsbovenaan op de productfiche en volgt het contentteam ze op.', en: { title: 'A sales question: how does the product data stay correct and up to date?', description: 'From the "A question sales often gets" series, with the Academy video on the feedback button: if you spot an error or missing information, report it at the top right of the product sheet and the content team follows it up.' } },
  { id: 'content-sq-coverage', pillar: 'pillar-product', format: 'post', month: '2027-08', audiences: INDUSTRY, title: 'Vraag van sales: welke landen en talen dekt Medipim?', description: 'Uit de reeks "Een vraag die sales vaak krijgt": de markten waar we data voor hebben.', en: { title: 'A sales question: which countries and languages does Medipim cover?', description: 'From the "A question sales often gets" series: the markets we have data for.' } },
  { id: 'content-sq-webshop', pillar: 'pillar-product', format: 'video', month: '2027-10', audiences: ['apothekers', 'groothandels'], title: 'Vraag van sales: hoe structureer ik mijn webshop met Medipim?', description: 'Uit de reeks "Een vraag die sales vaak krijgt", met de Academy-video over gamma en categorie: de Medipim-categorie ordent je producten inhoudelijk, het gamma toont alle producten van een merk zoals Compeed.', en: { title: 'A sales question: how do I structure my webshop with Medipim?', description: 'From the "A question sales often gets" series, with the Academy video on range and category: the Medipim category organises your products by content, the range shows all products of a brand such as Compeed.' } },
  { id: 'content-sq-data-ownership', pillar: 'pillar-product', format: 'post', month: '2027-12', audiences: ['producenten'], title: 'Vraag van sales: wie beheert de data die we als fabrikant aanleveren?', description: 'Uit de reeks "Een vraag die sales vaak krijgt": wat er met aangeleverde productdata gebeurt.', en: { title: 'A sales question: who manages the data we supply as a manufacturer?', description: 'From the "A question sales often gets" series: what happens to supplied product data.' } },
  { id: 'content-mf-pack-size', pillar: 'pillar-data', format: 'post', month: '2027-07', audiences: EVERYONE, title: 'Als één veld ontbreekt: de verpakkingshoeveelheid', description: 'Uit de reeks "Wat loopt er mis als één veld ontbreekt?": wat een verkeerde verpakkingshoeveelheid kost bij bestellen.', en: { title: 'When one field is missing: the pack size', description: 'From the "What goes wrong when one field is missing?" series: what a wrong pack size costs when ordering.' } },
  { id: 'content-mf-barcode', pillar: 'pillar-data', format: 'post', month: '2027-09', audiences: EVERYONE, title: 'Als één veld ontbreekt: de barcode', description: 'Uit de reeks "Wat loopt er mis als één veld ontbreekt?": wat er gebeurt aan de kassa en in het magazijn.', en: { title: 'When one field is missing: the barcode', description: 'From the "What goes wrong when one field is missing?" series: what happens at the till and in the warehouse.' } },
  { id: 'content-mf-photo', pillar: 'pillar-data', format: 'video', month: '2027-11', audiences: PHARMACISTS, title: 'Medipim Academy: welke prijsinformatie vind je in Medipim?', description: 'Video over de prijsinformatie op een productfiche en het gebruik van de prijzentool. Het script moet nog geschreven worden.', en: { title: 'Medipim Academy: what price information do you find in Medipim?', description: 'Video on the price information on a product sheet and how to use the price tool. The script still needs to be written.' } },
  { id: 'content-cq-pharmacist', pillar: 'pillar-customers', format: 'case', month: '2027-05', audiences: PHARMACISTS, title: 'Een klant aan het woord: een apotheker over een onbeschikbaar geneesmiddel', description: 'Uit de reeks "Een klant aan het woord": een Belgische apotheker vertelt hoe die via beschikbaarheid en categorie in Medipim een alternatief vindt en de arts belt met een gerichte suggestie.', en: { title: 'A customer speaking: a pharmacist on an unavailable medicine', description: 'From the "A customer speaking" series: a Belgian pharmacist tells how availability and category in Medipim help find an alternative and call the doctor with a targeted suggestion.' } },
  { id: 'content-cq-wholesaler', pillar: 'pillar-customers', format: 'case', month: '2027-06', audiences: ['groothandels'], title: 'Een klant aan het woord: een groothandel', description: 'Uit de reeks "Een klant aan het woord": één probleem en één resultaat bij een groothandel.', en: { title: 'A customer speaking: a wholesaler', description: 'From the "A customer speaking" series: one problem and one result at a wholesaler.' } },
  { id: 'content-cq-manufacturer', pillar: 'pillar-customers', format: 'case', month: '2027-07', audiences: ['producenten'], title: 'Een klant aan het woord: een fabrikant', description: 'Uit de reeks "Een klant aan het woord": wat aanleveren via Medipim een fabrikant oplevert.', en: { title: 'A customer speaking: a manufacturer', description: 'From the "A customer speaking" series: what supplying through Medipim brings a manufacturer.' } },
  { id: 'content-cq-software', pillar: 'pillar-customers', format: 'case', month: '2027-08', audiences: INDUSTRY, title: 'Een klant aan het woord: een softwarepartner', description: 'Uit de reeks "Een klant aan het woord": hoe een softwarepartner Medipim-data in zijn pakket gebruikt.', en: { title: 'A customer speaking: a software partner', description: 'From the "A customer speaking" series: how a software partner uses Medipim data in its product.' } },
  { id: 'content-cq-france', pillar: 'pillar-customers', format: 'case', month: '2027-09', audiences: PHARMACISTS, title: 'Een klant aan het woord: een apotheek in Frankrijk', description: 'Uit de reeks "Een klant aan het woord", in het Frans voor de Franse markt.', en: { title: 'A customer speaking: a pharmacy in France', description: 'From the "A customer speaking" series, in French for the French market.' } },
  { id: 'content-cq-hospital', pillar: 'pillar-customers', format: 'case', month: '2027-11', audiences: ['ziekenhuizen'], title: 'Een klant aan het woord: een ziekenhuisapotheek', description: 'Uit de reeks "Een klant aan het woord": productdata in een ziekenhuisapotheek.', en: { title: 'A customer speaking: a hospital pharmacy', description: 'From the "A customer speaking" series: product data in a hospital pharmacy.' } },
  { id: 'content-cq-australia', pillar: 'pillar-customers', format: 'case', month: '2027-11', audiences: EVERYONE, title: 'Een klant aan het woord: een klant in Australië', description: 'Uit de reeks "Een klant aan het woord", in het Engels voor de Australische markt.', en: { title: 'A customer speaking: a customer in Australia', description: 'From the "A customer speaking" series, in English for the Australian market.' } },
  { id: 'content-cq-online', pillar: 'pillar-customers', format: 'case', month: '2027-12', audiences: PHARMACISTS, title: 'Een klant aan het woord: een online apotheek', description: 'Uit de reeks "Een klant aan het woord": volledige productfiches in een webshop.', en: { title: 'A customer speaking: an online pharmacy', description: 'From the "A customer speaking" series: complete product sheets in a webshop.' } },
  { id: 'content-autumn-fairs', pillar: 'pillar-sector', format: 'post', month: '2027-08', audiences: EVERYONE, title: 'Vooruitblik: de beurzen van dit najaar', description: 'Waar je ons in september en oktober vindt: Expopharm en The Pharmacy Show, met een uitnodiging om af te spreken.', en: { title: 'Preview: this autumn\'s trade fairs', description: 'Where to find us in September and October: Expopharm and The Pharmacy Show, with an invitation to meet.' } },
  { id: 'content-year-review', pillar: 'pillar-sector', format: 'post', month: '2027-12', audiences: EVERYONE, title: 'Ons jaar 2027 in beeld', description: 'Terugblik op de beurzen en conferenties van 2027 en wat we er hoorden.', en: { title: 'Our 2027 in pictures', description: 'Looking back on the trade fairs and conferences of 2027 and what we heard there.' } },
  { id: 'content-team-data', pillar: 'pillar-team', format: 'post', month: '2027-06', audiences: EVERYONE, title: 'Maak kennis met het team: iemand van het datateam', description: 'Uit de reeks "Maak kennis met het team": de collega die fiches controleert en verrijkt.', en: { title: 'Meet the team: someone from the data team', description: 'From the "Meet the team" series: the colleague who checks and enriches sheets.' } },
  { id: 'content-team-sales', pillar: 'pillar-team', format: 'post', month: '2027-07', audiences: EVERYONE, title: 'Maak kennis met het team: iemand van sales', description: 'Uit de reeks "Maak kennis met het team": het eerste aanspreekpunt voor nieuwe klanten.', en: { title: 'Meet the team: someone from sales', description: 'From the "Meet the team" series: the first point of contact for new customers.' } },
  { id: 'content-team-dev', pillar: 'pillar-team', format: 'post', month: '2027-10', audiences: EVERYONE, title: 'Maak kennis met het team: iemand van development', description: 'Uit de reeks "Maak kennis met het team": wie het platform bouwt.', en: { title: 'Meet the team: someone from development', description: 'From the "Meet the team" series: who builds the platform.' } },
  { id: 'content-team-support', pillar: 'pillar-team', format: 'post', month: '2027-12', audiences: EVERYONE, title: 'Maak kennis met het team: iemand van support', description: 'Uit de reeks "Maak kennis met het team": wie je vragen beantwoordt.', en: { title: 'Meet the team: someone from support', description: 'From the "Meet the team" series: who answers your questions.' } },

  // December 2026, after the UX launch, and the end of 2027
  { id: 'content-new-ux-highlights', pillar: 'pillar-product', format: 'post', month: '2026-12', audiences: PHARMACISTS, title: 'Drie dingen die je misschien nog niet zag in de nieuwe UX', description: 'Drie kleinere verbeteringen in het vernieuwde platform, elk met een schermafbeelding.', en: { title: 'Three things you may not have noticed in the new UX', description: 'Three smaller improvements in the redesigned platform, each with a screenshot.' } },
  { id: 'content-new-ux-question', pillar: 'pillar-product', format: 'post', month: '2026-12', audiences: PHARMACISTS, title: 'Vraag van sales: wat verandert er voor mij met de nieuwe UX?', description: 'Uit de reeks "Een vraag die sales vaak krijgt": wat hetzelfde blijft en wat sneller gaat.', en: { title: 'A sales question: what changes for me with the new UX?', description: 'From the "A question sales often gets" series: what stays the same and what gets faster.' } },
  { id: 'content-year-greeting', pillar: 'pillar-team', format: 'post', month: '2026-12', audiences: EVERYONE, title: 'Eindejaarsgroet van het team', description: 'Teamfoto met een bedankje aan klanten en partners voor 2026.', en: { title: 'Season\'s greetings from the team', description: 'Team photo with thanks to customers and partners for 2026.' } },
  { id: 'content-2026-numbers', pillar: 'pillar-data', format: 'infographic', month: '2026-12', audiences: EVERYONE, title: 'Ons jaar 2026 in cijfers', description: 'Hoeveel producten, fiches, foto\'s en landen er dit jaar bijkwamen op het platform.', en: { title: 'Our 2026 in numbers', description: 'How many products, sheets, photos and countries were added to the platform this year.' } },
  { id: 'content-2027-numbers', pillar: 'pillar-data', format: 'infographic', month: '2027-12', audiences: EVERYONE, title: 'Ons jaar 2027 in cijfers', description: 'Hoeveel producten, fiches, foto\'s en landen er dit jaar bijkwamen op het platform.', en: { title: 'Our 2027 in numbers', description: 'How many products, sheets, photos and countries were added to the platform this year.' } },
];

/** Pieces that close their month: they go to its last weeks, in this order. The GIRP article follows the conference of 19–20 May. */
export const MONTH_END_PIECES = ['content-girp-trends', 'content-year-greeting', 'content-2026-numbers', 'content-year-review', 'content-2027-numbers'];

const DECEMBER_FILL = ['content-new-ux-highlights', 'content-new-ux-question', 'content-year-greeting', 'content-2026-numbers', 'content-2027-numbers'];

/** The pieces for December 2026 and 2027, for data seeded before them. */
export function decemberFillUpdate(existing: ContentPiece[], pillars: ContentPillar[], now: string): ContentPiece[] {
  return missingPieces(DECEMBER_FILL, existing, pillars, now);
}

/** The single posts above that fill the weekly rhythm of 2027. */
const WEEKLY_FILL = PIECES.filter((p) => /^content-(dyk|sq|mf|cq|team)-|^content-(autumn-fairs|year-review)$/.test(p.id)).map((p) => p.id);

function missingPieces(ids: string[], existing: ContentPiece[], pillars: ContentPillar[], now: string): ContentPiece[] {
  const seed = new Map(buildSeedContent(now).map((p) => [p.id, p]));
  const has = new Set(existing.map((p) => p.id));
  return ids.flatMap((id) => {
    const piece = seed.get(id)!;
    return has.has(id) || !pillars.some((p) => p.id === piece.pillarId) ? [] : [piece];
  });
}

/** The single posts that fill the weekly rhythm of 2027, for data seeded before them. */
export function weeklyFillUpdate(existing: ContentPiece[], pillars: ContentPillar[], now: string): ContentPiece[] {
  return missingPieces(WEEKLY_FILL, existing, pillars, now);
}

/** Pieces added after the first content seed, for data seeded before them. */
const ADDED_LATER = ['content-did-you-know', 'content-sheet-closer-look', 'content-one-product-three-users', 'content-missing-field', 'content-sales-question', 'content-event-presence', 'content-event-takeaway', 'content-two-countries', 'content-ai-in-practice', 'content-ai-foundation', 'content-photography'];

/** Seed pieces whose text changed, with their earlier Dutch description: only pieces still carrying it are revised. */
const REVISED: Record<string, string> = {
  'content-customer-quotes': 'Reeks van vier LinkedIn-posts met telkens één citaat van een klant en een portretfoto.',
  'content-behind-scenes': 'Een dag bij het datateam: van aangeleverde fiche tot verrijkte productinformatie.',
  'content-meet-team': 'Maandelijkse post die één collega voorstelt: wat doe je, en waarom bij Medipim?',
};

/** Calendar theme of the Medipim Academy posts. */
export const ACADEMY_THEME = 'Medipim Academy';
/** The Academy starts in Dutch, for Flanders. */
export const ACADEMY_LANGUAGES = ['nl'];
export const ACADEMY_COUNTRIES = ['BE'];

/** Pieces that became Medipim Academy posts, with the Dutch title and description they had before. */
const ACADEMY_REPLACES: Record<string, { title: string; description: string }> = {
  'content-integrations': { title: 'Integraties met apotheeksoftware uitgelegd', description: 'Welke apotheeksoftware Medipim-data gebruikt en wat de apotheker daar concreet van merkt.' },
  'content-why-data': { title: 'Waarom correcte productdata telt voor de apotheek', description: 'Van foute bijsluiters tot gemiste verkoop: wat onvolledige productdata kost, en hoe het beter kan.' },
  'content-dyk-search-code': { title: 'Wist je dat … je een product vindt op zijn productcode?', description: 'Uit de reeks "Wist je dat …": zoeken op CNK of barcode, met een schermafbeelding.' },
  'content-cq-pharmacist': { title: 'Een klant aan het woord: een apotheker', description: 'Uit de reeks "Een klant aan het woord": één probleem dat een Belgische apotheek met Medipim oploste.' },
  'content-dyk-photos': { title: 'Wist je dat … je productfoto\'s rechtstreeks gebruikt?', description: 'Uit de reeks "Wist je dat …": packshots ophalen voor je webshop of apotheekscherm.' },
  'content-sq-update-frequency': { title: 'Vraag van sales: hoe vaak wordt de productdata bijgewerkt?', description: 'Uit de reeks "Een vraag die sales vaak krijgt": van aanlevering tot publicatie.' },
  'content-dyk-documents': { title: 'Wist je dat … de bijsluiter bij de productfiche zit?', description: 'Uit de reeks "Wist je dat …": bijsluiters en andere documenten terugvinden bij een product.' },
  'content-dyk-languages': { title: 'Wist je dat … één fiche in meerdere talen beschikbaar is?', description: 'Uit de reeks "Wist je dat …": dezelfde productinformatie in het Nederlands, Frans, Duits of Engels.' },
  'content-sq-webshop': { title: 'Vraag van sales: hoe koppel ik Medipim aan mijn webshop?', description: 'Uit de reeks "Een vraag die sales vaak krijgt": de stappen van een koppeling.' },
  'content-mf-photo': { title: 'Als één veld ontbreekt: een actuele foto', description: 'Uit de reeks "Wat loopt er mis als één veld ontbreekt?": een verouderde verpakking op het scherm.' },
};

/** The pieces published as Medipim Academy posts, spread over 2027. */
export const ACADEMY_CONTENT = Object.keys(ACADEMY_REPLACES);

const stillSeedText = (id: string | undefined, text: { title: string; description: string }) =>
  !!id && ACADEMY_REPLACES[id]?.title === text.title && ACADEMY_REPLACES[id]?.description === text.description;

/**
 * The Medipim Academy posts for data seeded before them. Each replaced piece and its calendar post take the
 * Academy text and theme and keep their date; only what still carries the earlier text changes.
 */
export function academyUpdate(data: { content: ContentPiece[]; items: Item[] }, now: string): { content: ContentPiece[]; items: Item[] } {
  const seed = new Map(buildSeedContent(now).map((p) => [p.id, p]));
  const content = data.content
    .filter((p) => stillSeedText(p.id, p))
    .map((p) => {
      const s = seed.get(p.id)!;
      return { ...p, title: s.title, description: s.description, format: s.format, audiences: s.audiences, translations: s.translations, updatedAt: now };
    });
  const items = data.items
    .filter((i) => i.type === 'social' && stillSeedText(i.contentId, i))
    .map((i): Item => {
      const s = seed.get(i.contentId!)!;
      const en = s.translations?.en;
      return {
        ...i,
        title: s.title,
        description: s.description,
        audiences: s.audiences,
        campaign: i.campaign || ACADEMY_THEME,
        translations: { en: { ...i.translations?.en, title: en?.title, description: en?.description, ...(!i.campaign && { campaign: ACADEMY_THEME }) } },
        updatedAt: now,
      };
    });
  return { content, items };
}

/** Language and country of the Academy posts, for data seeded before items had languages; filled only where still empty. */
export function academyLanguages(items: Item[], now: string): Item[] {
  return items
    .filter((i) => i.type === 'social' && ACADEMY_CONTENT.includes(i.contentId ?? '') && (!i.languages?.length || !i.countries.length))
    .map((i) => ({
      ...i,
      languages: i.languages?.length ? i.languages : ACADEMY_LANGUAGES,
      countries: i.countries.length ? i.countries : ACADEMY_COUNTRIES,
      updatedAt: now,
    }));
}

/** The team's content ideas for data seeded before them: new pieces, and untouched seed pieces revised. */
export function contentIdeasUpdate(existing: ContentPiece[], pillars: ContentPillar[], now: string): ContentPiece[] {
  const seed = new Map(buildSeedContent(now).map((p) => [p.id, p]));
  const added = missingPieces(ADDED_LATER, existing, pillars, now);
  const revised = existing.flatMap((p) => {
    const s = seed.get(p.id);
    if (!s || REVISED[p.id] !== p.description) return [];
    if (p.title === s.title && p.description === s.description && p.format === s.format && !!p.recurring === !!s.recurring) return [];
    return [{ ...p, title: s.title, description: s.description, format: s.format, recurring: s.recurring, audiences: s.audiences, translations: s.translations, updatedAt: now }];
  });
  return [...added, ...revised];
}

export function buildSeedContent(now: string): ContentPiece[] {
  return PIECES.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    pillarId: p.pillar,
    format: p.format,
    ...(p.recurring && { recurring: true }),
    status: p.status ?? 'idee',
    audiences: p.audiences,
    owner: p.owner ?? '',
    month: p.month,
    translations: { en: p.en },
    createdAt: now,
    updatedAt: now,
  }));
}
