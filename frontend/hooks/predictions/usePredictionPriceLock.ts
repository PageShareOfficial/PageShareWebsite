'use client';

import { useEffect, useState } from 'react';
import { type SearchSuggestion } from '@/utils/api/stockApi';
import { LOCK_DURATION_MS } from '@/utils/predictions/predictionRules';
import { formatAssetPriceError } from '@/utils/predictions/predictionFormFormat';
import { getPredictionLivePrice } from '@/lib/api/predictionApi';
import { usePriceLockCountdown } from '@/hooks/predictions/usePriceLockCountdown';
import { useExpiryWindowBounds } from '@/hooks/predictions/useExpiryWindowBounds';

export interface PredictionPriceLockState {
  isVisible: boolean;
  lockExpired: boolean;
  lockRemainingSec: number;
}

interface UsePredictionPriceLockArgs {
  accessToken: string | undefined;
  isOnline: boolean;
  onEntryPriceLocked: (price: number) => void;
  onLockStateChange?: (state: PredictionPriceLockState) => void;
  setTickerQuery: (query: string) => void;
  setShowSuggestions: (show: boolean) => void;
}

/** Asset selection + price lock orchestration for the prediction form. */
export function usePredictionPriceLock({
  accessToken,
  isOnline,
  onEntryPriceLocked,
  onLockStateChange,
  setTickerQuery,
  setShowSuggestions,
}: UsePredictionPriceLockArgs) {
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [selectedTickerImage, setSelectedTickerImage] = useState('');
  const [lockStartMs, setLockStartMs] = useState<number | null>(null);
  const [lockEndsMs, setLockEndsMs] = useState<number | null>(null);
  const [isFetchingTicker, setIsFetchingTicker] = useState(false);
  const [tickerError, setTickerError] = useState('');

  const countdown = usePriceLockCountdown(lockEndsMs);
  const expiry = useExpiryWindowBounds(lockStartMs, countdown.lockExpired);
  const hasActiveLock = Boolean(selectedTicker && lockStartMs !== null);

  useEffect(() => {
    onLockStateChange?.({
      isVisible: hasActiveLock,
      lockExpired: countdown.lockExpired,
      lockRemainingSec: countdown.lockRemainingSec,
    });
  }, [
    hasActiveLock,
    countdown.lockExpired,
    countdown.lockRemainingSec,
    onLockStateChange,
  ]);

  const applyAssetLock = async (
    tickerSymbol: string,
    meta?: Pick<SearchSuggestion, 'name' | 'image'>
  ) => {
    if (!isOnline) {
      setTickerError('Connect to the internet to lock a price.');
      return;
    }
    if (!accessToken) {
      setTickerError('Sign in to lock a price.');
      return;
    }
    setIsFetchingTicker(true);
    setTickerError('');
    try {
      const live = await getPredictionLivePrice(tickerSymbol, accessToken);
      const now = Date.now();
      setSelectedTicker(live.asset);
      setSelectedName(meta?.name?.trim() || live.asset);
      setSelectedTickerImage(meta?.image?.trim() ? meta.image : '');
      setLockStartMs(now);
      setLockEndsMs(now + LOCK_DURATION_MS);
      countdown.setLockExpired(false);
      countdown.setLockRemainingSec(Math.ceil(LOCK_DURATION_MS / 1000));
      onEntryPriceLocked(Number(live.price.toFixed(8)));
      expiry.refreshExpiryPickerBounds(now);
      setTickerQuery(live.asset);
      setShowSuggestions(false);
    } catch (error) {
      setTickerError(formatAssetPriceError(error));
    } finally {
      setIsFetchingTicker(false);
    }
  };

  return {
    selectedTicker,
    selectedName,
    selectedTickerImage,
    lockStartMs,
    lockRemainingSec: countdown.lockRemainingSec,
    lockExpired: countdown.lockExpired,
    isFetchingTicker,
    tickerError,
    setTickerError,
    expiryValue: expiry.expiryValue,
    setExpiryValue: expiry.setExpiryValue,
    expiryMinMax: expiry.expiryMinMax,
    hasActiveLock,
    applyAssetLock,
    syncExpiryBoundsOnly: expiry.syncExpiryBoundsOnly,
    refreshExpiryPickerBounds: expiry.refreshExpiryPickerBounds,
  };
}
