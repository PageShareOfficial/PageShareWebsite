import { useState, useEffect, useCallback } from 'react';
import { TickerDetailData, TickerType } from '@/types/ticker';
import { getTickerFromCache, setTickerCache } from '@/lib/tickerCache';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
interface UseTickerDetailOptions {
  ticker: string;
  enabled?: boolean; // Default: true
}

interface UseTickerDetailResult {
  data: TickerDetailData | null;
  type: TickerType | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage ticker detail data
 * Supports both stocks and cryptocurrencies
 */
export function useTickerDetail(options: UseTickerDetailOptions): UseTickerDetailResult {
  const {
    ticker,
    enabled = true,
  } = options;

  const [data, setData] = useState<TickerDetailData | null>(null);
  const [type, setType] = useState<TickerType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  // Check if we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Fetch ticker detail data (uses in-memory cache to avoid refetch on revisit)
  const fetchData = useCallback(async (skipCache = false) => {
    if (!enabled || !isClient || !ticker) {
      return;
    }

    const symbol = ticker.toUpperCase();
    if (!skipCache) {
      const cached = getTickerFromCache(symbol);
      if (cached) {
      setData(cached.data);
      setType(cached.type);
      setError(null);
      setIsLoading(false);
      return;
      }
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ticker/${symbol}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Ticker not found');
        } else {
          setError('Failed to fetch ticker data');
        }
        setData(null);
        setType(null);
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      setTickerCache(symbol, result);
      setData(result.data);
      setType(result.type);
      setError(null);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to fetch ticker data'));
      setData(null);
      setType(null);
    } finally {
      setIsLoading(false);
    }
  }, [ticker, enabled, isClient]);

  // Initial fetch
  useEffect(() => {
    if (enabled && isClient && ticker) {
      fetchData();
    }
  }, [ticker, enabled, isClient, fetchData]);

  // Refetch function (bypasses cache to get fresh data)
  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    data,
    type,
    isLoading,
    error,
    refetch,
  };
}
