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
  const rounded = Math.round(value * 100) / 100;
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}${rounded}%`;
}

/** One decimal place; for chart axis labels (always shows sign for positive). */
export function formatSignedPercentAxis(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  const prefix = rounded > 0 ? '+' : '';
  return `${prefix}${rounded}%`;
}

/** Max hold window from prediction start to expiry (backend sends hours). */
export function formatMaxTradeDurationHours(
  hours: number | null | undefined
): string {
  if (hours == null || hours <= 0) return '—';
  const wholeHours = Math.round(hours * 10) / 10;
  if (wholeHours >= 24) {
    const days = Math.floor(wholeHours / 24);
    const rem = Math.round(wholeHours - days * 24);
    if (rem <= 0) return `${days}d`;
    return `${days}d ${rem}h`;
  }
  if (Number.isInteger(wholeHours)) {
    return `${wholeHours}h`;
  }
  return `${wholeHours}h`;
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
