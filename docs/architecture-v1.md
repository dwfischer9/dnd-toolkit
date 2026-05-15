# Architecture V1

## Summary

V1 is a local-first frontend application deployed on Vercel with no required backend persistence.

## Scope

- Single-browser local session
- Client-side encounter runtime state
- Browser `localStorage` persistence
- External creature reference data via D&D 5e API proxy routes

## Runtime Model

- UI: Next.js App Router + React client components
- Domain logic: pure helpers in combat state/services
- Persistence: browser storage (`localStorage`)
- Network: read-only creature search/detail API routes

## Data Ownership

- Encounter state: browser-local
- Creature library/custom templates: browser-local
- No server-side authoritative state in v1

## Why No Backend In V1

- Fastest path to shipping usable production app
- Lower operational complexity and cost
- Domain and UX can stabilize before committing to cloud data model

## V2 Backend Trigger Conditions

Introduce backend persistence when one or more become required:

- Cross-device continuity for a single user
- Durable cloud backup/restore
- Shared encounters / collaboration
- Centralized user identity and account management
- Audit/version history requirements

## V2 First Backend Slice (Recommended)

- Single-user private cloud sync first
- Keep encounter model compatible with existing local export/import shape
- Add auth only as needed for private data ownership

## Non-goals In V1

- Multi-user realtime collaboration
- Shared campaign state
- Server-side initiative authority
- Complex permission models
