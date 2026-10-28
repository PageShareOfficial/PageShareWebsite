import {
  MAX_PREDICTIONS_PER_DAY,
  validateExpiryAgainstStart,
  validatePositionSides,
  validatePriceDistance,
  validateRiskReward,
} from '@/utils/predictions/predictionRules';
import { parseDatetimeLocal } from '@/utils/predictions/datetimeLocal';
import type { PredictionFormValues } from '@/utils/predictions/predictionFormSchema';

interface ValidatePredictionDraftArgs {
  values: PredictionFormValues;
  selectedTicker: string | null;
  lockStartMs: number | null;
  lockExpired: boolean;
  canSubmit: boolean;
  predictionsUsed: number;
  expiryValue: string;
  submittedAtMs: number;
  syncExpiryBounds: (submitMs: number) => void;
}

/**
 * Shared pre-submit / pre-confirm checks for the prediction form.
 * Returns an error message, or null when valid (and sets expiryDate via callback path).
 */
export function validatePredictionDraft(
  args: ValidatePredictionDraftArgs
): { error: string } | { error: null; expiryDate: Date } {
  const {
    values,
    selectedTicker,
    lockStartMs,
    lockExpired,
    canSubmit,
    predictionsUsed,
    expiryValue,
    submittedAtMs,
    syncExpiryBounds,
  } = args;

  if (!selectedTicker || lockStartMs === null) {
    return { error: 'Select an asset and lock a price first.' };
  }
  if (lockExpired) {
    return { error: 'Price lock expired. Search the asset again to refresh.' };
  }
  if (!canSubmit) {
    return {
      error: `Daily limit reached (${predictionsUsed} / ${MAX_PREDICTIONS_PER_DAY} predictions submitted today).`,
    };
  }

  syncExpiryBounds(submittedAtMs);
  const expiryDate = parseDatetimeLocal(expiryValue);
  if (!expiryDate) {
    return { error: 'Choose a valid expiry time.' };
  }
  const expiryErr = validateExpiryAgainstStart(submittedAtMs, expiryDate);
  if (expiryErr) return { error: expiryErr };

  const sideErr = validatePositionSides(
    values.position,
    values.entryPrice,
    values.targetPrice,
    values.stopLoss
  );
  if (sideErr) return { error: sideErr };

  const distErr = validatePriceDistance(
    values.entryPrice,
    values.targetPrice,
    values.stopLoss
  );
  if (distErr) return { error: distErr };

  const rrErr = validateRiskReward(
    values.entryPrice,
    values.targetPrice,
    values.stopLoss
  );
  if (rrErr) return { error: rrErr };

  return { error: null, expiryDate };
}
