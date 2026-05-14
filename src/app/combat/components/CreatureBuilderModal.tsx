'use client'

import { useEffect, useMemo, useState } from 'react'
import { creatureApi, CreatureSearchResult } from '@/services/creatureApi'
import {
  loadCreatureLibrary,
  removeCreatureFromLibrary,
  upsertCreatureInLibrary,
} from '@/services/creatureLibrary'
import type Creature from '@/types/creature'
import { Abilities, AbilityLabels } from '@/types/creature'
import type { AbilityKey, CreatureFeatureGroup } from '@/types/creature'
import {
  CLASS_OPTIONS,
  CLASS_SPELLCASTING_ABILITIES,
  CLASS_SKILL_OPTIONS,
  CLASS_SKILL_PRESETS,
  Classes,
  type ClassName,
  type SkillLabel,
} from '@/types/class'
import { BuilderContexts, BuilderModes } from '@/types/app'
import { CreatureSaveActions } from '@/types/app'
import type { BuilderContext, BuilderMode, CreatureSaveAction } from '@/types/app'

interface CreatureBuilderModalProps {
  isOpen: boolean
  mode: BuilderMode
  context: BuilderContext
  initialCreature?: Creature | null
  onClose: () => void
  onSubmit: (creature: Creature, action: CreatureSaveAction) => void
}

const ABILITIES: Array<{ key: AbilityKey; label: string }> = [
  { key: Abilities.Strength, label: AbilityLabels.Strength },
  { key: Abilities.Dexterity, label: AbilityLabels.Dexterity },
  { key: Abilities.Constitution, label: AbilityLabels.Constitution },
  { key: Abilities.Intelligence, label: AbilityLabels.Intelligence },
  { key: Abilities.Wisdom, label: AbilityLabels.Wisdom },
  { key: Abilities.Charisma, label: AbilityLabels.Charisma },
]

const SKILL_OPTIONS = [
  { label: 'Acrobatics', ability: Abilities.Dexterity },
  { label: 'Animal Handling', ability: Abilities.Wisdom },
  { label: 'Arcana', ability: Abilities.Intelligence },
  { label: 'Athletics', ability: Abilities.Strength },
  { label: 'Deception', ability: Abilities.Charisma },
  { label: 'History', ability: Abilities.Intelligence },
  { label: 'Insight', ability: Abilities.Wisdom },
  { label: 'Intimidation', ability: Abilities.Charisma },
  { label: 'Investigation', ability: Abilities.Intelligence },
  { label: 'Medicine', ability: Abilities.Wisdom },
  { label: 'Nature', ability: Abilities.Intelligence },
  { label: 'Perception', ability: Abilities.Wisdom },
  { label: 'Performance', ability: Abilities.Charisma },
  { label: 'Persuasion', ability: Abilities.Charisma },
  { label: 'Religion', ability: Abilities.Intelligence },
  { label: 'Sleight of Hand', ability: Abilities.Dexterity },
  { label: 'Stealth', ability: Abilities.Dexterity },
  { label: 'Survival', ability: Abilities.Wisdom },
] as const satisfies readonly { label: SkillLabel; ability: AbilityKey }[]

const DEFAULT_CLASS = Classes.Fighter


const createDefaultCreature = (mode: BuilderMode): Creature => ({
  id: crypto.randomUUID(),
  name: mode === BuilderModes.Pc ? 'New PC' : 'New Monster',
  ac: 10,
  maxHp: 10,
  currentHp: 10,
  initiative: 0,
  isPlayer: mode === BuilderModes.Pc,
  isTemplate: true,
  characterClass: mode === BuilderModes.Pc ? DEFAULT_CLASS : undefined,
  characterLevel: mode === BuilderModes.Pc ? 1 : undefined,
  savingThrowProficiencies:
    mode === BuilderModes.Pc
      ? CLASS_OPTIONS.find((option) => option.label === DEFAULT_CLASS)?.savingThrows
      : undefined,
  abilityScores: {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
  },
  featureGroups: [],
  featureState: {},
  legendaryActions: null,
  skillProficiencies: mode === BuilderModes.Pc ? CLASS_SKILL_PRESETS[DEFAULT_CLASS] : [],
  spells: [],
})

const cloneCreature = (creature: Creature, mode: BuilderMode): Creature => ({
  ...creature,
  id: creature.id || crypto.randomUUID(),
  isPlayer: mode === BuilderModes.Pc,
  isTemplate: true,
  currentHp: creature.currentHp ?? creature.maxHp,
  abilityScores: creature.abilityScores ?? createDefaultCreature(mode).abilityScores,
  featureGroups: creature.featureGroups ?? [],
  featureState: creature.featureState ?? {},
  legendaryActions: creature.legendaryActions ?? null,
  characterClass: mode === BuilderModes.Pc ? creature.characterClass ?? DEFAULT_CLASS : undefined,
  characterLevel: mode === BuilderModes.Pc ? creature.characterLevel ?? 1 : undefined,
  spellcastingAbility:
    mode === BuilderModes.Pc
      ? creature.spellcastingAbility ??
        CLASS_SPELLCASTING_ABILITIES[(creature.characterClass as ClassName | undefined) ?? DEFAULT_CLASS] ??
        null
      : undefined,
  spellSaveDc: mode === BuilderModes.Pc ? creature.spellSaveDc : undefined,
  savingThrowProficiencies:
    mode === BuilderModes.Pc
      ? creature.savingThrowProficiencies ??
        CLASS_OPTIONS.find((option) => option.label === DEFAULT_CLASS)?.savingThrows
      : undefined,
  skillProficiencies: mode === BuilderModes.Pc ? creature.skillProficiencies ?? [] : undefined,
  spells: mode === BuilderModes.Pc ? creature.spells ?? [] : undefined,
})

export default function CreatureBuilderModal({
  isOpen,
  mode,
  context,
  initialCreature,
  onClose,
  onSubmit,
}: CreatureBuilderModalProps) {
  const [draft, setDraft] = useState<Creature>(() => cloneCreature(initialCreature ?? createDefaultCreature(mode), mode))
  const [library, setLibrary] = useState<Creature[]>([])
  const [monsterQuery, setMonsterQuery] = useState('')
  const [monsterResults, setMonsterResults] = useState<CreatureSearchResult[]>([])
  const [monsterLoading, setMonsterLoading] = useState(false)
  const [importPreview, setImportPreview] = useState<Creature | null>(null)
  const [selectedImportGroupIds, setSelectedImportGroupIds] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [draftContext, setDraftContext] = useState<BuilderContext>(context)
  const [spellText, setSpellText] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setLibrary(loadCreatureLibrary())
    setDraft(cloneCreature(initialCreature ?? createDefaultCreature(mode), mode))
    setMonsterQuery('')
    setMonsterResults([])
    setMonsterLoading(false)
    setImportPreview(null)
    setSelectedImportGroupIds([])
    setError(null)
    setDraftContext(context)
    setSpellText((initialCreature?.spells ?? []).join('\n'))
  }, [context, initialCreature, isOpen, mode])

  useEffect(() => {
    if (!monsterQuery.trim() || mode !== BuilderModes.Monster) {
      setMonsterResults([])
      setMonsterLoading(false)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setMonsterLoading(true)
      setError(null)

      try {
        const response = await creatureApi.searchCreatures(monsterQuery)
        setMonsterResults(response.results || [])
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : 'Failed to search creatures')
        setMonsterResults([])
      } finally {
        setMonsterLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [monsterQuery, mode])

  const featureCount = useMemo(
    () => (draft.featureGroups ?? []).reduce((sum, group) => sum + group.features.length, 0),
    [draft.featureGroups]
  )

  const updateField = <K extends keyof Creature>(field: K, value: Creature[K]) => {
    setDraft((previous) => ({
      ...previous,
      [field]: value,
    }))
  }

  const updateAbility = (ability: AbilityKey, value: number) => {
    setDraft((previous) => ({
      ...previous,
      abilityScores: {
        ...(previous.abilityScores ?? createDefaultCreature(mode).abilityScores!),
        [ability]: value,
      },
    }))
  }

  const updateHPFromMax = (value: number) => {
    setDraft((previous) => ({
      ...previous,
      maxHp: value,
      currentHp: previous.currentHp > value ? value : previous.currentHp,
    }))
  }

  const getAbilityModifier = (score: number) => Math.floor((score - 10) / 2)

  const getClassSavingThrows = (className: ClassName) =>
    CLASS_OPTIONS.find((option) => option.label === className)?.savingThrows ?? []

  const getClassSkillOptions = (className: ClassName) =>
    CLASS_SKILL_OPTIONS[className] ?? {
      skills: SKILL_OPTIONS.map((option) => option.label),
      pickCount: 0,
    }

  const getClassSkillPreset = (className: ClassName) =>
    CLASS_SKILL_PRESETS[className] ?? []

  const parseSpellList = (text: string) =>
    text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

  const getSpellcastingAbility = (className: ClassName) =>
    CLASS_SPELLCASTING_ABILITIES[className] ?? null

  const getSuggestedSpellSaveDc = (
    spellcastingAbility: AbilityKey | null | undefined,
    proficiencyBonus: number,
    abilityScores?: Creature['abilityScores']
  ) => {
    if (!spellcastingAbility) {
      return undefined
    }

    const score = abilityScores?.[spellcastingAbility] ?? 10
    return 8 + proficiencyBonus + getAbilityModifier(score)
  }

  const updateClass = (className: ClassName) => {
    const savingThrows = getClassSavingThrows(className)
    const classSkills = getClassSkillOptions(className)
    const recommendedSkillProficiencies = getClassSkillPreset(className)
    setDraft((previous) => ({
      ...previous,
      characterClass: className,
      savingThrowProficiencies: savingThrows,
      spellcastingAbility:
        getSpellcastingAbility(className) ?? previous.spellcastingAbility ?? null,
      skillProficiencies: recommendedSkillProficiencies.filter((skill) =>
        classSkills.skills.includes(skill)
      ),
    }))
  }

  const toggleSavingThrowProficiency = (ability: AbilityKey) => {
    setDraft((previous) => {
      const current = previous.savingThrowProficiencies ?? []
      return {
        ...previous,
        savingThrowProficiencies: current.includes(ability)
          ? current.filter((entry) => entry !== ability)
          : [...current, ability],
      }
    })
  }

  const updateSpellcastingAbility = (ability: AbilityKey | null) => {
    setDraft((previous) => ({
      ...previous,
      spellcastingAbility: ability,
    }))
  }

  const toggleSkillProficiency = (skill: SkillLabel) => {
    const className = (draft.characterClass ?? DEFAULT_CLASS) as ClassName
    const classSkills = getClassSkillOptions(className)

    if (!classSkills.skills.includes(skill)) {
      return
    }

    setDraft((previous) => {
      const current = (previous.skillProficiencies ?? []) as SkillLabel[]
      const isSelected = current.includes(skill)

      if (isSelected) {
        return {
          ...previous,
          skillProficiencies: current.filter((entry) => entry !== skill),
        }
      }

      if (classSkills.pickCount > 0 && current.length >= classSkills.pickCount) {
        return previous
      }

      return {
        ...previous,
        skillProficiencies: [...current, skill],
      }
    })
  }

  const editCreature = (creature: Creature) => {
    const nextMode: BuilderMode = creature.isPlayer ? BuilderModes.Pc : BuilderModes.Monster
    setError(null)
    setDraft(cloneCreature(creature, nextMode))
    setDraftContext(BuilderContexts.Library)
    setSelectedImportGroupIds([])
    setImportPreview(null)
    setMonsterQuery('')
    setMonsterResults([])
    setSpellText((creature.spells ?? []).join('\n'))
  }

  const mergeFeatureGroups = (incomingGroups: CreatureFeatureGroup[]) => {
    setDraft((previous) => {
      const existing = previous.featureGroups ?? []
      const nextByType = new Map<CreatureFeatureGroup['type'], CreatureFeatureGroup>()
      for (const group of existing) {
        nextByType.set(group.type, group)
      }
      for (const group of incomingGroups) {
        const existingGroup = nextByType.get(group.type)
        if (!existingGroup) {
          nextByType.set(group.type, group)
          continue
        }

        const nextFeaturesById = new Map(existingGroup.features.map((feature) => [feature.id, feature]))
        for (const feature of group.features) {
          nextFeaturesById.set(feature.id, feature)
        }

        nextByType.set(group.type, {
          ...existingGroup,
          features: [...nextFeaturesById.values()],
        })
      }

      return {
        ...previous,
        featureGroups: [...nextByType.values()],
      }
    })
  }

  const importMonsterFeatures = async (creature: CreatureSearchResult) => {
    setIsImporting(true)
    setError(null)

    try {
      const apiCreature = await creatureApi.getCreatureDetails(creature.index)
      const imported = creatureApi.convertApiCreatureToCreature(apiCreature)
      setImportPreview(imported)
      setSelectedImportGroupIds(imported.featureGroups?.map((group) => group.type) ?? [])
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Failed to import monster data')
    } finally {
      setIsImporting(false)
    }
  }

  const applyMonsterImport = () => {
    if (!importPreview?.featureGroups) {
      return
    }

    const nextGroups = importPreview.featureGroups.filter((group) =>
      selectedImportGroupIds.includes(group.type)
    )

    if (nextGroups.length === 0) {
      return
    }

    mergeFeatureGroups(nextGroups)
    setImportPreview(null)
    setSelectedImportGroupIds([])
  }

  const handleSave = (action: CreatureSaveAction) => {
    const selectedSavingThrows = draft.savingThrowProficiencies ?? []
    const selectedSkillProficiencies = draft.skillProficiencies ?? []
    const proficiencyBonus = draft.proficiencyBonus ?? 0
    const parsedSpells = parseSpellList(spellText)
    const spellcastingAbility =
      draft.spellcastingAbility ??
      getSpellcastingAbility((draft.characterClass as ClassName | undefined) ?? DEFAULT_CLASS)
    const suggestedSpellSaveDc = getSuggestedSpellSaveDc(
      spellcastingAbility,
      proficiencyBonus,
      draft.abilityScores
    )
    const savingThrowBonuses =
      mode === BuilderModes.Pc
        ? Object.fromEntries(
            ABILITIES.map(({ key }) => {
              const abilityScore = draft.abilityScores?.[key] ?? 10
              const abilityModifier = getAbilityModifier(abilityScore)
              const totalBonus = selectedSavingThrows.includes(key)
                ? abilityModifier + proficiencyBonus
                : abilityModifier
              return [key, totalBonus] as const
            })
          )
        : draft.savingThrowBonuses
    const skillBonuses =
      mode === BuilderModes.Pc
        ? Object.fromEntries(
            SKILL_OPTIONS.filter((skill) => selectedSkillProficiencies.includes(skill.label)).map((skill) => {
              const abilityScore = draft.abilityScores?.[skill.ability] ?? 10
              const abilityModifier = getAbilityModifier(abilityScore)
              return [skill.label, abilityModifier + proficiencyBonus] as const
            })
        )
        : draft.skillBonuses
    const spellSaveDc =
      mode === BuilderModes.Pc
        ? draft.spellSaveDc ?? suggestedSpellSaveDc
        : draft.spellSaveDc

    const nextCreature = upsertCreatureInLibrary({
      ...draft,
      isPlayer: mode === BuilderModes.Pc,
      isTemplate: true,
      currentHp: Math.min(draft.currentHp, draft.maxHp),
      savingThrowBonuses,
      skillBonuses,
      spellcastingAbility,
      spellSaveDc,
      spells: parsedSpells,
    })

    onSubmit(nextCreature, action)
    onClose()
    setLibrary(loadCreatureLibrary())
  }

  if (!isOpen) return null

  const isEditingEncounter = draftContext === BuilderContexts.Encounter
  const canAdd = !isEditingEncounter
  const title = isEditingEncounter
    ? 'Edit Creature'
    : initialCreature
      ? `Edit ${mode === BuilderModes.Pc ? 'PC' : 'Monster'}`
      : mode === BuilderModes.Pc
        ? 'Create PC'
        : 'Create Creature'
  const activeClassName = (draft.characterClass ?? DEFAULT_CLASS) as ClassName
  const activeClassSkillOptions = getClassSkillOptions(activeClassName)
  const recommendedSkillProficiencies = getClassSkillPreset(activeClassName)
  const selectedSkillProficiencies = draft.skillProficiencies ?? []
  const activeSpellcastingAbility =
    draft.spellcastingAbility ?? getSpellcastingAbility(activeClassName)
  const suggestedSpellSaveDc = getSuggestedSpellSaveDc(
    activeSpellcastingAbility,
    draft.proficiencyBonus ?? 0,
    draft.abilityScores
  )
  const currentSpellSaveDc = draft.spellSaveDc ?? suggestedSpellSaveDc ?? ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 px-3 py-4 backdrop-blur-sm">
      <div className="flex max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-white/[0.03] p-4 lg:flex lg:flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-200/80">
              Saved Roster
            </h3>
            <p className="mt-1 text-xs text-slate-400">Edit or add previously saved PCs and monsters.</p>
          </div>
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {library.length === 0 && (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.04] p-3 text-sm text-slate-400">
                No saved creatures yet.
              </div>
            )}
            {library.map((creature) => (
              <div key={creature.id} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{creature.name}</div>
                    <div className="mt-1 text-xs text-slate-400">
                      {creature.isPlayer ? 'PC' : 'Monster'} · AC {creature.ac} · HP {creature.maxHp}
                    </div>
                  </div>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                    Init {creature.initiative}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => editCreature(creature)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-white transition hover:bg-white/10"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onSubmit(creature, CreatureSaveActions.Add)}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-100 transition hover:bg-cyan-400/15"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      removeCreatureFromLibrary(creature.id)
                      setLibrary(loadCreatureLibrary())
                    }}
                    className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-xs text-red-100 transition hover:bg-red-500/20"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1 overflow-y-auto">
          <div className="border-b border-white/10 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-2xl font-semibold text-white">
                    {title}
                  </h2>
                  <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-[0.24em] text-slate-300">
                    {mode === BuilderModes.Pc ? 'Player Character' : 'Monster'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-400">
                  {mode === BuilderModes.Pc
                    ? 'Set ability scores, AC, HP, and initiative for a PC.'
                    : 'Build a custom monster, then import features, traits, and attacks from other monsters.'}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>

          <div className="grid gap-4 px-4 py-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_24rem]">
            <div className="space-y-4">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Name</span>
                    <input
                      value={draft.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Initiative</span>
                    <input
                      type="number"
                      value={draft.initiative}
                      onChange={(event) => updateField('initiative', Number(event.target.value) || 0)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">AC</span>
                    <input
                      type="number"
                      value={draft.ac}
                      onChange={(event) => updateField('ac', Number(event.target.value) || 0)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Proficiency</span>
                    <input
                      type="number"
                      value={draft.proficiencyBonus ?? 0}
                      onChange={(event) => updateField('proficiencyBonus', Number(event.target.value) || 0)}
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Max HP</span>
                    <input
                      type="number"
                      value={draft.maxHp}
                      onChange={(event) => updateHPFromMax(Math.max(1, Number(event.target.value) || 1))}
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Current HP</span>
                    <input
                      type="number"
                      value={draft.currentHp}
                      onChange={(event) =>
                        updateField('currentHp', Math.min(draft.maxHp, Math.max(0, Number(event.target.value) || 0)))
                      }
                      className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                    />
                  </label>
                </div>
              </section>

              {mode === BuilderModes.Pc && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                      Class
                    </h3>
                    <span className="text-xs text-slate-400">
                      Saving throws and progression
                    </span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Class</span>
                      <select
                        value={draft.characterClass ?? DEFAULT_CLASS}
                        onChange={(event) => updateClass(event.target.value as ClassName)}
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                      >
                        {CLASS_OPTIONS.map((option) => (
                          <option key={option.label} value={option.label}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-slate-400">Level</span>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={draft.characterLevel ?? 1}
                        onChange={(event) =>
                          updateField('characterLevel', Math.min(20, Math.max(1, Number(event.target.value) || 1)))
                        }
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                      />
                    </label>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Saving Throws</div>
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
                      {ABILITIES.map((ability) => {
                        const proficient = (draft.savingThrowProficiencies ?? []).includes(ability.key)
                        const score = draft.abilityScores?.[ability.key] ?? 10
                        const bonus = getAbilityModifier(score) + (proficient ? draft.proficiencyBonus ?? 0 : 0)

                        return (
                          <button
                            key={ability.key}
                            type="button"
                            onClick={() => toggleSavingThrowProficiency(ability.key)}
                            className={`rounded-2xl border px-3 py-2 text-left transition ${
                              proficient
                                ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100'
                                : 'border-white/10 bg-slate-950/70 text-slate-200 hover:border-white/20'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold">{ability.label}</span>
                              <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                                {proficient ? 'Prof' : 'No'}
                              </span>
                            </div>
                            <div className="mt-1 text-lg font-semibold tabular-nums">
                              {bonus >= 0 ? `+${bonus}` : bonus}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </section>
              )}

              {mode === BuilderModes.Pc && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                        Skill Proficiencies
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        {activeClassSkillOptions.pickCount > 0
                          ? `Choose ${activeClassSkillOptions.pickCount} for ${activeClassName}.`
                          : 'Choose skills based on the selected class.'}
                      </p>
                      {recommendedSkillProficiencies.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {recommendedSkillProficiencies.map((skillName) => (
                            <span
                              key={`recommended-skill:${skillName}`}
                              className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] text-cyan-100"
                            >
                              {skillName} recommended
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      {selectedSkillProficiencies.length}/{activeClassSkillOptions.pickCount || selectedSkillProficiencies.length}
                    </div>
                  </div>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                    {SKILL_OPTIONS.map((skill) => {
                      const allowed = activeClassSkillOptions.skills.includes(skill.label)
                      const proficient = selectedSkillProficiencies.includes(skill.label)
                      const score = draft.abilityScores?.[skill.ability] ?? 10
                      const bonus = getAbilityModifier(score) + (proficient ? draft.proficiencyBonus ?? 0 : 0)

                      return (
                        <button
                          key={skill.label}
                          type="button"
                          disabled={!allowed}
                          onClick={() => toggleSkillProficiency(skill.label)}
                          className={`rounded-2xl border px-3 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                            proficient
                              ? 'border-cyan-400/50 bg-cyan-400/10 text-cyan-100'
                              : allowed
                                ? 'border-white/10 bg-slate-950/70 text-slate-200 hover:border-white/20'
                                : 'border-white/5 bg-slate-950/30 text-slate-500'
                          }`}
                        >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold">{skill.label}</span>
                              <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                                {allowed
                                  ? recommendedSkillProficiencies.includes(skill.label)
                                    ? 'Rec'
                                    : 'Pick'
                                  : 'N/A'}
                              </span>
                            </div>
                          <div className="mt-1 text-lg font-semibold tabular-nums">
                            {bonus >= 0 ? `+${bonus}` : bonus}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              )}

              {mode === BuilderModes.Pc && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                        Spellcasting
                      </h3>
                      <p className="mt-1 text-xs text-slate-400">
                        Track prepared spells, the casting ability, and spell save DC.
                      </p>
                    </div>
                    <div className="text-xs text-slate-400">
                      Suggested DC{' '}
                      <span className="font-semibold text-cyan-100">
                        {suggestedSpellSaveDc ?? '—'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Casting Ability
                      </span>
                      <select
                        value={activeSpellcastingAbility ?? ''}
                        onChange={(event) =>
                          updateSpellcastingAbility(event.target.value ? (event.target.value as AbilityKey) : null)
                        }
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                      >
                        <option value="">None</option>
                        {ABILITIES.map((ability) => (
                          <option key={ability.key} value={ability.key}>
                            {ability.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Spell Save DC
                      </span>
                      <input
                        type="number"
                        value={currentSpellSaveDc}
                        onChange={(event) =>
                          updateField('spellSaveDc', Number(event.target.value) || 0)
                        }
                        className="h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none focus:border-cyan-400/70"
                      />
                    </label>
                  </div>

                  <div className="mt-3">
                    <label className="space-y-1">
                      <span className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Spells
                      </span>
                      <textarea
                        value={spellText}
                        onChange={(event) => setSpellText(event.target.value)}
                        placeholder="One spell per line"
                        rows={5}
                        className="min-h-28 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/70"
                      />
                    </label>
                    <div className="mt-1 text-[11px] text-slate-400">
                      Save lines one per spell. We’ll store them as a simple spell list.
                    </div>
                  </div>
                </section>
              )}

              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                    Ability Scores
                  </h3>
                  <span className="text-xs text-slate-400">
                    {featureCount} feature{featureCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                  {ABILITIES.map((ability) => (
                    <label key={ability.key} className="space-y-1">
                      <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                        {ability.label}
                      </span>
                      <input
                        type="number"
                        value={draft.abilityScores?.[ability.key] ?? 10}
                        onChange={(event) => updateAbility(ability.key, Number(event.target.value) || 0)}
                        className="h-12 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-center text-lg font-semibold tabular-nums text-white outline-none focus:border-cyan-400/70 sm:h-14 sm:text-xl"
                      />
                    </label>
                  ))}
                </div>
              </section>

              {mode === BuilderModes.Monster && (
                <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                        Import Monster Features
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Search a monster and import its traits, actions, legendary actions, and attacks.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={applyMonsterImport}
                      disabled={!importPreview || selectedImportGroupIds.length === 0 || isImporting}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/15 disabled:opacity-40"
                    >
                      {isImporting ? 'Loading...' : 'Import Selected'}
                    </button>
                  </div>

                  <input
                    type="text"
                    value={monsterQuery}
                    onChange={(event) => setMonsterQuery(event.target.value)}
                    placeholder="Search monsters to import..."
                    className="mt-3 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/70"
                  />

                  {monsterLoading && (
                    <div className="mt-3 rounded-xl border border-white/10 bg-slate-950/70 p-3 text-sm text-slate-400">
                      Searching monsters...
                    </div>
                  )}

                  {monsterResults.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {monsterResults.map((result) => (
                        <button
                          key={result.index}
                          type="button"
                          onClick={() => void importMonsterFeatures(result)}
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-left transition hover:border-cyan-400/40 hover:bg-slate-900/80"
                        >
                          <div className="min-w-0">
                            <div className="truncate font-medium text-white">{result.name}</div>
                            <div className="mt-0.5 text-xs text-slate-400">
                              CR {result.challengeRating ?? '?'} · XP {result.xp ?? '?'}
                            </div>
                          </div>
                          <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">
                            Load
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {importPreview?.featureGroups && importPreview.featureGroups.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
                        Available groups
                      </div>
                      <div className="grid gap-2">
                        {importPreview.featureGroups.map((group) => {
                          const checked = selectedImportGroupIds.includes(group.type)
                          return (
                            <label
                              key={group.type + ':' + group.label}
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2"
                            >
                              <div>
                                <div className="font-medium text-white">{group.label}</div>
                                <div className="text-xs text-slate-400">
                                  {group.features.length} feature{group.features.length === 1 ? '' : 's'}
                                </div>
                              </div>
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(event) => {
                                  setSelectedImportGroupIds((previous) =>
                                    event.target.checked
                                      ? [...previous, group.type]
                                      : previous.filter((groupType) => groupType !== group.type)
                                  )
                                }}
                                className="h-4 w-4 rounded border-white/20 bg-white/10"
                              />
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </section>
              )}
            </div>

            <div className="space-y-4">
              <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.24em] text-cyan-200/80">
                  Current Features
                </h3>
                <div className="mt-3 space-y-2">
                  {featureCount === 0 && (
                    <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/60 p-3 text-sm text-slate-400">
                      No features yet. Use monster import to add traits, attacks, or legendary actions.
                    </div>
                  )}
                  {(draft.featureGroups ?? []).map((group) => (
                    <div key={group.type + ':' + group.label} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium text-white">{group.label}</div>
                          <div className="text-xs text-slate-400">{group.features.length} items</div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((previous) => ({
                              ...previous,
                              featureGroups: (previous.featureGroups ?? []).filter(
                                (entry) => entry.type !== group.type || entry.label !== group.label
                              ),
                            }))
                          }
                          className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs text-slate-200 transition hover:bg-white/10"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 text-sm text-slate-300">
                        {group.features.map((feature) => feature.name).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                  {error}
                </div>
              )}

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleSave(CreatureSaveActions.Save)}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100"
                  >
                    {isEditingEncounter ? 'Save Changes' : 'Save to Library'}
                  </button>
                  {canAdd && (
                    <button
                      type="button"
                      onClick={() => handleSave(CreatureSaveActions.Add)}
                      className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/15"
                    >
                      Save & Add
                    </button>
                  )}
                  <div className="text-sm text-slate-400">
                    {mode === BuilderModes.Pc && draft.initiative <= 0 && 'PC initiative must be set before combat starts.'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
