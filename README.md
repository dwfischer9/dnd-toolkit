# D&D Toolkit

A lightweight Next.js toolkit for managing D&D combat encounters with creatures, initiative tracking, hit points, and encounter difficulty estimation.

## What it does

- Track creature and player initiative order
- Manage hit points and active combatants
- Display encounter XP, adjusted XP, multiplier, and difficulty thresholds
- Fetch creature data from the D&D 5e API and turn it into usable combat entries
- Add, remove, and update creatures in a combat encounter

## Tech stack

- Next.js 14+ (App Router)
- TypeScript
- PNPM
- Tailwind-style utility CSS with plain CSS modules
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
- `pnpm test` — execute unit tests for combat state and creature feature logic

## Project structure

- `src/app/` — Next.js app pages and API routes
- `src/app/combat/` — combat screen, encounter logic, and UI components
- `src/services/` — creature API client and feature mapping
- `src/types/` — shared TypeScript types for creatures and combat state
- `public/` — static assets

## Combat features

- Creates a combat encounter with players and creatures
- Rolls initiative for non-player creatures
- Calculates adjusted XP and encounter difficulty
- Keeps local encounter state in `localStorage`
- Supports creature feature and legendary action tracking

## API integration

This app uses the D&D 5e API via local API routes:

- `GET /api/creatures?q=...` — search creatures
- `GET /api/creatures/[index]` — fetch creature details

## Notes

- Creature data is normalized into a shared `Creature` type for combat logic
- The repo aims to use `creature` consistently instead of `monster` in UI and code
- A custom `creatureFeatures` service maps D&D API abilities and actions into structured feature groups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Run `pnpm install`
4. Make changes and verify with `pnpm test`
5. Open a pull request

## License

This project is unlicensed, unless otherwise specified.
