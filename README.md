# D&D Toolkit

A local-first Next.js app for running D&D 5e combat encounters with initiative tracking, hit points, effect timing, and encounter difficulty estimation.

## V1 Direction

- Single-browser local session (no account requirement)
- Frontend-first architecture
- Persistence in browser `localStorage`
- Import/export planned as the portability and backup mechanism
- Cloud persistence deferred to v2

## Tech stack

- Next.js 16+ (App Router)
- TypeScript
- PNPM
- Tailwind-style utility classes
- Local API routes for creature search and lookup

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

- `pnpm dev` — run the development server
- `pnpm build` — build the application for production
- `pnpm start` — run the production build locally
- `pnpm lint` — run ESLint
- `pnpm format` — run Prettier write
- `pnpm format:check` — check Prettier formatting
- `pnpm test` — execute unit tests for combat state, import/export validation, creature card view-model logic, and creature feature mapping
- `just test` — run test suite via Justfile

## Project structure

- `src/app/` — Next.js app pages and API routes
- `src/app/combat/` — combat screen, encounter logic, and UI components
- `src/services/` — creature API client and feature mapping
- `src/types/` — shared TypeScript types for creatures and combat state
- `public/` — static assets

## Combat features

- Tracks creature and player initiative order
- Manages hit points and active combatants
- Calculates encounter XP, adjusted XP, multiplier, and difficulty
- Supports legendary resources and feature-use tracking
- Supports round-based and turn-start-based effect timing
- Detects defense conflicts (resistance/immunity/vulnerability overlap by scope)
- Preserves panel scroll position while advancing turns rapidly

## API integration

This app uses the D&D 5e API via local API routes:

- `GET /api/creatures?q=...` — search creatures
- `GET /api/creatures/[index]` — fetch creature details

## Notes

- Creature data is normalized into a shared `Creature` type for combat logic
- The codebase uses `creature` terminology consistently instead of `monster`
- A custom `creatureFeatures` service maps D&D API abilities and actions into structured feature groups
- Spell labels are rendered in title case for display

## Production docs

- [Release V1 Checklist](./docs/release-v1.md)
- [Architecture V1](./docs/architecture-v1.md)
- [Data Format V1](./docs/data-format-v1.md)
- [Vercel Deploy Runbook](./docs/deploy-vercel.md)

## License

This project is unlicensed, unless otherwise specified.
