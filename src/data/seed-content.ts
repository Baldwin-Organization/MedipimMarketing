import type { Audience, Budget, BudgetLine, ContentFormat, ContentPiece, ContentPillar, ContentStatus } from './types';

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
  { id: 'content-integrations', pillar: 'pillar-product', format: 'artikel', month: '2027-01', audiences: PHARMACISTS, title: 'Integraties met apotheeksoftware uitgelegd', description: 'Welke apotheeksoftware Medipim-data gebruikt en wat de apotheker daar concreet van merkt.', en: { title: 'Integrations with pharmacy software explained', description: 'Which pharmacy software uses Medipim data, and what pharmacists notice in practice.' } },
  { id: 'content-product-update', pillar: 'pillar-product', format: 'nieuwsbrief', month: '2027-03', audiences: EVERYONE, title: 'Productupdate eerste kwartaal', description: 'Overzicht van wat er in het eerste kwartaal nieuw is op het platform.', en: { title: 'Product update first quarter', description: 'Overview of what is new on the platform in the first quarter.' } },

  // Data & expertise
  { id: 'content-why-data', pillar: 'pillar-data', format: 'artikel', month: '2027-01', audiences: ['apothekers', 'producenten'], title: 'Waarom correcte productdata telt voor de apotheek', description: 'Van foute bijsluiters tot gemiste verkoop: wat onvolledige productdata kost, en hoe het beter kan.', en: { title: 'Why correct product data matters to pharmacies', description: 'From wrong leaflets to missed sales: what incomplete product data costs, and how to do better.' } },
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
];

/** Pieces added after the first content seed, for data seeded before them. */
const ADDED_LATER = ['content-did-you-know', 'content-sheet-closer-look', 'content-one-product-three-users', 'content-missing-field', 'content-sales-question', 'content-event-presence', 'content-event-takeaway', 'content-two-countries', 'content-ai-in-practice', 'content-ai-foundation', 'content-photography'];

/** Seed pieces whose text changed, with their earlier Dutch description: only pieces still carrying it are revised. */
const REVISED: Record<string, string> = {
  'content-customer-quotes': 'Reeks van vier LinkedIn-posts met telkens één citaat van een klant en een portretfoto.',
  'content-behind-scenes': 'Een dag bij het datateam: van aangeleverde fiche tot verrijkte productinformatie.',
  'content-meet-team': 'Maandelijkse post die één collega voorstelt: wat doe je, en waarom bij Medipim?',
};

/** The team's content ideas for data seeded before them: new pieces, and untouched seed pieces revised. */
export function contentIdeasUpdate(existing: ContentPiece[], pillars: ContentPillar[], now: string): ContentPiece[] {
  const seed = new Map(buildSeedContent(now).map((p) => [p.id, p]));
  const has = new Set(existing.map((p) => p.id));
  const added = ADDED_LATER.flatMap((id) => {
    const piece = seed.get(id)!;
    return has.has(id) || !pillars.some((p) => p.id === piece.pillarId) ? [] : [piece];
  });
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
