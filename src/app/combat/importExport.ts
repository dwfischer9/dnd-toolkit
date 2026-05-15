import type Creature from '@/types/creature';

export interface ImportExportPayloadV1 {
  version: '1';
  exportedAt: string;
  app: 'dnd-toolkit';
  encounter: {
    activeCreatureId: string;
    round: number;
    creatures: Creature[];
  };
  library: {
    creatures: Creature[];
  };
}

export const createExportPayload = (params: {
  activeCreatureId: string;
  round: number;
  creatures: Creature[];
  libraryCreatures: Creature[];
  exportedAt?: string;
}): ImportExportPayloadV1 => ({
  version: '1',
  exportedAt: params.exportedAt ?? new Date().toISOString(),
  app: 'dnd-toolkit',
  encounter: {
    activeCreatureId: params.activeCreatureId,
    round: params.round,
    creatures: params.creatures,
  },
  library: {
    creatures: params.libraryCreatures,
  },
});

export const toImportedCreatures = (creatures: Creature[]): Creature[] =>
  creatures.map((creature) => ({
    ...creature,
    origin: 'imported' as const,
  }));

export const toValidRound = (round: unknown) => Math.max(1, Number(round) || 1);

export const validateImportPayload = (input: unknown): input is ImportExportPayloadV1 => {
  if (!input || typeof input !== 'object') {
    return false;
  }
  const candidate = input as Record<string, unknown>;
  if (candidate.version !== '1' || candidate.app !== 'dnd-toolkit') {
    return false;
  }
  if (typeof candidate.exportedAt !== 'string') {
    return false;
  }
  if (!candidate.encounter || typeof candidate.encounter !== 'object') {
    return false;
  }
  if (!candidate.library || typeof candidate.library !== 'object') {
    return false;
  }
  const encounter = candidate.encounter as Record<string, unknown>;
  const library = candidate.library as Record<string, unknown>;
  if (!Array.isArray(encounter.creatures) || !Array.isArray(library.creatures)) {
    return false;
  }
  if (typeof encounter.activeCreatureId !== 'string') {
    return false;
  }
  return typeof encounter.round === 'number' || typeof encounter.round === 'string';
};
