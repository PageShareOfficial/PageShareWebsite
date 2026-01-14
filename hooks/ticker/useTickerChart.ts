import { useState, useEffect, useCallback, useRef } from 'react';
import { ChartDataPoint } from '@/types/ticker';
import { TickerType } from '@/types/ticker';

interface UseTickerChartOptions {
  ticker: string;
  tickerType: TickerType | null;
  timeRange: '1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all';
  enabled?: boolean;
}

interface UseTickerChartResult {
  data: ChartDataPoint[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

/**
 * Hook to fetch and manage chart data
 * Debounces time range changes to avoid excessive API calls
 */
export function useTickerChart(options: UseTickerChartOptions): UseTickerChartResult {
  const {
    ticker,
    tickerType,
    timeRange,
    enabled = true,
  } = options;

  const [data, setData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [debouncedTimeRange, setDebouncedTimeRange] = useState(timeRange);
  
  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check if we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debounce time range changes (500ms delay)
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedTimeRange(timeRange);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [timeRange]);

  // Fetch chart data
  const fetchData = useCallback(async () => {
    if (!enabled || !isClient || !ticker || !tickerType) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/ticker/${ticker.toUpperCase()}/chart?range=${debouncedTimeRange}&type=${tickerType}`
      );
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Chart data not available');
        } else {
          setError('Failed to fetch chart data');
        }
        setData([]);
        setIsLoading(false);
        return;
      }

      const result = await response.json();
      
      setData(result.data || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch chart data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [ticker, tickerType, debouncedTimeRange, enabled, isClient]);

  // Fetch when dependencies change
  useEffect(() => {
    if (enabled && isClient && ticker && tickerType) {
      fetchData();
    }
  }, [ticker, tickerType, debouncedTimeRange, enabled, isClient, fetchData]);

  // Refetch function
  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}
