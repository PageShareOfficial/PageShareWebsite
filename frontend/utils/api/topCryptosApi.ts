/**
 * Top cryptocurrencies by market cap (CoinGecko /coins/markets, free tier, no key).
 * Server-only: Next caches the response so CoinGecko is hit once per revalidate window,
 * not once per visitor.
 */

const COINGECKO_MARKETS_URL = 'https://api.coingecko.com/api/v3/coins/markets';
const TOP_CRYPTOS_REVALIDATE_SECONDS = 300;
const DEFAULT_TOP_CRYPTOS_LIMIT = 10;
/** Extra rows fetched so the list is still full after excluded assets are dropped. */
const MARKET_ROWS_TO_SCAN = 30;

/** Stablecoins and tokenized/pegged assets: they rank high by market cap but barely move. */
const EXCLUDED_COIN_IDS: ReadonlySet<string> = new Set([
  'tether',
  'usd-coin',
  'usds',
  'dai',
  'ethena-usde',
  'usd1-wlfi',
  'global-dollar',
  'first-digital-usd',
  'paypal-usd',
  'true-usd',
  'figure-heloc',
  'tether-gold',
  'pax-gold',
  'staked-ether',
  'wrapped-steth',
  'wrapped-bitcoin',
  'weth',
  'coinbase-wrapped-btc',
]);

export interface TopCrypto {
  id: string;
  symbol: string;
  name: string;
  imageUrl: string;
  priceUsd: number;
  change24hPercent: number;
}

interface CoinGeckoMarketCoin {
  id?: unknown;
  symbol?: unknown;
  name?: unknown;
  image?: unknown;
  current_price?: unknown;
  price_change_percentage_24h?: unknown;
}

/** Maps one CoinGecko market row; returns null when required fields are missing. */
export function toTopCrypto(row: unknown): TopCrypto | null {
  if (typeof row !== 'object' || row === null) return null;
  const { id, symbol, name, image, current_price, price_change_percentage_24h } =
    row as CoinGeckoMarketCoin;
  if (typeof id !== 'string' || typeof symbol !== 'string' || typeof name !== 'string') {
    return null;
  }
  if (typeof image !== 'string' || typeof current_price !== 'number') return null;
  return {
    id,
    symbol: symbol.toUpperCase(),
    name,
    imageUrl: image,
    priceUsd: current_price,
    change24hPercent:
      typeof price_change_percentage_24h === 'number' ? price_change_percentage_24h : 0,
  };
}

function buildMarketsUrl(): string {
  const params = new URLSearchParams({
    vs_currency: 'usd',
    order: 'market_cap_desc',
    per_page: String(MARKET_ROWS_TO_SCAN),
    page: '1',
    sparkline: 'false',
    price_change_percentage: '24h',
  });
  return `${COINGECKO_MARKETS_URL}?${params}`;
}

/** Keeps valid, non-excluded coins in market-cap order, up to `limit`. */
export function selectTopCryptos(rows: readonly unknown[], limit: number): TopCrypto[] {
  return rows
    .map(toTopCrypto)
    .filter((coin): coin is TopCrypto => coin !== null && !EXCLUDED_COIN_IDS.has(coin.id))
    .slice(0, limit);
}

/** Returns the top cryptos by market cap, or [] if CoinGecko is unavailable. */
export async function fetchTopCryptos(limit = DEFAULT_TOP_CRYPTOS_LIMIT): Promise<TopCrypto[]> {
  try {
    const response = await fetch(buildMarketsUrl(), {
      headers: { accept: 'application/json' },
      next: { revalidate: TOP_CRYPTOS_REVALIDATE_SECONDS },
    });
    if (!response.ok) {
      console.error(`[topCryptos] CoinGecko responded ${response.status}`);
      return [];
    }
    const data: unknown = await response.json();
    if (!Array.isArray(data)) {
      console.error('[topCryptos] Unexpected CoinGecko response shape');
      return [];
    }
    return selectTopCryptos(data, limit);
  } catch (error) {
    console.error('[topCryptos] Failed to fetch top cryptos', error);
    return [];
  }
}
