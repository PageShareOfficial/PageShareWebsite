import { NextRequest, NextResponse } from 'next/server';
import { fetchCryptoDetail } from '@/utils/api/tickerApi';

/** GET /api/ticker/[tickername] – crypto only (CoinGecko). */
export async function GET(
  request: NextRequest,
  { params }: { params: { tickername: string } }
) {
  try {
    const { tickername } = params;
    const ticker = tickername?.toUpperCase();
    if (!ticker) {
      return NextResponse.json({ error: 'Ticker symbol is required' }, { status: 400 });
    }

    const crypto = await fetchCryptoDetail(ticker);
    if (!crypto) {
      return NextResponse.json({ error: 'Ticker not found' }, { status: 404 });
    }

    return NextResponse.json(
      {
        type: 'crypto' as const,
        data: crypto,
        lastUpdated: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=1800',
        },
      }
    );
  } catch (error) {
    console.error('Error in ticker API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
