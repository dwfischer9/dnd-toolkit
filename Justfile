set shell := ["zsh", "-cu"]

lint:
  pnpm lint

format:
  pnpm format

format-check:
  pnpm format:check

typecheck:
  pnpm typecheck

build:
  pnpm build

everything:
  pnpm format
  pnpm lint
  pnpm typecheck
  pnpm build

test:
  node --test --experimental-strip-types src/app/combat/combatState.test.ts src/app/combat/importExport.test.ts src/app/combat/creatureCardViewModel.test.ts src/services/creatureFeatures.test.ts
