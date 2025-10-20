'use client'
import { useState, useRef } from 'react'

export type Creature = {
  id: string
  name: string
  ac: number
  maxHp: number
  currentHp: number
  initiative: number
  isActive?: boolean
  isPlayer?: boolean
}

export default function CreatureCard({ creature }: { creature: Creature }) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const [hp, setHp] = useState(creature.currentHp)
  const handleDamage = (amount: number) => {
    setHp((prev) => Math.max(0, prev - amount))
  }
  const handleHeal = (amount: number) => {
    setHp((prev) => Math.min(creature.maxHp, prev + amount))
  }
  const modifyHealth = () => {
    const amount = textAreaRef.current?.value || ''
    if (amount.charAt(0) === '-') {
      handleDamage(parseInt(amount.slice(1)))
    } else if (amount.charAt(0) === '+') {
      handleHeal(parseInt(amount.slice(1)))
    } else {
      console.error("The damage string was not properly formatted. Use + or - prefix.");
    }
    // Clear the textarea after use
    if (textAreaRef.current) {
      textAreaRef.current.value = ''
    }
  }
  const hpPercent = hp / creature.maxHp * 100
  return (
    <div
      className={`rounded-2xl p-4 shadow-md transition-all border
      ${creature.isActive ? 'border-yellow-400 bg-gray-800' : 'border-gray-700 bg-gray-900'}
      ${creature.isPlayer ? 'text-blue-300' : 'text-red-300'}
      `}
    >
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">{creature.name}</h3>
        <span className="text-sm text-gray-400">Init: {creature.initiative}</span>
      </div>

      <div className="text-sm mb-2">AC: {creature.ac}</div>

      <div className="w-full bg-gray-700 h-3 rounded-full overflow-hidden mb-2">
        <div
          className="bg-green-500 h-full transition-all"
          style={{ width: `${hpPercent}%` }}
        />
      </div>

      <div className="text-sm mb-2">
        HP: {hp}/{creature.maxHp}
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={() => handleDamage(5)}
          className="bg-red-600 px-3 py-1 rounded text-white hover:bg-red-500"
        >
          -5
        </button>
        <button
          onClick={() => handleHeal(5)}
          className="bg-green-600 px-3 py-1 rounded text-white hover:bg-green-500"
        >
          +5
        </button>
        <textarea
          ref={textAreaRef}
          placeholder="±5"
          className="bg-gray-600 rounded text-white h-10 w-12 resize-none text-center text-sm"
        />
        <button
          onClick={modifyHealth}
          className="bg-blue-600 px-3 py-1 rounded text-white hover:bg-blue-500"
        >
          Apply
        </button>
      </div>
    </div>
  )
}


