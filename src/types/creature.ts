export const CreatureFeatureTypes = {
  Trait: 'trait',
  Action: 'action',
  Legendary: 'legendary',
  Reaction: 'reaction',
  Spell: 'spell',
} as const;

export type CreatureFeatureType = (typeof CreatureFeatureTypes)[keyof typeof CreatureFeatureTypes];

export const CreatureRollKinds = {
  Attack: 'attack',
  Damage: 'damage',
  Save: 'save',
  Other: 'other',
} as const;

export type CreatureRollKind = (typeof CreatureRollKinds)[keyof typeof CreatureRollKinds];

export const CreatureHands = {
  One: 'one',
  Two: 'two',
} as const;

export type CreatureHand = (typeof CreatureHands)[keyof typeof CreatureHands];

export const CreatureSizes = {
  Tiny: 'Tiny',
  Small: 'Small',
  Medium: 'Medium',
  Large: 'Large',
  Huge: 'Huge',
  Gargantuan: 'Gargantuan',
} as const;

export type CreatureSize = (typeof CreatureSizes)[keyof typeof CreatureSizes];

export interface CreatureReference {
  index: string;
  name: string;
}

export interface CreatureStats {
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
}

export interface CreatureSaves {
  strength?: boolean;
  dexterity?: boolean;
  constitution?: boolean;
  intelligence?: boolean;
  wisdom?: boolean;
  charisma?: boolean;
}

export interface CreatureTrackedResource {
  current: number;
  maximum: number;
  label: string;
}

export interface CreatureFeatureSavingThrow {
  ability: string;
  dc: number;
  successType: string;
}

export interface CreatureFeatureUsage {
  type: string;
  times?: number;
  dice?: string;
  minValue?: number;
  restTypes?: string[];
}

export interface CreatureFeatureDamage {
  type: string;
  dice: string;
}

export interface CreatureFeatureVersatileDamage extends CreatureFeatureDamage {
  hands: CreatureHand;
}

export interface CreatureFeatureState {
  uses?: CreatureTrackedResource;
}

export interface CreatureActionResult {
  featureId: string;
  featureName: string;
  summary: string;
  rolls: CreatureRollTile[];
}

export interface CreatureRollTile {
  label: string;
  value: number;
  detail?: string;
  kind: CreatureRollKind;
}

export interface CreatureFeature {
  id: string;
  name: string;
  type: CreatureFeatureType;
  description: string;
  attackBonus?: number;
  savingThrow?: CreatureFeatureSavingThrow;
  usage?: CreatureFeatureUsage;
  damage?: CreatureFeatureDamage[];
  versatileDamage?: CreatureFeatureVersatileDamage[];
  legendaryCost?: number;
}

export interface CreatureFeatureGroup {
  type: CreatureFeatureType;
  label: string;
  features: CreatureFeature[];
}

export const CreatureDefenseEffectCategories = {
  Resistance: 'resistance',
  Immunity: 'immunity',
  Vulnerability: 'vulnerability',
  Condition: 'condition',
} as const;

export type CreatureDefenseEffectCategory =
  (typeof CreatureDefenseEffectCategories)[keyof typeof CreatureDefenseEffectCategories];

export const CreatureEffectSources = {
  Baseline: 'baseline',
  Encounter: 'encounter',
} as const;

export type CreatureEffectSource =
  (typeof CreatureEffectSources)[keyof typeof CreatureEffectSources];

export interface CreatureEffect {
  id: string;
  label: string;
  category: CreatureDefenseEffectCategory;
  scope: string;
  source: CreatureEffectSource;
  timing?: 'round' | 'turn_start';
  durationRounds?: number;
  anchorRound?: number;
  anchorCreatureId?: string;
  elapsedTurnStarts?: number;
}

export default interface Creature {
  id: string;
  name: string;
  ac: number;
  maxHp: number;
  currentHp: number;
  initiative: number;
  isActive?: boolean;
  isPlayer?: boolean;
  isTemplate?: boolean;
  characterClass?: string;
  characterLevel?: number;
  spellcastingAbility?: AbilityKey | null;
  spellSaveDc?: number;
  spells?: string[];
  savingThrowProficiencies?: AbilityKey[];
  skillProficiencies?: string[];
  image?: string;
  challengeRating?: number;
  xp?: number;
  featureGroups?: CreatureFeatureGroup[];
  sourceCreature?: CreatureReference;
  abilityScores?: CreatureStats;
  savingThrowBonuses?: Partial<Record<AbilityKey, number>>;
  skillBonuses?: Record<string, number>;
  proficiencyBonus?: number;
  featureState?: Record<string, CreatureFeatureState>;
  legendaryActions?: CreatureTrackedResource | null;
  lastActionResult?: CreatureActionResult | null;
  effects?: CreatureEffect[];
  origin?: 'api' | 'imported' | 'user';
}

// API response types that match the actual D&D 5e API structure.
export interface CreatureApiDcType {
  index: string;
  name: string;
  url: string;
}

export interface CreatureApiDc {
  dc_type: CreatureApiDcType;
  dc_value: number;
  success_type: string;
}

export interface CreatureApiDamageType {
  index: string;
  name: string;
  url: string;
}

export interface DamageInfo {
  damage_type: CreatureApiDamageType;
  damage_dice: string;
}

export interface SpecialAbility {
  name: string;
  desc: string;
  usage?: CreatureFeatureUsage;
  dc?: CreatureApiDc;
  damage: DamageInfo[];
}

export interface LegendaryAction {
  name: string;
  desc: string;
  damage: DamageInfo[];
  dc?: CreatureApiDc;
}

export interface Action {
  name: string;
  desc: string;
  attack_bonus?: number;
  damage: DamageInfo[];
  dc?: CreatureApiDc;
  usage?: Omit<CreatureFeatureUsage, 'times'> & {
    min_value?: number;
    rest_types?: string[];
  };
  multiattack_type?: string;
  actions?: CreatureActionLink[];
}

export interface CreatureActionLink {
  action_name: string;
  count: string;
  type: string;
}

export interface ApiCreature {
  index: string;
  name: string;
  size: CreatureSize;
  type: string;
  alignment: string;
  armor_class:
    | Array<{
        type: string;
        value: number;
      }>
    | number;
  hit_points: number;
  hit_dice?: string;
  hit_points_roll?: string;
  speed: {
    walk?: string;
    fly?: string;
    swim?: string;
    burrow?: string;
    climb?: string;
  };
  strength: number;
  dexterity: number;
  constitution: number;
  intelligence: number;
  wisdom: number;
  charisma: number;
  proficiencies?: Array<{
    value: number;
    proficiency: {
      index: string;
      name: string;
      url: string;
    };
  }>;
  damage_vulnerabilities: string[];
  damage_resistances: string[];
  damage_immunities: string[];
  condition_immunities: string[];
  senses: {
    blindsight?: string;
    darkvision?: string;
    tremorsense?: string;
    truesight?: string;
    passive_perception: number;
  };
  languages: string;
  challenge_rating: number;
  proficiency_bonus: number;
  xp: number;
  special_abilities: SpecialAbility[];
  actions: Action[];
  legendary_actions: LegendaryAction[];
  image?: string;
  url: string;
  updated_at: string;
  forms: unknown[];
  reactions: unknown[];
}

export interface DetailedCreature extends Creature {
  stats?: CreatureStats;
  saves?: CreatureSaves;
  speed?: {
    walk?: string;
    fly?: string;
    swim?: string;
    burrow?: string;
    climb?: string;
  };
  size?: CreatureSize;
  type?: string;
  alignment?: string;
  challengeRating?: number;
  proficiencyBonus?: number;
  damage_vulnerabilities?: string[];
  damage_resistances?: string[];
  damage_immunities?: string[];
  condition_immunities?: string[];
  languages?: string;
  legendary_actions?: LegendaryAction[];
  featureGroups?: CreatureFeatureGroup[];
}

export const Abilities = {
  Strength: 'strength',
  Dexterity: 'dexterity',
  Constitution: 'constitution',
  Intelligence: 'intelligence',
  Wisdom: 'wisdom',
  Charisma: 'charisma',
} as const;

export type AbilityKey = (typeof Abilities)[keyof typeof Abilities];

export const AbilityLabels = {
  Strength: 'STR',
  Dexterity: 'DEX',
  Constitution: 'CON',
  Intelligence: 'INT',
  Wisdom: 'WIS',
  Charisma: 'CHA',
} as const;

export const ABILITY_ORDER: Array<{ key: AbilityKey; short: string }> = [
  { key: Abilities.Strength, short: AbilityLabels.Strength },
  { key: Abilities.Dexterity, short: AbilityLabels.Dexterity },
  { key: Abilities.Constitution, short: AbilityLabels.Constitution },
  { key: Abilities.Intelligence, short: AbilityLabels.Intelligence },
  { key: Abilities.Wisdom, short: AbilityLabels.Wisdom },
  { key: Abilities.Charisma, short: AbilityLabels.Charisma },
];

export const Skills = {
  Athletics: 'Athletics',
  Acrobatics: 'Acrobatics',
  SleightOfHand: 'Sleight of Hand',
  Stealth: 'Stealth',
  Arcana: 'Arcana',
  History: 'History',
  Investigation: 'Investigation',
  Nature: 'Nature',
  Religion: 'Religion',
  AnimalHandling: 'Animal Handling',
  Insight: 'Insight',
  Medicine: 'Medicine',
  Perception: 'Perception',
  Survival: 'Survival',
  Deception: 'Deception',
  Intimidation: 'Intimidation',
  Performance: 'Performance',
  Persuasion: 'Persuasion',
} as const;
