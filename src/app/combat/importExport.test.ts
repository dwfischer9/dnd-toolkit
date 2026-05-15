import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createExportPayload,
  toImportedCreatures,
  toValidRound,
  validateImportPayload,
} from './importExport.ts';

test('validateImportPayload accepts valid v1 payload', () => {
  const payload = {
    version: '1',
    exportedAt: '2026-05-15T00:00:00.000Z',
    app: 'dnd-toolkit',
    encounter: {
      activeCreatureId: 'c1',
      round: 2,
      creatures: [],
    },
    library: {
      creatures: [],
    },
  };

  assert.equal(validateImportPayload(payload), true);
});

test('validateImportPayload rejects malformed payloads', () => {
  assert.equal(validateImportPayload(null), false);
  assert.equal(validateImportPayload({}), false);
  assert.equal(
    validateImportPayload({
      version: '2',
      exportedAt: '2026-05-15T00:00:00.000Z',
      app: 'dnd-toolkit',
      encounter: { activeCreatureId: 'c1', round: 1, creatures: [] },
      library: { creatures: [] },
    }),
    false,
  );
  assert.equal(
    validateImportPayload({
      version: '1',
      exportedAt: '2026-05-15T00:00:00.000Z',
      app: 'dnd-toolkit',
      encounter: { activeCreatureId: 10, round: 1, creatures: [] },
      library: { creatures: [] },
    }),
    false,
  );
});

test('import/export helpers support round-trip replacement flow', () => {
  const payload = createExportPayload({
    activeCreatureId: 'c1',
    round: 3,
    creatures: [{ id: 'c1', name: 'Goblin', ac: 13, maxHp: 7, currentHp: 7, initiative: 14 }],
    libraryCreatures: [
      { id: 'l1', name: 'Lich', ac: 17, maxHp: 135, currentHp: 135, initiative: 0 },
    ],
    exportedAt: '2026-05-15T00:00:00.000Z',
  });

  assert.equal(validateImportPayload(payload), true);
  assert.equal(toValidRound(payload.encounter.round), 3);
  assert.equal(toValidRound('0'), 1);
  assert.equal(toValidRound(undefined), 1);

  const importedEncounter = toImportedCreatures(payload.encounter.creatures);
  const importedLibrary = toImportedCreatures(payload.library.creatures);
  assert.equal(importedEncounter[0]?.origin, 'imported');
  assert.equal(importedLibrary[0]?.origin, 'imported');
});
