import type Creature from '../types/creature';
import type { AbilityKey, ApiCreature } from '../types/creature';
import {
  CreatureDefenseEffectCategories,
  CreatureEffectSources,
  type CreatureDefenseEffectCategory,
} from '../types/creature';
import { buildCreatureFeatureGroups, parseSpellcastingDetails } from './creatureFeatures';

// API response types
export interface CreatureSearchResult {
  index: string;
  name: string;
  url: string;
  challengeRating?: number;
  xp?: number;
}

export interface CreatureSearchResponse {
  count: number;
  results: CreatureSearchResult[];
}

const ABILITY_KEY_BY_ABBREVIATION: Record<string, AbilityKey> = {
  STR: 'strength',
  DEX: 'dexterity',
  CON: 'constitution',
  INT: 'intelligence',
  WIS: 'wisdom',
  CHA: 'charisma',
};

const jsonHeaders = {
  Accept: 'application/json',
};

const requestJson = async <T>(input: RequestInfo | URL) => {
  const response = await fetch(input, {
    method: 'GET',
    headers: jsonHeaders,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`,
    );
  }

  return response.json() as Promise<T>;
};

const parseProficiencyBonuses = (apiCreature: ApiCreature) => {
  const savingThrowBonuses: Partial<Record<AbilityKey, number>> = {};
  const skillBonuses: Record<string, number> = {};

  for (const entry of apiCreature.proficiencies ?? []) {
    const proficiencyName = entry.proficiency?.name?.trim() ?? '';
    if (!proficiencyName) {
      continue;
    }

    if (proficiencyName.startsWith('Saving Throw:')) {
      const abilityAbbrev = proficiencyName.split(':')[1]?.trim().toUpperCase() ?? '';
      const abilityKey = ABILITY_KEY_BY_ABBREVIATION[abilityAbbrev];
      if (abilityKey) {
        savingThrowBonuses[abilityKey] = entry.value;
      }
      continue;
    }

    if (proficiencyName.startsWith('Skill:')) {
      const skillName = proficiencyName.split(':')[1]?.trim();
      if (skillName) {
        skillBonuses[skillName] = entry.value;
      }
    }
  }

  return { savingThrowBonuses, skillBonuses };
};

const toBaselineEffects = (values: string[], category: CreatureDefenseEffectCategory) =>
  values.map((value) => ({
    id: `${CreatureEffectSources.Baseline}:${category}:${value.toLowerCase()}`,
    label: `${category} (${value})`,
    category,
    scope: value.toLowerCase(),
    source: CreatureEffectSources.Baseline,
  }));

export const creatureApi = {
  async searchCreatures(query: string): Promise<CreatureSearchResponse> {
    return requestJson<CreatureSearchResponse>(`/api/creatures?q=${encodeURIComponent(query)}`);
  },

  async getCreatureDetails(index: string): Promise<ApiCreature> {
    return requestJson<ApiCreature>(`/api/creatures/${encodeURIComponent(index)}`);
  },

  convertApiCreatureToCreature(apiCreature: ApiCreature): Creature {
    if (!apiCreature.name) {
      throw new Error('Creature name is required');
    }

    let acValue = 10;
    if (Array.isArray(apiCreature.armor_class)) {
      acValue = apiCreature.armor_class[0]?.value || 10;
    } else if (typeof apiCreature.armor_class === 'number') {
      acValue = apiCreature.armor_class;
    }

    const { savingThrowBonuses, skillBonuses } = parseProficiencyBonuses(apiCreature);
    const { spellcastingAbility, spellSaveDc, spells } = parseSpellcastingDetails(
      apiCreature.special_abilities,
    );

    return {
      // Encounter instance ids come from combat state helpers; duplicated creatures must stay distinct.
      id: '',
      name: apiCreature.name,
      ac: acValue,
      maxHp: apiCreature.hit_points || 1,
      currentHp: apiCreature.hit_points || 1,
      initiative: 0,
      isPlayer: false,
      image: apiCreature.image,
      challengeRating: apiCreature.challenge_rating,
      xp: apiCreature.xp,
      abilityScores: {
        strength: apiCreature.strength,
        dexterity: apiCreature.dexterity,
        constitution: apiCreature.constitution,
        intelligence: apiCreature.intelligence,
        wisdom: apiCreature.wisdom,
        charisma: apiCreature.charisma,
      },
      proficiencyBonus: apiCreature.proficiency_bonus,
      savingThrowBonuses,
      skillBonuses,
      spellcastingAbility,
      spellSaveDc,
      spells,
      sourceCreature: {
        index: apiCreature.index,
        name: apiCreature.name,
      },
      featureGroups: buildCreatureFeatureGroups(apiCreature),
      effects: [
        ...toBaselineEffects(
          apiCreature.damage_resistances ?? [],
          CreatureDefenseEffectCategories.Resistance,
        ),
        ...toBaselineEffects(
          apiCreature.damage_immunities ?? [],
          CreatureDefenseEffectCategories.Immunity,
        ),
        ...toBaselineEffects(
          apiCreature.damage_vulnerabilities ?? [],
          CreatureDefenseEffectCategories.Vulnerability,
        ),
      ],
      origin: 'api',
    };
  },
};
