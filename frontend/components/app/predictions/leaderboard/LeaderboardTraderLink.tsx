'use client';

import AuthorBadges from '@/components/app/common/AuthorBadges';
import { getLeaderboardPlanId } from '@/utils/predictions/leaderboardPlan';
import type { LeaderboardEntry } from '@/types/predictions';

interface LeaderboardTraderLinkProps {
  entry: LeaderboardEntry;
  onNavigate: () => void;
}

export default function LeaderboardTraderLink({ entry, onNavigate }: LeaderboardTraderLinkProps) {
  return (
    <button
      type="button"
      onClick={onNavigate}
      className="min-w-0 text-left group"
      title={`View @${entry.handle} profile`}
    >
      <div className="flex min-w-0 items-center gap-1">
        <span className="truncate font-medium text-white transition-colors group-hover:text-cyan-300">
          {entry.displayName}
        </span>
        <AuthorBadges
          subscriptionPlanId={getLeaderboardPlanId(entry)}
          size="sm"
          className="shrink-0"
        />
      </div>
      <div className="truncate text-xs text-gray-500 transition-colors group-hover:text-cyan-400">
        @{entry.handle}
      </div>
    </button>
  );
}
