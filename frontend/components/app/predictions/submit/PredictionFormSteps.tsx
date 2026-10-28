'use client';

import { type Ref, type RefObject } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { CircleAlert } from '@/constants/icons';
import { PrimaryButton } from '@/components/app/common/Button';
import type { SearchSuggestion } from '@/utils/api/stockApi';
import type { PredictionFormValues } from '@/utils/predictions/predictionFormSchema';
import type { PredictionSubmissionQuota } from '@/hooks/predictions/usePredictionSubmissionQuota';
import PredictionFormAlerts from '@/components/app/predictions/submit/PredictionFormAlerts';
import PredictionAssetSearchSection from '@/components/app/predictions/submit/PredictionAssetSearchSection';
import PredictionPositionSection from '@/components/app/predictions/submit/PredictionPositionSection';
import PredictionTradeLevelsSection from '@/components/app/predictions/submit/PredictionTradeLevelsSection';
import PredictionExpirySection from '@/components/app/predictions/submit/PredictionExpirySection';
import PredictionConfidenceSection from '@/components/app/predictions/submit/PredictionConfidenceSection';
import PredictionThesisSection from '@/components/app/predictions/submit/PredictionThesisSection';
import PriceLockBanner from '@/components/app/predictions/submit/PriceLockBanner';

interface TickerSearchView {
  query: string;
  setQuery: (query: string) => void;
  suggestions: SearchSuggestion[];
  isSearching: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  setSelectedIndex: (index: number) => void;
}

interface PriceLockView {
  selectedTicker: string | null;
  selectedName: string;
  selectedTickerImage: string;
  isFetchingTicker: boolean;
  tickerError: string;
  setTickerError: (value: string) => void;
  hasActiveLock: boolean;
  lockExpired: boolean;
  lockRemainingSec: number;
  lockStartMs: number | null;
  expiryValue: string;
  setExpiryValue: (value: string) => void;
  expiryMinMax: { min: string; max: string };
  refreshExpiryPickerBounds: (submitMs: number, currentExpiry?: string) => void;
}

interface PredictionFormStepsProps {
  form: UseFormReturn<PredictionFormValues>;
  priceLock: PriceLockView;
  tickerSearch: TickerSearchView;
  inputRef: RefObject<HTMLInputElement | null>;
  suggestionsRef: RefObject<HTMLDivElement | null>;
  expiryInputRef: RefObject<HTMLInputElement | null>;
  thesisImageInputRef: RefObject<HTMLInputElement | null>;
  lockBannerRef?: Ref<HTMLDivElement>;
  isOnline: boolean;
  canSubmit: boolean;
  quotaLoading: boolean;
  quota: PredictionSubmissionQuota | null;
  predictionsUsed: number;
  formFieldsDisabled: boolean;
  assetSearchDisabled: boolean;
  assetSearchDisabledTitle?: string;
  offlineTitle: string;
  submitDisabled: boolean;
  submitError: string;
  tradeMetrics: {
    riskRewardText: string;
    potentialUpside: number;
    potentialDownside: number;
  };
  mediaPreview?: string;
  mediaError: string | null;
  thesisLength: number;
  positionValue: 'long' | 'short';
  inputRowClass: string;
  onSubmit: (event: React.FormEvent) => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onClearKeyboardSelection: () => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageFiles: (files: File[]) => void;
  onRemoveImage: () => void;
  onClearMediaError: () => void;
}

/** Step sections + submit controls for the prediction form. */
export default function PredictionFormSteps({
  form,
  priceLock,
  tickerSearch,
  inputRef,
  suggestionsRef,
  expiryInputRef,
  thesisImageInputRef,
  lockBannerRef,
  isOnline,
  canSubmit,
  quotaLoading,
  quota,
  predictionsUsed,
  formFieldsDisabled,
  assetSearchDisabled,
  assetSearchDisabledTitle,
  offlineTitle,
  submitDisabled,
  submitError,
  tradeMetrics,
  mediaPreview,
  mediaError,
  thesisLength,
  positionValue,
  inputRowClass,
  onSubmit,
  onKeyDown,
  onClearKeyboardSelection,
  onSelectSuggestion,
  onImageUpload,
  onImageFiles,
  onRemoveImage,
  onClearMediaError,
}: PredictionFormStepsProps) {
  const openExpiryPicker = () => {
    if (!priceLock.lockStartMs || !expiryInputRef.current) return;
    priceLock.refreshExpiryPickerBounds(Date.now(), priceLock.expiryValue);
    const input = expiryInputRef.current;
    const pickerInput = input as HTMLInputElement & { showPicker?: () => void };
    if (typeof pickerInput.showPicker === 'function') {
      pickerInput.showPicker();
      return;
    }
    input.focus();
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-3xl">
      <PredictionFormAlerts
        isOnline={isOnline}
        canSubmit={canSubmit}
        quotaLoading={quotaLoading}
        quota={quota}
        predictionsUsed={predictionsUsed}
      />
      <div className="space-y-4">
        <PredictionAssetSearchSection
          tickerSearch={tickerSearch}
          inputRef={inputRef}
          suggestionsRef={suggestionsRef}
          inputRowClass={inputRowClass}
          assetSearchDisabled={assetSearchDisabled}
          assetSearchDisabledTitle={assetSearchDisabledTitle}
          isFetchingTicker={priceLock.isFetchingTicker}
          selectedTicker={priceLock.selectedTicker}
          selectedName={priceLock.selectedName}
          selectedTickerImage={priceLock.selectedTickerImage}
          tickerError={priceLock.tickerError}
          onQueryChangeClearError={() => priceLock.setTickerError('')}
          onKeyDown={onKeyDown}
          onClearKeyboardSelection={onClearKeyboardSelection}
          onSelectSuggestion={onSelectSuggestion}
        />

        {priceLock.hasActiveLock ? (
          <div ref={lockBannerRef} className="mb-4">
            <PriceLockBanner
              lockExpired={priceLock.lockExpired}
              lockRemainingSec={priceLock.lockRemainingSec}
            />
          </div>
        ) : null}

        <PredictionPositionSection
          position={positionValue}
          disabled={formFieldsDisabled}
          title={
            !isOnline
              ? offlineTitle
              : !priceLock.selectedTicker
                ? 'Select an asset first'
                : undefined
          }
          onChange={(position) => form.setValue('position', position)}
        />

        <PredictionTradeLevelsSection
          register={form.register}
          entryPriceError={form.formState.errors.entryPrice}
          formFieldsDisabled={formFieldsDisabled}
          selectedTicker={priceLock.selectedTicker}
          riskRewardText={tradeMetrics.riskRewardText}
          potentialUpside={tradeMetrics.potentialUpside}
          potentialDownside={tradeMetrics.potentialDownside}
        />

        <PredictionExpirySection
          lockStartMs={priceLock.lockStartMs}
          expiryValue={priceLock.expiryValue}
          expiryMinMax={priceLock.expiryMinMax}
          formFieldsDisabled={formFieldsDisabled}
          expiryInputRef={expiryInputRef}
          onExpiryChange={priceLock.setExpiryValue}
          onOpenPicker={openExpiryPicker}
        />

        <PredictionConfidenceSection
          control={form.control}
          formFieldsDisabled={formFieldsDisabled}
        />

        <PredictionThesisSection
          register={form.register}
          thesisError={form.formState.errors.thesis}
          thesisLength={thesisLength}
          formFieldsDisabled={formFieldsDisabled}
          thesisImageInputRef={thesisImageInputRef}
          mediaPreview={mediaPreview}
          mediaError={mediaError}
          onImageUpload={onImageUpload}
          onImageFiles={onImageFiles}
          onRemoveImage={onRemoveImage}
          onClearMediaError={onClearMediaError}
        />

        {submitError ? (
          <p className="flex items-center gap-2 text-sm text-red-400">
            <CircleAlert className="h-4 w-4 shrink-0" />
            {submitError}
          </p>
        ) : null}

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
          className="w-full px-6 py-3 font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          Submit Prediction
        </PrimaryButton>
      </div>
    </form>
  );
}
