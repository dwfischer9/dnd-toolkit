'use client';

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import Link from 'next/link';
import CreatureBuilderModal from './components/CreatureBuilderModal';
import ControlsPanel from './components/ControlsPanel';
import InitiativeList from './components/InitiativeList';
import SummaryPanel from './components/SummaryPanel';
import CreatureSearchPanel from './components/CreatureSearchPanel';
import type Creature from '@/types/creature';
import { BuilderContexts, BuilderModes, StorageKeys } from '@/types/app';
import { CreatureSaveActions } from '@/types/app';
import type { BuilderContext, BuilderMode, CreatureSaveAction } from '@/types/app';
import {
  addCreatureToEncounter,
  applyTurnStartEffectUpdates,
  expireCreatureEffectsAtRoundBoundary,
  ensureEncounterCreatureIds,
  pruneEffectsByRemovedAnchor,
  getFirstActiveCreatureId,
  getNextTurnState,
  getPreviousTurnState,
  removeCreatureFromEncounter,
  resetLegendaryActions,
  rollD20,
  rollCreatureInitiative,
  sortCreatures,
} from './combatState';
import { creatureApi } from '@/services/creatureApi';
import {
  loadCreatureLibrary,
  saveCreatureLibrary,
  upsertCreatureInLibrary,
} from '@/services/creatureLibrary';
import {
  createExportPayload,
  toImportedCreatures,
  toValidRound,
  validateImportPayload,
} from './importExport';

const initialCreatures: Creature[] = [
  { id: '1', name: 'Thia (PC)', ac: 15, maxHp: 20, currentHp: 20, initiative: 18, isPlayer: true },
];

const ENCOUNTER_STORAGE_KEY = StorageKeys.CombatEncounter;
const TEST_CREATURE_INDEXES = ['adult-blue-dragon', 'goblin', 'lich'];

interface SavedEncounter {
  creatures: Creature[];
  activeCreatureId: string;
  round: number;
  validatedInitiativeSnapshot?: ValidatedInitiativeSnapshot | null;
  orderDriftActive?: boolean;
  orderDriftAcknowledged?: boolean;
  orderDriftDismissed?: boolean;
}

interface ValidatedInitiativeSnapshot {
  orderedIds: string[];
  initiativesById: Record<string, number>;
}

const XP_MULTIPLIERS = [
  { min: 15, multiplier: 4 },
  { min: 11, multiplier: 3 },
  { min: 7, multiplier: 2.5 },
  { min: 3, multiplier: 2 },
  { min: 2, multiplier: 1.5 },
  { min: 1, multiplier: 1 },
] as const;

const ENCOUNTER_THRESHOLDS_BY_LEVEL: Record<
  number,
  { easy: number; medium: number; hard: number; deadly: number }
> = {
  1: { easy: 25, medium: 50, hard: 75, deadly: 100 },
  2: { easy: 50, medium: 100, hard: 150, deadly: 200 },
  3: { easy: 75, medium: 150, hard: 225, deadly: 400 },
  4: { easy: 125, medium: 250, hard: 375, deadly: 500 },
  5: { easy: 250, medium: 500, hard: 750, deadly: 1100 },
  6: { easy: 300, medium: 600, hard: 900, deadly: 1400 },
  7: { easy: 350, medium: 750, hard: 1100, deadly: 1700 },
  8: { easy: 450, medium: 900, hard: 1400, deadly: 2100 },
  9: { easy: 550, medium: 1100, hard: 1600, deadly: 2400 },
  10: { easy: 600, medium: 1200, hard: 1900, deadly: 2800 },
  11: { easy: 800, medium: 1600, hard: 2400, deadly: 3600 },
  12: { easy: 1000, medium: 2000, hard: 3000, deadly: 4500 },
  13: { easy: 1100, medium: 2200, hard: 3400, deadly: 5100 },
  14: { easy: 1250, medium: 2500, hard: 3800, deadly: 5700 },
  15: { easy: 1400, medium: 2800, hard: 4300, deadly: 6400 },
  16: { easy: 1600, medium: 3200, hard: 4800, deadly: 7200 },
  17: { easy: 2000, medium: 3900, hard: 5900, deadly: 8800 },
  18: { easy: 2100, medium: 4200, hard: 6300, deadly: 9500 },
  19: { easy: 2400, medium: 4900, hard: 7300, deadly: 10900 },
  20: { easy: 2800, medium: 5700, hard: 8500, deadly: 12700 },
};

const getEncounterMultiplier = (creatureCount: number, playerCount: number) => {
  if (creatureCount <= 0) {
    return 1;
  }

  const baseMultiplier = XP_MULTIPLIERS.find((rule) => creatureCount >= rule.min)?.multiplier ?? 1;

  if (playerCount <= 2) {
    const raisedMultiplier = XP_MULTIPLIERS.find(
      (rule) => rule.multiplier > baseMultiplier,
    )?.multiplier;
    return raisedMultiplier ?? baseMultiplier;
  }

  if (playerCount >= 6) {
    const loweredRules = [...XP_MULTIPLIERS].reverse();
    const loweredMultiplier = loweredRules.find(
      (rule) => rule.multiplier < baseMultiplier,
    )?.multiplier;
    return loweredMultiplier ?? baseMultiplier;
  }

  return baseMultiplier;
};

export default function CombatScreen() {
  const [creatures, setCreatures] = useState<Creature[]>([]);
  const [activeCreatureId, setActiveCreatureId] = useState<string>(initialCreatures[0].id);
  const [round, setRound] = useState(1);
  const [partyLevel, setPartyLevel] = useState(1);
  const [leftMenuOpen, setLeftMenuOpen] = useState(false);
  const [rightMenuOpen, setRightMenuOpen] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderMode, setBuilderMode] = useState<BuilderMode>(BuilderModes.Pc);
  const [builderContext, setBuilderContext] = useState<BuilderContext>(BuilderContexts.New);
  const [builderCreature, setBuilderCreature] = useState<Creature | null>(null);
  const [turnTransitionError, setTurnTransitionError] = useState<string | null>(null);
  const [validatedInitiativeSnapshot, setValidatedInitiativeSnapshot] =
    useState<ValidatedInitiativeSnapshot | null>(null);
  const [orderDriftActive, setOrderDriftActive] = useState(false);
  const [orderDriftAcknowledged, setOrderDriftAcknowledged] = useState(false);
  const [orderDriftDismissed, setOrderDriftDismissed] = useState(false);
  const [effectCleanupNotice, setEffectCleanupNotice] = useState<string | null>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);
  const hasHydratedEncounter = useRef(false);

  const sortedCreatures = useMemo(() => sortCreatures(creatures), [creatures]);
  const toValidatedSnapshot = (orderedCreatures: Creature[]): ValidatedInitiativeSnapshot => ({
    orderedIds: orderedCreatures.map((creature) => creature.id),
    initiativesById: Object.fromEntries(
      orderedCreatures.map((creature) => [creature.id, creature.initiative]),
    ),
  });

  const matchesValidatedSnapshot = (
    orderedCreatures: Creature[],
    snapshot: ValidatedInitiativeSnapshot | null,
  ) => {
    if (!snapshot) {
      return false;
    }
    if (orderedCreatures.length !== snapshot.orderedIds.length) {
      return false;
    }
    return orderedCreatures.every(
      (creature, index) =>
        snapshot.orderedIds[index] === creature.id &&
        snapshot.initiativesById[creature.id] === creature.initiative,
    );
  };

  const runWithScrollPreservation = (action: () => void) => {
    const viewport = { x: window.scrollX, y: window.scrollY };
    const containers = [...document.querySelectorAll<HTMLElement>('[data-preserve-scroll="true"]')];
    const containerScroll = containers.map((element) => ({
      element,
      top: element.scrollTop,
      left: element.scrollLeft,
    }));

    action();

    requestAnimationFrame(() => {
      window.scrollTo(viewport.x, viewport.y);
      for (const entry of containerScroll) {
        entry.element.scrollTop = entry.top;
        entry.element.scrollLeft = entry.left;
      }
    });
  };

  const activeIndex = sortedCreatures.findIndex((creature) => creature.id === activeCreatureId);
  const normalizedActiveIndex = activeIndex >= 0 ? activeIndex : 0;
  const activeCreature = sortedCreatures[normalizedActiveIndex] ?? null;
  const playerCount = creatures.filter((creature) => creature.isPlayer).length || 1;
  const nonPlayerCreatures = creatures.filter((creature) => !creature.isPlayer);
  const missingPlayerInitiatives = creatures.filter(
    (creature) => creature.isPlayer && creature.initiative <= 0,
  ).length;
  const canRollInitiative = missingPlayerInitiatives === 0;
  const baseCreatureXp = nonPlayerCreatures.reduce((sum, creature) => sum + (creature.xp ?? 0), 0);
  const multiplier = getEncounterMultiplier(nonPlayerCreatures.length, playerCount);
  const adjustedCreatureXp = Math.round(baseCreatureXp * multiplier);
  const perPlayerThreshold = ENCOUNTER_THRESHOLDS_BY_LEVEL[Math.min(20, Math.max(1, partyLevel))];
  const encounterThresholds = {
    easy: perPlayerThreshold.easy * playerCount,
    medium: perPlayerThreshold.medium * playerCount,
    hard: perPlayerThreshold.hard * playerCount,
    deadly: perPlayerThreshold.deadly * playerCount,
  };
  const encounterDifficulty =
    nonPlayerCreatures.length === 0
      ? 'None'
      : adjustedCreatureXp < encounterThresholds.easy
        ? 'Trivial'
        : adjustedCreatureXp < encounterThresholds.medium
          ? 'Easy'
          : adjustedCreatureXp < encounterThresholds.hard
            ? 'Medium'
            : adjustedCreatureXp < encounterThresholds.deadly
              ? 'Hard'
              : 'Deadly';

  const appendMissingTestMonsters = async (baseCreatures: Creature[]) => {
    const hydratedBaseCreatures = await Promise.all(
      baseCreatures.map(async (creature) => {
        if (!creature.sourceCreature) {
          return creature;
        }

        const needsRulesHydration =
          !creature.abilityScores ||
          creature.savingThrowBonuses === undefined ||
          creature.skillBonuses === undefined;

        if (!needsRulesHydration) {
          return creature;
        }

        try {
          const apiCreature = await creatureApi.getCreatureDetails(creature.sourceCreature.index);
          const hydrated = creatureApi.convertApiCreatureToCreature(apiCreature);

          return {
            ...creature,
            abilityScores: hydrated.abilityScores,
            proficiencyBonus: hydrated.proficiencyBonus,
            savingThrowBonuses: hydrated.savingThrowBonuses,
            skillBonuses: hydrated.skillBonuses,
            featureGroups: creature.featureGroups ?? hydrated.featureGroups,
          };
        } catch (error) {
          console.error(`Failed to hydrate creature data for ${creature.name}:`, error);
          return creature;
        }
      }),
    );

    const presentCreatureIndexes = new Set(
      hydratedBaseCreatures
        .map((creature) => creature.sourceCreature?.index)
        .filter((index): index is string => Boolean(index)),
    );

    const missingCreatureIndexes = TEST_CREATURE_INDEXES.filter(
      (creatureIndex) => !presentCreatureIndexes.has(creatureIndex),
    );
    if (missingCreatureIndexes.length === 0) {
      return hydratedBaseCreatures;
    }

    const importedCreatures = await Promise.all(
      missingCreatureIndexes.map(async (creatureIndex) => {
        const apiCreature = await creatureApi.getCreatureDetails(creatureIndex);
        const converted = creatureApi.convertApiCreatureToCreature(apiCreature);
        return {
          ...converted,
          initiative:
            converted.isPlayer || converted.initiative > 0 ? converted.initiative : rollD20(),
        };
      }),
    );

    return [...hydratedBaseCreatures, ...importedCreatures];
  };

  useEffect(() => {
    const restoreOrSeedEncounter = async () => {
      const savedEncounter = window.localStorage.getItem(ENCOUNTER_STORAGE_KEY);
      if (savedEncounter) {
        const parsedEncounter = JSON.parse(savedEncounter) as SavedEncounter;
        const nextCreatures = ensureEncounterCreatureIds(
          await appendMissingTestMonsters(parsedEncounter.creatures),
        );
        const nextSortedCreatures = sortCreatures(nextCreatures);
        setCreatures(nextCreatures);
        setActiveCreatureId(
          parsedEncounter.activeCreatureId || getFirstActiveCreatureId(nextCreatures),
        );
        setRound(parsedEncounter.round);
        setValidatedInitiativeSnapshot(
          parsedEncounter.validatedInitiativeSnapshot ?? toValidatedSnapshot(nextSortedCreatures),
        );
        setOrderDriftActive(Boolean(parsedEncounter.orderDriftActive));
        setOrderDriftAcknowledged(Boolean(parsedEncounter.orderDriftAcknowledged));
        setOrderDriftDismissed(Boolean(parsedEncounter.orderDriftDismissed));
        hasHydratedEncounter.current = true;
        return;
      }

      try {
        const nextCreatures = ensureEncounterCreatureIds(
          await appendMissingTestMonsters(initialCreatures),
        );
        setCreatures(nextCreatures);
        setActiveCreatureId(getFirstActiveCreatureId(nextCreatures));
        setValidatedInitiativeSnapshot(toValidatedSnapshot(sortCreatures(nextCreatures)));
      } catch (error) {
        console.error('Failed to seed test monsters:', error);
      } finally {
        hasHydratedEncounter.current = true;
      }
    };

    void restoreOrSeedEncounter();
  }, []);

  useEffect(() => {
    if (!hasHydratedEncounter.current) {
      return;
    }

    const encounter: SavedEncounter = {
      creatures,
      activeCreatureId,
      round,
      validatedInitiativeSnapshot,
      orderDriftActive,
      orderDriftAcknowledged,
      orderDriftDismissed,
    };

    window.localStorage.setItem(ENCOUNTER_STORAGE_KEY, JSON.stringify(encounter));
  }, [
    activeCreatureId,
    creatures,
    round,
    validatedInitiativeSnapshot,
    orderDriftActive,
    orderDriftAcknowledged,
    orderDriftDismissed,
  ]);

  useEffect(() => {
    const handleEscapeToCloseMenus = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      setLeftMenuOpen(false);
      setRightMenuOpen(false);
      setBuilderOpen(false);
    };

    window.addEventListener('keydown', handleEscapeToCloseMenus);
    return () => window.removeEventListener('keydown', handleEscapeToCloseMenus);
  }, []);

  const rollInitiative = () => {
    const nextCreatures = rollCreatureInitiative(creatures);
    setCreatures(nextCreatures);
    setActiveCreatureId(getFirstActiveCreatureId(nextCreatures));
    setRound(1);
    setValidatedInitiativeSnapshot(toValidatedSnapshot(sortCreatures(nextCreatures)));
    setTurnTransitionError(null);
    setOrderDriftActive(false);
    setOrderDriftAcknowledged(false);
    setOrderDriftDismissed(false);
  };

  const addCreature = (creature: Creature) => {
    const nextCreatures = ensureEncounterCreatureIds(addCreatureToEncounter(creatures, creature));
    setCreatures(nextCreatures);
    setTurnTransitionError(null);
    if (creatures.length === 0) {
      setActiveCreatureId(getFirstActiveCreatureId(nextCreatures));
      setRound(1);
      setValidatedInitiativeSnapshot(toValidatedSnapshot(sortCreatures(nextCreatures)));
    }
  };

  const openBuilder = (
    mode: BuilderMode,
    context: BuilderContext,
    creature: Creature | null = null,
  ) => {
    setBuilderMode(mode);
    setBuilderContext(context);
    setBuilderCreature(creature);
    setBuilderOpen(true);
  };

  const updateCreature = (updatedCreature: Creature) => {
    setCreatures((previousCreatures) =>
      previousCreatures.map((creature) =>
        creature.id === updatedCreature.id ? updatedCreature : creature,
      ),
    );
  };

  const handleSubmitCreature = (creature: Creature, action: CreatureSaveAction) => {
    const nextCreature = upsertCreatureInLibrary(creature);

    if (action === CreatureSaveActions.Add) {
      addCreature(nextCreature);
    } else if (builderContext === BuilderContexts.Encounter) {
      updateCreature(nextCreature);
    }

    setBuilderOpen(false);
    setBuilderCreature(null);
  };

  const removeCreature = (creatureId: string) => {
    const nextState = removeCreatureFromEncounter(creatures, creatureId, activeCreatureId);
    const pruned = pruneEffectsByRemovedAnchor(nextState.creatures, creatureId);
    setCreatures(pruned.creatures);
    setActiveCreatureId(nextState.activeCreatureId);
    if (nextState.roundReset) {
      setRound(1);
    }
    setTurnTransitionError(null);
    setEffectCleanupNotice(
      pruned.removedCount > 0
        ? `${pruned.removedCount} anchored effect${pruned.removedCount === 1 ? '' : 's'} removed.`
        : null,
    );
  };

  const nextTurn = () => {
    if (orderDriftActive && !orderDriftAcknowledged) {
      setTurnTransitionError(
        'Order drift must be acknowledged before turn progression can continue.',
      );
      return;
    }
    const activeIndex = sortedCreatures.findIndex((creature) => creature.id === activeCreatureId);
    if (sortedCreatures.length === 0 || activeIndex < 0) {
      setTurnTransitionError(
        'Invalid boundary transition: active creature continuity cannot be proven.',
      );
      return;
    }
    const isBoundaryTransition = activeIndex === sortedCreatures.length - 1;
    if (
      isBoundaryTransition &&
      !matchesValidatedSnapshot(sortedCreatures, validatedInitiativeSnapshot)
    ) {
      setTurnTransitionError(
        'Invalid boundary transition: initiative continuity changed. Recalculate initiative.',
      );
      return;
    }
    const nextState = getNextTurnState(creatures, activeCreatureId, round);
    runWithScrollPreservation(() => {
      setCreatures((previousCreatures) => {
        const withTurnStartUpdates = applyTurnStartEffectUpdates(
          previousCreatures,
          nextState.activeCreatureId,
        );
        return withTurnStartUpdates.map((creature) => {
          const refreshedCreature =
            creature.id === nextState.activeCreatureId ? resetLegendaryActions(creature) : creature;
          return nextState.round !== round
            ? expireCreatureEffectsAtRoundBoundary(refreshedCreature, nextState.round)
            : refreshedCreature;
        });
      });
      setActiveCreatureId(nextState.activeCreatureId);
      setRound(nextState.round);
      setTurnTransitionError(null);
      setValidatedInitiativeSnapshot(toValidatedSnapshot(sortedCreatures));
    });
  };

  const previousTurn = () => {
    if (orderDriftActive && !orderDriftAcknowledged) {
      setTurnTransitionError(
        'Order drift must be acknowledged before turn progression can continue.',
      );
      return;
    }
    const activeIndex = sortedCreatures.findIndex((creature) => creature.id === activeCreatureId);
    if (sortedCreatures.length === 0 || activeIndex < 0) {
      setTurnTransitionError(
        'Invalid boundary transition: active creature continuity cannot be proven.',
      );
      return;
    }
    const isBoundaryTransition = activeIndex === 0;
    if (
      isBoundaryTransition &&
      !matchesValidatedSnapshot(sortedCreatures, validatedInitiativeSnapshot)
    ) {
      setTurnTransitionError(
        'Invalid boundary transition: initiative continuity changed. Recalculate initiative.',
      );
      return;
    }
    const nextState = getPreviousTurnState(creatures, activeCreatureId, round);
    runWithScrollPreservation(() => {
      setActiveCreatureId(nextState.activeCreatureId);
      setRound(nextState.round);
      setTurnTransitionError(null);
      setValidatedInitiativeSnapshot(toValidatedSnapshot(sortedCreatures));
    });
  };

  const recalculateInitiative = () => {
    if (!validatedInitiativeSnapshot) {
      setTurnTransitionError('No validated initiative snapshot available for recovery.');
      return;
    }
    const byId = new Map(creatures.map((creature) => [creature.id, creature]));
    const restored = validatedInitiativeSnapshot.orderedIds
      .map((id) => byId.get(id))
      .filter((creature): creature is Creature => Boolean(creature))
      .map((creature) => ({
        ...creature,
        initiative: validatedInitiativeSnapshot.initiativesById[creature.id] ?? creature.initiative,
      }));

    const restoredIds = new Set(restored.map((creature) => creature.id));
    const extras = creatures.filter((creature) => !restoredIds.has(creature.id));
    const nextCreatures = [...restored, ...extras];
    const hasDrift = restored.length !== validatedInitiativeSnapshot.orderedIds.length;
    setCreatures(nextCreatures);
    setActiveCreatureId(restored[0]?.id ?? sortCreatures(nextCreatures)[0]?.id ?? '');
    setTurnTransitionError(null);
    setOrderDriftActive(hasDrift);
    setOrderDriftAcknowledged(!hasDrift);
    setOrderDriftDismissed(false);
  };

  const exportData = () => {
    const payload = createExportPayload({
      activeCreatureId,
      round,
      creatures,
      libraryCreatures: loadCreatureLibrary(),
    });

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dnd-toolkit-export-${payload.exportedAt.replaceAll(':', '-')}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const importData = () => {
    importFileInputRef.current?.click();
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    const shouldReplace = window.confirm(
      'Import will replace your current encounter and creature library. Continue?',
    );
    if (!shouldReplace) {
      return;
    }

    try {
      const raw = await file.text();
      const parsed = JSON.parse(raw) as unknown;
      if (!validateImportPayload(parsed)) {
        window.alert('Invalid import file format.');
        return;
      }

      const importedEncounterCreatures = ensureEncounterCreatureIds(
        toImportedCreatures(parsed.encounter.creatures),
      );
      const importedRound = toValidRound(parsed.encounter.round);
      const importedActiveCreatureId =
        parsed.encounter.activeCreatureId || getFirstActiveCreatureId(importedEncounterCreatures);

      setCreatures(importedEncounterCreatures);
      setActiveCreatureId(importedActiveCreatureId);
      setRound(importedRound);
      setValidatedInitiativeSnapshot(
        toValidatedSnapshot(sortCreatures(importedEncounterCreatures)),
      );
      setTurnTransitionError(null);
      setOrderDriftActive(false);
      setOrderDriftAcknowledged(false);
      setOrderDriftDismissed(false);
      saveCreatureLibrary(toImportedCreatures(parsed.library.creatures ?? []));
    } catch {
      window.alert('Failed to import file.');
    }
  };

  const resetEncounter = () => {
    void (async () => {
      window.localStorage.removeItem(ENCOUNTER_STORAGE_KEY);
      const nextCreatures = ensureEncounterCreatureIds(
        await appendMissingTestMonsters(initialCreatures),
      );
      setCreatures(nextCreatures);
      setActiveCreatureId(getFirstActiveCreatureId(nextCreatures));
      setRound(1);
      setValidatedInitiativeSnapshot(toValidatedSnapshot(sortCreatures(nextCreatures)));
      setTurnTransitionError(null);
      setOrderDriftActive(false);
      setOrderDriftAcknowledged(false);
      setOrderDriftDismissed(false);
    })();
  };

  return (
    <main className="combat-root ui-shell h-[100dvh] overflow-hidden px-3 py-3 text-white md:px-5 md:py-4">
      <div className="mx-auto flex h-full min-h-0 max-w-[1800px] flex-col gap-2.5">
        <header className="war-table-panel hidden items-center justify-between rounded-2xl border border-amber-200/20 px-4 py-2.5 xl:flex">
          <div>
            <h1 className="font-['Iowan_Old_Style',_'Palatino_Linotype',_Palatino,_serif] text-2xl text-amber-50">
              Combat Console
            </h1>
            <p className="text-xs uppercase tracking-[0.18em] text-stone-300">
              Round {round} · Turn {sortedCreatures.length === 0 ? 0 : normalizedActiveIndex + 1}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-stone-100 transition hover:bg-white/10"
            >
              Home
            </Link>
            <Link
              href="/settings"
              className="rounded-full border border-amber-200/20 bg-amber-100/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-100/15"
            >
              Settings
            </Link>
          </div>
        </header>

        <div className="flex items-center justify-between gap-3 xl:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-amber-200/20 bg-amber-100/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-100/20"
              onClick={() => setLeftMenuOpen(true)}
            >
              Controls
            </button>
            <button
              type="button"
              className="rounded-full border border-amber-200/20 bg-amber-100/10 px-4 py-2 text-sm text-amber-100 transition hover:bg-amber-100/20"
              onClick={() => setRightMenuOpen(true)}
            >
              Summary
            </button>
          </div>
          <Link
            href="/settings"
            className="rounded-full border border-amber-200/20 bg-amber-100/10 px-4 py-2 text-sm font-medium text-amber-100 transition hover:bg-amber-100/15"
          >
            Settings
          </Link>
        </div>

        {(leftMenuOpen || rightMenuOpen) && (
          <button
            type="button"
            aria-label="Close side panels"
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm xl:hidden"
            onClick={() => {
              setLeftMenuOpen(false);
              setRightMenuOpen(false);
            }}
          />
        )}

        <aside
          data-preserve-scroll="true"
          className={`ui-shell fixed inset-y-0 left-0 z-40 w-[20rem] overflow-y-auto overflow-x-hidden border-r border-amber-300/20 p-4 shadow-2xl transition-transform xl:hidden ${
            leftMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
              onClick={() => setLeftMenuOpen(false)}
            >
              Close
            </button>
          </div>
          <CreatureSearchPanel
            onAddCreature={addCreature}
            onCreateCreature={() => openBuilder(BuilderModes.Monster, BuilderContexts.New)}
            compact
          />
        </aside>

        <aside
          data-preserve-scroll="true"
          className={`ui-shell fixed inset-y-0 right-0 z-40 w-[20rem] overflow-y-auto overflow-x-hidden border-l border-amber-300/20 p-4 shadow-2xl transition-transform xl:hidden ${
            rightMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="mb-3 flex justify-end">
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-200 transition hover:bg-white/10"
              onClick={() => setRightMenuOpen(false)}
            >
              Close
            </button>
          </div>
          <ControlsPanel
            round={round}
            turn={sortedCreatures.length === 0 ? 0 : normalizedActiveIndex + 1}
            activeCreatureName={activeCreature?.name ?? 'None'}
            missingPlayerInitiatives={missingPlayerInitiatives}
            canRollInitiative={canRollInitiative}
            onEndCombat={resetEncounter}
            onRollInitiative={rollInitiative}
            onPreviousTurn={previousTurn}
            onNextTurn={nextTurn}
            onAddPc={() => openBuilder(BuilderModes.Pc, BuilderContexts.New)}
            onExportData={exportData}
            onImportData={importData}
            compact
          />
          <div className="mt-3">
            <SummaryPanel
              creatures={sortedCreatures}
              round={round}
              compact
              partyLevel={partyLevel}
              onPartyLevelChange={setPartyLevel}
              encounter={{
                playerCount,
                creatureCount: nonPlayerCreatures.length,
                baseXp: baseCreatureXp,
                adjustedXp: adjustedCreatureXp,
                multiplier,
                thresholds: encounterThresholds,
                difficulty: encounterDifficulty,
              }}
            />
          </div>
        </aside>

        <div className="flex-1 min-h-0 xl:hidden">
          <InitiativeList
            creatures={sortedCreatures}
            round={round}
            activeCreatureId={activeCreatureId}
            onUpdateCreature={updateCreature}
            onRemoveCreature={removeCreature}
            onAddCreature={addCreature}
            onCreateCreature={() => openBuilder(BuilderModes.Monster, BuilderContexts.New)}
            onEditCreature={(creature) =>
              openBuilder(
                creature.isPlayer ? BuilderModes.Pc : BuilderModes.Monster,
                BuilderContexts.Encounter,
                creature,
              )
            }
            compact
            showAddCreaturePanel={false}
          />
        </div>

        <div className="hidden flex-1 min-h-0 gap-3 xl:grid xl:grid-cols-[18rem_minmax(0,1fr)_20rem]">
          <aside
            data-preserve-scroll="true"
            className="ui-panel war-table-panel min-h-0 overflow-y-auto overflow-x-hidden shadow-xl"
          >
            <CreatureSearchPanel
              onAddCreature={addCreature}
              onCreateCreature={() => openBuilder(BuilderModes.Monster, BuilderContexts.New)}
            />
          </aside>

          <section className="ui-panel war-table-panel min-w-0 min-h-0 overflow-hidden shadow-xl">
            <InitiativeList
              creatures={sortedCreatures}
              activeCreatureId={activeCreatureId}
              round={round}
              onUpdateCreature={updateCreature}
              onRemoveCreature={removeCreature}
              onAddCreature={addCreature}
              onCreateCreature={() => openBuilder(BuilderModes.Monster, BuilderContexts.New)}
              onEditCreature={(creature) =>
                openBuilder(
                  creature.isPlayer ? BuilderModes.Pc : BuilderModes.Monster,
                  BuilderContexts.Encounter,
                  creature,
                )
              }
              showAddCreaturePanel={false}
            />
          </section>

          <aside
            data-preserve-scroll="true"
            className="ui-panel war-table-panel min-h-0 overflow-y-auto overflow-x-hidden shadow-xl"
          >
            <ControlsPanel
              round={round}
              turn={sortedCreatures.length === 0 ? 0 : normalizedActiveIndex + 1}
              activeCreatureName={activeCreature?.name ?? 'None'}
              missingPlayerInitiatives={missingPlayerInitiatives}
              canRollInitiative={canRollInitiative}
              onEndCombat={resetEncounter}
              onRollInitiative={rollInitiative}
              onPreviousTurn={previousTurn}
              onNextTurn={nextTurn}
              onAddPc={() => openBuilder(BuilderModes.Pc, BuilderContexts.New)}
              onExportData={exportData}
              onImportData={importData}
              compact
            />
            <SummaryPanel
              creatures={sortedCreatures}
              round={round}
              partyLevel={partyLevel}
              onPartyLevelChange={setPartyLevel}
              encounter={{
                playerCount,
                creatureCount: nonPlayerCreatures.length,
                baseXp: baseCreatureXp,
                adjustedXp: adjustedCreatureXp,
                multiplier,
                thresholds: encounterThresholds,
                difficulty: encounterDifficulty,
              }}
            />
          </aside>
        </div>

        <CreatureBuilderModal
          isOpen={builderOpen}
          mode={builderMode}
          context={builderContext}
          initialCreature={builderCreature}
          onClose={() => setBuilderOpen(false)}
          onSubmit={handleSubmitCreature}
        />
        <input
          ref={importFileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => void handleImportFile(event)}
        />

        {missingPlayerInitiatives > 0 && (
          <div className="fixed bottom-4 left-4 z-30 rounded-full border border-red-400/20 bg-red-950/90 px-4 py-2 text-sm text-red-100 shadow-lg shadow-black/30">
            {missingPlayerInitiatives} PC initiative{missingPlayerInitiatives === 1 ? '' : 's'}{' '}
            still need to be set.
          </div>
        )}
        {turnTransitionError && (
          <div className="fixed bottom-4 right-4 z-30 max-w-[28rem] rounded-2xl border border-amber-400/20 bg-amber-950/90 px-4 py-3 text-sm text-amber-100 shadow-lg shadow-black/30">
            <div>{turnTransitionError}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={recalculateInitiative}
                className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-xs font-semibold text-amber-100 transition hover:bg-amber-400/25"
              >
                Recalculate Initiative
              </button>
              <button
                type="button"
                onClick={() => setTurnTransitionError(null)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white transition hover:bg-white/20"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {orderDriftActive && !orderDriftDismissed && (
          <div className="fixed bottom-20 right-4 z-30 max-w-[28rem] rounded-2xl border border-rose-400/20 bg-rose-950/90 px-4 py-3 text-sm text-rose-100 shadow-lg shadow-black/30">
            <div>Order Drift detected: validated snapshot could not be fully restored.</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {!orderDriftAcknowledged && (
                <button
                  type="button"
                  onClick={() => setOrderDriftAcknowledged(true)}
                  className="rounded-full border border-rose-300/30 bg-rose-400/15 px-3 py-1 text-xs font-semibold text-rose-100 transition hover:bg-rose-400/25"
                >
                  Acknowledge
                </button>
              )}
              <button
                type="button"
                onClick={() => setOrderDriftDismissed(true)}
                className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white transition hover:bg-white/20"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {effectCleanupNotice && (
          <div className="fixed bottom-4 left-1/2 z-30 -translate-x-1/2 rounded-full border border-sky-400/20 bg-sky-950/90 px-4 py-2 text-xs text-sky-100 shadow-lg shadow-black/30">
            {effectCleanupNotice}
          </div>
        )}
      </div>
    </main>
  );
}
