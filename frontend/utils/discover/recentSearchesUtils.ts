import { RecentSearch } from '@/types/discover';
import { saveToStorage } from '@/utils/core/storageUtils';

const STORAGE_KEY = 'pageshare_recent_searches';
const MAX_RECENT_SEARCHES = 20;

/**
 * Get all recent searches from localStorage
 * Returns empty array if none exist or on error
 */
export function getRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return [];
    }

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validate and filter out invalid entries
    const validSearches = parsed.filter((search: any) => {
      return (
        search &&
        typeof search === 'object' &&
        typeof search.id === 'string' &&
        typeof search.query === 'string' &&
        typeof search.type === 'string' &&
        typeof search.timestamp === 'string' &&
        ['account', 'stock', 'crypto'].includes(search.type)
      );
    });

    // Sort by timestamp (most recent first)
    return validSearches.sort((a: RecentSearch, b: RecentSearch) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
}

/**
 * Add a new recent search entry
 * Automatically limits to MAX_RECENT_SEARCHES and removes duplicates
 */
export function addRecentSearch(search: Omit<RecentSearch, 'id' | 'timestamp'>): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getRecentSearches();
    
    // Remove duplicate entries (same query and type)
    const filtered = existing.filter(
      (s) => !(s.query === search.query && s.type === search.type)
    );

    // Create new search entry
    const newSearch: RecentSearch = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...search,
      timestamp: new Date().toISOString(),
    };

    // Add to beginning and limit
    const updated = [newSearch, ...filtered].slice(0, MAX_RECENT_SEARCHES);

    // Save to localStorage
    saveToStorage(STORAGE_KEY, updated);
  } catch (error) {
    console.error('Error adding recent search:', error);
  }
}

/**
 * Remove a specific recent search by ID
 */
export function removeRecentSearch(id: string): void {
  if (typeof window === 'undefined') return;

  try {
    const existing = getRecentSearches();
    const filtered = existing.filter((s) => s.id !== id);
    saveToStorage(STORAGE_KEY, filtered);
  } catch (error) {
    console.error('Error removing recent search:', error);
  }
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
}

/**
 * Limit recent searches to a specific number
 * Keeps the most recent ones
 */
export function limitRecentSearches(searches: RecentSearch[], max: number = MAX_RECENT_SEARCHES): RecentSearch[] {
  return searches.slice(0, max);
}

/**
 * Get recent searches grouped by type
 */
export function getRecentSearchesByType(): {
  accounts: RecentSearch[];
  stocks: RecentSearch[];
  cryptos: RecentSearch[];
} {
  const all = getRecentSearches();
  
  return {
    accounts: all.filter((s) => s.type === 'account'),
    stocks: all.filter((s) => s.type === 'stock'),
    cryptos: all.filter((s) => s.type === 'crypto'),
  };
}

/**
 * Check if a search already exists in recent searches
 */
export function hasRecentSearch(query: string, type: 'account' | 'stock' | 'crypto'): boolean {
  const existing = getRecentSearches();
  return existing.some((s) => s.query === query && s.type === type);
}
