import { Abilities, AbilityKey, Skills } from './creature';

export enum Classes {
  Artificer = 'Artificer',
  Barbarian = 'Barbarian',
  Bard = 'Bard',
  Cleric = 'Cleric',
  Druid = 'Druid',
  Fighter = 'Fighter',
  Monk = 'Monk',
  Paladin = 'Paladin',
  Ranger = 'Ranger',
  Rogue = 'Rogue',
  Sorcerer = 'Sorcerer',
  Warlock = 'Warlock',
  Wizard = 'Wizard',
}

export type ClassName = (typeof Classes)[keyof typeof Classes];
export type SkillLabel = (typeof Skills)[keyof typeof Skills];

export interface ClassOption {
  label: ClassName;
  savingThrows: AbilityKey[];
}

export interface ClassSkillOptions {
  skills: SkillLabel[];
  pickCount: number;
}

export const CLASS_SKILL_PRESETS: Partial<Record<ClassName, SkillLabel[]>> = {
  [Classes.Barbarian]: [Skills.Athletics, Skills.Survival],
  [Classes.Bard]: [Skills.Deception, Skills.Persuasion, Skills.Performance],
  [Classes.Cleric]: [Skills.Insight, Skills.Religion],
  [Classes.Druid]: [Skills.Nature, Skills.Survival],
  [Classes.Fighter]: [Skills.Athletics, Skills.Perception],
  [Classes.Monk]: [Skills.Acrobatics, Skills.Stealth],
  [Classes.Paladin]: [Skills.Athletics, Skills.Persuasion],
  [Classes.Ranger]: [Skills.Perception, Skills.Survival, Skills.Stealth],
  [Classes.Rogue]: [Skills.Stealth, Skills.SleightOfHand, Skills.Perception, Skills.Acrobatics],
  [Classes.Sorcerer]: [Skills.Arcana, Skills.Persuasion],
  [Classes.Warlock]: [Skills.Arcana, Skills.Intimidation],
  [Classes.Wizard]: [Skills.Arcana, Skills.History],
};

export const CLASS_OPTIONS: ClassOption[] = [
  { label: Classes.Barbarian, savingThrows: [Abilities.Strength, Abilities.Constitution] },
  { label: Classes.Bard, savingThrows: [Abilities.Dexterity, Abilities.Charisma] },
  { label: Classes.Cleric, savingThrows: [Abilities.Wisdom, Abilities.Charisma] },
  { label: Classes.Druid, savingThrows: [Abilities.Intelligence, Abilities.Wisdom] },
  { label: Classes.Fighter, savingThrows: [Abilities.Strength, Abilities.Constitution] },
  { label: Classes.Monk, savingThrows: [Abilities.Strength, Abilities.Dexterity] },
  { label: Classes.Paladin, savingThrows: [Abilities.Wisdom, Abilities.Charisma] },
  { label: Classes.Ranger, savingThrows: [Abilities.Strength, Abilities.Dexterity] },
  { label: Classes.Rogue, savingThrows: [Abilities.Dexterity, Abilities.Intelligence] },
  { label: Classes.Sorcerer, savingThrows: [Abilities.Constitution, Abilities.Charisma] },
  { label: Classes.Warlock, savingThrows: [Abilities.Wisdom, Abilities.Charisma] },
  { label: Classes.Wizard, savingThrows: [Abilities.Intelligence, Abilities.Wisdom] },
];

export const CLASS_SPELLCASTING_ABILITIES: Partial<Record<ClassName, AbilityKey>> = {
  [Classes.Bard]: Abilities.Charisma,
  [Classes.Cleric]: Abilities.Wisdom,
  [Classes.Druid]: Abilities.Wisdom,
  [Classes.Paladin]: Abilities.Charisma,
  [Classes.Ranger]: Abilities.Wisdom,
  [Classes.Sorcerer]: Abilities.Charisma,
  [Classes.Warlock]: Abilities.Charisma,
  [Classes.Wizard]: Abilities.Intelligence,
};

export const CLASS_SKILL_OPTIONS: Partial<Record<ClassName, ClassSkillOptions>> = {
  [Classes.Barbarian]: {
    skills: [
      Skills.AnimalHandling,
      Skills.Athletics,
      Skills.Intimidation,
      Skills.Nature,
      Skills.Perception,
      Skills.Survival,
    ],
    pickCount: 2,
  },
  [Classes.Bard]: {
    skills: [
      Skills.Athletics,
      Skills.Acrobatics,
      Skills.SleightOfHand,
      Skills.Stealth,
      Skills.Arcana,
      Skills.History,
      Skills.Investigation,
      Skills.Nature,
      Skills.Religion,
      Skills.AnimalHandling,
      Skills.Insight,
      Skills.Medicine,
      Skills.Perception,
      Skills.Survival,
      Skills.Deception,
      Skills.Intimidation,
      Skills.Performance,
      Skills.Persuasion,
    ],
    pickCount: 3,
  },
  [Classes.Cleric]: {
    skills: [Skills.History, Skills.Insight, Skills.Medicine, Skills.Persuasion, Skills.Religion],
    pickCount: 2,
  },
  [Classes.Druid]: {
    skills: [
      Skills.Arcana,
      Skills.AnimalHandling,
      Skills.Insight,
      Skills.Medicine,
      Skills.Nature,
      Skills.Perception,
      Skills.Religion,
      Skills.Survival,
    ],
    pickCount: 2,
  },
  [Classes.Fighter]: {
    skills: [
      Skills.Acrobatics,
      Skills.AnimalHandling,
      Skills.Athletics,
      Skills.History,
      Skills.Insight,
      Skills.Intimidation,
      Skills.Perception,
      Skills.Survival,
    ],
    pickCount: 2,
  },
  [Classes.Monk]: {
    skills: [
      Skills.Acrobatics,
      Skills.Athletics,
      Skills.History,
      Skills.Insight,
      Skills.Religion,
      Skills.Stealth,
    ],
    pickCount: 2,
  },
  [Classes.Paladin]: {
    skills: [
      Skills.Athletics,
      Skills.Insight,
      Skills.Intimidation,
      Skills.Medicine,
      Skills.Persuasion,
      Skills.Religion,
    ],
    pickCount: 2,
  },
  [Classes.Ranger]: {
    skills: [
      Skills.AnimalHandling,
      Skills.Athletics,
      Skills.Insight,
      Skills.Investigation,
      Skills.Nature,
      Skills.Perception,
      Skills.Stealth,
      Skills.Survival,
    ],
    pickCount: 3,
  },
  [Classes.Rogue]: {
    skills: [
      Skills.Acrobatics,
      Skills.Athletics,
      Skills.Deception,
      Skills.Insight,
      Skills.Intimidation,
      Skills.Investigation,
      Skills.Perception,
      Skills.Performance,
      Skills.Persuasion,
      Skills.SleightOfHand,
      Skills.Stealth,
    ],
    pickCount: 4,
  },
  [Classes.Sorcerer]: {
    skills: [
      Skills.Arcana,
      Skills.Deception,
      Skills.Insight,
      Skills.Intimidation,
      Skills.Persuasion,
      Skills.Religion,
    ],
    pickCount: 2,
  },
  [Classes.Warlock]: {
    skills: [
      Skills.Arcana,
      Skills.Deception,
      Skills.History,
      Skills.Intimidation,
      Skills.Investigation,
      Skills.Nature,
      Skills.Religion,
    ],
    pickCount: 2,
  },
  [Classes.Wizard]: {
    skills: [
      Skills.Arcana,
      Skills.History,
      Skills.Insight,
      Skills.Investigation,
      Skills.Medicine,
      Skills.Religion,
    ],
    pickCount: 2,
  },
};
