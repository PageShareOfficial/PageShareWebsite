'use client';

import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import { getLeaderboardRowPresentation } from '@/utils/predictions/leaderboardIdentity';
import {
  getPodiumBorderStyle,
  getPodiumRowClass,
  shouldHighlightOwnLeaderboardRow,
} from '@/utils/predictions/leaderboardStyles';
import LeaderboardAccuracyActions from '@/components/app/predictions/leaderboard/LeaderboardAccuracyActions';
import LeaderboardRankDisplay from '@/components/app/predictions/leaderboard/LeaderboardRankDisplay';
import LeaderboardTraderLink from '@/components/app/predictions/leaderboard/LeaderboardTraderLink';
import LeaderboardYouBadge from '@/components/app/predictions/leaderboard/LeaderboardYouBadge';
import type { LeaderboardEntry } from '@/types/predictions';

interface LeaderboardMobileRowProps {
  entry: LeaderboardEntry;
  showAnalytics: boolean;
  showSaveAnalyst: boolean;
  analyticsRequiresUpgrade: boolean;
  onAnalyticsUpgradeRequired: () => void;
  maskIdentity?: boolean;
  viewerHandle?: string | null;
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
  showSaveAnalyst,
  analyticsRequiresUpgrade,
  onAnalyticsUpgradeRequired,
  maskIdentity = false,
  viewerHandle = null,
}: LeaderboardMobileRowProps) {
  const { isOwnRow, maskThisRow, identity } = getLeaderboardRowPresentation(
    entry,
    maskIdentity,
    viewerHandle
  );
  const highlightOwn = shouldHighlightOwnLeaderboardRow(entry.rank, isOwnRow);
  const podiumBorderStyle = getPodiumBorderStyle(entry.rank, { highlightOwn });

  return (
    <div
      style={podiumBorderStyle}
      className={`relative rounded-xl border-2 bg-black/65 px-3 py-3 ${getPodiumRowClass(
        entry.rank,
        { highlightOwn }
      )}`}
    >
      {isOwnRow && <LeaderboardYouBadge rank={entry.rank} />}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="pt-0.5">
            <LeaderboardRankDisplay rank={entry.rank} />
          </div>
          <AvatarWithFallback
            src={identity.avatarSrc}
            alt={identity.avatarAlt}
            fallbackText={identity.avatarFallbackText}
            size={34}
            className="shrink-0"
          />
          <LeaderboardTraderLink entry={entry} maskIdentity={maskThisRow} />
        </div>
        <LeaderboardAccuracyActions
          entry={entry}
          showAnalytics={showAnalytics}
          showSaveAnalyst={showSaveAnalyst}
          analyticsRequiresUpgrade={analyticsRequiresUpgrade}
          onAnalyticsUpgradeRequired={onAnalyticsUpgradeRequired}
          maskIdentity={maskThisRow}
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
