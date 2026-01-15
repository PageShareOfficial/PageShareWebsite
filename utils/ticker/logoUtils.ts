/**
 * Utility functions for getting ticker logos/images
 */

/**
 * Get stock logo URL
 * Uses our proxy API route to avoid SSL certificate issues
 * The proxy handles fetching from external services server-side
 */
export function getStockLogoUrl(ticker: string, companyName?: string): string {
  const upperTicker = ticker.toUpperCase();
  
  // Use our proxy API route to avoid SSL certificate issues
  // The proxy will try Financial Modeling Prep first, then fallback to other services
  return `/api/ticker/logo?ticker=${encodeURIComponent(upperTicker)}`;
  
  // Direct URLs (if proxy doesn't work, can use these but may have SSL issues):
  // - Financial Modeling Prep: https://financialmodelingprep.com/image-cdn/v4/logos/{ticker}.png
  // - Polygon.io: https://assets.polygon.io/logos/{ticker}/logo.png (has SSL issues)
  // - Clearbit: https://logo.clearbit.com/{domain} (requires company domain)
}

/**
 * Get crypto logo URL from CoinGecko
 * CoinGecko provides images in their API response
 */
export function getCryptoLogoUrl(coinId: string, size: 'small' | 'large' = 'small'): string {
  // CoinGecko image URLs are provided directly in the API response
  // This is just a helper for reference
  return `https://assets.coingecko.com/coins/images/${coinId}/${size}.png`;
}
