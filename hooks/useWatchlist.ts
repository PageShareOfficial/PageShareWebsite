import { useState, useEffect } from 'react';
import { WatchlistItem } from '@/types';

interface UseWatchlistResult {
  watchlist: WatchlistItem[];
  setWatchlist: React.Dispatch<React.SetStateAction<WatchlistItem[]>>;
  isClient: boolean;
}

/**
 * Hook to load and manage watchlist from localStorage
 */
export function useWatchlist(): UseWatchlistResult {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const savedWatchlist = localStorage.getItem('pageshare_watchlist');
    if (savedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        if (Array.isArray(parsedWatchlist)) {
          setWatchlist(parsedWatchlist);
        }
      } catch {
        // If parsing fails, keep empty watchlist
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      try {
        localStorage.setItem('pageshare_watchlist', JSON.stringify(watchlist));
      } catch (error) {
        console.error('Error saving watchlist to localStorage:', error);
      }
    }
  }, [watchlist, isClient]);

  return {
    watchlist,
    setWatchlist,
    isClient,
  };
}

