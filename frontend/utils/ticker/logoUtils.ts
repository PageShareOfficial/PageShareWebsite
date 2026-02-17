/**
 * Ticker logos – crypto only. CoinGecko provides image in API response.
 */

/** Crypto logo from CoinGecko (for reference; images usually come in API response). */
export function getCryptoLogoUrl(coinId: string, _size: 'small' | 'large' = 'small'): string {
  return `https://assets.coingecko.com/coins/images/${coinId}/${_size}.png`;
}
