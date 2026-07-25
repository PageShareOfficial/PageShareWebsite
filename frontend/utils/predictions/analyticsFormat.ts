import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';

export function formatNetRr(value: number): string {
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value.toFixed(1)}`;
}

export function formatRank(
  rank: number | null | undefined,
  rankTotal: number
): string {
  if (rank == null || rank <= 0) return 'Unranked';
  if (rankTotal > 0) return `#${rank} of ${rankTotal}`;
  return `#${rank}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  return `${value}%`;
}

export function formatSignedPercent(value: number | null | undefined): string {
  if (value == null) return '—';
  const prefix = value > 0 ? '+' : '';
  return `${prefix}${value}%`;
}

export function buildRecentFormInsight(
  dashboard: PredictionAnalyticsDashboard
): string {
  const { recent_30d: recent, net_rr_30d: netRr } = dashboard;
  if (recent.resolved_count === 0) {
    return 'No resolved predictions in the last 30 days yet.';
  }
  if (recent.resolved_count < 3) {
    return 'Early sample in the last 30 days — rank and Net RR will stabilize with more resolved calls.';
  }
  const wr = recent.win_rate_percent;
  if (netRr > 0 && wr != null && wr < 50) {
    return 'Net RR is positive despite a sub-50% win rate — wins are carrying risk-reward.';
  }
  if (netRr < 0 && wr != null && wr >= 50) {
    return 'Win rate looks decent, but losses have cost more in RR terms recently.';
  }
  if (netRr >= 2) {
    return 'Strong recent form: Net RR over the last 30 days is leading the story.';
  }
  if (netRr <= -2) {
    return 'Recent drawdown in Net RR — check the Predictions tab for context on losses.';
  }
  return `${recent.resolved_count} resolved calls in 30 days — Net RR and win rate tell the full picture.`;
}

export function buildHeroSubline(
  dashboard: PredictionAnalyticsDashboard
): string {
  const { recent_30d: recent, rank_total: rankTotal } = dashboard;
  const rankPart =
    dashboard.rank != null && rankTotal > 0
      ? `Ranked ${formatRank(dashboard.rank, rankTotal)} by Net RR (30d).`
      : 'Building a ranked track record on PageShare.';
  return `${recent.resolved_count} resolved in the last 30 days · ${rankPart}`;
}
