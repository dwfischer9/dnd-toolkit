'use client'
import { useState } from 'react'
import { Creature } from './CreatureCard'

type InitiativeItemProps = {
  creature: Creature
  isActive: boolean
  position: number
}

export default function InitiativeItem({
  creature,
  isActive,
  position,
}: InitiativeItemProps) {
  return (
    <div className="relative">
      <div className={`absolute -left-3`}
  </div>
  )
}
