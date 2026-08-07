'use client';

import Skeleton from '@/components/app/common/Skeleton';
import {
  ANALYTICS_KPI_GRID_CLASS,
  AnalyticsKpiCard,
  signedMetricClass,
} from '@/components/app/predictions/analytics/AnalyticsKpiCard';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';
import {
  formatNetRr,
  formatPercent,
  formatSignedPercent,
} from '@/utils/predictions/analyticsFormat';

interface AnalyticsRecentFormKpiCardsProps {
  recent: PredictionAnalyticsDashboard['recent_30d'];
}

export default function AnalyticsRecentFormKpiCards({
  recent,
}: AnalyticsRecentFormKpiCardsProps) {
  const netRr = recent.net_rr;
  const netReturn = recent.net_return_percent ?? null;

  return (
    <div className={ANALYTICS_KPI_GRID_CLASS} aria-label="Recent form key metrics">
      <AnalyticsKpiCard
        label="Resolved (30D)"
        value={String(recent.resolved_count)}
      />
      <AnalyticsKpiCard
        label="Win rate (30D)"
        value={formatPercent(recent.win_rate_percent)}
      />
      <AnalyticsKpiCard
        label="Net RR (30D)"
        value={formatNetRr(netRr)}
        valueClassName={signedMetricClass(netRr)}
      />
      <AnalyticsKpiCard
        label="Net P/L (30D)"
        value={formatSignedPercent(netReturn)}
        valueClassName={signedMetricClass(netReturn)}
      />
    </div>
  );
}

export function AnalyticsRecentFormKpiCardsSkeleton() {
  return (
    <div className={ANALYTICS_KPI_GRID_CLASS} aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="min-w-0 rounded-xl border border-white/10 bg-black/20 p-3"
        >
          <Skeleton variant="text" width={72} height={12} />
          <Skeleton variant="text" width={56} height={28} className="mt-3" />
        </div>
      ))}
    </div>
  );
}
