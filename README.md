# ItsAllFunAndGames

ItsAllFunAndGames is a statically exported Next.js catalogue that helps facilitators discover the right activity for any group through rich filtering, detailed game write-ups, and data health tooling, all wrapped in a responsive, theme-aware UI.

## Features
- **Faceted game discovery.** Combine fuzzy search with multi-select filters for categories, prep level, skills, and more, with pagination and URL-synchronised state so sessions are easy to share.
- **Rich detail pages.** Every game is statically generated with guidance on age ranges, player counts, rules, equipment, and variations for quick facilitation reference.
- **Data quality diagnostics.** A dedicated dashboard audits the source dataset for duplicates, validation errors, and coverage gaps to guide content maintenance.
- **Offline-ready PWA.** The app ships a service worker, offline fallback page, and cached dataset so facilitators can still browse during poor connectivity.
- **Adaptive theming.** A global theme provider and header toggle let visitors switch between light and dark palettes backed by shadcn-inspired design tokens.

## Technology stack
- **Framework:** Next.js App Router with React 19, TypeScript, and Turbopack-enabled dev/build scripts, exported as a fully static site under the `/Itsallfunandgames` base path.
- **Styling & UI:** Tailwind CSS with `tailwindcss-animate`, shadcn/ui-inspired primitives, Lucide icons, and Sonner toasts for consistent, expressive components.
- **Data validation:** Games are parsed from `public/games.json`, normalised, and checked with a Zod schema before being exposed to the UI layer.

## Data workflow
1. **Source file:** Update or add activities in `public/games.json`. Records missing an explicit `id` will derive one from the game name during import.
2. **Normalisation:** `lib/loadGames.ts` trims whitespace, swaps inverted ranges, removes duplicate IDs, and validates each entry with `GameSchema` so only clean records reach the catalogue.
3. **Diagnostics:** Visit `/data/quality` locally to inspect which records were excluded, resolve duplicates, and identify fields that need better coverage.

## Getting started
1. Install dependencies: `npm install`.
2. Start the development server: `npm run dev`.
3. Open [http://localhost:3000/Itsallfunandgames/](http://localhost:3000/Itsallfunandgames/) to browse the catalogue with the configured base path.

The dataset is loaded at build time, so restart the dev server after editing `games.json` to see fresh records.

## Useful scripts
| Command | Description |
| --- | --- |
| `npm run dev` | Start the Turbopack-powered development server with live reload. |
| `npm run lint` | Run ESLint across the project using the shared Next.js configuration. |
| `npm run build:prod` | Generate PWA icons then produce the static export in `out/` for deployment. |
| `npm run start` | Serve the production build locally (after `npm run build`). |

## Testing
- **Unit tests:** Run `npx vitest` to execute data normalisation tests and extend coverage as new helpers are added.
- **End-to-end tests:** With the dev server running, execute `npx playwright test` to verify critical user flows such as loading, filtering, and diagnostics navigation.

## Production build & deployment
Running `npm run build:prod` creates a static export that honours the `/Itsallfunandgames` base path and includes the PWA manifest and service worker. Serve the contents of `out/` (for example via GitHub Pages or any static host) to deploy.

## Updating icons & manifest
If you add a new logo source asset, regenerate the icon set and manifest metadata with `npm run gen:icons` before rebuilding for production.
