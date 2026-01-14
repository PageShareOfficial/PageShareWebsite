import { useState, useEffect, useCallback } from 'react';
import { TickerDetailData, TickerType } from '@/types/ticker';

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

  // Fetch ticker detail data
  const fetchData = useCallback(async () => {
    if (!enabled || !isClient || !ticker) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/ticker/${ticker.toUpperCase()}`);
      
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
      
      setData(result.data);
      setType(result.type);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch ticker data');
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

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    type,
    isLoading,
    error,
    refetch,
  };
}
