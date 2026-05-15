import assert from 'node:assert/strict';
import test from 'node:test';

import type Creature from '../../types/creature.ts';
import { CreatureFeatureTypes, CreatureHands, CreatureRollKinds } from '../../types/creature.ts';
import {
  addCreatureToEncounter,
  applyTurnStartEffectUpdates,
  expireCreatureEffectsAtRoundBoundary,
  getDefenseConflicts,
  getCreatureSaveBonus,
  getNextTurnState,
  getPreviousTurnState,
  initializeFeatureState,
  initializeLegendaryActions,
  performCreatureFeature,
  pruneEffectsByRemovedAnchor,
  resetCreatureResources,
  removeCreatureFromEncounter,
  rollCreatureInitiative,
  sortCreatures,
} from './combatState.ts';

const creatures: Creature[] = [
  { id: 'a', name: 'Wizard', ac: 12, maxHp: 18, currentHp: 18, initiative: 12, isPlayer: true },
  { id: 'b', name: 'Goblin', ac: 13, maxHp: 7, currentHp: 7, initiative: 15 },
  { id: 'c', name: 'Bandit', ac: 12, maxHp: 11, currentHp: 11, initiative: 15 },
];

test('sortCreatures orders by initiative then name', () => {
  const sorted = sortCreatures(creatures);

  assert.deepEqual(
    sorted.map((creature) => creature.id),
    ['c', 'b', 'a'],
  );
});

test('rollCreatureInitiative only rerolls non-player creatures', () => {
  const rolled = rollCreatureInitiative(creatures, () => 8);

  assert.equal(rolled.find((creature) => creature.id === 'a')?.initiative, 12);
  assert.equal(rolled.find((creature) => creature.id === 'b')?.initiative, 8);
  assert.equal(rolled.find((creature) => creature.id === 'c')?.initiative, 8);
});

test('getCreatureSaveBonus uses proficient value when present', () => {
  const creature: Creature = {
    id: 'dragon',
    name: 'Dragon',
    ac: 19,
    maxHp: 200,
    currentHp: 200,
    initiative: 10,
    abilityScores: {
      strength: 23,
      dexterity: 14,
      constitution: 21,
      intelligence: 16,
      wisdom: 15,
      charisma: 19,
    },
    savingThrowBonuses: { strength: 13 },
  };

  const save = getCreatureSaveBonus(creature, 'strength');
  assert.equal(save.bonus, 13);
  assert.equal(save.isProficient, true);
});

test('getCreatureSaveBonus falls back to ability modifier when not proficient', () => {
  const creature: Creature = {
    id: 'dragon',
    name: 'Dragon',
    ac: 19,
    maxHp: 200,
    currentHp: 200,
    initiative: 10,
    abilityScores: {
      strength: 23,
      dexterity: 14,
      constitution: 21,
      intelligence: 16,
      wisdom: 15,
      charisma: 19,
    },
    savingThrowBonuses: { dexterity: 7, constitution: 10, wisdom: 6, charisma: 9 },
  };

  const strengthSave = getCreatureSaveBonus(creature, 'strength');
  const intelligenceSave = getCreatureSaveBonus(creature, 'intelligence');
  assert.equal(strengthSave.bonus, 6);
  assert.equal(strengthSave.isProficient, false);
  assert.equal(intelligenceSave.bonus, 3);
  assert.equal(intelligenceSave.isProficient, false);
});

test('getNextTurnState wraps and increments round', () => {
  const state = getNextTurnState(creatures, 'a', 2);

  assert.equal(state.activeCreatureId, 'c');
  assert.equal(state.round, 3);
});

test('getPreviousTurnState wraps and clamps round at one', () => {
  const state = getPreviousTurnState(creatures, 'c', 1);

  assert.equal(state.activeCreatureId, 'a');
  assert.equal(state.round, 1);
});

test('addCreatureToEncounter assigns id and initiative when missing', () => {
  const nextCreatures = addCreatureToEncounter(
    [],
    { id: '', name: 'Ogre', ac: 11, maxHp: 59, currentHp: 59, initiative: 0 },
    { idFactory: () => 'ogre-1', roller: () => 17 },
  );

  assert.deepEqual(nextCreatures, [
    {
      id: 'ogre-1',
      name: 'Ogre',
      ac: 11,
      maxHp: 59,
      currentHp: 59,
      initiative: 17,
      featureState: {},
      legendaryActions: null,
      lastActionResult: null,
      origin: 'user',
    },
  ]);
});

test('addCreatureToEncounter leaves player initiative at zero until set manually', () => {
  const nextCreatures = addCreatureToEncounter(
    [],
    {
      id: '',
      name: 'Wizard',
      ac: 12,
      maxHp: 18,
      currentHp: 18,
      initiative: 0,
      isPlayer: true,
    },
    { idFactory: () => 'wizard-1', roller: () => 19 },
  );

  assert.equal(nextCreatures[0]?.initiative, 0);
});

test('addCreatureToEncounter mints id when conflicting with encounter', () => {
  const nextCreatures = addCreatureToEncounter(
    [{ id: 'gnoll', name: 'Gnoll', ac: 15, maxHp: 22, currentHp: 22, initiative: 10 }],
    { id: 'gnoll', name: 'Gnoll', ac: 15, maxHp: 22, currentHp: 22, initiative: 0 },
    { idFactory: () => 'gnoll-2', roller: () => 3 },
  );

  assert.equal(nextCreatures[0]?.id, 'gnoll');
  assert.equal(nextCreatures[1]?.id, 'gnoll-2');
  assert.equal(nextCreatures[1]?.initiative, 3);
});

test('removeCreatureFromEncounter advances active creature when needed', () => {
  const state = removeCreatureFromEncounter(creatures, 'c', 'c');

  assert.equal(state.activeCreatureId, 'b');
  assert.equal(state.roundReset, false);
  assert.deepEqual(
    state.creatures.map((creature) => creature.id),
    ['a', 'b'],
  );
});

test('performCreatureFeature rolls and decrements tracked resources', () => {
  const creatureWithFeatures: Creature = {
    id: 'm1',
    name: 'Dragon',
    ac: 18,
    maxHp: 200,
    currentHp: 200,
    initiative: 10,
    featureGroups: [
      {
        type: CreatureFeatureTypes.Legendary,
        label: 'Legendary Actions',
        features: [
          {
            id: 'tail-attack',
            name: 'Tail Attack',
            type: CreatureFeatureTypes.Legendary,
            description: 'Attack with tail.',
            attackBonus: 8,
            damage: [{ type: 'bludgeoning', dice: '2d6+4' }],
            usage: { type: 'per day', times: 2 },
          },
        ],
      },
    ],
    featureState: {
      'tail-attack': { uses: { current: 2, maximum: 2, label: 'per day' } },
    },
    legendaryActions: { current: 3, maximum: 3, label: 'Legendary Actions' },
  };

  const updated = performCreatureFeature(
    creatureWithFeatures,
    creatureWithFeatures.featureGroups![0].features[0],
    () => 4,
  );

  assert.equal(updated.featureState?.['tail-attack'].uses?.current, 1);
  assert.equal(updated.legendaryActions?.current, 2);
  assert.match(updated.lastActionResult?.summary ?? '', /\+8 to hit/);
  assert.deepEqual(updated.lastActionResult?.rolls, [
    { label: 'To hit', value: 12, detail: 'd20 4 + 8', kind: CreatureRollKinds.Attack },
    { label: 'bludgeoning', value: 12, detail: '2d6+4', kind: CreatureRollKinds.Damage },
  ]);
});

test('performCreatureFeature rolls versatile two-handed damage when requested', () => {
  const versatileCreature: Creature = {
    id: 'p1',
    name: 'Scout',
    ac: 12,
    maxHp: 14,
    currentHp: 14,
    initiative: 5,
    featureGroups: [
      {
        type: CreatureFeatureTypes.Action,
        label: 'Actions',
        features: [
          {
            id: 'warhammer',
            name: 'Warhammer',
            type: CreatureFeatureTypes.Action,
            description: '+4 to hit, versatile.',
            attackBonus: 4,
            damage: [{ type: 'bludgeoning', dice: '1d8 + 2' }],
            versatileDamage: [{ type: 'bludgeoning', dice: '1d10 + 2', hands: CreatureHands.Two }],
          },
        ],
      },
    ],
    featureState: {},
    legendaryActions: null,
    lastActionResult: null,
  };

  const weapon = versatileCreature.featureGroups![0].features[0];
  let d20Outcome = 0;
  let damageDie = 0;
  const scriptedRoller = () => {
    if (d20Outcome === 0) {
      d20Outcome = 3;
      return 3;
    }
    damageDie = 10;
    return damageDie;
  };

  const updated = performCreatureFeature(versatileCreature, weapon, scriptedRoller, {
    versatileGrip: CreatureHands.Two,
  });

  assert.equal(updated.lastActionResult?.featureName, 'Warhammer (two-handed)');
  assert.deepEqual(updated.lastActionResult?.rolls, [
    { label: 'To hit', value: 7, detail: 'd20 3 + 4', kind: CreatureRollKinds.Attack },
    { label: 'bludgeoning (2H)', value: 12, detail: '1d10+2', kind: CreatureRollKinds.Damage },
  ]);
});

test('resetCreatureResources restores feature and legendary resources', () => {
  const creature: Creature = {
    id: 'm2',
    name: 'Mage',
    ac: 12,
    maxHp: 40,
    currentHp: 40,
    initiative: 8,
    featureState: {
      spell: { uses: { current: 0, maximum: 3, label: 'per day' } },
    },
    legendaryActions: { current: 1, maximum: 3, label: 'Legendary Actions' },
  };

  const updated = resetCreatureResources(creature);

  assert.equal(updated.featureState?.spell.uses?.current, 3);
  assert.equal(updated.legendaryActions?.current, 3);
});

test('initializeFeatureState and initializeLegendaryActions derive default tracking', () => {
  const creature: Creature = {
    id: 'm3',
    name: 'Lich',
    ac: 17,
    maxHp: 135,
    currentHp: 135,
    initiative: 14,
    featureGroups: [
      {
        type: CreatureFeatureTypes.Action,
        label: 'Actions',
        features: [
          {
            id: 'paralyzing-touch',
            name: 'Paralyzing Touch',
            type: CreatureFeatureTypes.Action,
            description: 'Touch attack.',
            usage: { type: 'per day', times: 3 },
          },
        ],
      },
      {
        type: CreatureFeatureTypes.Legendary,
        label: 'Legendary Actions',
        features: [
          {
            id: 'disrupt-life',
            name: 'Disrupt Life',
            type: CreatureFeatureTypes.Legendary,
            description: 'Necrotic pulse.',
          },
        ],
      },
    ],
  };

  const featureState = initializeFeatureState(creature);
  const legendaryActions = initializeLegendaryActions(creature);

  assert.equal(featureState['paralyzing-touch'].uses?.current, 3);
  assert.equal(legendaryActions?.current, 3);
});

test('expireCreatureEffectsAtRoundBoundary expires encounter effects at boundary only', () => {
  const creature: Creature = {
    id: 'm4',
    name: 'Warlock',
    ac: 13,
    maxHp: 30,
    currentHp: 30,
    initiative: 9,
    effects: [
      {
        id: 'baseline:resistance:fire',
        label: 'resistance (fire)',
        category: 'resistance',
        scope: 'fire',
        source: 'baseline',
      },
      {
        id: 'encounter:1',
        label: 'vulnerability (cold)',
        category: 'vulnerability',
        scope: 'cold',
        source: 'encounter',
        durationRounds: 2,
        anchorRound: 3,
      },
    ],
  };

  const preExpiry = expireCreatureEffectsAtRoundBoundary(creature, 4);
  assert.equal(preExpiry.effects?.length, 2);

  const expired = expireCreatureEffectsAtRoundBoundary(creature, 5);
  assert.deepEqual(
    expired.effects?.map((effect) => effect.id),
    ['baseline:resistance:fire'],
  );
});

test('getDefenseConflicts returns scopes with incompatible categories', () => {
  const conflicts = getDefenseConflicts([
    {
      id: 'e1',
      label: 'resistance (fire)',
      category: 'resistance',
      scope: 'fire',
      source: 'baseline',
    },
    {
      id: 'e2',
      label: 'vulnerability (fire)',
      category: 'vulnerability',
      scope: 'fire',
      source: 'encounter',
    },
    {
      id: 'e3',
      label: 'immunity (poison)',
      category: 'immunity',
      scope: 'poison',
      source: 'baseline',
    },
  ]);

  assert.equal(conflicts.length, 1);
  assert.equal(conflicts[0].scope, 'fire');
  assert.deepEqual(new Set(conflicts[0].categories), new Set(['resistance', 'vulnerability']));
});

test('applyTurnStartEffectUpdates increments and expires turn-start effects on anchor turn', () => {
  const updated = applyTurnStartEffectUpdates(
    [
      {
        id: 'a',
        name: 'Caster',
        ac: 12,
        maxHp: 20,
        currentHp: 20,
        initiative: 10,
        effects: [
          {
            id: 'turn-1',
            label: 'resistance (all damage types)',
            category: 'resistance',
            scope: 'all damage types',
            source: 'encounter',
            timing: 'turn_start',
            anchorCreatureId: 'anchor',
            durationRounds: 2,
            elapsedTurnStarts: 1,
          },
        ],
      },
    ],
    'anchor',
  );

  assert.equal(updated[0].effects?.length, 0);
});

test('pruneEffectsByRemovedAnchor removes anchored effects when anchor creature is deleted', () => {
  const pruned = pruneEffectsByRemovedAnchor(
    [
      {
        id: 'owner',
        name: 'Owner',
        ac: 12,
        maxHp: 20,
        currentHp: 20,
        initiative: 8,
        effects: [
          {
            id: 'keep',
            label: 'immunity (poison)',
            category: 'immunity',
            scope: 'poison',
            source: 'baseline',
          },
          {
            id: 'remove',
            label: 'vulnerability (fire)',
            category: 'vulnerability',
            scope: 'fire',
            source: 'encounter',
            timing: 'turn_start',
            anchorCreatureId: 'deleted-anchor',
            durationRounds: 3,
            elapsedTurnStarts: 0,
          },
        ],
      },
    ],
    'deleted-anchor',
  );

  assert.equal(pruned.removedCount, 1);
  assert.deepEqual(
    pruned.creatures[0].effects?.map((effect) => effect.id),
    ['keep'],
  );
});
