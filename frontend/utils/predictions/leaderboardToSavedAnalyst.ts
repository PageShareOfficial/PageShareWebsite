import type { LeaderboardEntry } from '@/types/predictions';
import type { SavedAnalyst } from '@/types/savedAnalyst';
import { DEFAULT_LEADERBOARD_PLAN } from '@/utils/predictions/leaderboardPlan';

export function leaderboardEntryToSavedAnalyst(entry: LeaderboardEntry): SavedAnalyst {
  return {
    id: entry.handle,
    handle: entry.handle,
    displayName: entry.displayName,
    avatar: entry.avatar,
    subscriptionPlanId: entry.subscriptionPlanId ?? DEFAULT_LEADERBOARD_PLAN,
  };
}
