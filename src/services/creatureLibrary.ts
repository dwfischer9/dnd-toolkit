import type Creature from '@/types/creature';
import { StorageKeys } from '@/types/app';

export const CREATURE_LIBRARY_STORAGE_KEY = StorageKeys.CreatureLibrary;

const normalizeCreature = (creature: Creature): Creature => ({
  ...creature,
  id: creature.id || crypto.randomUUID(),
  initiative: Number.isFinite(creature.initiative) ? creature.initiative : 0,
  currentHp: Number.isFinite(creature.currentHp) ? creature.currentHp : creature.maxHp,
  maxHp: Number.isFinite(creature.maxHp) ? creature.maxHp : 1,
  ac: Number.isFinite(creature.ac) ? creature.ac : 10,
  isTemplate: true,
  origin: creature.origin ?? (creature.sourceCreature ? 'api' : 'user'),
});

export const loadCreatureLibrary = (): Creature[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(CREATURE_LIBRARY_STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsed = JSON.parse(rawValue) as Creature[];
    return parsed.map(normalizeCreature);
  } catch {
    return [];
  }
};

export const saveCreatureLibrary = (creatures: Creature[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  const normalized = creatures.map(normalizeCreature);
  window.localStorage.setItem(CREATURE_LIBRARY_STORAGE_KEY, JSON.stringify(normalized));
};

export const upsertCreatureInLibrary = (creature: Creature) => {
  const library = loadCreatureLibrary();
  const nextCreature = normalizeCreature(creature);
  const nextLibrary = library.filter((entry) => entry.id !== nextCreature.id);
  nextLibrary.unshift(nextCreature);
  saveCreatureLibrary(nextLibrary);
  return nextCreature;
};

export const removeCreatureFromLibrary = (creatureId: string) => {
  const nextLibrary = loadCreatureLibrary().filter((creature) => creature.id !== creatureId);
  saveCreatureLibrary(nextLibrary);
};
