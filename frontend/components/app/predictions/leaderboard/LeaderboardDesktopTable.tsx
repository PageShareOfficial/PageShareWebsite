'use client';

import { useRouter } from 'next/navigation';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import { navigateToProfile } from '@/utils/core/navigationUtils';
import { getPodiumBorderStyle, getPodiumRowClass } from '@/utils/predictions/leaderboardStyles';
import LeaderboardAccuracyActions from '@/components/app/predictions/leaderboard/LeaderboardAccuracyActions';
import LeaderboardRankDisplay from '@/components/app/predictions/leaderboard/LeaderboardRankDisplay';
import LeaderboardTraderLink from '@/components/app/predictions/leaderboard/LeaderboardTraderLink';
import type { LeaderboardEntry } from '@/types/predictions';

interface LeaderboardDesktopTableProps {
  entries: LeaderboardEntry[];
  showAnalytics: boolean;
  showSaveAnalyst: boolean;
  analyticsRequiresUpgrade: boolean;
  onAnalyticsUpgradeRequired: () => void;
}

export default function LeaderboardDesktopTable({
  entries,
  showAnalytics,
  showSaveAnalyst,
  analyticsRequiresUpgrade,
  onAnalyticsUpgradeRequired,
}: LeaderboardDesktopTableProps) {
  const router = useRouter();

  return (
    <div className="hidden overflow-hidden px-2 py-2 lg:block">
      <table className="w-full table-fixed border-separate border-spacing-y-2 text-left text-sm">
        <colgroup>
          <col className="w-14" />
          <col />
          <col className="w-[6.5rem]" />
          <col className="w-[5.5rem]" />
          <col className={showAnalytics || showSaveAnalyst ? 'w-[9rem]' : 'w-[5.5rem]'} />
        </colgroup>
        <thead>
          <tr className="border-b border-white/10 bg-white/[0.04] text-xs uppercase tracking-wide text-gray-400">
            <th className="px-2 py-3 font-medium">Rank</th>
            <th className="px-2 py-3 font-medium">Analyst/Trader</th>
            <th className="whitespace-nowrap px-2 py-3 text-right font-medium tabular-nums tracking-normal">
              Predictions
            </th>
            <th className="whitespace-nowrap px-2 py-3 text-right font-medium tabular-nums tracking-normal">
              Correct
            </th>
            <th className="whitespace-nowrap px-2 py-3 text-right font-medium tabular-nums tracking-normal">
              Accuracy
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const podiumBorderStyle = getPodiumBorderStyle(entry.rank);
            return (
            <tr key={entry.handle}>
              <td
                style={podiumBorderStyle}
                className={`rounded-l-xl border-y-2 border-l-2 bg-black/65 px-2 py-3 pl-3 font-medium tabular-nums ${getPodiumRowClass(
                  entry.rank
                )}`}
              >
                <LeaderboardRankDisplay rank={entry.rank} />
              </td>
              <td
                style={podiumBorderStyle}
                className={`border-y-2 bg-black/65 px-2 py-3 ${getPodiumRowClass(entry.rank)}`}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <AvatarWithFallback
                    src={entry.avatar}
                    alt={entry.displayName}
                    size={36}
                    className="shrink-0"
                  />
                  <LeaderboardTraderLink
                    entry={entry}
                    onNavigate={() => navigateToProfile(entry.handle, router)}
                  />
                </div>
              </td>
              <td
                style={podiumBorderStyle}
                className={`border-y-2 bg-black/65 px-2 py-3 text-right tabular-nums text-gray-300 ${getPodiumRowClass(
                  entry.rank
                )}`}
              >
                {entry.predictionsCount}
              </td>
              <td
                style={podiumBorderStyle}
                className={`border-y-2 bg-black/65 px-2 py-3 text-right tabular-nums text-gray-400 ${getPodiumRowClass(
                  entry.rank
                )}`}
              >
                {entry.verifiedCount}
              </td>
              <td
                style={podiumBorderStyle}
                className={`rounded-r-xl border-y-2 border-r-2 bg-black/65 px-2 py-3 pr-3 text-right ${getPodiumRowClass(
                  entry.rank
                )}`}
              >
                <LeaderboardAccuracyActions
                  entry={entry}
                  showAnalytics={showAnalytics}
                  showSaveAnalyst={showSaveAnalyst}
                  analyticsRequiresUpgrade={analyticsRequiresUpgrade}
                  onAnalyticsUpgradeRequired={onAnalyticsUpgradeRequired}
                  layout="desktop"
                />
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
