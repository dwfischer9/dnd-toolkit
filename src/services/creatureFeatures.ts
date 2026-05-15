import { CreatureFeatureTypes, CreatureHands } from '../types/creature.ts';
import type {
  Action,
  ApiCreature,
  AbilityKey,
  CreatureFeature,
  CreatureFeatureGroup,
  CreatureFeatureType,
  LegendaryAction,
  SpecialAbility,
  CreatureFeatureUsage,
  CreatureFeatureSavingThrow,
} from '../types/creature.ts';

export interface SpellcastingDetails {
  spellcastingAbility?: AbilityKey | null;
  spellSaveDc?: number;
  spells: string[];
}

const buildFeatureId = (creatureIndex: string, type: CreatureFeatureType, name: string) =>
  `${creatureIndex}:${type}:${name.toLowerCase().replace(/\s+/g, '-')}`;

const mapDamage = (
  damage: Array<{
    damage_type?: {
      name?: string;
    } | null;
    damage_dice?: string | null;
  }> = [],
) =>
  damage
    .map((entry) => {
      const damageType = entry.damage_type?.name?.trim();
      const damageDice = entry.damage_dice?.trim();

      if (!damageType || !damageDice) {
        return null;
      }

      return {
        type: damageType,
        dice: damageDice,
      };
    })
    .filter((entry): entry is { type: string; dice: string } => entry !== null);

const parseDescriptionDamage = (description: string) => {
  const firstHitMatch = description.match(/Hit:\s*\d+\s*\(([^)]+)\)\s*([a-zA-Z ]+?)\s*damage/i);

  if (!firstHitMatch) {
    return { damage: [], versatileDamage: [] };
  }

  const baseDice = firstHitMatch[1].trim();
  const baseType = firstHitMatch[2].trim();
  const damage = [{ type: baseType, dice: baseDice }];

  const versatileMatch = description.match(
    /or\s*\d+\s*\(([^)]+)\)\s*([a-zA-Z ]+?)\s*damage\s*if\s*used\s*with\s*two\s*hands/i,
  );

  const versatileDamage = versatileMatch
    ? [
        {
          type: versatileMatch[2].trim(),
          dice: versatileMatch[1].trim(),
          hands: CreatureHands.Two,
        },
      ]
    : [];

  return { damage, versatileDamage };
};

const ABILITY_KEY_BY_NAME: Record<string, AbilityKey> = {
  strength: 'strength',
  dexterity: 'dexterity',
  constitution: 'constitution',
  intelligence: 'intelligence',
  wisdom: 'wisdom',
  charisma: 'charisma',
};

const normalizeSpellName = (name: string) =>
  name
    .trim()
    .replace(/[.;]+$/g, '')
    .replace(/\s+/g, ' ');

const parseSpellList = (description: string) => {
  const spellSections = description.match(
    /(?:Cantrips \(at will\)|At will|(?:\d+(?:st|nd|rd|th) level(?: \(\d+ slots?\))?)): ([^\n.]+)/gi,
  );

  if (!spellSections) {
    return [];
  }

  const spells = spellSections.flatMap((section) => {
    const colonIndex = section.indexOf(':');
    const spellList = colonIndex >= 0 ? section.slice(colonIndex + 1) : section;
    return spellList.split(',').map(normalizeSpellName).filter(Boolean);
  });

  return [...new Set(spells)];
};

export const parseSpellcastingDetails = (
  specialAbilities: SpecialAbility[] | undefined,
): SpellcastingDetails => {
  const spellcastingAbility = specialAbilities?.find((ability) =>
    /spellcasting/i.test(ability.name),
  );

  if (!spellcastingAbility) {
    return { spells: [] };
  }

  const description = spellcastingAbility.desc;
  const abilityMatch = description.match(/spellcasting ability is ([A-Za-z]+)/i);
  const spellSaveDcMatch = description.match(/spell save DC (\d+)/i);

  const abilityName = abilityMatch?.[1]?.toLowerCase().trim() ?? '';
  const parsedAbility = ABILITY_KEY_BY_NAME[abilityName] ?? null;
  const spells = parseSpellList(description);

  return {
    spellcastingAbility: parsedAbility,
    spellSaveDc: spellSaveDcMatch ? Number(spellSaveDcMatch[1]) : undefined,
    spells,
  };
};

const mapSavingThrow = (dc?: {
  dc_type: { name: string };
  dc_value: number;
  success_type: string;
}): CreatureFeatureSavingThrow | undefined =>
  dc
    ? {
        ability: dc.dc_type.name,
        dc: dc.dc_value,
        successType: dc.success_type,
      }
    : undefined;

const mapUsage = (usage?: {
  type: string;
  times?: number;
  dice?: string;
  min_value?: number;
  rest_types?: string[];
}): CreatureFeatureUsage | undefined =>
  usage
    ? {
        type: usage.type,
        times: usage.times,
        dice: usage.dice,
        minValue: usage.min_value,
        restTypes: usage.rest_types,
      }
    : undefined;

const mapFeature = (
  creatureIndex: string,
  type: CreatureFeatureType,
  feature: SpecialAbility | Action | LegendaryAction,
): CreatureFeature => {
  const parsedDamage = mapDamage(feature.damage);
  const { damage: descDamage, versatileDamage: descVersatile } = parseDescriptionDamage(
    feature.desc,
  );

  /** Prefer typed API dice for the primary hit when present; prose still supplies versatile (2H) dice when listed. */
  const damage = parsedDamage.length > 0 ? parsedDamage : descDamage;

  return {
    id: buildFeatureId(creatureIndex, type, feature.name),
    name: feature.name,
    type,
    description: feature.desc,
    attackBonus: 'attack_bonus' in feature ? feature.attack_bonus : undefined,
    savingThrow: mapSavingThrow(feature.dc),
    usage: 'usage' in feature ? mapUsage(feature.usage) : undefined,
    damage,
    versatileDamage: descVersatile,
  };
};

const buildGroup = (
  creatureIndex: string,
  type: CreatureFeatureType,
  label: string,
  features: Array<SpecialAbility | Action | LegendaryAction> | undefined,
): CreatureFeatureGroup | null => {
  if (!features || features.length === 0) {
    return null;
  }

  return {
    type,
    label,
    features: features.map((feature) => mapFeature(creatureIndex, type, feature)),
  };
};

export const buildCreatureFeatureGroups = (apiCreature: ApiCreature): CreatureFeatureGroup[] =>
  [
    buildGroup(
      apiCreature.index,
      CreatureFeatureTypes.Trait,
      'Traits',
      apiCreature.special_abilities,
    ),
    buildGroup(apiCreature.index, CreatureFeatureTypes.Action, 'Actions', apiCreature.actions),
    buildGroup(
      apiCreature.index,
      CreatureFeatureTypes.Legendary,
      'Legendary Actions',
      apiCreature.legendary_actions,
    ),
  ].filter((group): group is CreatureFeatureGroup => group !== null);
