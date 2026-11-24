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
  { id: 'content-customer-quotes', pillar: 'pillar-customers', format: 'post', month: '2027-03', audiences: EVERYONE, title: 'Klant aan het woord: reeks korte citaten', description: 'Reeks van vier LinkedIn-posts met telkens één citaat van een klant en een portretfoto.', en: { title: 'Customers speaking: series of short quotes', description: 'Series of four LinkedIn posts, each with one customer quote and a portrait photo.' } },
  { id: 'content-case-wholesaler', pillar: 'pillar-customers', format: 'case', month: '2027-04', audiences: ['groothandels'], title: 'Case groothandel: één bron voor productdata', description: 'Hoe een groothandel productdata centraliseert via Medipim en wat dat oplevert voor de klanten.', en: { title: 'Wholesaler case: one source for product data', description: 'How a wholesaler centralises product data through Medipim, and what it brings its customers.' } },

  // Industry & events
  { id: 'content-events-preview', pillar: 'pillar-sector', format: 'post', month: '2027-01', audiences: EVERYONE, title: 'Vooruitblik: hier vind je ons in 2027', description: 'Overzicht van de beurzen waar we als exposant staan, met een uitnodiging om af te spreken.', en: { title: 'Preview: where to find us in 2027', description: 'Overview of the trade fairs where we exhibit, with an invitation to meet.' } },
  { id: 'content-pharmagora', pillar: 'pillar-sector', format: 'post', month: '2027-03', audiences: PHARMACISTS, title: 'Kom langs op PharmagoraPlus', description: 'Uitnodiging in het Frans voor onze stand op PharmagoraPlus in Parijs.', en: { title: 'Visit us at PharmagoraPlus', description: 'Invitation in French to our stand at PharmagoraPlus in Paris.' } },
  { id: 'content-girp-trends', pillar: 'pillar-sector', format: 'artikel', month: '2027-05', audiences: ['groothandels'], title: 'Trends bij Europese groothandels na GIRP PharmaConnect', description: 'Onze belangrijkste lessen uit GIRP PharmaConnect in Sofia, als artikel op LinkedIn en de website.', en: { title: 'Trends among European wholesalers after GIRP PharmaConnect', description: 'Our key takeaways from GIRP PharmaConnect in Sofia, as an article on LinkedIn and the website.' } },
  { id: 'content-expopharm-recap', pillar: 'pillar-sector', format: 'video', month: '2027-10', audiences: PHARMACISTS, title: 'Recap Expopharm', description: 'Korte aftermovie van onze stand op Expopharm in Düsseldorf.', en: { title: 'Expopharm recap', description: 'Short aftermovie of our stand at Expopharm in Düsseldorf.' } },

  // Team & culture
  { id: 'content-meet-team', pillar: 'pillar-team', format: 'post', month: '2027-02', audiences: EVERYONE, title: 'Maak kennis met het team', description: 'Maandelijkse post die één collega voorstelt: wat doe je, en waarom bij Medipim?', en: { title: 'Meet the team', description: 'Monthly post introducing one colleague: what do you do, and why at Medipim?' } },
  { id: 'content-behind-scenes', pillar: 'pillar-team', format: 'video', month: '2027-03', audiences: EVERYONE, title: 'Achter de schermen: zo verrijken we productdata', description: 'Een dag bij het datateam: van aangeleverde fiche tot verrijkte productinformatie.', en: { title: 'Behind the scenes: how we enrich product data', description: 'A day with the data team: from a supplied product sheet to enriched product information.' } },
];

export function buildSeedContent(now: string): ContentPiece[] {
  return PIECES.map((p) => ({
    id: p.id,
    title: p.title,
    description: p.description,
    pillarId: p.pillar,
    format: p.format,
    status: p.status ?? 'idee',
    audiences: p.audiences,
    owner: p.owner ?? '',
    month: p.month,
    translations: { en: p.en },
    createdAt: now,
    updatedAt: now,
  }));
}
