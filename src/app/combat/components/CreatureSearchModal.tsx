'use client'

import { useCallback, useEffect, useState } from 'react'
import { creatureApi, CreatureSearchResult } from '../../../services/creatureApi'
import type Creature from '../../../types/creature'

interface CreatureSearchModalProps {
  isOpen: boolean
  onClose: () => void
  onAddCreature: (creature: Creature) => void
}

export default function CreatureSearchModal({ isOpen, onClose, onAddCreature }: CreatureSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<CreatureSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCreature, setSelectedCreature] = useState<CreatureSearchResult | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = useCallback(() => {
    onClose()
    setSearchQuery('')
    setSearchResults([])
    setSelectedCreature(null)
    setError(null)
    setIsLoading(false)
    setIsLoadingDetails(false)
  }, [onClose])

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      setIsLoading(false)
      return
    }

    const timeoutId = window.setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        const response = await creatureApi.searchCreatures(searchQuery)
        setSearchResults(response.results || [])
      } catch (searchError) {
        setError(searchError instanceof Error ? searchError.message : 'Failed to search creatures')
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleClose, isOpen])

  const handleCreatureSelect = async (creature: CreatureSearchResult) => {
    setSelectedCreature(creature)
    setIsLoadingDetails(true)
    setError(null)

    try {
      const apiCreature = await creatureApi.getCreatureDetails(creature.index)
      const convertedCreature = creatureApi.convertApiCreatureToCreature(apiCreature)
      onAddCreature(convertedCreature)
      handleClose()
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load creature details')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4 py-6 backdrop-blur-sm">
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-2xl shadow-black/40">
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Add Creature</h2>
            <p className="mt-1 text-sm text-slate-400">
              Search the creature index and add an enemy or ally to the encounter.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            Close
          </button>
        </div>

        <div className="border-b border-white/10 px-5 py-4">
          <input
            type="text"
            placeholder="Search for creatures..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-white outline-none placeholder:text-slate-500 focus:border-cyan-400/70 focus:bg-white/10"
            autoFocus
          />
        </div>

        <div className="max-h-[65vh] overflow-y-auto px-5 py-4">
          {isLoading && (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center text-slate-400">
              Searching...
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {!isLoading && searchQuery && searchResults.length === 0 && !error && (
            <div className="rounded-2xl border border-white/10 bg-white/5 py-10 text-center text-slate-400">
              No creatures found.
            </div>
          )}

          {!isLoading && searchResults.length > 0 && (
            <div className="grid gap-3">
              {searchResults.map((creature) => (
                <button
                  key={creature.index}
                  type="button"
                  onClick={() => handleCreatureSelect(creature)}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-cyan-400/40 hover:bg-white/[0.08]"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-white">{creature.name}</div>
                    <div className="mt-1 text-sm text-slate-400">
                      CR {creature.challengeRating ?? '?'} · XP {creature.xp ?? '?'}
                    </div>
                  </div>
                  {isLoadingDetails && selectedCreature?.index === creature.index && (
                    <div className="shrink-0 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                      Loading...
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {!searchQuery && (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 py-10 text-center text-slate-400">
              Start typing to search for creatures.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
