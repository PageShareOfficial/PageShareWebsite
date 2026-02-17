import { NextRequest, NextResponse } from 'next/server';
import { fetchTickerChart } from '@/utils/api/chartApi';

/** GET /api/ticker/[tickername]/chart – crypto only (CoinGecko). */
export async function GET(
  request: NextRequest,
  { params }: { params: { tickername: string } }
) {
  try {
    const { tickername } = params;
    const searchParams = request.nextUrl.searchParams;
    const rangeParam = searchParams.get('range') || '30d';
    
    if (!tickername) {
      return NextResponse.json(
        { error: 'Ticker symbol is required' },
        { status: 400 }
      );
    }
    
    const validRanges = ['1d', '5d', '30d', '90d', '180d', '1y', 'all'];
    const timeRange = validRanges.includes(rangeParam) 
      ? (rangeParam as '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all')
      : '30d';
    
    const ticker = tickername.toUpperCase();
    
    let chartData;
    let retryCount = 0;
    const maxRetries = 2;
    
    while (retryCount <= maxRetries) {
      try {
        chartData = await fetchTickerChart(ticker, 'crypto', timeRange);
        
        if (chartData && chartData.length > 0) {
          break; // Success, exit retry loop
        }
        
        // If empty data and we haven't exhausted retries, try again
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          continue;
        }
      } catch (error) {
        console.error(`Error fetching chart data for ${ticker} (attempt ${retryCount + 1}):`, error);
        
        // If error and we haven't exhausted retries, try again
        if (retryCount < maxRetries) {
          retryCount++;
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
          continue;
        }
        
        // Final attempt failed, return empty data
        return NextResponse.json(
          {
            timeRange: timeRange,
            data: [],
            error: 'Failed to fetch chart data after retries',
          },
          { status: 200 }
        );
      }
    }
    
    if (!chartData || chartData.length === 0) {
      return NextResponse.json(
        {
          timeRange: timeRange,
          data: [],
          error: 'Chart data not available',
        },
        { status: 200 }
      );
    }
    
    // Cache duration: 1 hour for intraday, 6 hours for historical
    const isIntraday = timeRange === '1d' || timeRange === '5d';
    const cacheMaxAge = isIntraday ? 3600 : 21600; // 1h or 6h
    const staleWhileRevalidate = isIntraday ? 7200 : 43200; // 2h or 12h
    
    return NextResponse.json(
      {
        timeRange: timeRange,
        data: chartData,
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
