'use client';

import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import AuthorBadges from '@/components/app/common/AuthorBadges';
import SaveAnalystButton from '@/components/app/predictions/SaveAnalystButton';
import LeaderboardRankDisplay from '@/components/app/predictions/leaderboard/LeaderboardRankDisplay';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';
import {
  buildRankAriaLabel,
  buildRankTotalLabel,
} from '@/utils/predictions/analyticsRankLabels';
import { formatJoinedDate } from '@/utils/core/dateUtils';

interface AnalyticsDashboardHeroProps {
  dashboard: PredictionAnalyticsDashboard;
  isOwnAnalytics: boolean;
}

function RankBlock({
  rank,
  rankTotalLabel,
  rankTotal,
  layout,
}: {
  rank: number;
  rankTotalLabel: string | null;
  rankTotal: number;
  layout: 'inline' | 'stacked';
}) {
  const isStacked = layout === 'stacked';
  return (
    <div
      className={
        isStacked
          ? 'flex flex-col items-center gap-1.5'
          : 'flex shrink-0 items-center gap-2'
      }
      aria-label={buildRankAriaLabel(rank, rankTotal, rankTotalLabel)}
    >
      {isStacked ? (
        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
          Rank
        </span>
      ) : null}
      <LeaderboardRankDisplay rank={rank} size="lg" />
      {rankTotalLabel ? (
        <p
          className={
            isStacked
              ? 'text-center text-sm font-medium text-gray-400'
              : 'max-w-[5.5rem] text-right text-xs font-medium leading-tight text-gray-400'
          }
        >
          {rankTotalLabel}
        </p>
      ) : null}
    </div>
  );
}

export default function AnalyticsDashboardHero({
  dashboard,
  isOwnAnalytics,
}: AnalyticsDashboardHeroProps) {
  const { subject } = dashboard;
  const displayName = subject.display_name?.trim() || subject.username;
  const bioText = subject.bio?.trim() ?? '';
  const rank = dashboard.rank;
  const rankTotal = dashboard.rank_total;
  const rankTotalLabel = buildRankTotalLabel(rankTotal);
  const showRank = rank != null && rank > 0;

  const savedAnalyst = {
    id: subject.id,
    displayName,
    handle: subject.username,
    avatar: subject.profile_picture_url ?? '',
    subscriptionPlanId: 'analyst' as const,
  };

  const saveButtonClass =
    'rounded-xl border border-white/15 bg-white/10 px-3 py-2.5 hover:bg-white/15';

  return (
    <section className="rounded-xl border border-white/10 bg-gradient-to-br from-blue-500/10 via-transparent to-emerald-500/5 p-4 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <AvatarWithFallback
            src={subject.profile_picture_url ?? undefined}
            alt={displayName}
            size={56}
            fallbackText={displayName.slice(0, 2)}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2 sm:block">
              <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
                <h2 className="text-lg font-bold text-white">{displayName}</h2>
                <AuthorBadges subscriptionPlanId="analyst" size="md" />
                <span className="text-sm text-gray-400">@{subject.username}</span>
              </div>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-300">
              {bioText || 'No bio yet.'}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {formatJoinedDate(subject.joined_at)}
            </p>
          </div>
        </div>
        <div className="hidden shrink-0 items-start gap-4 sm:flex sm:flex-col sm:items-end">
          {showRank ? (
            <RankBlock
              rank={rank}
              rankTotal={rankTotal}
              rankTotalLabel={rankTotalLabel}
              layout="stacked"
            />
          ) : null}
          {!isOwnAnalytics ? (
            <SaveAnalystButton analyst={savedAnalyst} className={saveButtonClass} />
          ) : null}
        </div>
        {!isOwnAnalytics ? (
          <SaveAnalystButton
            analyst={savedAnalyst}
            className={`w-full sm:hidden ${saveButtonClass}`}
          />
        ) : null}
      </div>
    </section>
  );
}
