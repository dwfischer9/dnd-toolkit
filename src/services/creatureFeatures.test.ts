import assert from 'node:assert/strict';
import test from 'node:test';

import type { ApiCreature } from '../types/creature.ts';
import { CreatureSizes } from '../types/creature.ts';
import { buildCreatureFeatureGroups, parseSpellcastingDetails } from './creatureFeatures.ts';

const apiCreature: ApiCreature = {
  index: 'owlbear',
  name: 'Owlbear',
  size: CreatureSizes.Large,
  type: 'monstrosity',
  alignment: 'unaligned',
  armor_class: 13,
  hit_points: 59,
  speed: { walk: '40 ft.' },
  strength: 20,
  dexterity: 12,
  constitution: 17,
  intelligence: 3,
  wisdom: 12,
  charisma: 7,
  damage_vulnerabilities: [],
  damage_resistances: [],
  damage_immunities: [],
  condition_immunities: [],
  senses: { darkvision: '60 ft.', passive_perception: 13 },
  languages: '',
  challenge_rating: 3,
  proficiency_bonus: 2,
  xp: 700,
  special_abilities: [
    {
      name: 'Keen Sight and Smell',
      desc: 'The owlbear has advantage on Wisdom (Perception) checks that rely on sight or smell.',
      damage: [],
    },
  ],
  actions: [
    {
      name: 'Beak',
      desc: 'Melee Weapon Attack: +7 to hit, reach 5 ft., one creature. Hit: 10 (1d10 + 5) piercing damage.',
      attack_bonus: 7,
      damage: [
        {
          damage_type: { index: 'piercing', name: 'piercing', url: '/api/damage-types/piercing' },
          damage_dice: '1d10 + 5',
        },
      ],
    },
    {
      name: 'Spear',
      desc: 'Melee Weapon Attack: +3 to hit, reach 5 ft., one target. Hit: 4 (1d6 + 1) piercing damage, or 5 (1d8 + 1) piercing damage if used with two hands to make a melee attack.',
      attack_bonus: 3,
      damage: [
        {
          damage_type: { index: 'piercing', name: 'piercing', url: '/api/damage-types/piercing' },
          damage_dice: '1d6 + 1',
        },
      ],
    },
  ],
  legendary_actions: [],
  image: undefined,
  url: '/api/2014/monsters/owlbear',
  updated_at: '2026-01-01T00:00:00.000Z',
  forms: [],
  reactions: [],
};

test('buildCreatureFeatureGroups groups creature reference items for cards', () => {
  const groups = buildCreatureFeatureGroups(apiCreature);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].label, 'Traits');
  assert.equal(groups[1].label, 'Actions');
  assert.equal(groups[1].features[0].attackBonus, 7);
  assert.deepEqual(groups[1].features[0].damage, [{ type: 'piercing', dice: '1d10 + 5' }]);
  assert.deepEqual(groups[1].features[1].damage, [{ type: 'piercing', dice: '1d6 + 1' }]);
  assert.deepEqual(groups[1].features[1].versatileDamage, [
    { type: 'piercing', dice: '1d8 + 1', hands: 'two' },
  ]);
});

test('parseSpellcastingDetails extracts spellcasting ability, dc, and spells', () => {
  const details = parseSpellcastingDetails([
    {
      name: 'Spellcasting',
      desc: 'The lich is a 18th-level spellcaster. Its spellcasting ability is Intelligence (spell save DC 18, +10 to hit with spell attacks). It has the following wizard spells prepared:\nCantrips (at will): mage hand, prestidigitation, ray of frost\n1st level (4 slots): detect magic, magic missile, shield',
      damage: [],
    },
  ]);

  assert.equal(details.spellcastingAbility, 'intelligence');
  assert.equal(details.spellSaveDc, 18);
  assert.deepEqual(details.spells, [
    'mage hand',
    'prestidigitation',
    'ray of frost',
    'detect magic',
    'magic missile',
    'shield',
  ]);
});
