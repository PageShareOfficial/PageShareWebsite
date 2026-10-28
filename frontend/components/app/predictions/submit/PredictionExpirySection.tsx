'use client';

import { type RefObject } from 'react';
import { Calendar } from '@/constants/icons';
import PredictionFormSection from '@/components/app/predictions/submit/PredictionFormSection';

interface PredictionExpirySectionProps {
  lockStartMs: number | null;
  expiryValue: string;
  expiryMinMax: { min: string; max: string };
  formFieldsDisabled: boolean;
  expiryInputRef: RefObject<HTMLInputElement | null>;
  onExpiryChange: (value: string) => void;
  onOpenPicker: () => void;
}

/** Step 4: lock timestamp and expiry datetime picker. */
export default function PredictionExpirySection({
  lockStartMs,
  expiryValue,
  expiryMinMax,
  formFieldsDisabled,
  expiryInputRef,
  onExpiryChange,
  onOpenPicker,
}: PredictionExpirySectionProps) {
  return (
    <PredictionFormSection step={4} title="Expiry Time">
      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${formFieldsDisabled ? 'opacity-60' : ''}`}
      >
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-300">Price locked at</label>
          <input
            type="text"
            value={lockStartMs ? new Date(lockStartMs).toLocaleString() : '-'}
            disabled
            className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-gray-400"
          />
          <p className="mt-1 text-xs text-gray-500">Prediction start is set when you submit.</p>
        </div>
        <div className="relative">
          <label htmlFor="expiry" className="mb-1 block text-sm font-medium text-gray-300">
            Expiry Time
          </label>
          <input
            ref={expiryInputRef}
            id="expiry"
            type="datetime-local"
            value={expiryValue}
            min={expiryMinMax.min}
            max={expiryMinMax.max}
            onChange={(event) => onExpiryChange(event.target.value)}
            disabled={!lockStartMs || formFieldsDisabled}
            className="scheme-dark h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 pr-10 text-white disabled:cursor-not-allowed disabled:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          />
          <button
            type="button"
            onClick={onOpenPicker}
            disabled={!lockStartMs || formFieldsDisabled}
            className="absolute top-[2.02rem] right-2.5 inline-flex h-6 w-6 items-center justify-center rounded-sm text-white/90 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Open expiry calendar"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>
      {expiryMinMax.min ? (
        <p className="mt-2 text-xs text-gray-500">
          {' '}
          Min: 30 mins from submit · Max: 2 days from submit
        </p>
      ) : null}
    </PredictionFormSection>
  );
}
