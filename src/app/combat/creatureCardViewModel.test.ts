import assert from 'node:assert/strict';
import test from 'node:test';
import type Creature from '../../types/creature.ts';
import { getCreatureAbilityRows } from './creatureCardViewModel.ts';

test('getCreatureAbilityRows returns check/save data with save fallback to ability mod', () => {
  const creature: Creature = {
    id: 'dragon',
    name: 'Adult Blue Dragon',
    ac: 19,
    maxHp: 225,
    currentHp: 225,
    initiative: 10,
    abilityScores: {
      strength: 23,
      dexterity: 10,
      constitution: 21,
      intelligence: 14,
      wisdom: 13,
      charisma: 17,
    },
    savingThrowBonuses: { dexterity: 7, constitution: 10, wisdom: 6, charisma: 9 },
  };

  const rows = getCreatureAbilityRows(creature);
  const str = rows.find((row) => row.abilityKey === 'strength');
  const dex = rows.find((row) => row.abilityKey === 'dexterity');

  assert.ok(str);
  assert.ok(dex);
  assert.equal(str?.modifier, 6);
  assert.equal(str?.saveBonus, 6);
  assert.equal(str?.saveIsProficient, false);
  assert.equal(dex?.saveBonus, 7);
  assert.equal(dex?.saveIsProficient, true);
});
