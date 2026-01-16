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
    
    // Check if price data is valid (especially for stocks)
    const stockData = result.type === 'stock' ? result.data as any : null;
    const hasValidPrice = stockData 
      ? (stockData.price != null && stockData.price > 0)
      : true; // Crypto prices are handled separately
    
    // Determine cache duration based on type and price validity
    // If price is invalid (0 or missing), use short cache to allow retry
    // Stocks: 24 hours (fundamental data changes rarely), but 60 seconds if price is invalid
    // Crypto: 15 minutes (more volatile)
    let cacheMaxAge: number;
    let staleWhileRevalidate: number;
    
    if (result.type === 'stock') {
      if (hasValidPrice) {
        cacheMaxAge = 86400; // 24h for valid data
        staleWhileRevalidate = 172800; // 48h
      } else {
        cacheMaxAge = 60; // 60 seconds if price is invalid - allows quick retry
        staleWhileRevalidate = 120; // 2 minutes
      }
    } else {
      cacheMaxAge = 900; // 15min for crypto
      staleWhileRevalidate = 1800; // 30min
    }
    
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
