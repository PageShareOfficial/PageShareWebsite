'use client';

import { type Ref, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { type SearchSuggestion } from '@/utils/api/stockApi';
import { useTickerSearch } from '@/hooks/discover/useTickerSearch';
import { useClickOutside } from '@/hooks/common/useClickOutside';
import { ROUTES } from '@/constants/routes';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { useMediaUpload } from '@/hooks/composer/useMediaUpload';
import {
  MAX_PREDICTIONS_PER_DAY,
  MIN_CONFIDENCE,
  THESIS_IMAGE_ACCEPT,
} from '@/utils/predictions/predictionRules';
import {
  predictionFormSchema,
  type PredictionFormValues,
} from '@/utils/predictions/predictionFormSchema';
import { validatePredictionDraft } from '@/utils/predictions/validatePredictionDraft';
import { computeTradeLevelMetrics } from '@/utils/predictions/computeTradeLevelMetrics';
import { submitPredictionWithMedia } from '@/utils/predictions/submitPredictionWithMedia';
import { useAuth } from '@/contexts/AuthContext';
import type { PredictionSubmissionQuota } from '@/hooks/predictions/usePredictionSubmissionQuota';
import {
  usePredictionPriceLock,
  type PredictionPriceLockState,
} from '@/hooks/predictions/usePredictionPriceLock';
import PredictionFormSteps from '@/components/app/predictions/submit/PredictionFormSteps';
import PredictionSummaryConfirmModal from '@/components/app/modals/PredictionSummaryConfirmModal';

export type { PredictionPriceLockState };

const INPUT_ROW_CLASS =
  'h-11 min-h-11 text-sm w-full pl-10 pr-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

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
  const [submitError, setSubmitError] = useState('');
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  const tickerSearch = useTickerSearch({
    minQueryLength: 2,
    debounceMs: 300,
    enabled: true,
  });
  const media = useMediaUpload(null, {
    maxFiles: 1,
    allowedTypes: THESIS_IMAGE_ACCEPT.split(','),
  });

  useClickOutside({
    ref: suggestionsRef,
    handler: () => tickerSearch.setShowSuggestions(false),
    enabled: tickerSearch.showSuggestions,
    additionalRefs: [inputRef],
  });

  const form = useForm<PredictionFormValues>({
    resolver: zodResolver(predictionFormSchema),
    defaultValues: {
      position: 'long',
      entryPrice: 0,
      targetPrice: 0,
      stopLoss: 0,
      confidence: 0.75,
      thesis: '',
    },
  });

  const onEntryPriceLocked = useCallback(
    (price: number) => {
      form.setValue('entryPrice', price);
      form.setValue('targetPrice', 0);
      form.setValue('stopLoss', 0);
    },
    [form]
  );

  const priceLock = usePredictionPriceLock({
    accessToken: session?.access_token,
    isOnline,
    onEntryPriceLocked,
    onLockStateChange,
    setTickerQuery: tickerSearch.setQuery,
    setShowSuggestions: tickerSearch.setShowSuggestions,
  });

  const entryValue = form.watch('entryPrice');
  const targetValue = form.watch('targetPrice');
  const stopLossValue = form.watch('stopLoss');
  const confidenceValue = form.watch('confidence');
  const positionValue = form.watch('position');
  const thesisValue = form.watch('thesis');

  const formFieldsDisabled =
    !priceLock.selectedTicker ||
    priceLock.isFetchingTicker ||
    priceLock.lockExpired ||
    !isOnline;
  const assetSearchDisabled =
    priceLock.isFetchingTicker ||
    !isOnline ||
    (priceLock.hasActiveLock && !priceLock.lockExpired);
  const offlineTitle = 'Connect to the internet to continue';
  const assetSearchDisabledTitle = !isOnline
    ? offlineTitle
    : priceLock.hasActiveLock && !priceLock.lockExpired
      ? 'Price lock in progress. Search again after the lock expires to change asset.'
      : undefined;

  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    if (!isOnline || assetSearchDisabled) return;
    await priceLock.applyAssetLock(suggestion.ticker, {
      name: suggestion.name,
      image: suggestion.image,
    });
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (assetSearchDisabled) return;
    if (event.key === 'Enter') {
      event.preventDefault();
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
        const query = tickerSearch.query.trim().toUpperCase();
        if (query.length >= 1) void priceLock.applyAssetLock(query);
      }
      setHasKeyboardSelection(false);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      setHasKeyboardSelection(true);
    }
    tickerSearch.handleKeyDown(event);
  };

  const buildDraftValidationArgs = (values: PredictionFormValues) => ({
    values,
    selectedTicker: priceLock.selectedTicker,
    lockStartMs: priceLock.lockStartMs,
    lockExpired: priceLock.lockExpired,
    canSubmit,
    predictionsUsed: quota?.used ?? 0,
    expiryValue: priceLock.expiryValue,
    submittedAtMs: Date.now(),
    syncExpiryBounds: priceLock.syncExpiryBoundsOnly,
  });

  const onSubmit = form.handleSubmit((values) => {
    setSubmitError('');
    const result = validatePredictionDraft(buildDraftValidationArgs(values));
    if (result.error !== null) {
      setSubmitError(result.error);
      return;
    }
    setIsConfirmModalOpen(true);
  });

  const confirmSubmission = async () => {
    if (!session?.access_token) {
      throw new Error('Sign in to submit a prediction.');
    }
    const values = form.getValues();
    const result = validatePredictionDraft(buildDraftValidationArgs(values));
    if (result.error !== null) throw new Error(result.error);
    if (!priceLock.selectedTicker || priceLock.lockStartMs === null) {
      throw new Error('Select an asset and lock a price first.');
    }

    await submitPredictionWithMedia({
      values,
      accessToken: session.access_token,
      selectedTicker: priceLock.selectedTicker,
      selectedName: priceLock.selectedName,
      lockStartMs: priceLock.lockStartMs,
      expiryDate: result.expiryDate,
      mediaFiles: media.mediaFiles,
    });
    await refreshQuota();
    router.replace(ROUTES.predictions);
  };

  const predictionsUsed = quota?.used ?? 0;
  const tradeMetrics = computeTradeLevelMetrics(entryValue, targetValue, stopLossValue);
  const expiryLabel = priceLock.expiryValue
    ? `${new Date(priceLock.expiryValue).toLocaleDateString()} ${new Date(priceLock.expiryValue).toLocaleTimeString()}`
    : '-';
  const modalConfirmDisabled =
    priceLock.lockExpired || !canSubmit || !isOnline || quotaLoading;
  const modalConfirmDisabledMessage = !isOnline
    ? 'You are offline. Reconnect to submit your prediction.'
    : priceLock.lockExpired
      ? 'Price lock expired. Search and lock the asset price again before submitting.'
      : !canSubmit
        ? `Daily limit reached (${predictionsUsed} / ${MAX_PREDICTIONS_PER_DAY}). Try again tomorrow.`
        : undefined;
  const submitDisabled =
    !canSubmit ||
    !priceLock.selectedTicker ||
    priceLock.lockExpired ||
    !isOnline ||
    priceLock.isFetchingTicker ||
    quotaLoading;

  return (
    <>
      <PredictionFormSteps
        form={form}
        priceLock={priceLock}
        tickerSearch={tickerSearch}
        inputRef={inputRef}
        suggestionsRef={suggestionsRef}
        expiryInputRef={expiryInputRef}
        thesisImageInputRef={thesisImageInputRef}
        lockBannerRef={lockBannerRef}
        isOnline={isOnline}
        canSubmit={canSubmit}
        quotaLoading={quotaLoading}
        quota={quota}
        predictionsUsed={predictionsUsed}
        formFieldsDisabled={formFieldsDisabled}
        assetSearchDisabled={assetSearchDisabled}
        assetSearchDisabledTitle={assetSearchDisabledTitle}
        offlineTitle={offlineTitle}
        submitDisabled={submitDisabled}
        submitError={submitError}
        tradeMetrics={tradeMetrics}
        mediaPreview={media.mediaPreviews[0]}
        mediaError={media.mediaError}
        thesisLength={thesisValue.length}
        positionValue={positionValue}
        inputRowClass={INPUT_ROW_CLASS}
        onSubmit={onSubmit}
        onKeyDown={handleKeyPress}
        onClearKeyboardSelection={() => setHasKeyboardSelection(false)}
        onSelectSuggestion={(suggestion) => void handleSelectSuggestion(suggestion)}
        onImageUpload={media.handleImageUpload}
        onImageFiles={(files) => {
          if (files.length === 0) return;
          media.clearMediaError();
          media.addImageFiles(files);
        }}
        onRemoveImage={() => media.handleRemoveMedia(0)}
        onClearMediaError={media.clearMediaError}
      />
      <PredictionSummaryConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmSubmission}
        confirmDisabled={modalConfirmDisabled}
        confirmDisabledMessage={modalConfirmDisabledMessage}
        assetLabel={
          priceLock.selectedTicker
            ? `${priceLock.selectedTicker} · ${priceLock.selectedName}`
            : 'No asset selected'
        }
        assetImageSrc={priceLock.selectedTickerImage}
        assetImageAlt={priceLock.selectedName || priceLock.selectedTicker || 'Selected asset'}
        position={positionValue}
        entryPrice={entryValue || 0}
        targetPrice={targetValue || 0}
        stopLoss={stopLossValue || 0}
        riskRewardText={tradeMetrics.riskRewardText}
        potentialUpsideText={tradeMetrics.potentialUpsideText}
        potentialDownsideText={tradeMetrics.potentialDownsideText}
        expiryText={expiryLabel}
        confidence={typeof confidenceValue === 'number' ? confidenceValue : MIN_CONFIDENCE}
      />
    </>
  );
}
