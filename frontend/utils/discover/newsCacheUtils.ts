import { NewsArticle, NewsCategory } from '@/types/discover';

const CACHE_PREFIX = 'pageshare_news_cache_';
const CACHE_EXPIRY_MS = 2 * 60 * 60 * 1000; // 2 hours – GNews free tier ~100 requests/day

interface NewsCacheEntry {
  articles: NewsArticle[];
  totalArticles: number;
  timestamp: number;
  category: NewsCategory;
  page: number;
  query?: string;
}

/**
 * Generate cache key for news articles
 */
function getCacheKey(category: NewsCategory, page: number, query?: string): string {
  if (query) {
    return `${CACHE_PREFIX}search_${query.toLowerCase()}_page_${page}`;
  }
  return `${CACHE_PREFIX}${category}_page_${page}`;
}

/**
 * Check if cache entry is still valid (not expired)
 */
function isCacheValid(entry: NewsCacheEntry | null): boolean {
  if (!entry) return false;
  const now = Date.now();
  const age = now - entry.timestamp;
  return age < CACHE_EXPIRY_MS;
}

/**
 * Remove all expired news cache entries (call occasionally to free storage).
 * Uses the same TTL as getCachedNews.
 */
export function removeExpiredNewsCacheEntries(): void {
  if (typeof window === 'undefined') return;
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: NewsCacheEntry = JSON.parse(cached);
            if (!isCacheValid(entry)) keysToRemove.push(key);
          }
        } catch {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach((k) => localStorage.removeItem(k));
  } catch (error) {
    console.error('Error removing expired news cache:', error);
  }
}

/**
 * Get cached news articles for a category/page/query
 * Returns null if cache is invalid or doesn't exist
 */
export function getCachedNews(
  category: NewsCategory,
  page: number,
  query?: string
): { articles: NewsArticle[]; totalArticles: number } | null {
  if (typeof window === 'undefined') return null;

  try {
    const cacheKey = getCacheKey(category, page, query);
    const cached = localStorage.getItem(cacheKey);
    
    if (!cached) return null;

    const entry: NewsCacheEntry = JSON.parse(cached);
    
    // Check if cache is valid (not expired)
    if (!isCacheValid(entry)) {
      // Remove expired entry
      localStorage.removeItem(cacheKey);
      return null;
    }

    return {
      articles: entry.articles,
      totalArticles: entry.totalArticles,
    };
  } catch (error) {
    console.error('Error reading news cache:', error);
    return null;
  }
}

/**
 * Cache news articles for a category/page/query
 */
export function setCachedNews(
  category: NewsCategory,
  page: number,
  articles: NewsArticle[],
  totalArticles: number,
  query?: string
): void {
  if (typeof window === 'undefined') return;

  try {
    const cacheKey = getCacheKey(category, page, query);
    const entry: NewsCacheEntry = {
      articles,
      totalArticles,
      timestamp: Date.now(),
      category,
      page,
      query,
    };

    localStorage.setItem(cacheKey, JSON.stringify(entry));
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Clear oldest cache entries if storage is full
      clearOldestCacheEntries();
      // Retry
      try {
        const cacheKey = getCacheKey(category, page, query);
        const entry: NewsCacheEntry = {
          articles,
          totalArticles,
          timestamp: Date.now(),
          category,
          page,
          query,
        };
        localStorage.setItem(cacheKey, JSON.stringify(entry));
      } catch (retryError) {
        console.error('Error caching news after cleanup:', retryError);
      }
    } else {
      console.error('Error caching news:', error);
    }
  }
}

/**
 * Clear oldest cache entries when storage is full
 * Keeps the most recent 10 entries
 */
function clearOldestCacheEntries(): void {
  try {
    const entries: { key: string; timestamp: number }[] = [];
    
    // Find all cache entries
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: NewsCacheEntry = JSON.parse(cached);
            entries.push({ key, timestamp: entry.timestamp });
          }
        } catch {
          // Invalid entry, remove it
          if (key) localStorage.removeItem(key);
        }
      }
    }

    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest entries, keep 10 most recent
    const entriesToRemove = entries.slice(0, Math.max(0, entries.length - 10));
    entriesToRemove.forEach(({ key }) => {
      localStorage.removeItem(key);
    });
  } catch (error) {
    console.error('Error clearing old cache entries:', error);
  }
}

/**
 * Clear all news cache
 */
export function clearNewsCache(): void {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing news cache:', error);
  }
}
