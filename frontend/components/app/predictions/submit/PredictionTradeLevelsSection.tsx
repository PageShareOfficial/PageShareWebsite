'use client';

import type { FieldError, UseFormRegister } from 'react-hook-form';
import CoinbaseLogo from '@/components/app/common/CoinbaseLogo';
import PredictionFormSection from '@/components/app/predictions/submit/PredictionFormSection';
import { MIN_RISK_REWARD } from '@/utils/predictions/predictionRules';
import { formatPercent } from '@/utils/predictions/predictionFormFormat';
import type { PredictionFormValues } from '@/utils/predictions/predictionFormSchema';

interface PredictionTradeLevelsSectionProps {
  register: UseFormRegister<PredictionFormValues>;
  entryPriceError?: FieldError;
  formFieldsDisabled: boolean;
  selectedTicker: string | null;
  riskRewardText: string;
  potentialUpside: number;
  potentialDownside: number;
}

/** Step 3: entry / target / stop and RR metrics. */
export default function PredictionTradeLevelsSection({
  register,
  entryPriceError,
  formFieldsDisabled,
  selectedTicker,
  riskRewardText,
  potentialUpside,
  potentialDownside,
}: PredictionTradeLevelsSectionProps) {
  return (
    <PredictionFormSection step={3} title="Trade Levels">
      <div className={`space-y-3 ${formFieldsDisabled ? 'opacity-60' : ''}`}>
        <div>
          <label htmlFor="entryPrice" className="mb-1 block text-sm font-medium text-gray-300">
            Entry Price (USD)
          </label>
          <input
            id="entryPrice"
            type="number"
            step="any"
            readOnly={Boolean(selectedTicker)}
            {...register('entryPrice', { valueAsNumber: true })}
            className={`h-11 w-full rounded-lg border px-3 text-white ${
              selectedTicker
                ? 'cursor-not-allowed border-white/10 bg-white/3 text-gray-300'
                : 'border-white/10 bg-white/5'
            }`}
          />
          {selectedTicker ? (
            <p className="mt-1 text-xs text-gray-500">
              Locked to the price snapshot for this asset.
            </p>
          ) : null}
          {entryPriceError ? (
            <p className="mt-1 text-xs text-red-400">{entryPriceError.message}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="targetPrice"
              className="mb-1 block text-sm font-medium text-gray-300"
            >
              Target Price (USD)
            </label>
            <input
              id="targetPrice"
              type="number"
              step="any"
              disabled={formFieldsDisabled}
              {...register('targetPrice', { valueAsNumber: true })}
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
          <div>
            <label htmlFor="stopLoss" className="mb-1 block text-sm font-medium text-gray-300">
              Stop Loss (USD)
            </label>
            <input
              id="stopLoss"
              type="number"
              step="any"
              disabled={formFieldsDisabled}
              {...register('stopLoss', { valueAsNumber: true })}
              className="h-11 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-white disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="text-xs text-gray-500">Risk-Reward (RR)</p>
            <p className="text-lg font-semibold text-white">{riskRewardText}</p>
            <p className="text-xs text-gray-500">≥ {MIN_RISK_REWARD} required</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="text-xs text-gray-500">Potential Upside</p>
            <p className="text-lg font-semibold text-emerald-300">
              {formatPercent(potentialUpside)}
            </p>
            <p className="text-xs text-gray-500">≥ 1% required</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
            <p className="text-xs text-gray-500">Potential Downside</p>
            <p className="text-lg font-semibold text-red-300">
              {formatPercent(potentialDownside)}
            </p>
            <p className="text-xs text-gray-500">≥ 0.5% required</p>
          </div>
        </div>

        <p className="flex items-center justify-end gap-1.5 text-right text-xs text-gray-500">
          <CoinbaseLogo className="h-6 w-6 shrink-0" />
          <span>
            Market data provided by Coinbase. Outcomes are verified against Coinbase prices.
          </span>
        </p>
      </div>
    </PredictionFormSection>
  );
}
