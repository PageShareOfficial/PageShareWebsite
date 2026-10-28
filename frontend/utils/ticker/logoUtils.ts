/**
 * Ticker logos – crypto only. CoinGecko provides image in API response.
 */

export const COINCAP_ICON_BASE = 'https://assets.coincap.io/assets/icons';
export const COINGECKO_ICON_BASE = 'https://assets.coingecko.com/coins/images';

/** Crypto logo from CoinGecko (for reference; images usually come in API response). */
export function getCryptoLogoUrl(
  coinId: string,
  size: 'small' | 'large' = 'small'
): string {
  const normalizedId = coinId.trim();
  if (!normalizedId) return '';
  return `${COINGECKO_ICON_BASE}/${normalizedId}/${size}.png`;
}

/**
 * Icon URL for a ticker symbol in feed pills.
 * CoinCap serves common crypto icons by symbol; missing ones fall back in TickerImage.
 */
export function getTickerIconUrl(symbol: string): string {
  const normalized = symbol.trim().toLowerCase();
  if (!normalized) return '';
  return `${COINCAP_ICON_BASE}/${normalized}@2x.png`;
}
