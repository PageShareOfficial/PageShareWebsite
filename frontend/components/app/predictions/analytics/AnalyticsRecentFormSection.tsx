'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import AnalyticsDonutChart from '@/components/app/predictions/analytics/AnalyticsDonutChart';
import AnalyticsNetRrAreaChart from '@/components/app/predictions/analytics/AnalyticsNetRrAreaChart';
import AnalyticsRecentFormKpiCards from '@/components/app/predictions/analytics/AnalyticsRecentFormKpiCards';
import AnalyticsResolvedReturnBarChart from '@/components/app/predictions/analytics/AnalyticsResolvedReturnBarChart';
import AnalyticsSectionCard from '@/components/app/predictions/analytics/AnalyticsSectionCard';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';
import { buildOutcomeChartSegments } from '@/utils/predictions/analyticsChartData';
import { formatNetRr, formatPercent } from '@/utils/predictions/analyticsFormat';
import { formatDate } from '@/utils/core/dateUtils';

const NET_RR_HELP_TEXT =
  'Each resolved prediction contributes setup RR: wins add +RR, losses subtract −RR, expired adds 0. The area chart shows how Net RR built over the last 30 days.';

interface AnalyticsRecentFormSectionProps {
  dashboard: PredictionAnalyticsDashboard;
}

export default function AnalyticsRecentFormSection({
  dashboard,
}: AnalyticsRecentFormSectionProps) {
  const [netRrHelpOpen, setNetRrHelpOpen] = useState(false);
  const recent = dashboard.recent_30d;
  const outcomeSegments = buildOutcomeChartSegments(recent);

  return (
    <AnalyticsSectionCard
      title="Recent form"
      titleMeta={
        <p className="text-sm text-gray-400 tabular-nums">
          {formatDate(dashboard.recent_30d_period_start)} –{' '}
          {formatDate(dashboard.recent_30d_period_end)}
        </p>
      }
    >
      <AnalyticsRecentFormKpiCards recent={recent} />
      <AnalyticsNetRrAreaChart
        series={dashboard.net_rr_series_30d}
        title="Cumulative Net RR (30 days)"
        caption={formatNetRr(recent.net_rr)}
      />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <AnalyticsDonutChart
          title="Outcomes (30d)"
          segments={outcomeSegments}
          centerValue={formatPercent(recent.win_rate_percent)}
          centerLabel="Win rate"
          emptyMessage="No resolved calls in the last 30 days."
        />
        <AnalyticsResolvedReturnBarChart
          title="Return by prediction (30d)"
          bars={dashboard.resolved_returns_30d}
        />
      </div>
      <button
        type="button"
        onClick={() => setNetRrHelpOpen((open) => !open)}
        className="mt-4 flex w-full items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-left text-xs text-gray-400 hover:bg-white/5"
      >
        How Net RR works
        {netRrHelpOpen ? (
          <ChevronUp className="h-4 w-4 shrink-0" aria-hidden />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
        )}
      </button>
      {netRrHelpOpen ? (
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          {NET_RR_HELP_TEXT}
        </p>
      ) : null}
    </AnalyticsSectionCard>
  );
}
