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

export const AuthModes = {
  SignIn: 'sign-in',
  Create: 'create',
} as const;

export type AuthMode = (typeof AuthModes)[keyof typeof AuthModes];

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
  AuthUsers: 'dnd-toolkit:auth-users',
  AuthSession: 'dnd-toolkit:auth-session',
  CreatureLibrary: 'dnd-toolkit:creature-library',
  CombatEncounter: 'dnd-toolkit:combat-encounter',
  MusicSettings: 'dnd-toolkit:music-settings',
  UiSettings: 'dnd-toolkit:ui-settings',
} as const;
