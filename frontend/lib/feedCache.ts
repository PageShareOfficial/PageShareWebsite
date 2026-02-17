/**
 * Home feed cache. Kept in a separate module so AuthContext can clear it on logout
 * without importing from hooks (avoids circular dependency).
 */
import type { Post } from '@/types';

export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let feedCache: { data: Post[]; timestamp: number } | null = null;

export function getFeedCache(): { data: Post[]; timestamp: number } | null {
  return feedCache;
}

export function setFeedCache(data: Post[], timestamp: number): void {
  feedCache = { data, timestamp };
}

/**
 * Clear the home feed cache. Call on logout so the next user does not see the previous user's feed.
 */
export function clearFeedCache(): void {
  feedCache = null;
}

export function isFeedCacheValid(): boolean {
  return feedCache !== null && Date.now() - feedCache.timestamp < CACHE_TTL_MS;
}
