/**
 * Detected search type based on query format
 */
export type SearchType = 'account' | 'ticker' | 'unknown';

/**
 * Detects the search type based on query format
 * - @username → account
 * - $TICKER → ticker
 * - TICKER (uppercase, short) → ticker
 * - Otherwise → unknown (will search both)
 */
export function detectSearchType(query: string): SearchType {
  const trimmed = query.trim();
  
  if (!trimmed) {
    return 'unknown';
  }

  // Check for account prefix (@)
  if (trimmed.startsWith('@')) {
    return 'account';
  }

  // Check for ticker prefix ($)
  if (trimmed.startsWith('$')) {
    return 'ticker';
  }

  // Check if it looks like a ticker (uppercase, 1-5 characters, alphanumeric)
  // Common ticker patterns: AAPL, BTC, ETH, SPY, etc.
  const tickerPattern = /^[A-Z0-9]{1,5}$/;
  if (tickerPattern.test(trimmed.toUpperCase())) {
    return 'ticker';
  }

  // Default to unknown (will search both)
  return 'unknown';
}

/**
 * Normalizes search query by removing prefixes and trimming
 * @username → username
 * $TICKER → TICKER
 * "  query  " → "query"
 */
export function normalizeSearchQuery(query: string): string {
  const trimmed = query.trim();
  
  // Remove @ prefix for accounts
  if (trimmed.startsWith('@')) {
    return trimmed.slice(1).trim();
  }
  
  // Remove $ prefix for tickers
  if (trimmed.startsWith('$')) {
    return trimmed.slice(1).trim();
  }
  
  return trimmed;
}

/**
 * Determines if query should search for accounts
 * Returns true if:
 * - Query starts with @
 * - Query type is unknown (will search both)
 */
export function shouldSearchAccounts(query: string): boolean {
  const searchType = detectSearchType(query);
  return searchType === 'account' || searchType === 'unknown';
}

/**
 * Determines if query should search for tickers (stocks/crypto)
 * Returns true if:
 * - Query starts with $
 * - Query looks like a ticker (uppercase, short)
 * - Query type is unknown (will search both)
 */
export function shouldSearchTickers(query: string): boolean {
  const searchType = detectSearchType(query);
  return searchType === 'ticker' || searchType === 'unknown';
}

/**
 * Checks if a query is likely a ticker symbol
 * Tickers are typically:
 * - 1-5 characters
 * - Uppercase letters and numbers
 * - No spaces or special characters
 */
export function isLikelyTicker(query: string): boolean {
  const normalized = normalizeSearchQuery(query).toUpperCase();
  const tickerPattern = /^[A-Z0-9]{1,5}$/;
  return tickerPattern.test(normalized);
}

/**
 * Checks if a query is likely a username
 * Usernames are typically:
 * - Lowercase letters, numbers, underscores
 * - No spaces or special characters (except _)
 * - Usually longer than tickers
 */
export function isLikelyUsername(query: string): boolean {
  const normalized = normalizeSearchQuery(query).toLowerCase();
  const usernamePattern = /^[a-z0-9_]{3,}$/;
  return usernamePattern.test(normalized) && normalized.length > 2;
}
