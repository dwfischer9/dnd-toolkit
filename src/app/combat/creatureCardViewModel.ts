import { ABILITY_ORDER } from '../../types/creature.ts';
import type Creature from '../../types/creature.ts';
import { getCreatureSaveBonus } from './combatState.ts';

export interface AbilityRowViewModel {
  abilityKey: (typeof ABILITY_ORDER)[number]['key'];
  short: string;
  modifier: number;
  score: number;
  saveBonus: number;
  saveIsProficient: boolean;
}

const getAbilityModifier = (score: number) => Math.floor((score - 10) / 2);

export const getCreatureAbilityRows = (creature: Creature): AbilityRowViewModel[] => {
  if (!creature.abilityScores) {
    return [];
  }

  return ABILITY_ORDER.flatMap((ability) => {
    const score = creature.abilityScores?.[ability.key];
    if (score === undefined) {
      return [];
    }
    const save = getCreatureSaveBonus(creature, ability.key);
    return [
      {
        abilityKey: ability.key,
        short: ability.short,
        modifier: getAbilityModifier(score),
        score,
        saveBonus: save.bonus,
        saveIsProficient: save.isProficient,
      },
    ];
  });
};
