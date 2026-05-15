import { NextRequest, NextResponse } from 'next/server';

const DND_API_BASE = 'https://www.dnd5eapi.co/api/2014';
const CREATURE_DETAIL_REVALIDATE_SECONDS = 60 * 60;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ index: string }> },
) {
  try {
    const { index } = await params;

    const response = await fetch(`${DND_API_BASE}/monsters/${encodeURIComponent(index)}`, {
      method: 'GET',
      next: {
        revalidate: CREATURE_DETAIL_REVALIDATE_SECONDS,
      },
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CREATURE_DETAIL_REVALIDATE_SECONDS}, stale-while-revalidate=${CREATURE_DETAIL_REVALIDATE_SECONDS}`,
      },
    });
  } catch (error) {
    console.error('Error fetching creature details:', error);
    return NextResponse.json({ error: 'Failed to fetch creature details' }, { status: 500 });
  }
}
