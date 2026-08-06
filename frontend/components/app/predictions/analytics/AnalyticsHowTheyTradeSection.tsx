'use client';

import AnalyticsChartCard from '@/components/app/predictions/analytics/AnalyticsChartCard';
import AnalyticsDonutChart from '@/components/app/predictions/analytics/AnalyticsDonutChart';
import AnalyticsHorizontalBarChart from '@/components/app/predictions/analytics/AnalyticsHorizontalBarChart';
import AnalyticsScaledMetricBar from '@/components/app/predictions/analytics/AnalyticsScaledMetricBar';
import AnalyticsSectionCard from '@/components/app/predictions/analytics/AnalyticsSectionCard';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';
import {
  buildLongShortSegments,
  buildTopAssetBars,
} from '@/utils/predictions/analyticsChartData';
import {
  MAX_CONFIDENCE,
  MIN_CONFIDENCE,
  MIN_RISK_REWARD,
} from '@/utils/predictions/predictionRules';

function formatConfidenceValue(value: number): string {
  return value.toFixed(2);
}

function formatSetupRrValue(value: number): string {
  return (Math.round(value * 10) / 10).toFixed(1);
}

function formatSetupRrScaleLabel(value: number): string {
  return value === MIN_RISK_REWARD ? '1.2' : value.toFixed(1);
}

function MetricEmptyCard({ title }: { title: string }) {
  return (
    <AnalyticsChartCard title={title}>
      <p className="text-sm text-gray-400">—</p>
    </AnalyticsChartCard>
  );
}

interface AnalyticsHowTheyTradeSectionProps {
  style: PredictionAnalyticsDashboard['style'];
}

export default function AnalyticsHowTheyTradeSection({
  style,
}: AnalyticsHowTheyTradeSectionProps) {
  const longShortSegments = buildLongShortSegments(style);

  return (
    <AnalyticsSectionCard title="How they trade">
      <div className="grid gap-6 lg:grid-cols-2">
        <AnalyticsDonutChart
          title="Long vs short"
          segments={longShortSegments}
          centerLabel="Bias"
          centerValue={
            style.long_percent != null ? `${style.long_percent}% L` : undefined
          }
          emptyMessage="No resolved predictions for direction split."
        />
        <AnalyticsHorizontalBarChart
          title="Top assets"
          items={buildTopAssetBars(style.top_assets)}
          emptyMessage="No asset breakdown yet."
          scrollMaxHeightClass="max-h-56"
        />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {style.average_confidence != null ? (
          <AnalyticsScaledMetricBar
            title="Avg confidence"
            rowLabel="Confidence"
            value={style.average_confidence}
            scaleMin={MIN_CONFIDENCE}
            scaleMax={MAX_CONFIDENCE}
            formatScaleLabel={formatConfidenceValue}
            formatValue={formatConfidenceValue}
            barColor="rgb(167 139 250 / 0.9)"
          />
        ) : (
          <MetricEmptyCard title="Avg confidence" />
        )}
        {style.average_setup_rr != null ? (
          <AnalyticsScaledMetricBar
            title="Avg setup RR"
            rowLabel="Risk-reward at submit"
            value={style.average_setup_rr}
            scaleMin={MIN_RISK_REWARD}
            fullBar
            formatScaleLabel={formatSetupRrScaleLabel}
            formatValue={formatSetupRrValue}
            barColor="rgb(251 191 36 / 0.9)"
          />
        ) : (
          <MetricEmptyCard title="Avg setup RR" />
        )}
      </div>
    </AnalyticsSectionCard>
  );
}
