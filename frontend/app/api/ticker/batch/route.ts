import { NextRequest, NextResponse } from 'next/server';
import { fetchCryptoDetail } from '@/utils/api/tickerApi';
import type { CryptoDetailData } from '@/types/ticker';

export const dynamic = 'force-dynamic';

/** GET /api/ticker/batch?symbols=BTC,ETH,SOL – returns array of ticker details for watchlist enrichment. */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const symbolsParam = searchParams.get('symbols');
    if (!symbolsParam?.trim()) {
      return NextResponse.json({ error: 'symbols query is required (e.g. ?symbols=BTC,ETH,SOL)' }, { status: 400 });
    }

    const symbols = symbolsParam
      .split(',')
      .map((s) => s.trim().toUpperCase())
      .filter(Boolean);

    if (symbols.length === 0) {
      return NextResponse.json({ data: [] });
    }

    // Cap batch size to avoid timeouts
    const MAX = 20;
    const toFetch = symbols.slice(0, MAX);

    const results = await Promise.all(
      toFetch.map(async (ticker) => {
        const crypto = await fetchCryptoDetail(ticker);
        if (!crypto) return { ticker, data: null };
        return { ticker, data: crypto as CryptoDetailData };
      })
    );

    const data = results.map(({ ticker, data }) => ({
      ticker,
      type: 'crypto' as const,
      data,
      lastUpdated: new Date().toISOString(),
    }));

    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Error in ticker batch API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
