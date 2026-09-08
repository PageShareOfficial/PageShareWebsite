'use client';

import AuthorBadges from '@/components/app/common/AuthorBadges';
import { getLeaderboardIdentity } from '@/utils/predictions/leaderboardIdentity';
import { getLeaderboardPlanId } from '@/utils/predictions/leaderboardPlan';
import type { LeaderboardEntry } from '@/types/predictions';

interface LeaderboardTraderLinkProps {
  entry: LeaderboardEntry;
  maskIdentity?: boolean;
}

export default function LeaderboardTraderLink({
  entry,
  maskIdentity = false,
}: LeaderboardTraderLinkProps) {
  const identity = getLeaderboardIdentity(entry, maskIdentity);

  return (
    <div className="min-w-0 text-left">
      <div className="flex min-w-0 items-center gap-1">
        <span className="truncate font-medium text-white">{identity.displayName}</span>
        <AuthorBadges
          subscriptionPlanId={getLeaderboardPlanId(entry)}
          size="sm"
          className="shrink-0"
        />
      </div>
      {identity.handle && (
        <div className="truncate text-xs text-gray-500">@{identity.handle}</div>
      )}
    </div>
  );
}
