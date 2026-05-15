# Vercel Deployment Runbook

## Goal

Deploy the app as a frontend-only Next.js app with local-session persistence.

## Prerequisites

- Vercel account and project linked to this repository.
- Node and PNPM versions compatible with `package.json`.

## Steps

1. Install dependencies:
   - `pnpm install`
2. Validate production build locally:
   - `pnpm build`
3. Run tests:
   - `just test`
4. Optional formatting/linting gates:
   - `pnpm format:check`
   - `pnpm lint`
5. Push to the deployment branch connected to Vercel.

## Vercel Project Settings

- Framework Preset: `Next.js`
- Build Command: `pnpm build`
- Install Command: `pnpm install`
- Output Directory: default (Next.js)

## Runtime Notes

- No server-side database is required for v1.
- Encounter and library state persist in browser `localStorage`.
- Import/export JSON is the backup/transfer mechanism.

## Post-deploy Smoke Checks

1. Open combat screen.
2. Add creatures and advance turns.
3. Refresh page and confirm encounter persists.
4. Export data, clear encounter, import exported file, confirm restoration.
5. Validate temporary effects decrement and expire at expected round/turn boundaries.
