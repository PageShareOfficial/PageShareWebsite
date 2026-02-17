/**
 * In-memory cache for ticker detail data to avoid refetching on revisit or watchlist load.
 */

import type { TickerDetailResponse } from '@/types/ticker';

const TTL_MS = 3 * 60 * 1000; // 3 minutes

interface CacheEntry {
  response: TickerDetailResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

function cacheKey(symbol: string): string {
  return symbol.toUpperCase();
}

export function getTickerFromCache(symbol: string): TickerDetailResponse | null {
  const key = cacheKey(symbol);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.response;
}

export function setTickerCache(symbol: string, response: TickerDetailResponse): void {
  cache.set(cacheKey(symbol), { response, timestamp: Date.now() });
}

export function isTickerCacheValid(symbol: string): boolean {
  return getTickerFromCache(symbol) !== null;
}

export function clearTickerCache(): void {
  cache.clear();
}
