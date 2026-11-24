'use client';

import { useEffect, useSyncExternalStore } from 'react';
import {
  getNetworkStatsServerSnapshot,
  getNetworkStatsSnapshot,
  requestNetworkStats,
  subscribeNetworkStats,
} from '@/lib/network/networkStatsCache';

type UseNetworkStatsOptions = {
  /** When false, skips fetch/revalidation (use cached data if already loaded). */
  enabled?: boolean;
};

export function useNetworkStats(options?: UseNetworkStatsOptions) {
  const enabled = options?.enabled ?? true;

  const { stats, loading } = useSyncExternalStore(
    subscribeNetworkStats,
    getNetworkStatsSnapshot,
    getNetworkStatsServerSnapshot,
  );

  useEffect(() => {
    if (!enabled) return;
    void requestNetworkStats();
  }, [enabled]);

  const showLoading = enabled ? loading : false;

  return { stats, loading: showLoading };
}
