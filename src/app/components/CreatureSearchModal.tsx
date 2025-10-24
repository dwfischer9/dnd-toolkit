'use client'
import { useState, useEffect } from 'react'
import { creatureApi, CreatureSearchResult } from '../../services/creatureApi'
import Creature from '../../types/creature'

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

  // Debounced search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true)
      setError(null)
      try {
        console.log('Searching for:', searchQuery)
        const response = await creatureApi.searchCreatures(searchQuery)
        console.log('Search response:', response)
        setSearchResults(response.results || [])
      } catch (error) {
        console.error('Error searching creatures:', error)
        setError(error instanceof Error ? error.message : 'Failed to search creatures')
        setSearchResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300) // 300ms debounce

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const handleCreatureSelect = async (creature: CreatureSearchResult) => {
    setSelectedCreature(creature)
    setIsLoadingDetails(true)
    setError(null)

    try {
      const apiCreature = await creatureApi.getCreatureDetails(creature.index)
      const convertedCreature = creatureApi.convertApiCreatureToCreature(apiCreature)
      onAddCreature(convertedCreature)
      onClose()
      // Reset state
      setSearchQuery('')
      setSearchResults([])
      setSelectedCreature(null)
    } catch (error) {
      console.error('Error fetching creature details:', error)
      setError(error instanceof Error ? error.message : 'Failed to load creature details')
    } finally {
      setIsLoadingDetails(false)
    }
  }

  const handleClose = () => {
    onClose()
    setSearchQuery('')
    setSearchResults([])
    setSelectedCreature(null)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-white">Add Creature</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <input
            type="text"
            placeholder="Search for creatures..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="text-center py-4">
              <div className="text-gray-400">Searching...</div>
            </div>
          )}

          {error && (
            <div className="text-center py-4">
              <div className="text-red-400 bg-red-900 p-3 rounded-lg">{error}</div>
            </div>
          )}

          {!isLoading && searchQuery && searchResults.length === 0 && !error && (
            <div className="text-center py-4">
              <div className="text-gray-400">No creatures found</div>
            </div>
          )}

          {!isLoading && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((creature) => (
                <div
                  key={creature.index}
                  onClick={() => handleCreatureSelect(creature)}
                  className="p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-white">{creature.name}</div>
                      <div className="text-sm text-gray-400">Index: {creature.index}</div>
                    </div>
                    {isLoadingDetails && selectedCreature?.index === creature.index && (
                      <div className="text-blue-400">Loading...</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {!searchQuery && (
            <div className="text-center py-8">
              <div className="text-gray-400">Start typing to search for creatures</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
