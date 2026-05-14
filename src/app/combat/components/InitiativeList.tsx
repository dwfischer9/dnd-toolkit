'use client'

import type Creature from '@/types/creature'
import CreatureCard from './CreatureCard'
import CreatureSearchPanel from './CreatureSearchPanel'
import { useLocale } from '@/app/LocaleProvider'

interface InitiativeListProps {
  creatures: Creature[]
  activeCreatureId: string
  onUpdateCreature: (creature: Creature) => void
  onRemoveCreature: (creatureId: string) => void
  onEditCreature?: (creature: Creature) => void
  onAddCreature?: (creature: Creature) => void
  onCreateCreature?: () => void
  compact?: boolean
}

export default function InitiativeList({
  creatures,
  activeCreatureId,
  onUpdateCreature,
  onRemoveCreature,
  onEditCreature,
  onAddCreature,
  onCreateCreature,
  compact = false,
}: InitiativeListProps) {
  const { t } = useLocale()
  return (
    <div className={compact ? 'flex h-full min-h-0 flex-col gap-2' : 'flex h-full min-h-0 flex-col gap-4'}>
      <h2 className={compact ? 'mb-1 text-lg font-bold' : 'mb-2 text-2xl font-bold'}>{t.InitiativeTracker}</h2>

      {onAddCreature && onCreateCreature && (
        <CreatureSearchPanel
          onAddCreature={onAddCreature}
          onCreateCreature={onCreateCreature}
          compact={compact}
        />
      )}

      <div className={`min-h-0 flex-1 overflow-y-auto pr-1 ${compact ? 'space-y-2' : 'space-y-4'}`}>
        {creatures.length === 0 && (
          <div className={`rounded-xl border border-dashed border-gray-700 text-center text-gray-400 ${compact ? 'p-3 text-sm' : 'p-6'}`}>
            <div>{t.NoCreatures}</div>
          </div>
        )}

        {creatures.map((creature) => (
          <CreatureCard
            key={creature.id}
            creature={{
              ...creature,
              isActive: creature.id === activeCreatureId,
            }}
            onUpdateCreature={onUpdateCreature}
            onRemoveCreature={onRemoveCreature}
            onEditCreature={onEditCreature}
          />
        ))}
      </div>
    </div>
  )
}
