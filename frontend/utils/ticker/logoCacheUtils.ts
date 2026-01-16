/**
 * Utility functions for caching failed ticker logo requests
 * Prevents repeated API calls for tickers that don't have logos
 */

const CACHE_KEY = 'pageshare_failed_logos';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface FailedLogoCache {
  [ticker: string]: number; // ticker -> timestamp
}

/**
 * Check if a ticker logo request has failed recently
 * Returns true if we should skip the API call (logo doesn't exist)
 */
export function isLogoRequestFailed(ticker: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const cacheData = localStorage.getItem(CACHE_KEY);
    if (!cacheData) return false;

    const cache: FailedLogoCache = JSON.parse(cacheData);
    const timestamp = cache[ticker.toUpperCase()];

    if (!timestamp) return false;

    // Check if cache entry is still valid (not expired)
    const age = Date.now() - timestamp;
    if (age > CACHE_DURATION) {
      // Cache expired, remove this entry
      delete cache[ticker.toUpperCase()];
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      return false;
    }

    return true; // Logo request failed recently, skip API call
  } catch (error) {
    // If cache is corrupted, clear it
    try {
      localStorage.removeItem(CACHE_KEY);
    } catch {
      // Ignore errors
    }
    return false;
  }
}

/**
 * Mark a ticker logo request as failed
 * This prevents future API calls for this ticker
 */
export function markLogoRequestFailed(ticker: string): void {
  if (typeof window === 'undefined') return;

  try {
    const cacheData = localStorage.getItem(CACHE_KEY);
    const cache: FailedLogoCache = cacheData ? JSON.parse(cacheData) : {};

    // Store ticker in uppercase for consistency
    cache[ticker.toUpperCase()] = Date.now();

    // Clean up expired entries to prevent cache from growing too large
    const now = Date.now();
    const cleanedCache: FailedLogoCache = {};
    for (const [key, timestamp] of Object.entries(cache)) {
      if (now - timestamp <= CACHE_DURATION) {
        cleanedCache[key] = timestamp;
      }
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify(cleanedCache));
  } catch (error) {
    // If storage is full or there's an error, try to clear old entries
    try {
      localStorage.removeItem(CACHE_KEY);
      const cache: FailedLogoCache = {};
      cache[ticker.toUpperCase()] = Date.now();
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore errors - cache is optional
    }
  }
}

/**
 * Clear the failed logo cache
 * Useful for debugging or resetting the cache
 */
export function clearFailedLogoCache(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // Ignore errors
  }
}
