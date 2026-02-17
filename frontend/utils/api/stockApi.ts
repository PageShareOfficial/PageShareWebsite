/**
 * Crypto data only (CoinGecko). US stocks support has been removed.
 */

import {
  isKnownCryptoTicker,
} from '@/utils/ticker/tickerTypeUtils';

export interface StockData {
  ticker: string;
  name: string;
  price: number;
  change: number;
  changeAmount?: number;
  image?: string;
}

async function getCryptoNameAndImage(coinId: string): Promise<{ name: string | null; image: string | null }> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false`;
    const response = await fetch(url);
    if (!response.ok) return { name: null, image: null };
    const data = await response.json();
    return {
      name: data.name || null,
      image: data.image?.large || data.image?.small || null,
    };
  } catch {
    return { name: null, image: null };
  }
}

export async function fetchCryptoData(ticker: string): Promise<StockData | null> {
  try {
    const tickerToCoinId: Record<string, string> = {
      'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana', 'XRP': 'ripple',
      'ADA': 'cardano', 'DOGE': 'dogecoin', 'DOT': 'polkadot', 'MATIC': 'matic-network', 'AVAX': 'avalanche-2',
      'LTC': 'litecoin', 'LINK': 'chainlink', 'UNI': 'uniswap', 'ATOM': 'cosmos', 'ETC': 'ethereum-classic',
      'XLM': 'stellar', 'ALGO': 'algorand', 'VET': 'vechain', 'ICP': 'internet-computer',
    };
    const coinId = tickerToCoinId[ticker.toUpperCase()];
    if (!coinId) return await fetchCryptoDataBySearch(ticker);

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=false&include_last_updated_at=false`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data[coinId]) return null;
    const coinData = data[coinId];
    const price = coinData.usd;
    const changePercent = coinData.usd_24h_change || 0;
    const coinInfo = await getCryptoNameAndImage(coinId);
    return {
      ticker: ticker.toUpperCase(),
      name: coinInfo.name || ticker,
      price,
      change: changePercent,
      image: coinInfo.image || '',
    };
  } catch (error) {
    console.error(`Error fetching crypto data for ${ticker}:`, error);
    return null;
  }
}

async function fetchCryptoDataBySearch(ticker: string): Promise<StockData | null> {
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${ticker.toLowerCase()}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return null;
    const searchData = await searchResponse.json();
    if (!searchData.coins?.length) return null;
    const coin = searchData.coins[0];
    const coinId = coin.id;
    const priceUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`;
    const priceResponse = await fetch(priceUrl);
    if (!priceResponse.ok) return null;
    const priceData = await priceResponse.json();
    if (!priceData[coinId]) return null;
    const coinPriceData = priceData[coinId];
    const coinInfo = await getCryptoNameAndImage(coinId);
    return {
      ticker: (coin.symbol || ticker).toString().toUpperCase(),
      name: coinInfo.name || coin.name || ticker,
      price: coinPriceData.usd,
      change: coinPriceData.usd_24h_change || 0,
      image: coinInfo.image || '',
    };
  } catch (error) {
    console.error(`Error searching crypto for ${ticker}:`, error);
    return null;
  }
}

/** Fetch ticker data (crypto only). */
export async function fetchTickerData(ticker: string): Promise<StockData | null> {
  const upper = ticker.toUpperCase();
  if (isKnownCryptoTicker(upper)) return fetchCryptoData(upper);
  return fetchCryptoData(upper);
}

export interface SearchSuggestion {
  ticker: string;
  name: string;
  type: 'crypto';
  image?: string;
}

export async function searchCrypto(query: string): Promise<SearchSuggestion[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  try {
    const url = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(normalizedQuery)}`;
    const response = await fetch(url);
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.coins?.length) return [];
    return data.coins.slice(0, 10).map((coin: { symbol: string; name: string; thumb?: string; small?: string; large?: string }) => ({
      ticker: (coin.symbol || '').toString().toUpperCase(),
      name: coin.name || '',
      type: 'crypto' as const,
      image: coin.thumb || coin.small || coin.large,
    }));
  } catch (error) {
    console.error('Error searching crypto:', error);
    return [];
  }
}

/** Search tickers (crypto only). */
export async function searchTickers(query: string): Promise<SearchSuggestion[]> {
  if (!query.trim()) return [];
  return searchCrypto(query);
}
