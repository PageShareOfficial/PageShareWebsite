'use client';

import { type Ref, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Loader2, AlertCircle, Calendar, WifiOff, Upload } from 'lucide-react';
import { type SearchSuggestion } from '@/utils/api/stockApi';
import { useTickerSearch } from '@/hooks/discover/useTickerSearch';
import { useClickOutside } from '@/hooks/common/useClickOutside';
import ImageWithFallback from '@/components/app/common/ImageWithFallback';
import { getInitials } from '@/utils/core/textFormatting';
import Skeleton from '@/components/app/common/Skeleton';
import { PrimaryButton } from '@/components/app/common/Button';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { useMediaUpload } from '@/hooks/composer/useMediaUpload';
import {
  LOCK_DURATION_MS,
  MAX_PREDICTIONS_PER_DAY,
  MAX_CONFIDENCE,
  MAX_THESIS_LENGTH,
  MIN_RISK_REWARD,
  MIN_CONFIDENCE,
  buildExpiryWindowFromStart,
  computeRiskReward,
  validateExpiryAgainstStart,
  validatePositionSides,
  validatePriceDistance,
  validateRiskReward,
  THESIS_IMAGE_ACCEPT,
} from '@/utils/predictions/predictionRules';
import { useAuth } from '@/contexts/AuthContext';
import { apiUploadMedia } from '@/lib/api/client';
import { createPrediction, getPredictionLivePrice } from '@/lib/api/predictionApi';
import type { PredictionSubmissionQuota } from '@/hooks/predictions/usePredictionSubmissionQuota';
import { parseDatetimeLocal, toDatetimeLocalValue } from '@/utils/predictions/datetimeLocal';
import PredictionFormSection from '@/components/app/predictions/PredictionFormSection';
import PriceLockBanner from '@/components/app/predictions/PriceLockBanner';
import PredictionSummaryConfirmModal from '@/components/app/modals/PredictionSummaryConfirmModal';

export interface PredictionPriceLockState {
  isVisible: boolean;
  lockExpired: boolean;
  lockRemainingSec: number;
}

const formSchema = z.object({
  position: z.enum(['long', 'short']),
  entryPrice: z.number().positive(),
  targetPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  confidence: z.number().min(MIN_CONFIDENCE).max(MAX_CONFIDENCE),
  thesis: z.string().trim().min(1, 'Add your thesis.').max(MAX_THESIS_LENGTH),
});

type FormValues = z.infer<typeof formSchema>;

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatAssetPriceError(error: unknown): string {
  const message = getErrorMessage(error, 'Failed to load live price');
  if (message === 'NotFound') {
    return 'Asset not found';
  }
  return message;
}

interface SubmitPredictionFormProps {
  quota: PredictionSubmissionQuota | null;
  canSubmit: boolean;
  quotaLoading?: boolean;
  refreshQuota: () => Promise<void>;
  lockBannerRef?: Ref<HTMLDivElement>;
  onLockStateChange?: (state: PredictionPriceLockState) => void;
}

export default function SubmitPredictionForm({
  quota,
  canSubmit,
  quotaLoading = false,
  refreshQuota,
  lockBannerRef,
  onLockStateChange,
}: SubmitPredictionFormProps) {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { session } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const expiryInputRef = useRef<HTMLInputElement>(null);
  const thesisImageInputRef = useRef<HTMLInputElement>(null);
  const [hasKeyboardSelection, setHasKeyboardSelection] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState('');
  const [selectedTickerImage, setSelectedTickerImage] = useState('');
  const [lockStartMs, setLockStartMs] = useState<number | null>(null);
  const [lockEndsMs, setLockEndsMs] = useState<number | null>(null);
  const [lockRemainingSec, setLockRemainingSec] = useState(0);
  const [lockExpired, setLockExpired] = useState(false);
  const [isFetchingTicker, setIsFetchingTicker] = useState(false);
  const [tickerError, setTickerError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [isThesisImageDragging, setIsThesisImageDragging] = useState(false);
  const [expiryMinMax, setExpiryMinMax] = useState<{ min: string; max: string }>({
    min: '',
    max: '',
  });

  const tickerSearch = useTickerSearch({
    minQueryLength: 2,
    debounceMs: 300,
    enabled: true,
  });
  const {
    mediaPreviews,
    mediaFiles,
    mediaError,
    handleImageUpload,
    addImageFiles,
    handleRemoveMedia,
    clearMediaError,
  } = useMediaUpload(null, {
    maxFiles: 1,
    allowedTypes: THESIS_IMAGE_ACCEPT.split(','),
  });

  useClickOutside({
    ref: suggestionsRef,
    handler: () => tickerSearch.setShowSuggestions(false),
    enabled: tickerSearch.showSuggestions,
    additionalRefs: [inputRef],
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      position: 'long',
      entryPrice: 0,
      targetPrice: 0,
      stopLoss: 0,
      confidence: 0.75,
      thesis: '',
    },
  });

  const [expiryValue, setExpiryValue] = useState('');
  const entryValue = form.watch('entryPrice');
  const targetValue = form.watch('targetPrice');
  const stopLossValue = form.watch('stopLoss');
  const confidenceValue = form.watch('confidence');
  const positionValue = form.watch('position');
  const thesisValue = form.watch('thesis');

  useEffect(() => {
    if (!lockEndsMs) {
      return;
    }
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((lockEndsMs - now) / 1000));
      setLockRemainingSec(left);
      if (now >= lockEndsMs) {
        setLockExpired(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lockEndsMs]);

  useEffect(() => {
    if (!lockStartMs || lockExpired) {
      return;
    }
    const syncBounds = () => {
      const { min, max } = buildExpiryWindowFromStart(Date.now());
      setExpiryMinMax({
        min: toDatetimeLocalValue(min),
        max: toDatetimeLocalValue(max),
      });
    };
    syncBounds();
    const id = window.setInterval(syncBounds, 30_000);
    return () => window.clearInterval(id);
  }, [lockStartMs, lockExpired]);

  const hasActiveLock = Boolean(selectedTicker && lockStartMs !== null);

  useEffect(() => {
    onLockStateChange?.({
      isVisible: hasActiveLock,
      lockExpired,
      lockRemainingSec,
    });
  }, [hasActiveLock, lockExpired, lockRemainingSec, onLockStateChange]);

  const formFieldsDisabled =
    !selectedTicker || isFetchingTicker || lockExpired || !isOnline;
  const assetSearchDisabled =
    isFetchingTicker || !isOnline || (hasActiveLock && !lockExpired);
  const offlineTitle = 'Connect to the internet to continue';
  const assetSearchDisabledTitle = !isOnline
    ? offlineTitle
    : hasActiveLock && !lockExpired
      ? 'Price lock in progress. Search again after the lock expires to change asset.'
      : undefined;

  const handleThesisImageFiles = (files: File[]) => {
    if (files.length === 0) return;
    clearMediaError();
    addImageFiles(files);
  };

  const handleThesisImagePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (formFieldsDisabled) return;
    const pastedFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (pastedFiles.length === 0) return;
    event.preventDefault();
    handleThesisImageFiles(pastedFiles);
  };

  const applyAssetLock = async (
    tickerSymbol: string,
    meta?: Pick<SearchSuggestion, 'name' | 'image'>
  ) => {
    if (!isOnline) {
      return;
    }
    if (!session?.access_token) {
      setTickerError('Sign in to lock a price.');
      return;
    }
    setIsFetchingTicker(true);
    setTickerError('');
    try {
      const live = await getPredictionLivePrice(tickerSymbol, session.access_token);
      const now = Date.now();
      setSelectedTicker(live.asset);
      setSelectedName(meta?.name?.trim() || live.asset);
      setSelectedTickerImage(meta?.image?.trim() ? meta.image : '');
      setLockStartMs(now);
      setLockEndsMs(now + LOCK_DURATION_MS);
      setLockExpired(false);
      setLockRemainingSec(Math.ceil(LOCK_DURATION_MS / 1000));
      form.setValue('entryPrice', Number(live.price.toFixed(8)));
      form.setValue('targetPrice', 0);
      form.setValue('stopLoss', 0);
      refreshExpiryPickerBounds(now);
      tickerSearch.setQuery(live.asset);
      tickerSearch.setShowSuggestions(false);
    } catch (e) {
      setTickerError(formatAssetPriceError(e));
    } finally {
      setIsFetchingTicker(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    if (!isOnline || assetSearchDisabled) {
      return;
    }
    await applyAssetLock(suggestion.ticker, {
      name: suggestion.name,
      image: suggestion.image,
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (assetSearchDisabled) {
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const selectedSuggestion =
        tickerSearch.selectedIndex >= 0
          ? tickerSearch.suggestions[tickerSearch.selectedIndex]
          : undefined;
      if (
        hasKeyboardSelection &&
        tickerSearch.showSuggestions &&
        !tickerSearch.isSearching &&
        selectedSuggestion
      ) {
        void handleSelectSuggestion(selectedSuggestion);
      } else {
        const q = tickerSearch.query.trim().toUpperCase();
        if (q.length >= 1) {
          void applyAssetLock(q);
        }
      }
      setHasKeyboardSelection(false);
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      setHasKeyboardSelection(true);
      tickerSearch.handleKeyDown(e);
    } else {
      tickerSearch.handleKeyDown(e);
    }
  };

  const syncExpiryBoundsOnly = (submitMs: number) => {
    const { min, max } = buildExpiryWindowFromStart(submitMs);
    setExpiryMinMax({
      min: toDatetimeLocalValue(min),
      max: toDatetimeLocalValue(max),
    });
  };

  const refreshExpiryPickerBounds = (submitMs: number, currentExpiry?: string) => {
    const { min, max, defaultExpiry } = buildExpiryWindowFromStart(submitMs);
    setExpiryMinMax({
      min: toDatetimeLocalValue(min),
      max: toDatetimeLocalValue(max),
    });
    const parsed = currentExpiry ? parseDatetimeLocal(currentExpiry) : null;
    if (!parsed) {
      setExpiryValue(toDatetimeLocalValue(defaultExpiry));
      return;
    }
    const clamped =
      parsed.getTime() < min.getTime()
        ? min
        : parsed.getTime() > max.getTime()
          ? max
          : parsed;
    setExpiryValue(toDatetimeLocalValue(clamped));
  };

  const openExpiryPicker = () => {
    if (!lockStartMs || !expiryInputRef.current) {
      return;
    }
    refreshExpiryPickerBounds(Date.now(), expiryValue);
    const input = expiryInputRef.current;
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker();
      return;
    }
    input.focus();
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError('');
    if (!selectedTicker || lockStartMs === null) {
      setSubmitError('Select an asset and lock a price first.');
      return;
    }
    if (lockExpired) {
      setSubmitError('Price lock expired. Search the asset again to refresh.');
      return;
    }
    if (!canSubmit) {
      setSubmitError(
        `Daily limit reached (${quota?.used ?? 0} / ${MAX_PREDICTIONS_PER_DAY} predictions submitted today).`
      );
      return;
    }
    const submittedAt = Date.now();
    syncExpiryBoundsOnly(submittedAt);
    const expiryDate = parseDatetimeLocal(expiryValue);
    if (!expiryDate) {
      setSubmitError('Choose a valid expiry time.');
      return;
    }
    const expiryErr = validateExpiryAgainstStart(submittedAt, expiryDate);
    if (expiryErr) {
      setSubmitError(expiryErr);
      return;
    }

    const entry = values.entryPrice;
    const target = values.targetPrice;
    const stop = values.stopLoss;

    const sideErr = validatePositionSides(values.position, entry, target, stop);
    if (sideErr) {
      setSubmitError(sideErr);
      return;
    }
    const distErr = validatePriceDistance(entry, target, stop);
    if (distErr) {
      setSubmitError(distErr);
      return;
    }
    const rrErr = validateRiskReward(entry, target, stop);
    if (rrErr) {
      setSubmitError(rrErr);
      return;
    }

    // Open confirmation modal after validation passes
    setIsConfirmModalOpen(true);
  });

  const confirmSubmission = async () => {
    const values = form.getValues();
    if (lockExpired) {
      throw new Error('Price lock expired while confirming. Search the asset again to refresh.');
    }
    if (!canSubmit) {
      throw new Error(
        `Daily limit reached (${quota?.used ?? 0} / ${MAX_PREDICTIONS_PER_DAY} predictions submitted today).`
      );
    }
    if (!session?.access_token) {
      throw new Error('Sign in to submit a prediction.');
    }
    if (!selectedTicker || lockStartMs === null) {
      throw new Error('Select an asset and lock a price first.');
    }
    const submittedAt = Date.now();
    syncExpiryBoundsOnly(submittedAt);
    const expiryDate = parseDatetimeLocal(expiryValue);
    if (!expiryDate) {
      throw new Error('Choose a valid expiry time.');
    }
    const expiryErr = validateExpiryAgainstStart(submittedAt, expiryDate);
    if (expiryErr) {
      throw new Error(expiryErr);
    }

    let thesisImageUrl: string | undefined;
    if (mediaFiles.length > 0) {
      const { uploads } = await apiUploadMedia(mediaFiles, session.access_token);
      thesisImageUrl = uploads[0]?.url;
    }

    await createPrediction(
      {
        asset: selectedTicker,
        asset_name: selectedName || undefined,
        position: values.position,
        entry_price: values.entryPrice,
        target_price: values.targetPrice,
        stop_loss: values.stopLoss,
        lock_started_at: new Date(lockStartMs).toISOString(),
        expiry_at: expiryDate.toISOString(),
        confidence: values.confidence,
        thesis: values.thesis,
        thesis_image_url: thesisImageUrl,
      },
      session.access_token
    );

    await refreshQuota();
    router.push('/predictions');
  };

  const inputRowClass =
    'h-11 min-h-[2.75rem] text-sm w-full pl-10 pr-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const predictionsUsed = quota?.used ?? 0;
  const riskReward = computeRiskReward(entryValue || 0, targetValue || 0, stopLossValue || 0);
  const riskRewardText = Number.isNaN(riskReward) ? '-' : riskReward.toFixed(2);
  const potentialUpside =
    entryValue > 0 ? ((targetValue - entryValue) / entryValue) * 100 : 0;
  const potentialDownside =
    entryValue > 0 ? ((stopLossValue - entryValue) / entryValue) * 100 : 0;
  const expiryLabel = expiryValue
    ? `${new Date(expiryValue).toLocaleDateString()} ${new Date(expiryValue).toLocaleTimeString()}`
    : '-';
  const assetLabel = selectedTicker ? `${selectedTicker} · ${selectedName}` : 'No asset selected';
  const modalConfirmDisabled = lockExpired || !canSubmit || !isOnline || quotaLoading;
  const modalConfirmDisabledMessage = !isOnline
    ? 'You are offline. Reconnect to submit your prediction.'
    : lockExpired
    ? 'Price lock expired. Search and lock the asset price again before submitting.'
    : !canSubmit
      ? `Daily limit reached (${predictionsUsed} / ${MAX_PREDICTIONS_PER_DAY}). Try again tomorrow.`
      : undefined;
  const submitDisabled =
    !canSubmit ||
    !selectedTicker ||
    lockExpired ||
    !isOnline ||
    isFetchingTicker ||
    quotaLoading;

  return (
    <>
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
      {!isOnline ? (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <WifiOff className="mt-0.5 h-5 w-5 flex-shrink-0" />
          <span>You&apos;re offline. Reconnect to search assets and submit predictions.</span>
        </div>
      ) : null}

      {!canSubmit && !quotaLoading && quota !== null && (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>
            You have submitted {predictionsUsed} predictions today (max {MAX_PREDICTIONS_PER_DAY}). Try again tomorrow.
          </span>
        </div>
      )}

      <div className="space-y-4">
          <PredictionFormSection
            step={1}
            title="Select Asset"
          >
            <div className="relative">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
                <div className="relative min-w-0 h-11 sm:w-1/2 sm:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-0 bottom-0 z-[1] my-auto h-4 w-4 text-gray-400" />
                  <input
                    ref={inputRef}
                    id="prediction-asset"
                    type="text"
                    value={tickerSearch.query}
                    onChange={(e) => {
                      tickerSearch.setQuery(e.target.value);
                      tickerSearch.setSelectedIndex(-1);
                      setHasKeyboardSelection(false);
                      setTickerError('');
                    }}
                    onKeyDown={handleKeyPress}
                    onFocus={() => {
                      if (assetSearchDisabled) {
                        return;
                      }
                      if (tickerSearch.suggestions.length > 0) {
                        tickerSearch.setShowSuggestions(true);
                      }
                    }}
                    placeholder="BTC, ETH, SOL..."
                    disabled={assetSearchDisabled}
                    title={assetSearchDisabledTitle}
                    className={inputRowClass}
                  />
                  {isFetchingTicker && (
                    <Loader2 className="absolute right-3 top-0 bottom-0 my-auto w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {isFetchingTicker ? (
                  <div className="flex h-11 min-w-0 items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-0 sm:w-1/2 sm:flex-none">
                    <Skeleton variant="rectangular" width={40} height={40} rounded="rounded-lg" />
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <Skeleton variant="text" width="70%" height={14} />
                      <Skeleton variant="text" width="40%" height={12} />
                    </div>
                  </div>
                ) : selectedTicker ? (
                  <div className="flex min-w-0 h-11 items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-0 sm:w-1/2 sm:flex-none">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
                      <ImageWithFallback
                        src={selectedTickerImage}
                        alt={selectedName || selectedTicker}
                        className="h-full w-full"
                        fallback={
                          <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
                            {getInitials(selectedName || selectedTicker)}
                          </div>
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">{selectedName}</p>
                      <p className="truncate text-xs text-gray-400">{selectedTicker}</p>
                    </div>
                  </div>
                ) : null}
              </div>

              {!assetSearchDisabled &&
                tickerSearch.showSuggestions &&
                (tickerSearch.suggestions.length > 0 || tickerSearch.isSearching) && (
                  <div
                    ref={suggestionsRef}
                    className="absolute left-0 top-full z-50 mt-1 w-full sm:w-1/2 bg-black border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                  >
                    {tickerSearch.isSearching && tickerSearch.suggestions.length === 0 && (
                      <>
                        {Array.from({ length: 3 }).map((_, index) => (
                          <div
                            key={`sk-${index}`}
                            className={`px-4 py-3 ${index > 0 ? 'border-t border-white/5' : ''}`}
                          >
                            <div className="flex items-center gap-3">
                              <Skeleton variant="rectangular" width={40} height={40} rounded="rounded-lg" />
                              <Skeleton variant="text" width={120} height={16} />
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                    {tickerSearch.suggestions.map((suggestion, index) => (
                      <button
                        key={`${suggestion.ticker}-${index}`}
                        type="button"
                        disabled={assetSearchDisabled}
                        onClick={() => void handleSelectSuggestion(suggestion)}
                        className={`w-full px-4 py-3 text-left hover:bg-white/10 flex items-center gap-3 ${
                          index > 0 ? 'border-t border-white/5' : ''
                        }`}
                      >
                        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0">
                          <ImageWithFallback
                            src={suggestion.image}
                            alt={suggestion.name}
                            className="w-full h-full"
                            fallback={
                              <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-white/10">
                                {getInitials(suggestion.name)}
                              </div>
                            }
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-white">{suggestion.ticker}</div>
                          <div className="text-xs text-gray-500 truncate">{suggestion.name}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {tickerError ? <p className="text-sm text-red-400 mt-2">{tickerError}</p> : null}
          </PredictionFormSection>

          {hasActiveLock ? (
            <div ref={lockBannerRef} className="mb-4">
              <PriceLockBanner
                lockExpired={lockExpired}
                lockRemainingSec={lockRemainingSec}
              />
            </div>
          ) : null}

          <PredictionFormSection step={2} title="Position">
            <div className={`grid grid-cols-2 gap-3 ${formFieldsDisabled ? 'opacity-60' : ''}`}>
              {(['long', 'short'] as const).map((p) => {
                const active = positionValue === p;
                return (
                  <button
                    key={p}
                    type="button"
                    disabled={formFieldsDisabled}
                    title={!isOnline ? offlineTitle : !selectedTicker ? 'Select an asset first' : undefined}
                    onClick={() => form.setValue('position', p)}
                    className={`rounded-lg border-2 px-3 py-3 text-sm font-semibold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                      active
                        ? 'border-sky-400/70 bg-sky-500/10 text-sky-200'
                        : 'border-white/10 bg-transparent text-gray-400 hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-100'
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </PredictionFormSection>

          <PredictionFormSection
            step={3}
            title="Trade Levels"
          >
            <div className={`space-y-3 ${formFieldsDisabled ? 'opacity-60' : ''}`}>
              <div>
                <label htmlFor="entryPrice" className="block text-sm font-medium text-gray-300 mb-1">
                  Entry Price (USD)
                </label>
                <input
                  id="entryPrice"
                  type="number"
                  step="any"
                  readOnly={Boolean(selectedTicker)}
                  {...form.register('entryPrice', { valueAsNumber: true })}
                  className={`w-full h-11 px-3 rounded-lg border text-white ${
                    selectedTicker
                      ? 'cursor-not-allowed border-white/10 bg-white/[0.03] text-gray-300'
                      : 'border-white/10 bg-white/5'
                  }`}
                />
                {selectedTicker ? (
                  <p className="mt-1 text-xs text-gray-500">Locked to the price snapshot for this asset.</p>
                ) : null}
                {form.formState.errors.entryPrice && (
                  <p className="text-xs text-red-400 mt-1">{form.formState.errors.entryPrice.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="targetPrice" className="block text-sm font-medium text-gray-300 mb-1">
                    Target Price (USD)
                  </label>
                  <input
                    id="targetPrice"
                    type="number"
                    step="any"
                    disabled={formFieldsDisabled}
                    {...form.register('targetPrice', { valueAsNumber: true })}
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
                <div>
                  <label htmlFor="stopLoss" className="block text-sm font-medium text-gray-300 mb-1">
                    Stop Loss (USD)
                  </label>
                  <input
                    id="stopLoss"
                    type="number"
                    step="any"
                    disabled={formFieldsDisabled}
                    {...form.register('stopLoss', { valueAsNumber: true })}
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <p className="text-xs text-gray-500">Risk-Reward (RR)</p>
                  <p className="text-lg font-semibold text-white">{riskRewardText}</p>
                  <p className="text-xs text-gray-500">≥ {MIN_RISK_REWARD} required</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <p className="text-xs text-gray-500">Potential Upside</p>
                  <p className="text-lg font-semibold text-emerald-300">{formatPercent(potentialUpside)}</p>
                  <p className="text-xs text-gray-500">≥ 1% required</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                  <p className="text-xs text-gray-500">Potential Downside</p>
                  <p className="text-lg font-semibold text-red-300">{formatPercent(potentialDownside)}</p>
                  <p className="text-xs text-gray-500">≥ 0.5% required</p>
                </div>
              </div>
            </div>
          </PredictionFormSection>

          <PredictionFormSection step={4} title="Expiry Time">
            <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3 ${formFieldsDisabled ? 'opacity-60' : ''}`}>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Price locked at</label>
                <input
                  type="text"
                  value={lockStartMs ? new Date(lockStartMs).toLocaleString() : '-'}
                  disabled
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-gray-400"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Prediction start is set when you submit.
                </p>
              </div>
              <div className="relative">
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-300 mb-1">
                  Expiry Time
                </label>
                <input
                  ref={expiryInputRef}
                  id="expiry"
                  type="datetime-local"
                  value={expiryValue}
                  min={expiryMinMax.min}
                  max={expiryMinMax.max}
                  onChange={(e) => setExpiryValue(e.target.value)}
                  disabled={!lockStartMs || formFieldsDisabled}
                  className="w-full h-11 px-3 pr-10 bg-white/5 border border-white/10 rounded-lg text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={openExpiryPicker}
                  disabled={!lockStartMs || formFieldsDisabled}
                  className="absolute right-2.5 top-[2.02rem] inline-flex h-6 w-6 items-center justify-center rounded text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Open expiry calendar"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            </div>
            {expiryMinMax.min ? (
              <p className="text-xs text-gray-500 mt-2"> Min: 30 mins from submit · Max: 2 days from submit</p>
            ) : null}
          </PredictionFormSection>

          <PredictionFormSection step={5} title="Confidence">
            <div className={formFieldsDisabled ? 'opacity-60' : ''}>
            <Controller
              name="confidence"
              control={form.control}
              render={({ field }) => (
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-500">{MIN_CONFIDENCE}</span>
                    <input
                      id="confidence"
                      type="range"
                      min={MIN_CONFIDENCE}
                      max={MAX_CONFIDENCE}
                      step={0.05}
                      value={field.value}
                      disabled={formFieldsDisabled}
                      onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                      className="flex-1 accent-cyan-500"
                    />
                    <span className="text-xs text-gray-500">{MAX_CONFIDENCE}</span>
                    <span className="w-12 rounded border border-white/10 bg-white/5 px-2 py-1 text-center text-white tabular-nums">
                      {(typeof field.value === 'number' ? field.value : MIN_CONFIDENCE).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            />
            </div>
          </PredictionFormSection>

          <PredictionFormSection step={6} title="Thesis / Analysis">
            <textarea
              id="thesis"
              rows={4}
              maxLength={MAX_THESIS_LENGTH}
              disabled={formFieldsDisabled}
              aria-invalid={Boolean(form.formState.errors.thesis)}
              {...form.register('thesis')}
              placeholder="Write your analysis here..."
              className={`w-full px-3 py-2 bg-white/5 border rounded-lg text-white placeholder-gray-500 resize-y min-h-[100px] disabled:cursor-not-allowed disabled:opacity-50 ${
                form.formState.errors.thesis ? 'border-red-500/60' : 'border-white/10'
              }`}
            />
            <div className="mt-1 flex items-start justify-between gap-3">
              {form.formState.errors.thesis ? (
                <p className="text-xs text-red-400">{form.formState.errors.thesis.message}</p>
              ) : (
                <span />
              )}
              <p className="shrink-0 text-xs text-gray-500">
                {thesisValue.length} / {MAX_THESIS_LENGTH}
              </p>
            </div>
            <div className="mt-4">
              <span className="block text-sm font-medium text-gray-300 mb-2">
                Optional chart (JPG, PNG, or WEBP)
              </span>
              <input
                ref={thesisImageInputRef}
                id="thesis-images"
                type="file"
                accept={THESIS_IMAGE_ACCEPT}
                disabled={formFieldsDisabled}
                onChange={(e) => {
                  clearMediaError();
                  handleImageUpload(e);
                }}
                className="sr-only"
                tabIndex={-1}
              />
              <div
                tabIndex={formFieldsDisabled ? -1 : 0}
                aria-label="Upload thesis chart image by drop or paste"
                aria-disabled={formFieldsDisabled}
                onDragEnter={(event) => {
                  event.preventDefault();
                  if (!formFieldsDisabled) setIsThesisImageDragging(true);
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  if (!formFieldsDisabled) setIsThesisImageDragging(true);
                }}
                onDragLeave={(event) => {
                  event.preventDefault();
                  if (event.currentTarget.contains(event.relatedTarget as Node)) return;
                  setIsThesisImageDragging(false);
                }}
                onDrop={(event) => {
                  event.preventDefault();
                  setIsThesisImageDragging(false);
                  if (formFieldsDisabled) return;
                  const dropped = Array.from(event.dataTransfer.files).filter((file) =>
                    file.type.startsWith('image/')
                  );
                  handleThesisImageFiles(dropped);
                }}
                onPaste={handleThesisImagePaste}
                className={`relative flex min-h-[140px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
                  formFieldsDisabled
                    ? 'cursor-not-allowed opacity-50 border-white/10 bg-white/[0.02]'
                    : isThesisImageDragging
                      ? 'cursor-copy border-cyan-400/60 bg-cyan-500/10'
                      : 'border-white/20 bg-white/[0.03]'
                }`}
              >
                {mediaPreviews[0] ? (
                  <>
                    <img
                      src={mediaPreviews[0]}
                      alt="Thesis chart preview"
                      className="max-h-48 w-full rounded-md object-contain"
                    />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleRemoveMedia(0);
                      }}
                      disabled={formFieldsDisabled}
                      className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 disabled:cursor-not-allowed"
                    >
                      Remove
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      Drop, paste, or{' '}
                      <button
                        type="button"
                        disabled={formFieldsDisabled}
                        onClick={() => thesisImageInputRef.current?.click()}
                        className="font-medium text-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        choose file
                      </button>{' '}
                      to replace
                    </p>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-8 w-8 text-gray-400" aria-hidden />
                    <p className="text-sm text-gray-300">
                      Drop an image here, paste from clipboard, or{' '}
                      <button
                        type="button"
                        disabled={formFieldsDisabled}
                        onClick={() => thesisImageInputRef.current?.click()}
                        className="font-medium text-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        choose file
                      </button>
                    </p>
                    <p className="mt-1 text-xs text-gray-500">One image, max 5MB</p>
                  </>
                )}
              </div>
              {mediaError ? <p className="mt-2 text-xs text-amber-400">{mediaError}</p> : null}
            </div>
          </PredictionFormSection>

          {submitError && (
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {submitError}
            </p>
          )}

          <div className="space-y-3">
            <PrimaryButton
              type="submit"
              disabled={submitDisabled}
              title={
                !isOnline
                  ? offlineTitle
                  : quotaLoading
                    ? 'Loading submission quota'
                    : undefined
              }
              className="w-full px-6 py-3 font-semibold disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Prediction
            </PrimaryButton>
          </div>
      </div>
    </form>
    <PredictionSummaryConfirmModal
      isOpen={isConfirmModalOpen}
      onClose={() => setIsConfirmModalOpen(false)}
      onConfirm={confirmSubmission}
      confirmDisabled={modalConfirmDisabled}
      confirmDisabledMessage={modalConfirmDisabledMessage}
      assetLabel={assetLabel}
      assetImageSrc={selectedTickerImage}
      assetImageAlt={selectedName || selectedTicker || 'Selected asset'}
      position={positionValue}
      entryPrice={entryValue || 0}
      targetPrice={targetValue || 0}
      stopLoss={stopLossValue || 0}
      riskRewardText={riskRewardText}
      potentialUpsideText={formatPercent(potentialUpside)}
      potentialDownsideText={formatPercent(potentialDownside)}
      expiryText={expiryLabel}
      confidence={typeof confidenceValue === 'number' ? confidenceValue : MIN_CONFIDENCE}
    />
    </>
  );
}
