/**
 * API utilities for fetching ticker chart/price history data
 * Uses Yahoo Finance for stocks, CoinGecko for crypto
 */

import { ChartDataPoint } from '@/types/ticker';

/**
 * Map time range to CoinGecko days parameter
 */
function getCoinGeckoDays(timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'): number {
  switch (timeRange) {
    case '1d':
      return 1;
    case '5d':
      return 7;
    case '30d':
      return 30;
    case '90d':
      return 90;
    case '180d':
      return 180;
    case '1y':
      return 365;
    case 'all':
      return 365; // CoinGecko max is 365 days for free tier
    default:
      return 30;
  }
}

/**
 * Map time range to CoinGecko interval
 */
function getCoinGeckoInterval(timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'): string {
  if (timeRange === '1d') {
    return 'hourly'; // For 1 day, use hourly data
  }
  return 'daily';
}

/**
 * Get coin ID from ticker (reuse from tickerApi)
 */
async function getCoinIdFromTicker(ticker: string): Promise<string | null> {
  const TICKER_TO_COIN_ID: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'BNB': 'binancecoin',
    'SOL': 'solana',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
    'MATIC': 'matic-network',
    'AVAX': 'avalanche-2',
    'LTC': 'litecoin',
    'LINK': 'chainlink',
    'UNI': 'uniswap',
    'ATOM': 'cosmos',
    'ETC': 'ethereum-classic',
    'XLM': 'stellar',
    'ALGO': 'algorand',
    'VET': 'vechain',
    'ICP': 'internet-computer',
  };
  
  const upperTicker = ticker.toUpperCase();
  
  if (TICKER_TO_COIN_ID[upperTicker]) {
    return TICKER_TO_COIN_ID[upperTicker];
  }
  
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker.toLowerCase())}`;
    const searchResponse = await fetch(searchUrl);
    
    if (!searchResponse.ok) {
      return null;
    }
    
    const searchData = await searchResponse.json();
    
    if (!searchData.coins || searchData.coins.length === 0) {
      return null;
    }
    
    const exactMatch = searchData.coins.find((coin: any) => 
      coin.symbol.toLowerCase() === ticker.toLowerCase()
    );
    
    if (exactMatch) {
      return exactMatch.id;
    }
    
    return searchData.coins[0].id;
  } catch (error) {
    return null;
  }
}

/**
 * Map time range to Yahoo Finance range parameter
 */
function getYahooRange(timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'): string {
  switch (timeRange) {
    case '1d':
      return '1d';
    case '5d':
      return '5d';
    case '30d':
      return '1mo';
    case '90d':
      return '3mo';
    case '180d':
      return '6mo';
    case '1y':
      return '1y';
    case 'all':
      return 'max';
    default:
      return '1mo';
  }
}

/**
 * Map time range to Yahoo Finance interval parameter
 */
function getYahooInterval(timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'): string {
  if (timeRange === '1d') {
    return '5m'; // 5-minute intervals for 1 day
  }
  if (timeRange === '5d') {
    return '1h'; // 1-hour intervals for 7 days
  }
  return '1d'; // Daily intervals for longer ranges
}

/**
 * Fetch stock price history from Yahoo Finance
 */
export async function fetchStockChart(
  ticker: string,
  timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'
): Promise<ChartDataPoint[]> {
  try {
    const range = getYahooRange(timeRange);
    const interval = getYahooInterval(timeRange);
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker.toUpperCase()}?interval=${interval}&range=${range}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    });
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.chart?.result?.[0]?.timestamp || !data.chart.result[0].indicators?.quote?.[0]) {
      return [];
    }
    
    const result = data.chart.result[0];
    const timestamps = result.timestamp as number[];
    const quote = result.indicators.quote[0];
    const closes = quote.close as number[];
    const opens = quote.open as number[];
    const highs = quote.high as number[];
    const lows = quote.low as number[];
    const volumes = quote.volume as number[];
    
    // Convert to ChartDataPoint array
    const chartData: ChartDataPoint[] = [];
    
    for (let i = 0; i < timestamps.length; i++) {
      if (closes[i] !== null && closes[i] !== undefined) {
        // For 1D data, preserve full ISO timestamp with time for 5-minute intervals
        // For other ranges, use date only
        const timestamp = timestamps[i] * 1000;
        const dateObj = new Date(timestamp);
        const date = timeRange === '1d' 
          ? dateObj.toISOString() // Full timestamp for 1D (includes time)
          : dateObj.toISOString().split('T')[0]; // Date only for longer ranges
        
        chartData.push({
          date: date,
          price: closes[i],
          volume: volumes[i] || 0,
          open: opens[i] || closes[i],
          high: highs[i] || closes[i],
          low: lows[i] || closes[i],
          close: closes[i],
        });
      }
    }
    
    return chartData;
  } catch (error) {
    return [];
  }
}

/**
 * Fetch crypto price history from CoinGecko market_chart
 */
export async function fetchCryptoChart(
  coinId: string,
  timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'
): Promise<ChartDataPoint[]> {
  try {
    const days = getCoinGeckoDays(timeRange);
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      return [];
    }
    
    const data = await response.json();
    
    if (!data.prices || !Array.isArray(data.prices)) {
      return [];
    }
    
    // Convert to ChartDataPoint array
    const chartData: ChartDataPoint[] = [];
    const prices = data.prices as [number, number][]; // [timestamp, price]
    const volumes = data.total_volumes as [number, number][] | undefined; // [timestamp, volume]
    
    // Create volume map for quick lookup
    const volumeMap = new Map<number, number>();
    if (volumes) {
      for (const [timestamp, volume] of volumes) {
        volumeMap.set(timestamp, volume);
      }
    }
    
    for (const [timestamp, price] of prices) {
      const date = new Date(timestamp).toISOString().split('T')[0];
      chartData.push({
        date: date,
        price: price,
        volume: volumeMap.get(timestamp),
      });
    }
    
    return chartData;
  } catch (error) {
    return [];
  }
}

/**
 * Fetch chart data (auto-detects stock/crypto)
 */
export async function fetchTickerChart(
  ticker: string,
  tickerType: 'stock' | 'crypto',
  timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'
): Promise<ChartDataPoint[]> {
  if (tickerType === 'crypto') {
    const coinId = await getCoinIdFromTicker(ticker);
    if (!coinId) {
      return [];
    }
    return fetchCryptoChart(coinId, timeRange);
  } else {
    return fetchStockChart(ticker, timeRange);
  }
}
