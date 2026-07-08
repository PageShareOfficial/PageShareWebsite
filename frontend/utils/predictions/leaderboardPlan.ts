import type { PlanId } from '@/types/billing';
import type { LeaderboardEntry } from '@/types/predictions';

export const DEFAULT_LEADERBOARD_PLAN: PlanId = 'analyst';

export function getLeaderboardPlanId(entry: LeaderboardEntry): PlanId {
  return entry.subscriptionPlanId ?? DEFAULT_LEADERBOARD_PLAN;
}
