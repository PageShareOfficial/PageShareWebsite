'use client';

import { CircleAlert, WifiOff } from '@/constants/icons';
import { MAX_PREDICTIONS_PER_DAY } from '@/utils/predictions/predictionRules';
import type { PredictionSubmissionQuota } from '@/hooks/predictions/usePredictionSubmissionQuota';

interface PredictionFormAlertsProps {
  isOnline: boolean;
  canSubmit: boolean;
  quotaLoading: boolean;
  quota: PredictionSubmissionQuota | null;
  predictionsUsed: number;
}

/** Offline and daily-quota banners for the prediction form. */
export default function PredictionFormAlerts({
  isOnline,
  canSubmit,
  quotaLoading,
  quota,
  predictionsUsed,
}: PredictionFormAlertsProps) {
  return (
    <>
      {!isOnline ? (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <WifiOff className="mt-0.5 h-5 w-5 shrink-0" />
          <span>You&apos;re offline. Reconnect to search assets and submit predictions.</span>
        </div>
      ) : null}

      {!canSubmit && !quotaLoading && quota !== null ? (
        <div className="mb-6 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0" />
          <span>
            You have submitted {predictionsUsed} predictions today (max{' '}
            {MAX_PREDICTIONS_PER_DAY}). Try again tomorrow.
          </span>
        </div>
      ) : null}
    </>
  );
}
