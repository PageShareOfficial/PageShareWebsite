/**
 * Short-TTL in-memory cache for context data (content filters, bookmarks)
 * so provider remounts don't refetch within the TTL window.
 */

const TTL_MS = 2 * 60 * 1000; // 2 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const caches = new Map<string, CacheEntry<unknown>>();

function key(name: string, userId: string): string {
  return `${name}:${userId}`;
}

export function getContextCache<T>(name: string, userId: string): T | null {
  const entry = caches.get(key(name, userId)) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > TTL_MS) {
    caches.delete(key(name, userId));
    return null;
  }
  return entry.data;
}

export function setContextCache<T>(name: string, userId: string, data: T): void {
  caches.set(key(name, userId), { data, timestamp: Date.now() });
}

export function isContextCacheValid(name: string, userId: string): boolean {
  return getContextCache(name, userId) !== null;
}

export function invalidateContextCache(name: string, userId: string): void {
  caches.delete(key(name, userId));
}
