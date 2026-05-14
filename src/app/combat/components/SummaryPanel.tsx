'use client'

import type Creature from '@/types/creature'
import { CreatureRollKinds } from '@/types/creature'
import { useLocale } from '@/app/LocaleProvider'

interface SummaryPanelProps {
  creatures: Creature[]
  activeCreature: Creature | null
  round: number
  compact?: boolean
  partyLevel: number
  onPartyLevelChange: (nextLevel: number) => void
  encounter: {
    playerCount: number
    creatureCount: number
    baseXp: number
    adjustedXp: number
    multiplier: number
    thresholds: {
      easy: number
      medium: number
      hard: number
      deadly: number
    }
    difficulty: string
  }
}

const SummaryPanel = ({
  creatures,
  activeCreature,
  round,
  compact = false,
  partyLevel,
  onPartyLevelChange,
  encounter,
}: SummaryPanelProps) => {
  const { t } = useLocale()
  const playerCount = creatures.filter((creature) => creature.isPlayer).length
  const enemyCount = creatures.length - playerCount
  const totalHp = creatures.reduce((total, creature) => total + creature.currentHp, 0)
  const maxHp = creatures.reduce((total, creature) => total + creature.maxHp, 0)
  const multiplierLabel = encounter.multiplier === 1 ? 'x' : `${encounter.multiplier}x`
  const bestSavingThrows = Object.entries(activeCreature?.savingThrowBonuses ?? {})
    .sort((left, right) => right[1] - left[1])
    .slice(0, 2)

  return (
    <div className={compact ? 'space-y-2' : 'space-y-4'}>
      <h2 className={compact ? 'text-lg font-bold' : 'text-2xl font-bold'}>{t.Summary}</h2>

      <div className={`rounded-lg bg-gray-800 ${compact ? 'space-y-1.5 p-3 text-xs' : 'space-y-3 p-4'}`}>
        <div className="flex justify-between">
          <span>{t.Round}</span>
          <span className="font-semibold">{round}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.Creatures}</span>
          <span className="font-semibold">{creatures.length}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.Players}</span>
          <span className="font-semibold">{playerCount}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.Enemies}</span>
          <span className="font-semibold">{enemyCount}</span>
        </div>
        <div className="flex justify-between">
          <span>{t.TotalHp}</span>
          <span className="font-semibold">
            {totalHp}/{maxHp}
          </span>
        </div>
      </div>

      <div className={`rounded-lg bg-gray-800 ${compact ? 'space-y-1.5 p-3 text-xs' : 'space-y-3 p-4'}`}>
        <div className="flex items-center justify-between">
          <h3 className={compact ? 'text-sm font-semibold text-blue-300' : 'text-lg font-semibold text-blue-300'}>
            {t.Encounter}
          </h3>
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide text-gray-400">Party Lv</span>
            <input
              type="number"
              min={1}
              max={20}
              value={partyLevel}
              onChange={(event) =>
                onPartyLevelChange(Math.min(20, Math.max(1, Number(event.target.value) || 1)))
              }
              className="h-6 w-12 rounded border border-gray-600 bg-gray-900 px-1 text-center text-xs text-white"
            />
          </div>
        </div>
        <div className={compact ? 'space-y-1 text-xs' : 'space-y-1.5 text-sm'}>
          <div className="flex justify-between">
            <span>Difficulty</span>
            <span className="font-semibold">{encounter.difficulty}</span>
          </div>
          <div className="flex justify-between">
            <span>{t.Creatures} / {t.Players}</span>
            <span>
              {encounter.creatureCount} / {encounter.playerCount}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Base XP</span>
            <span>{encounter.baseXp}</span>
          </div>
          <div className="flex justify-between">
            <span>Adjusted XP</span>
            <span>{encounter.adjustedXp} ({multiplierLabel})</span>
          </div>
          <div className="text-[10px] text-gray-400">
            Thresholds E/M/H/D: {encounter.thresholds.easy}/{encounter.thresholds.medium}/
            {encounter.thresholds.hard}/{encounter.thresholds.deadly}
          </div>
        </div>
      </div>

      <div className={`rounded-lg bg-gray-800 ${compact ? 'space-y-2 p-3' : 'space-y-3 p-4'}`}>
        <h3 className={compact ? 'text-sm font-semibold text-blue-300' : 'text-lg font-semibold text-blue-300'}>
          {t.ActiveCreature}
        </h3>
          {activeCreature ? (
          <div className={compact ? 'space-y-1 text-xs' : 'space-y-2 text-sm'}>
            <div className="font-semibold text-white">{activeCreature.name}</div>
            <div>AC: {activeCreature.ac}</div>
            <div>
              HP: {activeCreature.currentHp}/{activeCreature.maxHp}
            </div>
            <div>Initiative: {activeCreature.initiative}</div>
            {activeCreature.spellSaveDc !== undefined && (
              <div>Spell DC: {activeCreature.spellSaveDc}</div>
            )}
            {bestSavingThrows.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wide text-gray-400">Best Saves</div>
                <div className="flex flex-wrap gap-1.5">
                  {bestSavingThrows.map(([ability, bonus]) => (
                    <span
                      key={`summary-best-save:${ability}`}
                      className="rounded-full border border-emerald-400/30 bg-emerald-950/35 px-2 py-0.5 text-[10px] text-emerald-100"
                    >
                      {ability.slice(0, 3).toUpperCase()} {bonus >= 0 ? `+${bonus}` : bonus}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {activeCreature.spells && activeCreature.spells.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] uppercase tracking-wide text-gray-400">Spells</div>
                <div className="flex flex-wrap gap-1.5">
                  {activeCreature.spells.map((spell) => (
                    <span
                      key={`summary-spell:${spell}`}
                      className="rounded-full border border-indigo-400/30 bg-indigo-950/35 px-2 py-0.5 text-[10px] text-indigo-100"
                    >
                      {spell}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {activeCreature.legendaryActions && (
              <div>
                {activeCreature.legendaryActions.label}: {activeCreature.legendaryActions.current}/
                {activeCreature.legendaryActions.maximum}
              </div>
            )}
            {activeCreature.lastActionResult && (
              <div className={`rounded bg-gray-900 ${compact ? 'p-1.5' : 'p-2'}`}>
                <div className="font-medium text-yellow-300">
                  {activeCreature.lastActionResult.featureName}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {activeCreature.lastActionResult.rolls.map((roll, index) => (
                    <div
                      key={`${activeCreature.id}:${activeCreature.lastActionResult?.featureId ?? 'roll'}:${roll.kind}:${index}:${roll.detail ?? roll.label}`}
                      className={`flex ${compact ? 'min-h-10 min-w-16 px-1.5 py-0.5 text-[9px]' : 'min-h-12 min-w-20 px-2 py-1 text-[10px]'} flex-col items-center justify-center rounded-md border text-center font-semibold ${
                        roll.kind === CreatureRollKinds.Damage
                          ? 'border-red-500 bg-red-950 text-red-100'
                          : roll.kind === CreatureRollKinds.Save
                            ? 'border-blue-500 bg-blue-950 text-blue-100'
                        : 'border-yellow-500 bg-yellow-950 text-yellow-100'
                      }`}
                    >
                      <span className="whitespace-nowrap">{roll.detail ?? roll.label}</span>
                      <span className="text-sm">{roll.value}</span>
                      {roll.detail && roll.kind !== CreatureRollKinds.Damage && (
                        <span className="whitespace-nowrap text-[9px] opacity-80">{roll.detail}</span>
                      )}
                      {roll.kind === CreatureRollKinds.Damage && (
                        <span className="whitespace-nowrap text-[9px] opacity-80">{roll.label}</span>
                      )}
                    </div>
                  ))}
                  <span className="text-gray-300">{activeCreature.lastActionResult.summary}</span>
                </div>
              </div>
            )}
            {!compact && activeCreature.featureGroups && activeCreature.featureGroups.length > 0 && (
              <div className="space-y-2 pt-2">
                {activeCreature.featureGroups.map((group) => (
                  <div key={group.type} className="rounded bg-gray-900 p-2">
                    <div className="font-medium text-yellow-300">{group.label}</div>
                    <div className="mt-1 text-gray-300">
                      {group.features.map((feature) => feature.name).join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-400">{t.NoActiveCreature}</div>
        )}
      </div>

      <div className={`rounded-lg bg-gray-800 ${compact ? 'space-y-2 p-3' : 'space-y-3 p-4'}`}>
        <h3 className={compact ? 'text-sm font-semibold text-blue-300' : 'text-lg font-semibold text-blue-300'}>
          {t.TurnOrder}
        </h3>
        <div className={compact ? 'space-y-1 text-xs' : 'space-y-2 text-sm'}>
          {creatures.map((creature) => (
            <div key={creature.id} className="flex justify-between">
              <span>{creature.name}</span>
              <span>{creature.initiative}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
SummaryPanel.displayName = 'SummaryPanel'
export default SummaryPanel
