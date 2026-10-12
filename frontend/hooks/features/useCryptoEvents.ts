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
 * Crypto events feed backed by a short-lived localStorage cache.
 * A cached copy (even expired) renders immediately; the network refresh replaces it.
 */
export function useCryptoEvents(): UseCryptoEventsResult {
  const [feed, setFeed] = useState<CryptoEventsFeed | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
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
  }, [reloadToken]);

  const retry = useCallback(() => setReloadToken((token) => token + 1), []);

  return { feed, isLoading, error, retry };
}
