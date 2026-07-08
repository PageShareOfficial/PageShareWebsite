'use client';

import { useRouter } from 'next/navigation';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import { navigateToProfile } from '@/utils/core/navigationUtils';
import { getPodiumBorderStyle, getPodiumRowClass } from '@/utils/predictions/leaderboardStyles';
import LeaderboardAccuracyActions from '@/components/app/predictions/leaderboard/LeaderboardAccuracyActions';
import LeaderboardRankDisplay from '@/components/app/predictions/leaderboard/LeaderboardRankDisplay';
import LeaderboardTraderLink from '@/components/app/predictions/leaderboard/LeaderboardTraderLink';
import type { LeaderboardEntry } from '@/types/predictions';

interface LeaderboardMobileRowProps {
  entry: LeaderboardEntry;
  showAnalytics: boolean;
  analyticsRequiresUpgrade: boolean;
  onAnalyticsUpgradeRequired: () => void;
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2 text-xs">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium tabular-nums text-gray-200">{value}</div>
    </div>
  );
}

export default function LeaderboardMobileRow({
  entry,
  showAnalytics,
  analyticsRequiresUpgrade,
  onAnalyticsUpgradeRequired,
}: LeaderboardMobileRowProps) {
  const router = useRouter();

  const podiumBorderStyle = getPodiumBorderStyle(entry.rank);

  return (
    <div
      style={podiumBorderStyle}
      className={`rounded-xl border-2 bg-black/65 px-3 py-3 ${getPodiumRowClass(entry.rank)}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="pt-0.5">
            <LeaderboardRankDisplay rank={entry.rank} />
          </div>
          <AvatarWithFallback
            src={entry.avatar}
            alt={entry.displayName}
            size={34}
            className="shrink-0"
          />
          <LeaderboardTraderLink
            entry={entry}
            onNavigate={() => navigateToProfile(entry.handle, router)}
          />
        </div>
        <LeaderboardAccuracyActions
          entry={entry}
          showAnalytics={showAnalytics}
          analyticsRequiresUpgrade={analyticsRequiresUpgrade}
          onAnalyticsUpgradeRequired={onAnalyticsUpgradeRequired}
          layout="mobile"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <StatBox label="Predictions" value={entry.predictionsCount} />
        <StatBox label="Correct" value={entry.verifiedCount} />
      </div>
    </div>
  );
}
