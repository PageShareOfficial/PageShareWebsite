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

interface LeaderboardDesktopTableProps {
  entries: LeaderboardEntry[];
  showAnalytics: boolean;
  showSaveAnalyst: boolean;
  analyticsRequiresUpgrade: boolean;
  onAnalyticsUpgradeRequired: () => void;
  maskIdentity?: boolean;
  viewerHandle?: string | null;
}

export default function LeaderboardDesktopTable({
  entries,
  showAnalytics,
  showSaveAnalyst,
  analyticsRequiresUpgrade,
  onAnalyticsUpgradeRequired,
  maskIdentity = false,
  viewerHandle = null,
}: LeaderboardDesktopTableProps) {
  return (
    <div className="hidden overflow-visible px-2 py-4 lg:block">
      <table className="w-full table-fixed border-separate border-spacing-y-4 text-left text-sm">
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
              Win rate
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const { isOwnRow, maskThisRow, identity } = getLeaderboardRowPresentation(
              entry,
              maskIdentity,
              viewerHandle
            );
            const highlightOwn = shouldHighlightOwnLeaderboardRow(
              entry.rank,
              isOwnRow
            );
            const podiumBorderStyle = getPodiumBorderStyle(entry.rank, {
              highlightOwn,
            });
            const rowClass = getPodiumRowClass(entry.rank, { highlightOwn });
            return (
              <tr key={entry.handle}>
                <td
                  style={podiumBorderStyle}
                  className={`relative rounded-l-xl border-y-2 border-l-2 bg-black/65 px-2 py-3 pl-3 font-medium tabular-nums ${rowClass}`}
                >
                  {isOwnRow && <LeaderboardYouBadge rank={entry.rank} />}
                  <LeaderboardRankDisplay rank={entry.rank} />
                </td>
                <td
                  style={podiumBorderStyle}
                  className={`border-y-2 bg-black/65 px-2 py-3 ${rowClass}`}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <AvatarWithFallback
                      src={identity.avatarSrc}
                      alt={identity.avatarAlt}
                      fallbackText={identity.avatarFallbackText}
                      size={36}
                      className="shrink-0"
                    />
                    <LeaderboardTraderLink entry={entry} maskIdentity={maskThisRow} />
                  </div>
                </td>
                <td
                  style={podiumBorderStyle}
                  className={`border-y-2 bg-black/65 px-2 py-3 text-right tabular-nums text-gray-300 ${rowClass}`}
                >
                  {entry.predictionsCount}
                </td>
                <td
                  style={podiumBorderStyle}
                  className={`border-y-2 bg-black/65 px-2 py-3 text-right tabular-nums text-gray-400 ${rowClass}`}
                >
                  {entry.verifiedCount}
                </td>
                <td
                  style={podiumBorderStyle}
                  className={`rounded-r-xl border-y-2 border-r-2 bg-black/65 px-2 py-3 pr-3 text-right ${rowClass}`}
                >
                  <LeaderboardAccuracyActions
                    entry={entry}
                    showAnalytics={showAnalytics}
                    showSaveAnalyst={showSaveAnalyst}
                    analyticsRequiresUpgrade={analyticsRequiresUpgrade}
                    onAnalyticsUpgradeRequired={onAnalyticsUpgradeRequired}
                    maskIdentity={maskThisRow}
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
