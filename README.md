# Medipim Marketing Machine

Lokaal prototype van een marketing- en communicatieplanner voor Medipim: social posts,
e-mailings, calls, beurzen/conferenties, betalende campagnes en PR in vakmedia in één
kalender, met budgetopvolging en to do's die automatisch naar voren schuiven als ze over
datum zijn.

De interface is tweetalig (Nederlands en Engels, te wisselen onderaan de zijbalk) en volgt het
[Medipim design system](https://github.com/Baldwin-Organization/medipim-design-system)
(tokens, kleuren, IBM Plex-typografie, Material Symbols Rounded 300).

## Functies

- **Kalender** als jaar- of kwartaaloverzicht (minikalender en items per maand), per maand,
  per week of als lijst met elke dag onder elkaar (per week gegroepeerd, lege dagen inbegrepen),
  met kleuren per type en filters op type,
  kanaal, eigenaar, thema, doelgroep, type product en land of markt.
- **Verrijking** van elk item met doelgroep (groothandels, producenten, apothekers,
  ziekenhuizen), type product (geneesmiddelen, medicinale cannabis, cosmetica, voeding &
  supplementen, baby) en landen. België, Frankrijk, Duitsland, VK, Luxemburg, Oostenrijk,
  Spanje, VS en Australië zijn bestaande markten (`EXISTING_MARKETS` in
  `src/data/dimensions.ts`); elk ander land is een nieuwe markt.
- **Drag-and-drop**: versleep items en to do's naar een andere dag. Verplaats je een item,
  dan schuiven de gekoppelde open to do's mee met dezelfde offset.
- **Naar voren schuiven**: open to do's die over datum zijn, staan op vandaag met een badge
  "x dagen te laat". De oorspronkelijke vervaldatum blijft bewaard.
- **Vandaag / Deze week**-paneel bovenaan de kalender, per urgentie (te laat, vandaag, deze week).
- **Dashboard** met wat eraan komt (14 dagen), wat te laat is en de komende beurzen.
- **Itemformulier** met to do's; nieuwe items krijgen standaard-to do's per type
  (bv. "Stand boeken" 8 weken voor een beurs, "Visual maken" 5 dagen voor een post).
  Een bestaand item zonder to do's kan die standaardlijst achteraf krijgen.
- **Beurzen en conferenties** als horizontaal scrollbare tijdlijn over alle komende maanden,
  met filters op deelname, land of markt, type product, doelgroep, soort, status en eigenaar,
  en een voorbereidingschecklist per event.
- **Deelname per event**, met kleurcode op de tijdlijn, de eventkaarten, het dashboard en in de
  kalender: we gaan als exposant (groen), als bezoeker (blauw), we gaan niet maar draaien wel
  campagnes (koraal), we gaan niet en doen niets (grijs), of nog te beslissen (gestippeld).
  De legende boven de tijdlijn telt per keuze en werkt ook als filter.
- **Campagnes**: betalende advertenties op LinkedIn Ads, Google Ads en ChatGPT Ads, met
  looptijd (start- en einddatum), budget en standaard-to do's (doel en KPI, visuals,
  targeting, tussentijdse evaluatie, rapportering). Gegroepeerd als lopend, komend en
  afgelopen, filterbaar per kanaal.
- **PR & vakmedia**: advertenties, advertorials, persberichten, interviews, vakartikels en
  opiniestukken, met het medium (titel) en de publicatiedatum, per maand gegroepeerd.
- **Content**: wat we willen delen, los van kanaal en datum. De contentmix bestaat uit
  pijlers met een streefaandeel (startvoorstel: product & platform 25%, data & expertise 25%,
  klanten & cases 20%, sector & events 20%, team & cultuur 10%), naast het aandeel dat gepland
  en gedeeld is, per jaar of over alles. Pijlers (naam, omschrijving, streefaandeel) pas je aan
  via "Pijlers bewerken". Elk contentstuk heeft een pijler, formaat (post, artikel, klantcase,
  video, infographic, whitepaper, webinar, nieuwsbrief), status (idee, in productie, klaar om te
  delen, gedeeld), geplande maand, doelgroep en eigenaar, en staat op een bord per status.
  "Inplannen in de kalender" maakt een post of mailing aan die naar het stuk verwijst; bij elk
  kalenderitem kun je ook zelf een contentstuk kiezen. Een stuk kan een terugkerende reeks
  zijn (bv. "Een vraag die sales vaak krijgt", één vraag per post); het telt als één stuk in de
  mix. De startinhoud bevat 28 ideeën, waaronder de ideeën van het team van november 2026.
- **Budget**: per jaar een budget per budgetpost (beurzen als exposant, beurzen als bezoeker,
  e-mailmarketing, LinkedIn, Google Ads, vakmedia en gezamenlijke campagnes, lidmaatschappen,
  ChatGPT Ads, reserve), tegenover het geplande en werkelijk bestede bedrag van de items (elk
  item heeft de velden "Gepland" en "Werkelijk besteed", excl. btw). Een item valt automatisch
  onder een post volgens soort, kanaal en deelname (`autoBudgetLine` in `src/data/budget.ts`);
  in het formulier kun je een andere post kiezen. Bedragen die onder geen post vallen, staan
  apart als "Niet toegewezen". Met opsplitsing per kwartaal, doelgroep en markt (bestaand of
  nieuw) en de grootste posten. Kosten tellen in het jaar en kwartaal van de startdatum. Het
  budget 2027 (€ 189.294) zit in de startinhoud.
- **Lokale opslag** in IndexedDB, met JSON-export en -import en een knop om de
  startinhoud te herstellen. Donkere modus.
- **Twee talen**: NL/EN-schakelaar onderaan de zijbalk; de keuze wordt in de browser
  onthouden. Alle interfacetekst, kanalen, statussen, doelgroepen, producttypes,
  standaard-to do's, landnamen, datums en bedragen volgen de taal. Ook de inhoud is
  tweetalig: elk item heeft een titel, beschrijving, locatie en thema in het Nederlands en
  het Engels (in het formulier: de velden bovenaan in de gekozen taal, de andere taal onder
  "Engelse versie" / "Dutch version"), en to do's bewerk je in de gekozen taal. Een leeg veld
  toont de tekst uit de andere taal. De volledige startinhoud is vertaald.

## Aan de slag

Vereist Node.js 20 of nieuwer.

```bash
npm install
npm run dev        # http://localhost:5173
```

Bij de eerste start vult de app zichzelf met de eventkalender 2027: 56 internationale
beurzen en congressen (november 2026 tot november 2027, plus CPHI Frankfurt), als idee,
zonder eigenaar en zonder to do's. Bij PharmagoraPlus, APP (Gold Coast), GIRP PharmaConnect
(Sofia), Expopharm en The Pharmacy Show (Birmingham) staat Medipim als exposant (status
gepland); de andere events zijn nog te beslissen. Een browser met oudere startinhoud krijgt die
vijf markeringen en de Engelse vertalingen eenmalig bij het opstarten (`SEED_UPDATES` in
`src/data/seed.ts`; de Engelse teksten staan in `src/data/seed-en.ts`). Elk event is verrijkt met doelgroep, type product en
het land uit de locatie; de relevantie voor Medipim staat in de beschrijving. Events met een onbevestigde datum staan op een voorlopige dag en dragen
"(datum te bevestigen)" in de titel.

Daarnaast bevat de startinhoud de communicatie rond de nieuwe UX van het Belgische platform
(thema "Nieuwe UX Belgisch platform"): de LinkedIn-post van Maarten van 23 november 2026,
een LinkedIn-post vanuit de Medipim-pagina op 25 november en een nieuwsbrief aan de
Belgische apothekers op 27 november om 9:00, met to do's. Die drie items verwijzen naar het
contentstuk "Lancering nieuwe UX Belgisch platform".

Het budget 2027, de vijf contentpijlers en de 28 contentideeën staan in
`src/data/seed-content.ts`. Een browser met oudere startinhoud krijgt ze eenmalig bij het
opstarten, enkel voor wat nog leeg is (het budget als er voor 2027 nog niets is ingevuld, de
pijlers en ideeën als er nog geen pijlers zijn). De ideeën van het team kwamen later en worden
apart toegevoegd; bestaande startideeën die erop lijken, worden enkel bijgewerkt als niemand ze
al aanpaste.

Social posts gaan enkel via LinkedIn; het kanaal is het account waarvandaan gepost wordt
(Medipim, Maarten (CEO), Medipim Australia, Medipim USA).

Het team: Nele, Maarten, Ioana en Kjell (`OWNERS` in `src/data/meta.ts`).

| Script | Doel |
|---|---|
| `npm run dev` | Ontwikkelserver |
| `npm run build` | Typecheck en productiebuild in `dist/` |
| `npm run typecheck` | Alleen TypeScript controleren |
| `npm test` | Unit tests (planningslogica, budget, opslag) |

## Structuur

```
src/
  data/
    types.ts         Item, Todo, Budget, ContentPillar, ContentPiece, Dataset
    dimensions.ts    doelgroepen, producttypes, landen en bestaande/nieuwe markten
    schedule.ts      doorschuiven, urgentie, item verplaatsen met to do's
    templates.ts     standaard-to do's per type
    budget.ts        budgetpost per item, totalen per post, kwartaal, doelgroep en markt
    content.ts       contentmix per pijler, periode, tellingen per formaat en doelgroep
    repository.ts    opslaginterface + IndexedDB-implementatie
    store.tsx        React-state bovenop de repository
    seed.ts          startinhoud: eventkalender 2027, eenmalige updates
    seed-content.ts  budget 2027, contentpijlers en contentideeën
  i18n/
    nl.ts            Nederlandse interfacetekst (bron, bepaalt de vorm van het woordenboek)
    en.ts            Engelse vertaling
    index.ts         huidige taal, t, labels voor kanalen, statussen en to do's
  views/             Dashboard, Kalender, Beurzen, Campagnes, PR, Content, Budget, formulieren
  components/        knoppen, chips, pills, kalenderitems (Medipim-stijl)
  styles/
    medipim-tokens.css  kopie van public/tokens uit het design system
    app.css             app-stijlen, uitsluitend via --mp-* tokens
```

### Online versie (Railway)

De app draait op Railway, project `medipim-marketingkalender`, service `web`:
<https://medipim-marketing.up.railway.app>. Railway bouwt met `npm run build` en
serveert `dist/` als statische site. Opnieuw deployen vanuit een lokale checkout:

```bash
railway link        # eenmalig: project medipim-marketingkalender, service web
railway up
```

De online versie vraagt een login (HTTP basic auth, ingesteld in `Caddyfile`). Gebruikersnaam
en wachtwoord staan niet in de code maar in de Railway-variabelen `BASIC_AUTH_USER` en
`BASIC_AUTH_HASH`. Het wachtwoord wijzigen:

```bash
railway variables --set "BASIC_AUTH_HASH=$(caddy hash-password --plaintext 'nieuw-wachtwoord')"
```

Railway deployt daarna opnieuw. Zonder die twee variabelen start de server niet.

Gegevens blijven ook online lokaal per browser; collega's zien elkaars wijzigingen
pas met een gedeelde database (zie hieronder).

### Naar een gedeelde database

Alle opslag loopt via de interface `Repository` in `src/data/repository.ts`. Voor een
gedeelde backend schrijf je een tweede implementatie (bv. `ApiRepository`) en geef je die
aan `<StoreProvider repository={...}>`. De rest van de app hoeft niet te veranderen.

### Design tokens bijwerken

`src/styles/medipim-tokens.css` is een kopie van `public/tokens/medipim-tokens.css` uit het
design system. Kopieer het bestand opnieuw na een tokenwijziging daar. Iconen in
`src/icons.generated.ts` komen uit `vendor/material-symbols/rounded/` van dezelfde repo.

Zie [CONTRIBUTING.md](CONTRIBUTING.md) voor de werkwijze met branches en PR's.
