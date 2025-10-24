'use client'
import React, { useState, forwardRef, useImperativeHandle } from 'react'
import CreatureCard from './CreatureCard'
import Creature from '../../types/creature'

export interface InitiativeListRef {
  rollInitiative: () => void
  addCreature: (creature: Creature) => void
  removeCreature: (Creature: Creature) => void
}

const InitiativeList = forwardRef<InitiativeListRef>((props, ref) => {
  const [creatures, setCreatures] = useState<Creature[]>([
    { id: '1', name: 'Thia (PC)', ac: 15, maxHp: 20, currentHp: 20, initiative: 18, isPlayer: true },
    { id: '2', name: 'Goblin #1', ac: 13, maxHp: 7, currentHp: 7, initiative: 14 },
    { id: '3', name: 'Goblin #2', ac: 13, maxHp: 7, currentHp: 7, initiative: 11 },
    { id: '4', name: 'Aric (PC)', ac: 16, maxHp: 17, currentHp: 17, initiative: 9, isPlayer: true },
  ])

  const [activeIndex, setActiveIndex] = useState(0)
  const nextTurn = () => {
    setActiveIndex((prev) => (prev + 1) % creatures.length)
  }

  const prevTurn = () => {
    setActiveIndex((prev) => (prev - 1 + creatures.length) % creatures.length)
  }

  const rollInitiative = () => {
    setCreatures(prevCreatures =>
      prevCreatures.map(creature => {
        // Only roll for non-player creatures
        if (!creature.isPlayer) {
          const roll = Math.floor(Math.random() * 20) + 1
          return { ...creature, initiative: roll }
        }
        return creature
      })
    )
    // Reset active turn to first creature after rolling
    setActiveIndex(0)
  }

  const addCreature = (newCreature: Creature) => {
    // Generate a unique ID if not provided
    const creatureWithId = {
      ...newCreature,
      id: newCreature.id || Math.random().toString(36).substr(2, 9)
    }

    setCreatures(prevCreatures => [...prevCreatures, creatureWithId])
  }
  const removeCreature = (currentCreature: Creature) => {
  }
  // Expose the rollInitiative and addCreature functions to parent components
  useImperativeHandle(ref, () => ({
    rollInitiative,
    addCreature,
    removeCreature
  }))
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-2">Initiative Tracker</h2>

      {/* Render cards sorted by initiative */}
      {creatures
        .sort((a, b) => b.initiative - a.initiative)
        .map((creature, i) => (
          <CreatureCard
            key={creature.id}
            creature={{
              ...creature,
              isActive: i === activeIndex,
            }}
          />
        ))}

      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={prevTurn}
          className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600"
        >
          ← Prev Turn
        </button>
        <button
          onClick={nextTurn}
          className="bg-yellow-600 px-4 py-2 rounded text-black font-bold hover:bg-yellow-500"
        >
          Next Turn →
        </button>
      </div>
    </div>
  )
})

InitiativeList.displayName = 'InitiativeList'

export default InitiativeList
