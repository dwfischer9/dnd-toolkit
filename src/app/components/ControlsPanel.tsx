'use client'
import { useState } from 'react'
import CreatureSearchModal from './CreatureSearchModal'
import Creature from '../../types/creature'

interface ControlsPanelProps {
  onRollInitiative?: () => void
  onAddCreature?: (creature: Creature) => void
}

export default function ControlsPanel({ onRollInitiative, onAddCreature }: ControlsPanelProps) {
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)

  const handleAddCreature = (creature: Creature) => {
    onAddCreature?.(creature)
    setIsSearchModalOpen(false)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold mb-4">Combat Controls</h2>
      
      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold text-blue-300">Quick Actions</h3>
        <div className="space-y-2">
          <button className="w-full bg-red-600 px-4 py-2 rounded hover:bg-red-500 text-white">
            End Combat
          </button>
          <button 
            onClick={onRollInitiative}
            className="w-full bg-yellow-600 px-4 py-2 rounded hover:bg-yellow-500 text-black font-semibold"
          >
            Roll Initiative
          </button>
          <button 
            onClick={() => setIsSearchModalOpen(true)}
            className="w-full bg-green-600 px-4 py-2 rounded hover:bg-green-500 text-white"
          >
            Add Creature
          </button>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold text-blue-300">Combat Status</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Round:</span>
            <span className="font-bold">1</span>
          </div>
          <div className="flex justify-between">
            <span>Turn:</span>
            <span className="font-bold">1</span>
          </div>
          <div className="flex justify-between">
            <span>Active:</span>
            <span className="text-yellow-400 font-bold">Thia (PC)</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-4 space-y-4">
        <h3 className="text-lg font-semibold text-blue-300">Dice Roller</h3>
        <div className="space-y-2">
          <button className="w-full bg-purple-600 px-4 py-2 rounded hover:bg-purple-500 text-white">
            Roll d20
          </button>
          <button className="w-full bg-purple-600 px-4 py-2 rounded hover:bg-purple-500 text-white">
            Roll d6
          </button>
          <button className="w-full bg-purple-600 px-4 py-2 rounded hover:bg-purple-500 text-white">
            Roll d100
          </button>
        </div>
      </div>

      <CreatureSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onAddCreature={handleAddCreature}
      />
    </div>
  )
}
