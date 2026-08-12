'use client';

import { useState } from 'react';
import { MdLeaderboard } from 'react-icons/md';
import ViewAnalystAnalyticsUpgradeModal from '@/components/app/modals/ViewAnalystAnalyticsUpgradeModal';
import LeaderboardDesktopTable from '@/components/app/predictions/leaderboard/LeaderboardDesktopTable';
import LeaderboardFooter from '@/components/app/predictions/leaderboard/LeaderboardFooter';
import LeaderboardMobileRow from '@/components/app/predictions/leaderboard/LeaderboardMobileRow';
import LeaderboardSectionSkeleton from '@/components/app/predictions/leaderboard/LeaderboardSectionSkeleton';
import type { LeaderboardEntry } from '@/types/predictions';

interface LeaderboardSectionProps {
  entries: LeaderboardEntry[];
  showHeading: boolean;
  showAnalytics: boolean;
  showSaveAnalyst: boolean;
  analyticsRequiresUpgrade: boolean;
  maskIdentity?: boolean;
  viewerHandle?: string | null;
  isLoading?: boolean;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  loadMoreDisabled?: boolean;
}

function LeaderboardEmptyState() {
  return (
    <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
      <MdLeaderboard className="h-6 w-6 text-amber-400/80" aria-hidden />
      <p className="text-sm text-gray-400">
        No ranked analysts yet. Analyst subscribers will appear here once they submit
        predictions.
      </p>
    </div>
  );
}

export default function LeaderboardSection({
  entries,
  showHeading,
  showAnalytics,
  showSaveAnalyst,
  analyticsRequiresUpgrade,
  maskIdentity = false,
  viewerHandle = null,
  isLoading = false,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  loadMoreDisabled = false,
}: LeaderboardSectionProps) {
  const [isAnalyticsUpgradeOpen, setIsAnalyticsUpgradeOpen] = useState(false);

  const openAnalyticsUpgrade = () => setIsAnalyticsUpgradeOpen(true);
  const closeAnalyticsUpgrade = () => setIsAnalyticsUpgradeOpen(false);

  return (
    <div className="space-y-3">
      {showHeading && (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <MdLeaderboard className="h-5 w-5 text-amber-400/90" aria-hidden />
            Leaderboard
          </h2>
        </div>
      )}

      <div className="overflow-visible rounded-xl border border-white/10">
        {isLoading ? (
          <LeaderboardSectionSkeleton />
        ) : entries.length === 0 ? (
          <LeaderboardEmptyState />
        ) : (
          <>
            <div className="space-y-4 overflow-visible px-3 py-4 lg:hidden">
              {entries.map((entry) => (
                <LeaderboardMobileRow
                  key={`mobile-${entry.handle}`}
                  entry={entry}
                  showAnalytics={showAnalytics}
                  showSaveAnalyst={showSaveAnalyst}
                  analyticsRequiresUpgrade={analyticsRequiresUpgrade}
                  maskIdentity={maskIdentity}
                  viewerHandle={viewerHandle}
                  onAnalyticsUpgradeRequired={openAnalyticsUpgrade}
                />
              ))}
            </div>

            <LeaderboardDesktopTable
              entries={entries}
              showAnalytics={showAnalytics}
              showSaveAnalyst={showSaveAnalyst}
              analyticsRequiresUpgrade={analyticsRequiresUpgrade}
              maskIdentity={maskIdentity}
              viewerHandle={viewerHandle}
              onAnalyticsUpgradeRequired={openAnalyticsUpgrade}
            />
            <LeaderboardFooter
              hasMore={hasMore && !isLoading}
              isLoadingMore={isLoadingMore}
              onLoadMore={onLoadMore}
              loadMoreDisabled={loadMoreDisabled}
            />
          </>
        )}
      </div>

      <ViewAnalystAnalyticsUpgradeModal
        isOpen={isAnalyticsUpgradeOpen}
        onClose={closeAnalyticsUpgrade}
      />
    </div>
  );
}
