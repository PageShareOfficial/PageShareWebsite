'use client';

import { useState } from 'react';
import Modal from '@/components/app/common/Modal';
import ImageWithFallback from '@/components/app/common/ImageWithFallback';
import { PrimaryButton, SecondaryButton } from '@/components/app/common/Button';
import FormErrorMessage from '@/components/app/common/FormErrorMessage';
import LoadingState from '@/components/app/common/LoadingState';
import { getInitials } from '@/utils/core/textFormatting';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

const MAX_TRADE_PRICE_DECIMALS = 8;

function formatPredictionUsdPrice(value: number): string {
  if (!Number.isFinite(value)) {
    return '-';
  }

  const trimmed = value
    .toFixed(MAX_TRADE_PRICE_DECIMALS)
    .replace(/\.?0+$/, '');
  const [wholePart, fractionPart] = trimmed.split('.');
  const formattedWhole = Number(wholePart).toLocaleString('en-US');

  return fractionPart
    ? `$${formattedWhole}.${fractionPart}`
    : `$${formattedWhole}`;
}

interface PredictionSummaryConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  confirmDisabled?: boolean;
  confirmDisabledMessage?: string;
  assetLabel: string;
  assetImageSrc?: string;
  assetImageAlt?: string;
  position: 'long' | 'short';
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskRewardText: string;
  potentialUpsideText: string;
  potentialDownsideText: string;
  expiryText: string;
  confidence: number;
}

function Row({ label, value, valueClass = 'text-white' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm font-medium tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function PredictionSummaryConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  confirmDisabled = false,
  confirmDisabledMessage,
  assetLabel,
  assetImageSrc,
  assetImageAlt,
  position,
  entryPrice,
  targetPrice,
  stopLoss,
  riskRewardText,
  potentialUpsideText,
  potentialDownsideText,
  expiryText,
  confidence,
}: PredictionSummaryConfirmModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const positionLabel = position === 'long' ? 'LONG' : 'SHORT';
  const positionClass =
    position === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300';

  const handleClose = () => {
    if (!isSubmitting) {
      setError(null);
      onClose();
    }
  };

  const handleConfirm = async () => {
    if (confirmDisabled || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onConfirm();
      handleClose();
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Prediction Summary"
      maxWidth="md"
      contentClassName="p-4 sm:p-6"
      closeOnOverlayClick={!isSubmitting}
    >
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black/30 px-3 py-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-md bg-white/10">
              <ImageWithFallback
                src={assetImageSrc ?? ''}
                alt={assetImageAlt || assetLabel}
                className="h-full w-full"
                fallback={
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-white">
                    {getInitials(assetImageAlt || assetLabel)}
                  </div>
                }
              />
            </div>
            <p className="min-w-0 truncate text-sm font-medium text-white">{assetLabel}</p>
          </div>
          <span className={`rounded px-2 py-1 text-[10px] font-semibold tracking-wide ${positionClass}`}>
            {positionLabel}
          </span>
        </div>
        <div className="mt-3 divide-y divide-white/10">
          <Row label="Entry Price" value={formatPredictionUsdPrice(entryPrice)} />
          <Row label="Target Price" value={formatPredictionUsdPrice(targetPrice)} valueClass="text-emerald-300" />
          <Row label="Stop Loss" value={formatPredictionUsdPrice(stopLoss)} valueClass="text-red-300" />
          <Row label="Risk-Reward (RR)" value={riskRewardText} />
          <Row label="Potential Upside" value={potentialUpsideText} valueClass="text-emerald-300" />
          <Row label="Potential Downside" value={potentialDownsideText} valueClass="text-red-300" />
          <Row label="Expiry" value={expiryText} />
          <Row label="Confidence" value={confidence.toFixed(2)} />
        </div>
      </div>

      {confirmDisabled && confirmDisabledMessage ? (
        <p className="mt-3 text-sm text-amber-300">{confirmDisabledMessage}</p>
      ) : null}

      <FormErrorMessage message={error ?? undefined} className="mt-3" />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <SecondaryButton
          type="button"
          onClick={handleClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cancel
        </SecondaryButton>
        <PrimaryButton
          type="button"
          onClick={() => void handleConfirm()}
          disabled={confirmDisabled || isSubmitting}
          className="w-full sm:w-auto px-5 py-2.5 font-semibold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting ? (
            <LoadingState text="Submitting..." size="sm" inline className="text-black" />
          ) : (
            'Submit Prediction'
          )}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
