import { NextRequest, NextResponse } from 'next/server'

const DND_API_BASE = 'https://www.dnd5eapi.co/api/2014'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    
    // Fetch from D&D 5e API
    const response = await fetch(`${DND_API_BASE}/monsters`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    // Filter results based on query
    const filteredResults = data.results.filter((monster: any) =>
      monster.name.toLowerCase().includes(query.toLowerCase())
    )
    
    return NextResponse.json({
      count: filteredResults.length,
      results: filteredResults
    })
  } catch (error) {
    console.error('Error fetching creatures:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creatures' },
      { status: 500 }
    )
  }
}