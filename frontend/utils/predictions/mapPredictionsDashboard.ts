import type { PlanId } from '@/types/billing';
import type {
  MyPredictionAnalyticsSummary,
  PredictionLeaderboardEntry,
} from '@/lib/api/predictionApi';import type { AnalystScoreSummary, LeaderboardEntry } from '@/types/predictions';

export function mapLeaderboardEntry(
  entry: PredictionLeaderboardEntry
): LeaderboardEntry {
  const displayName =
    entry.display_name?.trim() || entry.username.trim() || 'Analyst';
  return {
    rank: entry.rank,
    displayName,
    handle: entry.username,
    score: entry.net_rr_30d,
    winRatePercent: entry.win_rate_percent ?? 0,
    predictionsCount: entry.predictions_count,
    verifiedCount: entry.wins,
    avatar: entry.profile_picture_url?.trim() ?? '',
    subscriptionPlanId: (entry.subscription_plan_id as PlanId | undefined) ?? 'analyst',
    avatarInitials: entry.avatar_initials?.trim() || undefined,
  };
}

export function mapAnalystScoreSummary(
  summary: MyPredictionAnalyticsSummary
): AnalystScoreSummary {
  return {
    rank: summary.rank ?? 0,
    winRatePercent: summary.win_rate_percent ?? 0,
    totalPredictions: summary.total_predictions,
  };
}

export function formatAnalystRank(rank: number): string {
  return rank > 0 ? `#${rank}` : '—';
}
