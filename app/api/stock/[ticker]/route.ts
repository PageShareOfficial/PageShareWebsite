import { NextRequest, NextResponse } from 'next/server';

// Next.js API route to proxy Yahoo Finance requests (avoids CORS issues)
export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const { ticker } = params;
    
    if (!ticker) {
      return NextResponse.json(
        { error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }

    // Fetch from Yahoo Finance
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?interval=1d&range=1d`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 60 }, // Cache for 60 seconds
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch stock data' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
      return NextResponse.json(
        { error: 'Stock not found' },
        { status: 404 }
      );
    }
    
    const result = data.chart.result[0];
    const meta = result.meta;
    const regularMarketPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const changeAmount = regularMarketPrice - previousClose;
    const changePercent = ((changeAmount / previousClose) * 100);
    
    return NextResponse.json({
      ticker: ticker.toUpperCase(),
      name: meta.shortName || meta.longName || ticker,
      price: regularMarketPrice,
      change: changePercent,
      changeAmount: changeAmount,
    });
  } catch (error) {
    console.error('Error in stock API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

