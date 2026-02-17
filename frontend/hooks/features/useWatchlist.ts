import { useWatchlistContext } from '@/contexts/WatchlistContext';

export interface UseWatchlistResult {
  watchlist: ReturnType<typeof useWatchlistContext>['watchlist'];
  setWatchlist: ReturnType<typeof useWatchlistContext>['setWatchlist'];
  isClient: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTicker: (ticker: string) => Promise<void>;
  removeTicker: (ticker: string) => Promise<void>;
  openManageModal: () => void;
  closeManageModal: () => void;
}

/**
 * Backend-driven watchlist. Use within WatchlistProvider.
 * Provides watchlist state, add/remove, and openManageModal for the single global ManageWatchlistModal.
 */
export function useWatchlist(): UseWatchlistResult {
  return useWatchlistContext();
}
