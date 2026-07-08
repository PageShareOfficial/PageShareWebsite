import type { PlanId } from '@/types/billing';

/** Leaderboard ranks Analyst subscribers who submit predictions. */
export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  handle: string;
  score: number;
  winRatePercent: number;
  predictionsCount: number;
  verifiedCount: number;
  avatar: string;
  subscriptionPlanId?: PlanId;
};

export type AnalystScoreSummary = {
  rank: number;
  winRatePercent: number;
  totalPredictions: number;
};
