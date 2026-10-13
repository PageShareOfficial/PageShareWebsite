'use client';

import { useCallback, useEffect, useState } from 'react';
import { fetchCryptoEvents } from '@/lib/api/cryptoEventsApi';
import type { CryptoEventsFeed } from '@/types/cryptoEvents';
import { readCachedCryptoEvents, writeCachedCryptoEvents } from '@/utils/events/cryptoEventsCache';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface UseCryptoEventsResult {
  feed: CryptoEventsFeed | null;
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

/**
 * Crypto events feed. A server-rendered `initialFeed` is used as-is and saved to localStorage;
 * without one (backend unreachable during the server render) the hook falls back to the cached
 * copy, even expired, and refreshes from the network.
 */
export function useCryptoEvents(initialFeed: CryptoEventsFeed | null = null): UseCryptoEventsResult {
  const [feed, setFeed] = useState<CryptoEventsFeed | null>(initialFeed);
  const [isLoading, setIsLoading] = useState(initialFeed === null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (initialFeed && reloadToken === 0) {
      writeCachedCryptoEvents(initialFeed);
      return;
    }
    let cancelled = false;
    const cached = readCachedCryptoEvents();
    if (cached) setFeed(cached.feed);
    if (cached && !cached.isExpired && reloadToken === 0) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    fetchCryptoEvents()
      .then((freshFeed) => {
        if (cancelled) return;
        setFeed(freshFeed);
        writeCachedCryptoEvents(freshFeed);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load crypto events'));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [initialFeed, reloadToken]);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  return { feed, isLoading, error, retry };
}
