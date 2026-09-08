'use client';

import {
  ANALYTICS_KPI_GRID_CLASS,
  signedMetricClass
} from '@/components/app/predictions/analytics/AnalyticsKpiCard';
import {
  formatSignedPercent,
} from '@/utils/predictions/analyticsFormat';

interface TradeExtremesValueProps {
  best: number | null | undefined;
  worst: number | null | undefined;
}

export function TradeExtremesValue({ best, worst }: TradeExtremesValueProps) {
  if (best == null && worst == null) {
    return (
      <p className="mt-1.5 text-xl font-bold tabular-nums text-white">—</p>
    );
  }
  if (best != null && worst != null) {
    return (
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-1.5 text-xl font-bold tabular-nums">
        <span className={signedMetricClass(best)}>
          {formatSignedPercent(best)}
        </span>
        <span className="text-base font-medium text-gray-500">/</span>
        <span className={signedMetricClass(worst)}>
          {formatSignedPercent(worst)}
        </span>
      </p>
    );
  }
  const single = best ?? worst;
  return (
    <p
      className={`mt-1.5 text-xl font-bold tabular-nums ${signedMetricClass(single)}`}
    >
      {formatSignedPercent(single)}
    </p>
  );
}

export { ANALYTICS_KPI_GRID_CLASS };
