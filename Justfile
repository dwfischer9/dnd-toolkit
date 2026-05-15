set shell := ["zsh", "-cu"]

lint:
  ./node_modules/.bin/eslint .

format:
  ./node_modules/.bin/prettier --write .

format-check:
  ./node_modules/.bin/prettier --check .

typecheck:
  ./node_modules/.bin/tsc --noEmit

build:
  ./node_modules/.bin/next build --turbopack

everything:
  ./node_modules/.bin/prettier --write .
  ./node_modules/.bin/eslint .
  ./node_modules/.bin/tsc --noEmit
  ./node_modules/.bin/next build --turbopack

test:
  node --test --experimental-strip-types src/app/combat/combatState.test.ts src/app/combat/importExport.test.ts src/app/combat/creatureCardViewModel.test.ts src/services/creatureFeatures.test.ts
