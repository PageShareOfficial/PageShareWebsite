'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Search, Loader2, Lock, Clock, AlertCircle, Calendar } from 'lucide-react';
import { fetchCryptoData, type SearchSuggestion, type StockData } from '@/utils/api/stockApi';
import { useTickerSearch } from '@/hooks/discover/useTickerSearch';
import { useClickOutside } from '@/hooks/common/useClickOutside';
import ImageWithFallback from '@/components/app/common/ImageWithFallback';
import MediaPreviewGrid from '@/components/app/common/MediaPreviewGrid';
import { getInitials } from '@/utils/core/textFormatting';
import Skeleton from '@/components/app/common/Skeleton';
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
  MIN_EXPIRY_OFFSET_MS,
  MAX_EXPIRY_OFFSET_MS,
  computeRiskReward,
  validatePositionSides,
  validatePriceDistance,
  validateRiskReward,
  THESIS_IMAGE_ACCEPT,
} from '@/utils/predictions/predictionRules';
import {
  canSubmitPredictionToday,
  getPredictionsSubmittedToday,
  incrementPredictionsSubmittedToday,
} from '@/utils/predictions/dailyPredictionLimit';
import { parseDatetimeLocal, toDatetimeLocalValue } from '@/utils/predictions/datetimeLocal';
import PredictionFormSection from '@/components/app/predictions/PredictionFormSection';
import PredictionSummaryConfirmModal from '@/components/app/modals/PredictionSummaryConfirmModal';

const formSchema = z.object({
  position: z.enum(['long', 'short']),
  entryPrice: z.number().positive(),
  targetPrice: z.number().positive(),
  stopLoss: z.number().positive(),
  confidence: z.number().min(MIN_CONFIDENCE).max(MAX_CONFIDENCE),
  thesis: z.string().min(1, 'Add your thesis.').max(MAX_THESIS_LENGTH),
});

type FormValues = z.infer<typeof formSchema>;

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export default function SubmitPredictionForm() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const expiryInputRef = useRef<HTMLInputElement>(null);

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
    mediaError,
    handleImageUpload,
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

  const applyAssetLock = async (tickerSymbol: string) => {
    setIsFetchingTicker(true);
    setTickerError('');
    try {
      const data: StockData | null = await fetchCryptoData(tickerSymbol);
      if (!data) {
        setTickerError(`Could not load price for ${tickerSymbol}.`);
        return;
      }
      const now = Date.now();
      setSelectedTicker(data.ticker);
      setSelectedName(data.name);
      setSelectedTickerImage(data.image?.trim() ? data.image : '');
      setLockStartMs(now);
      setLockEndsMs(now + LOCK_DURATION_MS);
      setLockExpired(false);
      setLockRemainingSec(Math.ceil(LOCK_DURATION_MS / 1000));
      form.setValue('entryPrice', Number(data.price.toFixed(8)));
      form.setValue('targetPrice', 0);
      form.setValue('stopLoss', 0);
      const minD = new Date(now + MIN_EXPIRY_OFFSET_MS);
      const maxD = new Date(now + MAX_EXPIRY_OFFSET_MS);
      const defaultExpiry = new Date(now + 24 * 60 * 60 * 1000);
      const clamped =
        defaultExpiry < minD ? minD : defaultExpiry > maxD ? maxD : defaultExpiry;
      setExpiryMinMax({
        min: toDatetimeLocalValue(minD),
        max: toDatetimeLocalValue(maxD),
      });
      setExpiryValue(toDatetimeLocalValue(clamped));
      tickerSearch.setQuery(data.ticker);
      tickerSearch.setShowSuggestions(false);
    } catch (e) {
      setTickerError(getErrorMessage(e, 'Failed to load ticker'));
    } finally {
      setIsFetchingTicker(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    if (!isOnline) {
      return;
    }
    await applyAssetLock(suggestion.ticker);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
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

  const openExpiryPicker = () => {
    if (!lockStartMs || !expiryInputRef.current) {
      return;
    }
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
    if (!canSubmitPredictionToday()) {
      setSubmitError(
        `Daily limit reached (${getPredictionsSubmittedToday()} / ${MAX_PREDICTIONS_PER_DAY} predictions submitted today).`
      );
      return;
    }
    const expiryDate = parseDatetimeLocal(expiryValue);
    if (!expiryDate) {
      setSubmitError('Choose a valid expiry time.');
      return;
    }
    const minExp = new Date(lockStartMs + MIN_EXPIRY_OFFSET_MS);
    const maxExp = new Date(lockStartMs + MAX_EXPIRY_OFFSET_MS);
    if (expiryDate.getTime() < minExp.getTime() || expiryDate.getTime() > maxExp.getTime()) {
      setSubmitError(
        `Expiry must be between ${minExp.toLocaleString()} and ${maxExp.toLocaleString()}.`
      );
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
    try {
      if (lockExpired) {
        setSubmitError('Price lock expired while confirming. Search the asset again to refresh.');
        return;
      }
      if (!canSubmitPredictionToday()) {
        setSubmitError(
          `Daily limit reached (${getPredictionsSubmittedToday()} / ${MAX_PREDICTIONS_PER_DAY} predictions submitted today).`
        );
        return;
      }
      incrementPredictionsSubmittedToday();
      setIsConfirmModalOpen(false);
      // Backend submission would go here with FormData including mediaFiles
      router.push('/predictions');
    } catch (err) {
      setSubmitError(getErrorMessage(err, 'Something went wrong'));
    }
  };

  const inputRowClass =
    'h-11 min-h-[2.75rem] text-sm w-full pl-10 pr-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

  const predictionsUsed = getPredictionsSubmittedToday();
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
  const modalConfirmDisabled = lockExpired || !canSubmitPredictionToday();
  const modalConfirmDisabledMessage = lockExpired
    ? 'Price lock expired. Search and lock the asset price again before submitting.'
    : !canSubmitPredictionToday()
      ? `Daily limit reached (${predictionsUsed} / ${MAX_PREDICTIONS_PER_DAY}). Try again tomorrow.`
      : undefined;

  return (
    <>
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
      {!canSubmitPredictionToday() && (
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
                      if (tickerSearch.suggestions.length > 0) {
                        tickerSearch.setShowSuggestions(true);
                      }
                    }}
                    placeholder="BTC, ETH, SOL..."
                    disabled={isFetchingTicker || !isOnline}
                    className={inputRowClass}
                  />
                  {isFetchingTicker && (
                    <Loader2 className="absolute right-3 top-0 bottom-0 my-auto w-4 h-4 animate-spin text-gray-400" />
                  )}
                </div>
                {selectedTicker ? (
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

              {tickerSearch.showSuggestions &&
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

            {selectedTicker && lockStartMs !== null ? (
              <div
                className={`mt-3 rounded-lg border px-3 py-2.5 flex items-center justify-between gap-3 ${
                  lockExpired
                    ? 'border-red-500/40 bg-red-500/10'
                    : 'border-cyan-500/40 bg-cyan-500/10'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Lock className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  <p className="text-sm text-white truncate">Current price is locked for 2:00 minutes</p>
                </div>
                <div className="flex items-center gap-1.5 text-xs tabular-nums text-gray-300">
                  <Clock className="w-3.5 h-3.5" />
                  {lockExpired
                    ? 'Expired'
                    : `${Math.floor(lockRemainingSec / 60)}:${String(lockRemainingSec % 60).padStart(2, '0')}`}
                </div>
              </div>
            ) : null}
          </PredictionFormSection>

          <PredictionFormSection step={2} title="Position">
            <div className="grid grid-cols-2 gap-3">
              {(['long', 'short'] as const).map((p) => {
                const active = positionValue === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => form.setValue('position', p)}
                    className={`rounded-lg border-2 px-3 py-3 text-sm font-semibold uppercase transition-colors ${
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
            <div className="space-y-3">
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
                    {...form.register('targetPrice', { valueAsNumber: true })}
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
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
                    {...form.register('stopLoss', { valueAsNumber: true })}
                    className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-white"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Time (locked)</label>
                <input
                  type="text"
                  value={lockStartMs ? new Date(lockStartMs).toLocaleString() : '-'}
                  disabled
                  className="w-full h-11 px-3 bg-white/5 border border-white/10 rounded-lg text-gray-400"
                />
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
                  disabled={!lockStartMs}
                  className="w-full h-11 px-3 pr-10 bg-white/5 border border-white/10 rounded-lg text-white [color-scheme:dark] [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={openExpiryPicker}
                  disabled={!lockStartMs}
                  className="absolute right-2.5 top-[2.02rem] inline-flex h-6 w-6 items-center justify-center rounded text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Open expiry calendar"
                >
                  <Calendar className="h-4 w-4" />
                </button>
              </div>
            </div>
            {expiryMinMax.min ? (
              <p className="text-xs text-gray-500 mt-2">Min: 30 mins from start · Max: 2 days from start</p>
            ) : null}
          </PredictionFormSection>

          <PredictionFormSection step={5} title="Confidence">
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
          </PredictionFormSection>

          <PredictionFormSection step={6} title="Thesis / Analysis">
            <textarea
              id="thesis"
              rows={4}
              maxLength={MAX_THESIS_LENGTH}
              {...form.register('thesis')}
              placeholder="Write your analysis and trade setup here..."
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 resize-y min-h-[100px]"
            />
            <p className="mt-1 text-right text-xs text-gray-500">
              {thesisValue.length} / {MAX_THESIS_LENGTH}
            </p>
            <div className="mt-4">
              <label htmlFor="thesis-images" className="block text-sm font-medium text-gray-300 mb-1">
                Optional chart (JPG, PNG, or WEBP)
              </label>
              <input
                id="thesis-images"
                type="file"
                accept={THESIS_IMAGE_ACCEPT}
                onChange={(e) => {
                  clearMediaError();
                  handleImageUpload(e);
                }}
                className="text-sm text-gray-400 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white"
              />
              {mediaError ? <p className="mt-2 text-xs text-amber-400">{mediaError}</p> : null}
              {mediaPreviews.length > 0 ? (
                <>
                  <p className="mt-2 text-xs text-gray-500">1 image selected</p>
                  <MediaPreviewGrid
                    previews={mediaPreviews}
                    onRemove={handleRemoveMedia}
                    containerClassName="mt-3 grid grid-cols-1"
                    imageClassName="h-44 w-full rounded-md object-contain bg-black/30"
                  />
                </>
              ) : null}
            </div>
          </PredictionFormSection>

          {submitError && (
            <p className="text-sm text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {submitError}
            </p>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={
                !canSubmitPredictionToday() ||
                !selectedTicker ||
                lockExpired ||
                !isOnline ||
                isFetchingTicker
              }
              className="w-full px-6 py-3 rounded-lg bg-white text-black font-semibold hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Prediction
            </button>
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
