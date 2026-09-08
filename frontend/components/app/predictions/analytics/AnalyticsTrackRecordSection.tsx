'use client';

import AnalyticsDonutChart from '@/components/app/predictions/analytics/AnalyticsDonutChart';
import AnalyticsHorizontalBarChart from '@/components/app/predictions/analytics/AnalyticsHorizontalBarChart';
import AnalyticsSectionCard from '@/components/app/predictions/analytics/AnalyticsSectionCard';
import AnalyticsTrackRecordKpiCards from '@/components/app/predictions/analytics/AnalyticsTrackRecordKpiCards';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';
import {
  buildOutcomeChartSegments,
  buildPipelineBars,
} from '@/utils/predictions/analyticsChartData';
import { formatPercent } from '@/utils/predictions/analyticsFormat';

interface AnalyticsTrackRecordSectionProps {
  lifetime: PredictionAnalyticsDashboard['lifetime'];
}

export default function AnalyticsTrackRecordSection({
  lifetime,
}: AnalyticsTrackRecordSectionProps) {
  const outcomeSegments = buildOutcomeChartSegments(lifetime);

  return (
    <AnalyticsSectionCard title="Track record">
      <AnalyticsTrackRecordKpiCards lifetime={lifetime} />
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsDonutChart
          title="Outcome mix (all time)"
          segments={outcomeSegments}
          centerValue={formatPercent(lifetime.win_rate_percent)}
          centerLabel="Win rate"
          emptyMessage="No resolved predictions yet."
        />
        <AnalyticsHorizontalBarChart
          title="Prediction pipeline"
          items={buildPipelineBars(lifetime)}
        />
      </div>
    </AnalyticsSectionCard>
  );
}
