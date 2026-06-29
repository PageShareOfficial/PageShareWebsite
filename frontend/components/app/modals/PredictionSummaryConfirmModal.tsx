import Modal from '@/components/app/common/Modal';
import ImageWithFallback from '@/components/app/common/ImageWithFallback';
import { getInitials } from '@/utils/core/textFormatting';

interface PredictionSummaryConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
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
      <span className={`text-sm font-medium ${valueClass}`}>{value}</span>
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
  const positionLabel = position === 'long' ? 'LONG' : 'SHORT';
  const positionClass =
    position === 'long' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Prediction Summary"
      maxWidth="md"
      contentClassName="p-4 sm:p-6"
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
          <Row label="Entry Price" value={`$${entryPrice.toLocaleString()}`} />
          <Row label="Target Price" value={`$${targetPrice.toLocaleString()}`} valueClass="text-emerald-300" />
          <Row label="Stop Loss" value={`$${stopLoss.toLocaleString()}`} valueClass="text-red-300" />
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

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onClose}
          className="w-full sm:w-auto rounded-lg border border-white/20 px-5 py-2.5 text-white hover:bg-white/5"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className="w-full sm:w-auto rounded-lg bg-white px-5 py-2.5 font-semibold text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Submit Prediction
        </button>
      </div>
    </Modal>
  );
}
