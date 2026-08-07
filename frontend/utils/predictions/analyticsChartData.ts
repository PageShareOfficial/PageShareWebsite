import type { BarChartItem } from '@/components/app/predictions/analytics/AnalyticsHorizontalBarChart';
import type { ChartSegment } from '@/components/app/predictions/analytics/AnalyticsDonutChart';
import type {
  PredictionAnalyticsDashboard,
} from '@/lib/api/predictionApi';

export const ANALYTICS_OUTCOME_COLORS = {
  win: 'rgb(52 211 153 / 0.9)',
  loss: 'rgb(248 113 113 / 0.85)',
  expired: 'rgb(156 163 175 / 0.75)',
} as const;

export const ANALYTICS_OUTCOME_BAR_FILL = {
  win: 'rgb(52 211 153)',
  loss: 'rgb(248 113 113)',
  expired: 'rgb(156 163 175)',
} as const;

export interface OutcomeCounts {
  wins: number;
  losses: number;
  expired: number;
}

export function buildOutcomeChartSegments(
  counts: OutcomeCounts
): ChartSegment[] {
  return [
    { label: 'Wins', value: counts.wins, color: ANALYTICS_OUTCOME_COLORS.win },
    {
      label: 'Losses',
      value: counts.losses,
      color: ANALYTICS_OUTCOME_COLORS.loss,
    },
    {
      label: 'Expired',
      value: counts.expired,
      color: ANALYTICS_OUTCOME_COLORS.expired,
    },
  ];
}

export function buildPipelineBars(
  lifetime: PredictionAnalyticsDashboard['lifetime']
): BarChartItem[] {
  return [
    {
      label: 'Total locked',
      value: lifetime.total_predictions,
      color: 'rgb(96 165 250 / 0.85)',
    },
    {
      label: 'Resolved',
      value: lifetime.resolved_count,
      color: 'rgb(52 211 153 / 0.85)',
    },
    {
      label: 'Still active',
      value: lifetime.active_count,
      color: 'rgb(251 191 36 / 0.85)',
    },
  ];
}

export function buildTopAssetBars(
  topAssets: PredictionAnalyticsDashboard['style']['top_assets']
): BarChartItem[] {
  return topAssets.map((item, index) => ({
    label: item.asset,
    value: item.count,
    color:
      index === 0
        ? 'rgb(52 211 153 / 0.9)'
        : `rgb(52 211 153 / ${Math.max(0.35, 0.85 - index * 0.15)})`,
  }));
}

export function buildLongShortSegments(
  style: PredictionAnalyticsDashboard['style']
): ChartSegment[] {
  if (style.long_count + style.short_count <= 0) {
    return [];
  }
  return [
    {
      label: 'Long',
      value: style.long_count,
      color: 'rgb(52 211 153 / 0.9)',
    },
    {
      label: 'Short',
      value: style.short_count,
      color: 'rgb(96 165 250 / 0.85)',
    },
  ];
}
