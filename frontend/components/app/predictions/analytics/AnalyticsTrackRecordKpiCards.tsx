'use client';

import Skeleton from '@/components/app/common/Skeleton';
import {
  AnalyticsKpiCard,
  signedMetricClass,
} from '@/components/app/predictions/analytics/AnalyticsKpiCard';
import {
  ANALYTICS_KPI_GRID_CLASS,
  TradeExtremesValue,
} from '@/components/app/predictions/analytics/AnalyticsTradeExtremesValue';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';
import {
  formatMaxTradeDurationHours,
  formatPercent,
  formatSignedPercent,
} from '@/utils/predictions/analyticsFormat';

interface AnalyticsTrackRecordKpiCardsProps {
  lifetime: PredictionAnalyticsDashboard['lifetime'];
}

export default function AnalyticsTrackRecordKpiCards({
  lifetime,
}: AnalyticsTrackRecordKpiCardsProps) {
  const netReturn = lifetime.net_return_percent ?? null;

  return (
    <div
      className={ANALYTICS_KPI_GRID_CLASS}
      aria-label="Track record key metrics"
    >
      <AnalyticsKpiCard
        label="Win rate (all time)"
        value={formatPercent(lifetime.win_rate_percent)}
      />
      <AnalyticsKpiCard
        label="Net P/L (all time)"
        value={formatSignedPercent(netReturn)}
        valueClassName={signedMetricClass(netReturn)}
      />
      <AnalyticsKpiCard
        label="Best / worst trade"
        valueNode={
          <TradeExtremesValue
            best={lifetime.best_return_percent}
            worst={lifetime.worst_return_percent}
          />
        }
      />
      <AnalyticsKpiCard
        label="Longest trade window"
        value={formatMaxTradeDurationHours(lifetime.max_trade_duration_hours)}
      />
    </div>
  );
}

export function AnalyticsTrackRecordKpiCardsSkeleton() {
  return (
    <div className={ANALYTICS_KPI_GRID_CLASS} aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3"
        >
          <Skeleton variant="text" width={88} height={12} />
          <Skeleton variant="text" width={56} height={28} className="mt-3" />
        </div>
      ))}
    </div>
  );
}
