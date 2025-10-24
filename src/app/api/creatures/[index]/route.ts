import { NextRequest, NextResponse } from 'next/server'

const DND_API_BASE = 'https://www.dnd5eapi.co/api/2014'

export async function GET(
  request: NextRequest,
  { params }: { params: { index: string } }
) {
  try {
    const { index } = params
    
    // Fetch creature details from D&D 5e API
    const response = await fetch(`${DND_API_BASE}/monsters/${index}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching creature details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch creature details' },
      { status: 500 }
    )
  }
}