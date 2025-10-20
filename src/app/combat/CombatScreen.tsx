'use client'
import CreatureCard from './components/CreatureCard'
import InitiativeList from './components/InitiativeList'
import React from 'react'
export default function CombatScreen() {
  return (
    <main className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-sm mx-auto">
        <InitiativeList />
      </div>
    </main>
  )
}

