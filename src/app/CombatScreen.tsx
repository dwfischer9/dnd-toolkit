'use client'
import CreatureCard from './components/CreatureCard'
import InitiativeList, { InitiativeListRef } from './components/InitiativeList'
import ControlsPanel from './components/ControlsPanel'
import SummaryPanel from './components/SummaryPanel'
import React, { useRef } from 'react'

export default function CombatScreen() {
  const initiativeListRef = useRef<InitiativeListRef>(null)
  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-8">
          <div className="w-50">
            <ControlsPanel
              onRollInitiative={() => initiativeListRef.current?.rollInitiative()}
              onAddCreature={(creature) => initiativeListRef.current?.addCreature(creature)}
            />
          </div>

          <div className="flex-1 w-50">
            <InitiativeList ref={initiativeListRef} />
          </div>
          <div className="w-70">
            <SummaryPanel />
          </div>
        </div>
      </div>
    </main>
  )
}

