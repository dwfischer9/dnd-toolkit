export const BuilderModes = {
  Pc: 'pc',
  Monster: 'monster',
} as const;

export type BuilderMode = (typeof BuilderModes)[keyof typeof BuilderModes];

export const BuilderContexts = {
  New: 'new',
  Library: 'library',
  Encounter: 'encounter',
} as const;

export type BuilderContext = (typeof BuilderContexts)[keyof typeof BuilderContexts];

export const MusicSources = {
  YouTube: 'youtube',
  Local: 'local',
} as const;

export type MusicSource = (typeof MusicSources)[keyof typeof MusicSources];

export const CreatureSaveActions = {
  Save: 'save',
  Add: 'add',
} as const;

export type CreatureSaveAction = (typeof CreatureSaveActions)[keyof typeof CreatureSaveActions];

export const StorageKeys = {
  CreatureLibrary: 'dnd-toolkit:creature-library',
  CombatEncounter: 'dnd-toolkit:combat-encounter',
  MusicSettings: 'dnd-toolkit:music-settings',
  UiSettings: 'dnd-toolkit:ui-settings',
} as const;
