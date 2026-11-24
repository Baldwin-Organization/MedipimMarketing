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

- Interfacetekst is Nederlands.
- Stijlen gebruiken uitsluitend de Medipim design tokens (`--mp-*`): achtergronden
  `--mp-*-bg*`, tekst en iconen `--mp-*-content*`, randen `--mp-*-border*`. Geen losse
  kleur- of pixelwaarden voor spacing, radius of lettergrootte.
- Opslag loopt altijd via `src/data/repository.ts`, nooit rechtstreeks naar IndexedDB vanuit
  een scherm.
- Nieuwe planningslogica krijgt een unit test in `src/data/*.test.ts`.
