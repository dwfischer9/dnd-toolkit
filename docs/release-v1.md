# Release V1 Checklist

This checklist is the ship gate for the local-first v1 release on Vercel.

## Build and Test

- [ ] `pnpm install` completes without errors
- [x] `pnpm lint` passes
- [x] `pnpm test` passes
- [ ] `pnpm build` passes

### Gate Status (2026-05-15)

1. `lint`: pass via local ESLint binary.
2. `test`: pass (`24/24`).
3. `build`: blocked in current sandbox by Turbopack process/port permission error (`Operation not permitted`).

## Core Runtime

- [ ] App loads and runs from a fresh browser profile
- [ ] Encounter state persists across reload via `localStorage`
- [ ] Rapid `Next Turn` clicking does not cause panel scroll jumps
- [ ] Round and turn transitions behave correctly at initiative boundaries

## Effects and Timing

- [ ] Round-based effects expire only at round transition
- [ ] Turn-start effects expire on selected anchor creature turn starts
- [ ] Removing anchor creature removes anchored effects
- [ ] Defense conflicts are surfaced clearly in UI

## Data Portability

- [ ] Export includes both encounter and creature library data
- [ ] Import restores both sections correctly
- [ ] Import/export round-trip reproduces state without data loss

## Local Persistence and Recovery

- [ ] App handles missing/corrupt saved encounter payload gracefully
- [ ] Recalculate Initiative recovery flow works after invalid boundary state
- [ ] Order Drift acknowledgement flow behaves as intended

## Production Deployment

- [ ] Vercel project configured and build command verified
- [ ] Environment variables documented (if any)
- [ ] Production URL smoke-tested on desktop and mobile

## Telemetry and Privacy

- [ ] Vercel Analytics integrated
- [ ] Error monitoring integrated (e.g. Sentry)
- [ ] Telemetry toggle exists in Settings and defaults to off
- [ ] Telemetry failure does not block core gameplay
