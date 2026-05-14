import type Creature from '../../types/creature.ts'
import {
  CreatureFeatureTypes,
  CreatureHands,
  CreatureRollKinds,
} from '../../types/creature.ts'
import type { CreatureActionResult, CreatureFeature, CreatureHand, CreatureTrackedResource } from '../../types/creature.ts'

export const rollD20 = () => Math.floor(Math.random() * 20) + 1

const compareCreatures = (left: Creature, right: Creature) => {
  if (right.initiative !== left.initiative) {
    return right.initiative - left.initiative
  }

  return left.name.localeCompare(right.name)
}

export const sortCreatures = (creatures: Creature[]) => [...creatures].sort(compareCreatures)

/** Ensures every creature has a unique non-empty id (fixes API creatures that used index as id, or legacy saves). */
export const ensureEncounterCreatureIds = (creatures: Creature[]): Creature[] => {
  const seen = new Set<string>()
  return creatures.map((creature) => {
    if (creature.id && !seen.has(creature.id)) {
      seen.add(creature.id)
      return creature
    }
    const id = crypto.randomUUID()
    seen.add(id)
    return { ...creature, id }
  })
}

export const getActiveCreature = (creatures: Creature[], activeCreatureId: string) =>
  sortCreatures(creatures).find((creature) => creature.id === activeCreatureId) ?? null

export const getFirstActiveCreatureId = (creatures: Creature[]) => sortCreatures(creatures)[0]?.id ?? ''

export const rollCreatureInitiative = (
  creatures: Creature[],
  roller: () => number = rollD20
) =>
  creatures.map((creature) =>
    creature.isPlayer ? creature : { ...creature, initiative: roller() }
  )

export const addCreatureToEncounter = (
  creatures: Creature[],
  creature: Creature,
  options?: { idFactory?: () => string; roller?: () => number }
) => {
  const idFactory = options?.idFactory ?? (() => crypto.randomUUID())
  const roller = options?.roller ?? rollD20
  const occupiedIds = new Set(creatures.map((entry) => entry.id))
  const resolvedId =
    creature.id && !occupiedIds.has(creature.id) ? creature.id : idFactory()

  const nextCreature = {
    ...creature,
    id: resolvedId,
    initiative:
      creature.initiative > 0
        ? creature.initiative
        : creature.isPlayer
          ? 0
          : roller(),
    featureState: creature.featureState ?? initializeFeatureState(creature),
    legendaryActions: creature.legendaryActions ?? initializeLegendaryActions(creature),
    lastActionResult: creature.lastActionResult ?? null,
  }

  return [...creatures, nextCreature]
}

const parseDiceNotation = (dice: string) => {
  const match = dice.replace(/\s+/g, '').match(/^(\d+)d(\d+)([+-]\d+)?$/i)
  if (!match) {
    return null
  }

  return {
    count: Number(match[1]),
    sides: Number(match[2]),
    modifier: match[3] ? Number(match[3]) : 0,
  }
}

const rollFromNotation = (dice: string, roller: () => number = rollD20) => {
  const parsed = parseDiceNotation(dice)
  if (!parsed) {
    return null
  }

  const rolls = Array.from({ length: parsed.count }, () => {
    const raw = roller()
    return ((raw - 1) % parsed.sides) + 1
  })

  const total = rolls.reduce((sum, roll) => sum + roll, 0) + parsed.modifier
  return { rolls, total, modifier: parsed.modifier }
}

const formatDiceNotation = (dice: string) => dice.replace(/\s+/g, '')

const deriveFeatureUses = (feature: CreatureFeature): CreatureTrackedResource | undefined => {
  if (feature.usage?.times && feature.usage.times > 0) {
    return {
      current: feature.usage.times,
      maximum: feature.usage.times,
      label: feature.usage.type,
    }
  }

  return undefined
}

export const initializeFeatureState = (creature: Creature) =>
  Object.fromEntries(
    (creature.featureGroups ?? [])
      .flatMap((group) => group.features)
      .map((feature) => [
        feature.id,
        {
          uses: deriveFeatureUses(feature),
        },
      ])
  )

export const initializeLegendaryActions = (creature: Creature): CreatureTrackedResource | null =>
  creature.featureGroups?.some((group) => group.type === CreatureFeatureTypes.Legendary)
    ? {
        current: 3,
        maximum: 3,
        label: 'Legendary Actions',
      }
    : null

export const resetCreatureResources = (creature: Creature): Creature => ({
  ...creature,
  featureState: Object.fromEntries(
    Object.entries(creature.featureState ?? {}).map(([featureId, state]) => [
      featureId,
      {
        ...state,
        uses: state.uses
          ? {
              ...state.uses,
              current: state.uses.maximum,
            }
          : undefined,
      },
    ])
  ),
  legendaryActions: creature.legendaryActions
    ? {
        ...creature.legendaryActions,
        current: creature.legendaryActions.maximum,
      }
    : null,
})

export const resetLegendaryActions = (creature: Creature): Creature => ({
  ...creature,
  legendaryActions: creature.legendaryActions
    ? {
        ...creature.legendaryActions,
        current: creature.legendaryActions.maximum,
      }
    : null,
})

export type PerformCreatureFeatureOptions = {
  /** `two`: roll `versatileDamage` dice; `one` or omitted rolls `damage` dice. */
  versatileGrip?: CreatureHand
}

export const performCreatureFeature = (
  creature: Creature,
  feature: CreatureFeature,
  roller?: () => number,
  options?: PerformCreatureFeatureOptions
): Creature => {
  const rollDice = roller ?? rollD20
  const nextCreature = {
    ...creature,
    featureState: { ...(creature.featureState ?? {}) },
  }

  const featureState = nextCreature.featureState[feature.id] ?? {}
  if (featureState.uses && featureState.uses.current > 0) {
    featureState.uses = {
      ...featureState.uses,
      current: featureState.uses.current - 1,
    }
  }

  if (
    feature.type === CreatureFeatureTypes.Legendary &&
    nextCreature.legendaryActions &&
    nextCreature.legendaryActions.current > 0
  ) {
    nextCreature.legendaryActions = {
      ...nextCreature.legendaryActions,
      current: nextCreature.legendaryActions.current - (feature.legendaryCost ?? 1),
    }
  }

  nextCreature.featureState[feature.id] = featureState

  const useVersatile =
    options?.versatileGrip === CreatureHands.Two &&
    feature.versatileDamage &&
    feature.versatileDamage.length > 0
  const damageLines = useVersatile
    ? feature.versatileDamage!.map((entry) => ({ type: entry.type, dice: entry.dice }))
    : feature.damage ?? []

  const parts: string[] = []
  const rolls = [] as CreatureActionResult['rolls']
  if (feature.attackBonus !== undefined) {
    const attackRoll = rollDice()
    rolls.push({
      label: 'To hit',
      value: attackRoll + feature.attackBonus,
      detail: `d20 ${attackRoll} + ${feature.attackBonus}`,
      kind: CreatureRollKinds.Attack,
    })
    parts.push(`+${feature.attackBonus} to hit`)
  }

  if (damageLines.length > 0) {
    const gripNote = useVersatile ? ', two-handed' : ''
    const damageSummary = damageLines
      .map((damage) => {
        const rolled = rollFromNotation(damage.dice, rollDice)
        const damageKindLabel = `${damage.type}${useVersatile ? ' (2H)' : ''}`
        if (rolled) {
          rolls.push({
            label: damageKindLabel,
            value: rolled.total,
            detail: formatDiceNotation(damage.dice),
            kind: CreatureRollKinds.Damage,
          })
        }
        return rolled
          ? `${formatDiceNotation(damage.dice)} ${damage.type}${gripNote}`
          : `${damage.dice} ${damage.type}${gripNote}`
      })
      .join(', ')
    parts.push(damageSummary)
  }

  if (feature.savingThrow) {
    parts.push(`DC ${feature.savingThrow.dc} ${feature.savingThrow.ability} save`)
    rolls.push({
      label: 'DC',
      value: feature.savingThrow.dc,
      detail: feature.savingThrow.ability,
      kind: CreatureRollKinds.Save,
    })
  }

  if (parts.length === 0) {
    parts.push(feature.description)
  }

  const lastActionResult: CreatureActionResult = {
    featureId: feature.id,
    featureName: `${feature.name}${useVersatile ? ' (two-handed)' : ''}`,
    summary: parts.join(' • '),
    rolls,
  }

  return {
    ...nextCreature,
    lastActionResult,
  }
}

export const removeCreatureFromEncounter = (
  creatures: Creature[],
  creatureId: string,
  activeCreatureId: string
) => {
  const currentSortedCreatures = sortCreatures(creatures)
  const removedIndex = currentSortedCreatures.findIndex((creature) => creature.id === creatureId)
  const nextCreatures = creatures.filter((creature) => creature.id !== creatureId)

  if (nextCreatures.length === 0) {
    return { creatures: nextCreatures, activeCreatureId: '', roundReset: true }
  }

  if (creatureId !== activeCreatureId) {
    return { creatures: nextCreatures, activeCreatureId, roundReset: false }
  }

  const nextSortedCreatures = sortCreatures(nextCreatures)
  const nextIndex = Math.min(Math.max(removedIndex, 0), nextSortedCreatures.length - 1)

  return {
    creatures: nextCreatures,
    activeCreatureId: nextSortedCreatures[nextIndex].id,
    roundReset: false,
  }
}

export const getNextTurnState = (
  creatures: Creature[],
  activeCreatureId: string,
  round: number
) => {
  const sortedCreatures = sortCreatures(creatures)
  if (sortedCreatures.length === 0) {
    return { activeCreatureId: '', round: 1 }
  }

  const activeIndex = Math.max(
    0,
    sortedCreatures.findIndex((creature) => creature.id === activeCreatureId)
  )
  const nextIndex = (activeIndex + 1) % sortedCreatures.length

  return {
    activeCreatureId: sortedCreatures[nextIndex].id,
    round: nextIndex === 0 ? round + 1 : round,
  }
}

export const getPreviousTurnState = (
  creatures: Creature[],
  activeCreatureId: string,
  round: number
) => {
  const sortedCreatures = sortCreatures(creatures)
  if (sortedCreatures.length === 0) {
    return { activeCreatureId: '', round: 1 }
  }

  const activeIndex = Math.max(
    0,
    sortedCreatures.findIndex((creature) => creature.id === activeCreatureId)
  )
  const previousIndex = (activeIndex - 1 + sortedCreatures.length) % sortedCreatures.length

  return {
    activeCreatureId: sortedCreatures[previousIndex].id,
    round: activeIndex === 0 ? Math.max(1, round - 1) : round,
  }
}
