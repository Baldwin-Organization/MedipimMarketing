# Medipim marketingkalender

Lokaal prototype van een marketing- en communicatieplanner voor Medipim: social posts,
e-mailings, calls en beurzen/conferenties in één kalender, met to do's die automatisch
naar voren schuiven als ze over datum zijn.

De interface is in het Nederlands en volgt het
[Medipim design system](https://github.com/Baldwin-Organization/medipim-design-system)
(tokens, kleuren, IBM Plex-typografie, Material Symbols Rounded 300).

## Functies

- **Kalender** per maand, week of als agenda, met kleuren per type en filters op type,
  kanaal, eigenaar, campagne, doelgroep, type product en land of markt.
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
- **Beurzen en conferenties** als tijdlijn, met een voorbereidingschecklist per event.
- **Lokale opslag** in IndexedDB, met JSON-export en -import en een knop om de
  startinhoud te herstellen. Donkere modus.

## Aan de slag

Vereist Node.js 20 of nieuwer.

```bash
npm install
npm run dev        # http://localhost:5173
```

Bij de eerste start vult de app zichzelf met de eventkalender 2027: 56 internationale
beurzen en congressen (november 2026 tot november 2027, plus CPHI Frankfurt), als idee,
zonder eigenaar en zonder to do's. Elk event is verrijkt met doelgroep, type product en
het land uit de locatie; de relevantie voor Medipim staat in de beschrijving. Events met een onbevestigde datum staan op een voorlopige dag en dragen
"(datum te bevestigen)" in de titel.

Het team: Nele, Maarten, Ioana en Kjell (`OWNERS` in `src/data/meta.ts`).

| Script | Doel |
|---|---|
| `npm run dev` | Ontwikkelserver |
| `npm run build` | Typecheck en productiebuild in `dist/` |
| `npm run typecheck` | Alleen TypeScript controleren |
| `npm test` | Unit tests (planningslogica, opslag) |

## Structuur

```
src/
  data/
    types.ts         Item, Todo, Dataset
    dimensions.ts    doelgroepen, producttypes, landen en bestaande/nieuwe markten
    schedule.ts      doorschuiven, urgentie, item verplaatsen met to do's
    templates.ts     standaard-to do's per type
    repository.ts    opslaginterface + IndexedDB-implementatie
    store.tsx        React-state bovenop de repository
    seed.ts          startinhoud: eventkalender 2027
  views/             Dashboard, Kalender, Beurzen, itemformulier
  components/        knoppen, chips, pills, kalenderitems (Medipim-stijl)
  styles/
    medipim-tokens.css  kopie van public/tokens uit het design system
    app.css             app-stijlen, uitsluitend via --mp-* tokens
```

### Naar een gedeelde database

Alle opslag loopt via de interface `Repository` in `src/data/repository.ts`. Voor een
gedeelde backend schrijf je een tweede implementatie (bv. `ApiRepository`) en geef je die
aan `<StoreProvider repository={...}>`. De rest van de app hoeft niet te veranderen.

### Design tokens bijwerken

`src/styles/medipim-tokens.css` is een kopie van `public/tokens/medipim-tokens.css` uit het
design system. Kopieer het bestand opnieuw na een tokenwijziging daar. Iconen in
`src/icons.generated.ts` komen uit `vendor/material-symbols/rounded/` van dezelfde repo.

Zie [CONTRIBUTING.md](CONTRIBUTING.md) voor de werkwijze met branches en PR's.
