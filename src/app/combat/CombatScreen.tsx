'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import CreatureBuilderModal from './components/CreatureBuilderModal'
import ControlsPanel from './components/ControlsPanel'
import InitiativeList from './components/InitiativeList'
import SummaryPanel from './components/SummaryPanel'
import type Creature from '@/types/creature'
import { BuilderContexts, BuilderModes, StorageKeys } from '@/types/app'
import { CreatureSaveActions } from '@/types/app'
import type { BuilderContext, BuilderMode, CreatureSaveAction } from '@/types/app'
import { useLocale } from '@/app/LocaleProvider'
import type { AuthUser } from '@/services/auth'
import {
  addCreatureToEncounter,
  ensureEncounterCreatureIds,
  getFirstActiveCreatureId,
  getNextTurnState,
  getPreviousTurnState,
  removeCreatureFromEncounter,
  resetLegendaryActions,
  rollCreatureInitiative,
  sortCreatures,
} from './combatState'
import { creatureApi } from '@/services/creatureApi'
import { upsertCreatureInLibrary } from '@/services/creatureLibrary'

const initialCreatures: Creature[] = [
  { id: '1', name: 'Thia (PC)', ac: 15, maxHp: 20, currentHp: 20, initiative: 18, isPlayer: true },
 ]

const ENCOUNTER_STORAGE_KEY = StorageKeys.CombatEncounter
const TEST_CREATURE_INDEXES = ['adult-blue-dragon', 'goblin', 'lich']

interface SavedEncounter {
  creatures: Creature[]
  activeCreatureId: string
  round: number
}

const XP_MULTIPLIERS = [
  { min: 15, multiplier: 4 },
  { min: 11, multiplier: 3 },
  { min: 7, multiplier: 2.5 },
  { min: 3, multiplier: 2 },
  { min: 2, multiplier: 1.5 },
  { min: 1, multiplier: 1 },
] as const

const ENCOUNTER_THRESHOLDS_BY_LEVEL: Record<number, { easy: number; medium: number; hard: number; deadly: number }> = {
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
}

const getEncounterMultiplier = (creatureCount: number, playerCount: number) => {
  if (creatureCount <= 0) {
    return 1
  }

  const baseMultiplier =
    XP_MULTIPLIERS.find((rule) => creatureCount >= rule.min)?.multiplier ?? 1

  if (playerCount <= 2) {
    const raisedMultiplier =
      XP_MULTIPLIERS.find((rule) => rule.multiplier > baseMultiplier)?.multiplier
    return raisedMultiplier ?? baseMultiplier
  }

  if (playerCount >= 6) {
    const loweredRules = [...XP_MULTIPLIERS].reverse()
    const loweredMultiplier =
      loweredRules.find((rule) => rule.multiplier < baseMultiplier)?.multiplier
    return loweredMultiplier ?? baseMultiplier
  }

  return baseMultiplier
}

interface CombatScreenProps {
  currentUser?: AuthUser | null
  onSignOut?: () => void
}

export default function CombatScreen({ currentUser, onSignOut }: CombatScreenProps = {}) {
  const { t } = useLocale()
  const [creatures, setCreatures] = useState<Creature[]>([])
  const [activeCreatureId, setActiveCreatureId] = useState<string>(initialCreatures[0].id)
  const [round, setRound] = useState(1)
  const [partyLevel, setPartyLevel] = useState(1)
  const [leftMenuOpen, setLeftMenuOpen] = useState(false)
  const [rightMenuOpen, setRightMenuOpen] = useState(false)
  const [builderOpen, setBuilderOpen] = useState(false)
  const [builderMode, setBuilderMode] = useState<BuilderMode>(BuilderModes.Pc)
  const [builderContext, setBuilderContext] = useState<BuilderContext>(BuilderContexts.New)
  const [builderCreature, setBuilderCreature] = useState<Creature | null>(null)
  const hasHydratedEncounter = useRef(false)

  const sortedCreatures = useMemo(() => sortCreatures(creatures), [creatures])

  const activeIndex = sortedCreatures.findIndex((creature) => creature.id === activeCreatureId)
  const normalizedActiveIndex = activeIndex >= 0 ? activeIndex : 0
  const activeCreature = sortedCreatures[normalizedActiveIndex] ?? null
  const playerCount = creatures.filter((creature) => creature.isPlayer).length || 1
  const nonPlayerCreatures = creatures.filter((creature) => !creature.isPlayer)
  const missingPlayerInitiatives = creatures.filter(
    (creature) => creature.isPlayer && creature.initiative <= 0
  ).length
  const canRollInitiative = missingPlayerInitiatives === 0
  const baseCreatureXp = nonPlayerCreatures.reduce((sum, creature) => sum + (creature.xp ?? 0), 0)
  const multiplier = getEncounterMultiplier(nonPlayerCreatures.length, playerCount)
  const adjustedCreatureXp = Math.round(baseCreatureXp * multiplier)
  const perPlayerThreshold =
    ENCOUNTER_THRESHOLDS_BY_LEVEL[Math.min(20, Math.max(1, partyLevel))]
  const encounterThresholds = {
    easy: perPlayerThreshold.easy * playerCount,
    medium: perPlayerThreshold.medium * playerCount,
    hard: perPlayerThreshold.hard * playerCount,
    deadly: perPlayerThreshold.deadly * playerCount,
  }
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
              : 'Deadly'

  const appendMissingTestMonsters = async (baseCreatures: Creature[]) => {
    const hydratedBaseCreatures = await Promise.all(
      baseCreatures.map(async (creature) => {
        if (!creature.sourceCreature) {
          return creature
        }

        const needsRulesHydration =
          !creature.abilityScores ||
          creature.savingThrowBonuses === undefined ||
          creature.skillBonuses === undefined

        if (!needsRulesHydration) {
          return creature
        }

        try {
          const apiCreature = await creatureApi.getCreatureDetails(creature.sourceCreature.index)
          const hydrated = creatureApi.convertApiCreatureToCreature(apiCreature)

          return {
            ...creature,
            abilityScores: hydrated.abilityScores,
            proficiencyBonus: hydrated.proficiencyBonus,
            savingThrowBonuses: hydrated.savingThrowBonuses,
            skillBonuses: hydrated.skillBonuses,
            featureGroups: creature.featureGroups ?? hydrated.featureGroups,
          }
        } catch (error) {
          console.error(`Failed to hydrate creature data for ${creature.name}:`, error)
          return creature
        }
      })
    )

    const presentCreatureIndexes = new Set(
      hydratedBaseCreatures
        .map((creature) => creature.sourceCreature?.index)
        .filter((index): index is string => Boolean(index))
    )

    const missingCreatureIndexes = TEST_CREATURE_INDEXES.filter((creatureIndex) => !presentCreatureIndexes.has(creatureIndex))
    if (missingCreatureIndexes.length === 0) {
      return hydratedBaseCreatures
    }

    const importedCreatures = await Promise.all(
      missingCreatureIndexes.map(async (creatureIndex) => {
        const apiCreature = await creatureApi.getCreatureDetails(creatureIndex)
        return creatureApi.convertApiCreatureToCreature(apiCreature)
      })
    )

    return [...hydratedBaseCreatures, ...importedCreatures]
  }

  useEffect(() => {
    const restoreOrSeedEncounter = async () => {
      const savedEncounter = window.localStorage.getItem(ENCOUNTER_STORAGE_KEY)
      if (savedEncounter) {
        const parsedEncounter = JSON.parse(savedEncounter) as SavedEncounter
        const nextCreatures = ensureEncounterCreatureIds(
          await appendMissingTestMonsters(parsedEncounter.creatures)
        )
        setCreatures(nextCreatures)
        setActiveCreatureId(parsedEncounter.activeCreatureId || getFirstActiveCreatureId(nextCreatures))
        setRound(parsedEncounter.round)
        hasHydratedEncounter.current = true
        return
      }

      try {
        const nextCreatures = ensureEncounterCreatureIds(await appendMissingTestMonsters(initialCreatures))
        setCreatures(nextCreatures)
        setActiveCreatureId(getFirstActiveCreatureId(nextCreatures))
      } catch (error) {
        console.error('Failed to seed test monsters:', error)
      } finally {
        hasHydratedEncounter.current = true
      }
    }

    void restoreOrSeedEncounter()
  }, [])

  useEffect(() => {
    if (!hasHydratedEncounter.current) {
      return
    }

    const encounter: SavedEncounter = {
      creatures,
      activeCreatureId,
      round,
    }

    window.localStorage.setItem(ENCOUNTER_STORAGE_KEY, JSON.stringify(encounter))
  }, [activeCreatureId, creatures, round])

  useEffect(() => {
    const handleEscapeToCloseMenus = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return
      }
      setLeftMenuOpen(false)
      setRightMenuOpen(false)
      setBuilderOpen(false)
    }

    window.addEventListener('keydown', handleEscapeToCloseMenus)
    return () => window.removeEventListener('keydown', handleEscapeToCloseMenus)
  }, [])

  const rollInitiative = () => {
    const nextCreatures = rollCreatureInitiative(creatures)
    setCreatures(nextCreatures)
    setActiveCreatureId(getFirstActiveCreatureId(nextCreatures))
    setRound(1)
  }

  const addCreature = (creature: Creature) => {
    const nextCreatures = ensureEncounterCreatureIds(addCreatureToEncounter(creatures, creature))
    setCreatures(nextCreatures)
    if (creatures.length === 0) {
      setActiveCreatureId(getFirstActiveCreatureId(nextCreatures))
      setRound(1)
    }
  }

  const openBuilder = (
    mode: BuilderMode,
    context: BuilderContext,
    creature: Creature | null = null
  ) => {
    setBuilderMode(mode)
    setBuilderContext(context)
    setBuilderCreature(creature)
    setBuilderOpen(true)
  }

  const updateCreature = (updatedCreature: Creature) => {
    setCreatures((previousCreatures) =>
      previousCreatures.map((creature) =>
        creature.id === updatedCreature.id ? updatedCreature : creature
      )
    )
  }

  const handleSubmitCreature = (creature: Creature, action: CreatureSaveAction) => {
    const nextCreature = upsertCreatureInLibrary(creature)

    if (action === CreatureSaveActions.Add) {
      addCreature(nextCreature)
    } else if (builderContext === BuilderContexts.Encounter) {
      updateCreature(nextCreature)
    }

    setBuilderOpen(false)
    setBuilderCreature(null)
  }

  const removeCreature = (creatureId: string) => {
    const nextState = removeCreatureFromEncounter(creatures, creatureId, activeCreatureId)
    setCreatures(nextState.creatures)
    setActiveCreatureId(nextState.activeCreatureId)
    if (nextState.roundReset) {
      setRound(1)
    }
  }

  const nextTurn = () => {
    const nextState = getNextTurnState(creatures, activeCreatureId, round)
    setCreatures((previousCreatures) =>
      previousCreatures.map((creature) =>
        creature.id === nextState.activeCreatureId ? resetLegendaryActions(creature) : creature
      )
    )
    setActiveCreatureId(nextState.activeCreatureId)
    setRound(nextState.round)
  }

  const previousTurn = () => {
    const nextState = getPreviousTurnState(creatures, activeCreatureId, round)
    setActiveCreatureId(nextState.activeCreatureId)
    setRound(nextState.round)
  }

  return (
    <main className="h-[100dvh] overflow-hidden px-4 py-4 text-white md:px-6 lg:px-8">
      <div className="mx-auto flex h-full min-h-0 max-w-[1800px] flex-col gap-4">
        <div className="flex items-center justify-between gap-3 xl:hidden">
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
              onClick={() => setLeftMenuOpen(true)}
            >
              Controls
            </button>
            <button
              type="button"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
              onClick={() => setRightMenuOpen(true)}
            >
              Summary
            </button>
          </div>
          <Link
            href="/settings"
            className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15"
          >
            Settings
          </Link>
        </div>

        <section className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 shadow-2xl shadow-black/20 backdrop-blur">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-100">
                {t.AppTitle}
              </span>
              <span className="text-sm text-slate-300">
                Keep the encounter moving without losing the table flow.
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {currentUser && (
                <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
                  <div className="text-[9px] uppercase tracking-[0.28em] text-slate-400">{t.SignedIn}</div>
                  <div className="mt-1 text-base font-semibold">{currentUser.displayName}</div>
                </div>
              )}
              {onSignOut && currentUser && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  Sign Out
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
                <div className="text-[9px] uppercase tracking-[0.28em] text-slate-400">{t.Round}</div>
                <div className="mt-1 text-xl font-semibold">{round}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
                <div className="text-[9px] uppercase tracking-[0.28em] text-slate-400">{t.Turn}</div>
                <div className="mt-1 text-xl font-semibold">
                  {sortedCreatures.length === 0 ? '0' : normalizedActiveIndex + 1}
                </div>
              </div>
              <div className="min-w-0 rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
                <div className="text-[9px] uppercase tracking-[0.28em] text-slate-400">{t.Active}</div>
                <div className="mt-1 truncate text-base font-semibold">{activeCreature?.name ?? 'None'}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/40 px-3 py-2">
                <div className="text-[9px] uppercase tracking-[0.28em] text-slate-400">{t.Difficulty}</div>
                <div className="mt-1 text-base font-semibold">{encounterDifficulty}</div>
              </div>
            </div>
          </div>
        </section>

        {(leftMenuOpen || rightMenuOpen) && (
          <button
            type="button"
            aria-label="Close side panels"
            className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm xl:hidden"
            onClick={() => {
              setLeftMenuOpen(false)
              setRightMenuOpen(false)
            }}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-40 w-[19rem] overflow-y-auto border-r border-white/10 bg-slate-950 p-4 transition-transform xl:hidden ${
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
          <ControlsPanel
            round={round}
            turn={sortedCreatures.length === 0 ? 0 : normalizedActiveIndex + 1}
            activeCreatureName={activeCreature?.name ?? 'None'}
            missingPlayerInitiatives={missingPlayerInitiatives}
            canRollInitiative={canRollInitiative}
            onEndCombat={() => {
              void (async () => {
                window.localStorage.removeItem(ENCOUNTER_STORAGE_KEY)
                const nextCreatures = ensureEncounterCreatureIds(
                  await appendMissingTestMonsters(initialCreatures)
                )
                setCreatures(nextCreatures)
                setActiveCreatureId(getFirstActiveCreatureId(nextCreatures))
                setRound(1)
              })()
            }}
            onRollInitiative={rollInitiative}
            onPreviousTurn={previousTurn}
            onNextTurn={nextTurn}
            onAddPc={() => openBuilder(BuilderModes.Pc, BuilderContexts.New)}
            compact
          />
        </aside>

        <aside
          className={`fixed inset-y-0 right-0 z-40 w-[20rem] overflow-y-auto border-l border-white/10 bg-slate-950 p-4 transition-transform xl:hidden ${
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
          <SummaryPanel
            creatures={sortedCreatures}
            activeCreature={activeCreature}
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
        </aside>

        <div className="mt-4 flex-1 min-h-0 xl:hidden">
          <InitiativeList
            creatures={sortedCreatures}
            activeCreatureId={activeCreatureId}
            onUpdateCreature={updateCreature}
            onRemoveCreature={removeCreature}
            onAddCreature={addCreature}
            onCreateCreature={() => openBuilder(BuilderModes.Monster, BuilderContexts.New)}
            onEditCreature={(creature) =>
              openBuilder(
                creature.isPlayer ? BuilderModes.Pc : BuilderModes.Monster,
                BuilderContexts.Encounter,
                creature
              )
            }
            compact
          />
        </div>

        <div className="mt-4 hidden flex-1 min-h-0 gap-4 xl:grid xl:grid-cols-[15rem_minmax(0,1fr)_18rem]">
          <aside className="min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20 backdrop-blur">
            <ControlsPanel
              round={round}
              turn={sortedCreatures.length === 0 ? 0 : normalizedActiveIndex + 1}
              activeCreatureName={activeCreature?.name ?? 'None'}
              missingPlayerInitiatives={missingPlayerInitiatives}
              canRollInitiative={canRollInitiative}
              onEndCombat={() => {
                void (async () => {
                  window.localStorage.removeItem(ENCOUNTER_STORAGE_KEY)
                  const nextCreatures = ensureEncounterCreatureIds(
                    await appendMissingTestMonsters(initialCreatures)
                  )
                  setCreatures(nextCreatures)
                  setActiveCreatureId(getFirstActiveCreatureId(nextCreatures))
                  setRound(1)
                })()
              }}
              onRollInitiative={rollInitiative}
              onPreviousTurn={previousTurn}
              onNextTurn={nextTurn}
              onAddPc={() => openBuilder(BuilderModes.Pc, BuilderContexts.New)}
            />
          </aside>

          <section className="min-w-0 min-h-0 overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/20 backdrop-blur">
            <InitiativeList
              creatures={sortedCreatures}
              activeCreatureId={activeCreatureId}
              onUpdateCreature={updateCreature}
              onRemoveCreature={removeCreature}
              onAddCreature={addCreature}
              onCreateCreature={() => openBuilder(BuilderModes.Monster, BuilderContexts.New)}
              onEditCreature={(creature) =>
                openBuilder(
                  creature.isPlayer ? BuilderModes.Pc : BuilderModes.Monster,
                  BuilderContexts.Encounter,
                  creature
                )
              }
            />
          </section>

          <aside className="min-h-0 overflow-y-auto rounded-[2rem] border border-white/10 bg-white/[0.04] p-3 shadow-2xl shadow-black/20 backdrop-blur">
            <SummaryPanel
              creatures={sortedCreatures}
              activeCreature={activeCreature}
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

        {missingPlayerInitiatives > 0 && (
          <div className="fixed bottom-4 left-4 z-30 rounded-full border border-red-400/20 bg-red-950/90 px-4 py-2 text-sm text-red-100 shadow-lg shadow-black/30">
            {missingPlayerInitiatives} PC initiative{missingPlayerInitiatives === 1 ? '' : 's'} still need to be set.
          </div>
        )}
      </div>
    </main>
  )
}
