'use client';

import dynamic from 'next/dynamic';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { WatchlistItem } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  listWatchlist,
  addToWatchlist,
  removeFromWatchlist,
} from '@/lib/api/watchlistApi';
import type { CryptoDetailData } from '@/types/ticker';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

const ManageWatchlistModal = dynamic(
  () => import('@/components/app/modals/ManageWatchlistModal'),
  { ssr: false }
);

export interface WatchlistContextValue {
  watchlist: WatchlistItem[];
  setWatchlist: React.Dispatch<React.SetStateAction<WatchlistItem[]>>;
  isClient: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  addTicker: (ticker: string) => Promise<void>;
  removeTicker: (ticker: string) => Promise<void>;
  openManageModal: () => void;
  closeManageModal: () => void;
}

const WatchlistContext = createContext<WatchlistContextValue | null>(null);

export function WatchlistProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const watchlistRef = useRef<WatchlistItem[]>([]);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    watchlistRef.current = watchlist;
  }, [watchlist]);

  const loadFromBackend = useCallback(async () => {
    if (!accessToken) {
      setWatchlist([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const backendItems = await listWatchlist(accessToken);
      const prevByTicker = new Map(
        watchlistRef.current.map((w) => [w.ticker.toUpperCase(), w])
      );

      if (backendItems.length === 0) {
        setWatchlist([]);
        setLoading(false);
        return;
      }

      const symbols = backendItems.map((i) => i.ticker.toUpperCase()).join(',');
      const res = await fetch(`/api/ticker/batch?symbols=${encodeURIComponent(symbols)}`);
      const batchPayload = res.ok ? (await res.json()) as { data: Array<{ ticker: string; data: CryptoDetailData | null }> } : { data: [] };
      const byTicker = new Map<string, CryptoDetailData | null>();
      for (const row of batchPayload.data ?? []) {
        byTicker.set(row.ticker.toUpperCase(), row.data);
      }

      const enriched: WatchlistItem[] = backendItems.map((item) => {
        const prev = prevByTicker.get(item.ticker.toUpperCase());
        const data = byTicker.get(item.ticker.toUpperCase());
        if (data) {
          return {
            ticker: item.ticker.toUpperCase(),
            name: data.name || item.name || item.ticker,
            price: data.currentPrice,
            change: data.priceChangePercent24h,
            image: (data.image || prev?.image) ?? '',
          };
        }
        return {
          ticker: item.ticker,
          name: prev?.name ?? item.name ?? item.ticker,
          price: prev?.price ?? 0,
          change: prev?.change ?? 0,
          image: prev?.image ?? '',
        };
      });
      setWatchlist(enriched);
    } catch (e) {
      setError(getErrorMessage(e, 'Failed to load watchlist'));
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!isClient || !accessToken) {
      setWatchlist([]);
      return;
    }
    setLoading(true);
    loadFromBackend();
  }, [isClient, accessToken, loadFromBackend]);

  const addTicker = useCallback(
    async (ticker: string) => {
      if (!accessToken) return;
      const symbol = ticker.trim().toUpperCase();
      if (!symbol) return;
      if (watchlist.some((w) => w.ticker === symbol)) return;
      try {
        await addToWatchlist(symbol, accessToken);
        await loadFromBackend();
      } catch (e) {
        setError(getErrorMessage(e, 'Failed to add to watchlist'));
      }
    },
    [accessToken, watchlist, loadFromBackend]
  );

  const removeTicker = useCallback(
    async (ticker: string) => {
      if (!accessToken) return;
      const symbol = ticker.trim().toUpperCase();
      if (!symbol) return;
      try {
        await removeFromWatchlist(symbol, accessToken);
        setWatchlist((prev) => prev.filter((item) => item.ticker !== symbol));
      } catch (e) {
        setError(
          getErrorMessage(e, 'Failed to remove from watchlist')
        );
      }
    },
    [accessToken]
  );

  const openManageModal = useCallback(() => setIsManageModalOpen(true), []);
  const closeManageModal = useCallback(() => setIsManageModalOpen(false), []);

  const value: WatchlistContextValue = {
    watchlist,
    setWatchlist,
    isClient,
    loading,
    error,
    refresh: loadFromBackend,
    addTicker,
    removeTicker,
    openManageModal,
    closeManageModal,
  };

  return (
    <WatchlistContext.Provider value={value}>
      {children}
      <ManageWatchlistModal
        isOpen={isManageModalOpen}
        onClose={closeManageModal}
        watchlist={watchlist}
        onUpdateWatchlist={setWatchlist}
        onAddTicker={(item) => addTicker(item.ticker)}
        onRemoveTicker={removeTicker}
      />
    </WatchlistContext.Provider>
  );
}

export function useWatchlistContext(): WatchlistContextValue {
  const ctx = useContext(WatchlistContext);
  if (!ctx) {
    throw new Error('useWatchlistContext must be used within WatchlistProvider');
  }
  return ctx;
}
