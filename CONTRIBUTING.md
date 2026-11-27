# Bijdragen

## Branches

- `main` is altijd werkend en deploybaar. Er wordt niet rechtstreeks op gepusht.
- Werk op een feature branch vanaf `main`: `feat/<onderwerp>`, `fix/<onderwerp>` of
  `chore/<onderwerp>` (kleine letters, koppeltekens).
- Houd de geschiedenis lineair: rebase op `main` in plaats van `main` in je branch te mergen.

## Pull requests

1. Push je branch en open een PR naar `main`.
2. Beschrijf wat er verandert en waarom; voeg een screenshot toe bij zichtbare wijzigingen.
3. Controleer vóór je om review vraagt:
   ```bash
   npm run typecheck
   npm test
   npm run build
   ```
4. Minstens één review is nodig. De reviewer merget (squash), daarna wordt de branch verwijderd.

## Afspraken

- Interfacetekst staat nooit rechtstreeks in een scherm, maar in `src/i18n/nl.ts` en
  `src/i18n/en.ts` (lees via `t`). Opgeslagen waarden (kanalen, statussen, doelgroepen,
  standaard-to do's) blijven Nederlands; toon ze via de labelfuncties in `src/i18n/index.ts`.
- Inhoud (titel, beschrijving, locatie, thema, to do-titel) is tweetalig: de gewone velden zijn
  Nederlands, `translations.en` bevat het Engels. Toon ze altijd via `itemText`, `itemTitle` of
  `todoText`, nooit rechtstreeks.
- Stijlen gebruiken uitsluitend de Medipim design tokens (`--mp-*`): achtergronden
  `--mp-*-bg*`, tekst en iconen `--mp-*-content*`, randen `--mp-*-border*`. Geen losse
  kleur- of pixelwaarden voor spacing, radius of lettergrootte.
- Opslag loopt altijd via `src/data/repository.ts`, nooit rechtstreeks naar IndexedDB vanuit
  een scherm.
- Nieuwe planningslogica krijgt een unit test in `src/data/*.test.ts`.
