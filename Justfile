set shell := ["zsh", "-cu"]

lint:
  pnpm lint

format:
  pnpm format

format-check:
  pnpm format:check

test:
  node --test --experimental-strip-types src/app/combat/combatState.test.ts src/app/combat/importExport.test.ts src/app/combat/creatureCardViewModel.test.ts src/services/creatureFeatures.test.ts
