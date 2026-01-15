import { useState, useEffect } from 'react';
import { RecentSearch } from '@/types/discover';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  getRecentSearchesByType,
} from '@/utils/discover/recentSearchesUtils';

interface UseRecentSearchesResult {
  recentSearches: RecentSearch[];
  recentSearchesByType: {
    accounts: RecentSearch[];
    stocks: RecentSearch[];
    cryptos: RecentSearch[];
  };
  addSearch: (search: Omit<RecentSearch, 'id' | 'timestamp'>) => void;
  removeSearch: (id: string) => void;
  clearAll: () => void;
  isClient: boolean;
}

/**
 * Hook to manage recent searches state
 * Loads from localStorage, provides methods to add/remove/clear
 * Automatically limits to 20 most recent searches
 */
export function useRecentSearches(): UseRecentSearchesResult {
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Set client-side flag and load initial data
  useEffect(() => {
    setIsClient(true);
    setRecentSearches(getRecentSearches());
  }, []);

  // Listen for storage changes (cross-tab updates)
  useEffect(() => {
    if (!isClient) return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pageshare_recent_searches') {
        setRecentSearches(getRecentSearches());
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isClient]);

  // Add a new search
  const handleAddSearch = (search: Omit<RecentSearch, 'id' | 'timestamp'>) => {
    addRecentSearch(search);
    setRecentSearches(getRecentSearches());
    
    // Dispatch custom event for same-tab updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('recentSearchesUpdated'));
    }
  };

  // Remove a search by ID
  const handleRemoveSearch = (id: string) => {
    removeRecentSearch(id);
    setRecentSearches(getRecentSearches());
    
    // Dispatch custom event for same-tab updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('recentSearchesUpdated'));
    }
  };

  // Clear all searches
  const handleClearAll = () => {
    clearRecentSearches();
    setRecentSearches([]);
    
    // Dispatch custom event for same-tab updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('recentSearchesUpdated'));
    }
  };

  // Listen for custom event (same-tab updates)
  useEffect(() => {
    if (!isClient) return;

    const handleCustomUpdate = () => {
      setRecentSearches(getRecentSearches());
    };

    window.addEventListener('recentSearchesUpdated', handleCustomUpdate);

    return () => {
      window.removeEventListener('recentSearchesUpdated', handleCustomUpdate);
    };
  }, [isClient]);

  // Get searches grouped by type
  const recentSearchesByType = getRecentSearchesByType();

  return {
    recentSearches,
    recentSearchesByType,
    addSearch: handleAddSearch,
    removeSearch: handleRemoveSearch,
    clearAll: handleClearAll,
    isClient,
  };
}
