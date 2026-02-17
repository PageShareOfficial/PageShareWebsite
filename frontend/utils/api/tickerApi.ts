/**
 * Ticker detail API – crypto only (CoinGecko). US stocks support removed.
 */

import { CryptoDetailData, TickerType } from '@/types/ticker';
import { fetchCryptoData } from './stockApi';

const TICKER_TO_COIN_ID: Record<string, string> = {
  'BTC': 'bitcoin', 'ETH': 'ethereum', 'BNB': 'binancecoin', 'SOL': 'solana', 'XRP': 'ripple',
  'ADA': 'cardano', 'DOGE': 'dogecoin', 'DOT': 'polkadot', 'MATIC': 'matic-network', 'AVAX': 'avalanche-2',
  'LTC': 'litecoin', 'LINK': 'chainlink', 'UNI': 'uniswap', 'ATOM': 'cosmos', 'ETC': 'ethereum-classic',
  'XLM': 'stellar', 'ALGO': 'algorand', 'VET': 'vechain', 'ICP': 'internet-computer',
};

async function getCoinIdFromTicker(ticker: string): Promise<string | null> {
  const upperTicker = ticker.toUpperCase();
  if (TICKER_TO_COIN_ID[upperTicker]) return TICKER_TO_COIN_ID[upperTicker];
  try {
    const searchUrl = `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(ticker.toLowerCase())}`;
    const searchResponse = await fetch(searchUrl);
    if (!searchResponse.ok) return null;
    const searchData = await searchResponse.json();
    if (!searchData.coins?.length) return null;
    const exactMatch = searchData.coins.find((coin: { symbol: string }) =>
      coin.symbol.toLowerCase() === ticker.toLowerCase()
    );
    return exactMatch ? exactMatch.id : null;
  } catch {
    return null;
  }
}

export async function fetchCryptoDetail(ticker: string): Promise<CryptoDetailData | null> {
  try {
    const coinId = await getCoinIdFromTicker(ticker);
    if (!coinId) return null;

    const url = `https://api.coingecko.com/api/v3/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`;
    const response = await fetch(url);
    if (!response.ok) return null;
    const data = await response.json();
    if (!data?.market_data) return null;
    const marketData = data.market_data;

    return {
      id: data.id,
      symbol: (data.symbol || '').toString().toUpperCase(),
      name: data.name || '',
      description: data.description?.en || '',
      image: data.image?.large || data.image?.small || '',
      links: {
        homepage: data.links?.homepage || [],
        whitepaper: data.links?.whitepaper || null,
        github: data.links?.repos_url?.github?.[0] || null,
        blockchainSite: data.links?.blockchain_site || [],
        officialForumUrl: data.links?.official_forum_url || [],
      },
      currentPrice: marketData.current_price?.usd || 0,
      priceChange24h: marketData.price_change_24h || 0,
      priceChangePercent24h: marketData.price_change_percentage_24h || 0,
      marketCap: marketData.market_cap?.usd || 0,
      marketCapRank: marketData.market_cap_rank || 0,
      fullyDilutedValuation: marketData.fully_diluted_valuation?.usd || null,
      totalVolume: marketData.total_volume?.usd || 0,
      high24h: marketData.high_24h?.usd || 0,
      low24h: marketData.low_24h?.usd || 0,
      circulatingSupply: marketData.circulating_supply || 0,
      totalSupply: marketData.total_supply || null,
      maxSupply: marketData.max_supply || null,
      ath: marketData.ath?.usd || 0,
      athDate: marketData.ath_date?.usd || '',
      atl: marketData.atl?.usd || 0,
      atlDate: marketData.atl_date?.usd || '',
      priceChangePercent5d: marketData.price_change_percentage_5d || 0,
      priceChangePercent30d: marketData.price_change_percentage_30d || 0,
      priceChangePercent1y: marketData.price_change_percentage_1y || null,
      marketCapChangePercent24h: marketData.market_cap_change_percentage_24h || 0,
    };
  } catch {
    return null;
  }
}

export async function detectTickerType(ticker: string): Promise<TickerType> {
  const cryptoData = await fetchCryptoData(ticker);
  return cryptoData ? 'crypto' : 'crypto';
}

export async function fetchTickerDetail(ticker: string): Promise<{
  type: TickerType;
  data: CryptoDetailData;
} | null> {
  const cryptoData = await fetchCryptoDetail(ticker);
  if (cryptoData) return { type: 'crypto', data: cryptoData };
  return null;
}
