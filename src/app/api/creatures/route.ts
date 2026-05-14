import { NextRequest, NextResponse } from 'next/server'

const DND_API_BASE = 'https://www.dnd5eapi.co/api/2014'
const DND_API_ORIGIN = 'https://www.dnd5eapi.co'
const CREATURE_LIST_REVALIDATE_SECONDS = 60 * 60
const MAX_SEARCH_RESULTS = 25

interface CreatureListItem {
  index: string
  name: string
  url: string
}

interface CreatureSearchItem extends CreatureListItem {
  challengeRating?: number
  xp?: number
}

interface CreatureListResponse {
  results: CreatureListItem[]
}

interface CreatureDetailResponse {
  challenge_rating: number
  xp: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''

    const response = await fetch(`${DND_API_BASE}/monsters`, {
      method: 'GET',
      next: {
        revalidate: CREATURE_LIST_REVALIDATE_SECONDS,
      },
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }

    const data: CreatureListResponse = await response.json()

    const filteredResults = data.results
      .filter((creature) => creature.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, MAX_SEARCH_RESULTS)

    const enrichedResults: CreatureSearchItem[] = await Promise.all(
      filteredResults.map(async (creature) => {
        try {
          const detailResponse = await fetch(`${DND_API_ORIGIN}${creature.url}`, {
            method: 'GET',
            next: {
              revalidate: CREATURE_LIST_REVALIDATE_SECONDS,
            },
            headers: {
              Accept: 'application/json',
            },
          })

          if (!detailResponse.ok) {
            return creature
          }

          const detailData: CreatureDetailResponse = await detailResponse.json()
          return {
            ...creature,
            challengeRating: detailData.challenge_rating,
            xp: detailData.xp,
          }
        } catch {
          return creature
        }
      })
    )

    return NextResponse.json(
      {
        count: enrichedResults.length,
        results: enrichedResults,
      },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CREATURE_LIST_REVALIDATE_SECONDS}, stale-while-revalidate=${CREATURE_LIST_REVALIDATE_SECONDS}`,
        },
      }
    )
  } catch (error) {
    console.error('Error fetching creatures:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creatures' },
      { status: 500 }
    )
  }
}
