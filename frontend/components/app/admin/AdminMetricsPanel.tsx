'use client';

import { useCallback, useEffect, useState } from 'react';
import ErrorState from '@/components/app/common/ErrorState';
import LoadingState from '@/components/app/common/LoadingState';
import { useAuth } from '@/contexts/AuthContext';
import { getMetricsDashboard, type MetricsDashboard } from '@/lib/api/adminApi';
import { formatDateTime } from '@/utils/core/dateUtils';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface MetricTile {
  label: string;
  value: string;
}

/** Backend growth values are fractions (0.25 = +25%). */
export function formatGrowth(ratio: number | undefined): string {
  if (ratio === undefined || Number.isNaN(ratio)) return '—';
  const percent = ratio * 100;
  const sign = percent > 0 ? '+' : '';
  return `${sign}${percent.toFixed(1)}%`;
}

export function buildMetricTiles(metrics: MetricsDashboard): MetricTile[] {
  const users = metrics.user_metrics;
  const engagement = metrics.engagement_metrics;
  const growth = metrics.growth_metrics;
  return [
    { label: 'Total users', value: users.total_users.toLocaleString() },
    { label: 'Daily active', value: users.dau.toLocaleString() },
    { label: 'Monthly active', value: users.mau.toLocaleString() },
    { label: 'Signups this week', value: (users.new_signups.this_week ?? 0).toLocaleString() },
    { label: 'Posts', value: engagement.total_posts.toLocaleString() },
    { label: 'Comments', value: engagement.total_comments.toLocaleString() },
    { label: 'Reactions', value: engagement.total_reactions.toLocaleString() },
    { label: 'Reposts', value: engagement.total_reposts.toLocaleString() },
    { label: 'User growth (WoW)', value: formatGrowth(growth.user_growth.week_over_week) },
    { label: 'Content growth (WoW)', value: formatGrowth(growth.content_growth.week_over_week) },
    { label: 'Errors today', value: String(metrics.platform_health.errors.total_today ?? 0) },
    { label: 'Critical today', value: String(metrics.platform_health.errors.critical_today ?? 0) },
  ];
}

function useMetricsDashboard() {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const [metrics, setMetrics] = useState<MetricsDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!accessToken) return;
    let cancelled = false;
    setError(null);
    getMetricsDashboard(accessToken)
      .then((result) => {
        if (!cancelled) setMetrics(result);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load metrics.'));
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, reloadToken]);

  const reload = useCallback(() => {
    setMetrics(null);
    setReloadToken((token) => token + 1);
  }, []);
  return { metrics, error, reload };
}

export default function AdminMetricsPanel() {
  const { metrics, error, reload } = useMetricsDashboard();

  if (error) return <ErrorState message={error} onRetry={reload} />;
  if (!metrics) return <LoadingState text="Loading metrics…" />;

  return (
    <section className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {buildMetricTiles(metrics).map((tile) => (
          <div key={tile.label} className="rounded-xl border border-white/10 p-4">
            <p className="text-xs text-gray-400">{tile.label}</p>
            <p className="mt-1 text-xl font-semibold text-white">{tile.value}</p>
          </div>
        ))}
      </div>
      {metrics.timestamp && (
        <p className="text-xs text-gray-500">Updated {formatDateTime(metrics.timestamp)}</p>
      )}
    </section>
  );
}
