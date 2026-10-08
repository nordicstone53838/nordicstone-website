# nordicstone.dk

Hjemmesiden for Nordic Stone, bygget med [Astro](https://astro.build). Hostes på Vercel:
hver ændring på `main` lægges automatisk online.

## Sådan rettes siden

Ændringer laves af TVG Invest (GitHub: `tvg-invest`, inviteret som collaborator) og
pushes til `main`. Vercel lægger dem automatisk online. Går noget galt, kan en tidligere
version gendannes i Vercel under Deployments -> Instant Rollback.

## Vigtige filer

| Fil | Indhold |
| --- | --- |
| `src/pages/` | Siderne (forside, privat, erhverv, sortiment, om os, kontakt) |
| `src/layouts/Base.astro` | Topmenu, footer og fælles telefon/mail |
| `src/content/` | Sortimentet (produkterne) |
| `src/assets/billeder/` | Billeder |
| `src/styles/global.css` | Farver og layout |
| `src/config.ts` | Modtager-mail og Web3Forms-nøgle til formularerne |
| `lead-mail-script.gs` | Google Sheets-script der mailer nye Facebook-leads (kører ikke på hjemmesiden) |

## Kontaktformularer

De 3 formularer (kontakt, privat, erhverv) sendes via [Web3Forms](https://web3forms.com)
til `hje@nordicstone.dk`. Nøglen står i `src/config.ts`. Er den ikke sat, åbner formularerne
i stedet den besøgendes mailprogram.

## Lokalt (for udviklere)

```sh
npm install
npm run dev     # http://localhost:4321
npm run build   # bygger til ./dist
```
