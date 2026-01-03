import { NextRequest, NextResponse } from 'next/server';

// Next.js API route to search stocks by name or ticker (proxies Yahoo Finance search)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { suggestions: [] },
        { status: 200 }
      );
    }

    // Yahoo Finance search endpoint
    const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(query)}&quotesCount=10&newsCount=0`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { suggestions: [] },
        { status: 200 }
      );
    }
    
    const data = await response.json();
    
    if (!data.quotes || data.quotes.length === 0) {
      return NextResponse.json(
        { suggestions: [] },
        { status: 200 }
      );
    }
    
    // Map Yahoo Finance results to our format
    const suggestions = data.quotes
      .filter((quote: any) => quote.quoteType === 'EQUITY' || quote.quoteType === 'ETF') // Only stocks and ETFs
      .slice(0, 10) // Limit to 10 results
      .map((quote: any) => ({
        ticker: quote.symbol,
        name: quote.longname || quote.shortname || quote.symbol,
        type: 'stock' as const,
      }));
    
    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('Error in stock search API route:', error);
    return NextResponse.json(
      { suggestions: [] },
      { status: 200 }
    );
  }
}

