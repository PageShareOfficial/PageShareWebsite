import type { CryptoEventsFeed } from '@/types/cryptoEvents';

const CACHE_KEY = 'pageshare_crypto_events_v1';
/** Event statuses flip daily (upcoming -> ongoing -> ended), so keep the browser copy short-lived. */
export const CRYPTO_EVENTS_CACHE_TTL_MS = 60 * 60 * 1000;

interface CryptoEventsCacheEntry {
  feed: CryptoEventsFeed;
  savedAt: number;
}

export interface CachedCryptoEvents {
  feed: CryptoEventsFeed;
  isExpired: boolean;
}

function isCacheEntry(value: unknown): value is CryptoEventsCacheEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<CryptoEventsCacheEntry>;
  return typeof entry.savedAt === 'number' && Array.isArray(entry.feed?.events);
}

/**
 * Read the cached feed. Expired entries are still returned (flagged) so the page can show
 * them while a refresh is in flight or when the refresh fails.
 */
export function readCachedCryptoEvents(now: number = Date.now()): CachedCryptoEvents | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isCacheEntry(parsed)) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return { feed: parsed.feed, isExpired: now - parsed.savedAt >= CRYPTO_EVENTS_CACHE_TTL_MS };
  } catch (error) {
    console.error('Error reading crypto events cache:', error);
    return null;
  }
}

export function writeCachedCryptoEvents(feed: CryptoEventsFeed, now: number = Date.now()): void {
  if (typeof window === 'undefined') return;
  const entry: CryptoEventsCacheEntry = { feed, savedAt: now };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch (error) {
    // Quota errors only cost us the cache; the page still renders from memory.
    console.error('Error caching crypto events:', error);
  }
}
