/**
 * Chart/price history – crypto only (CoinGecko). US stocks removed.
 */

import { ChartDataPoint } from '@/types/ticker';

function getCoinGeckoDays(timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'): number {
  switch (timeRange) {
    case '1d': return 1;
    case '5d': return 7;
    case '30d': return 30;
    case '90d': return 90;
    case '180d': return 180;
    case '1y': return 365;
    case 'all': return 365;
    default: return 30;
  }
}

const TICKER_TO_COIN_ID: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana', 'XRP': 'ripple',
  'ADA': 'cardano', 'DOGE': 'dogecoin', 'DOT': 'polkadot', 'MATIC': 'matic-network', 'AVAX': 'avalanche-2',
  'LTC': 'litecoin', 'LINK': 'chainlink', 'UNI': 'uniswap', 'ATOM': 'cosmos', 'ETC': 'ethereum-classic',
  'XLM': 'stellar', 'ALGO': 'algorand', 'VET': 'vechain', 'ICP': 'internet-computer',
};

async function getCoinIdFromTicker(ticker: string): Promise<string | null> {
  const upper = ticker.toUpperCase();
  if (TICKER_TO_COIN_ID[upper]) return TICKER_TO_COIN_ID[upper];
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker.toLowerCase())}`;
    const res = await fetch(searchUrl);
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.coins?.length) return null;
    const exact = data.coins.find((c: { symbol: string }) => c.symbol.toLowerCase() === ticker.toLowerCase());
    return exact ? exact.id : null;
  } catch {
    return null;
  }
}

export async function fetchCryptoChart(
  coinId: string,
  timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'
): Promise<ChartDataPoint[]> {
  try {
    const days = getCoinGeckoDays(timeRange);
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.prices?.length) return [];
    const volumeMap = new Map<number, number>();
    if (data.total_volumes) {
      for (const [ts, vol] of data.total_volumes as [number, number][]) {
        volumeMap.set(ts, vol);
      }
    }
    return (data.prices as [number, number][]).map(([timestamp, price]) => ({
      date: new Date(timestamp).toISOString().split('T')[0],
      price,
      volume: volumeMap.get(timestamp),
    }));
  } catch {
    return [];
  }
}

export async function fetchTickerChart(
  ticker: string,
  _tickerType: 'crypto',
  timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'
): Promise<ChartDataPoint[]> {
  const coinId = await getCoinIdFromTicker(ticker);
  if (!coinId) return [];
  return fetchCryptoChart(coinId, timeRange);
}
