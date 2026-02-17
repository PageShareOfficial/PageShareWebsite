import { useState, useEffect, useCallback } from 'react';
import { RecentSearch } from '@/types/discover';
import {
  getRecentSearchesBackend,
  addRecentSearchBackend,
  clearRecentSearchesBackend,
  removeRecentSearchBackend,
} from '@/lib/api/searchApi';
import { useAuth } from '@/contexts/AuthContext';

function toRecentSearch(item: {
  id: string;
  type: 'account' | 'ticker';
  result_id: string;
  query: string;
  result_display_name?: string | null;
  result_image_url?: string | null;
  created_at: string;
}): RecentSearch {
  return {
    id: item.id,
    type: item.type,
    query: item.query,
    timestamp: item.created_at,
    resultId: item.result_id,
    resultName: item.result_display_name ?? undefined,
    image: item.result_image_url ?? undefined,
  };
}

interface UseRecentSearchesResult {
  recentSearches: RecentSearch[];
  recentSearchesByType: {
    accounts: RecentSearch[];
    tickers: RecentSearch[];
  };
  addSearch: (search: Omit<RecentSearch, 'id' | 'timestamp'>) => void;
  removeSearch: (id: string) => void;
  clearAll: () => void;
  isClient: boolean;
}

/**
 * Recent searches: backend only when authenticated. No localStorage — when not
 * logged in we don't show recent searches UI, so no need to persist anon data.
 */
export function useRecentSearches(): UseRecentSearchesResult {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isClient, setIsClient] = useState(false);

  const loadFromBackend = useCallback(async () => {
    if (!accessToken) return;
    try {
      const list = await getRecentSearchesBackend(accessToken);
      setRecentSearches(list.map(toRecentSearch));
    } catch (e) {
      console.error('Failed to load recent searches', e);
    }
  }, [accessToken]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    if (accessToken) {
      loadFromBackend();
    } else {
      setRecentSearches([]);
    }
  }, [isClient, accessToken, loadFromBackend]);

  const addSearch = useCallback(
    (search: Omit<RecentSearch, 'id' | 'timestamp'>) => {
      if (!accessToken) return;
      addRecentSearchBackend(
        {
          type: search.type,
          result_id: search.resultId ?? search.query,
          query: search.query,
          result_display_name: search.resultName ?? null,
          result_image_url: search.image ?? null,
        },
        accessToken
      )
        .then((item) => {
          setRecentSearches((prev) => {
            const next = [toRecentSearch(item), ...prev.filter((s) => s.id !== item.id)];
            return next.slice(0, 20);
          });
        })
        .catch((e) => console.error('Failed to add recent search', e));
    },
    [accessToken]
  );

  const removeSearch = useCallback(
    (id: string) => {
      if (!accessToken) return;
      removeRecentSearchBackend(id, accessToken)
        .then(() => {
          setRecentSearches((prev) => prev.filter((s) => s.id !== id));
        })
        .catch((e) => console.error('Failed to remove recent search', e));
    },
    [accessToken]
  );

  const clearAll = useCallback(() => {
    if (!accessToken) return;
    clearRecentSearchesBackend(accessToken)
      .then(() => setRecentSearches([]))
      .catch((e) => console.error('Failed to clear recent searches', e));
  }, [accessToken]);

  const recentSearchesByType = {
    accounts: recentSearches.filter((s) => s.type === 'account'),
    tickers: recentSearches.filter((s) => s.type === 'ticker'),
  };

  return {
    recentSearches,
    recentSearchesByType,
    addSearch,
    removeSearch,
    clearAll,
    isClient,
  };
}
