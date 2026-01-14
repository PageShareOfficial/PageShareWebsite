import { NextRequest, NextResponse } from 'next/server';
import { fetchTickerDetail } from '@/utils/api/tickerApi';

/**
 * API route to fetch comprehensive ticker detail data
 * Supports both stocks and cryptocurrencies
 * 
 * GET /api/ticker/AAPL
 * GET /api/ticker/BTC
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tickername: string } }
) {
  try {
    const { tickername } = params;
    
    if (!tickername) {
      return NextResponse.json(
        { error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }
    
    const ticker = tickername.toUpperCase();
    
    // Fetch ticker detail data
    const result = await fetchTickerDetail(ticker);
    
    if (!result) {
      return NextResponse.json(
        { error: 'Ticker not found' },
        { status: 404 }
      );
    }
    
    // Determine cache duration based on type
    // Stocks: 24 hours (fundamental data changes rarely)
    // Crypto: 15 minutes (more volatile)
    const cacheMaxAge = result.type === 'stock' ? 86400 : 900; // 24h or 15min
    const staleWhileRevalidate = result.type === 'stock' ? 172800 : 1800; // 48h or 30min
    
    return NextResponse.json(
      {
        type: result.type,
        data: result.data,
        lastUpdated: new Date().toISOString(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': `public, s-maxage=${cacheMaxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
