'use client';

import AnalystStatsSection from '@/components/app/predictions/AnalystStatsSection';
import ErrorState from '@/components/app/common/ErrorState';
import LeaderboardSection from '@/components/app/predictions/leaderboard/LeaderboardSection';
import SavedAnalystsSection from '@/components/app/predictions/SavedAnalystsSection';
import { usePredictionsDashboardData } from '@/hooks/predictions/usePredictionsDashboardData';
import { usePredictionsDashboardFlags } from '@/hooks/predictions/usePredictionsDashboardFlags';
import { usePredictionsView } from '@/hooks/predictions/usePredictionsView';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';

export default function PredictionsDashboard() {
  const { variant, isResolving } = usePredictionsView();
  const flags = usePredictionsDashboardFlags(variant);
  const isOnline = useOnlineStatus();
  const showAnalystStatsBlock =
    flags.showAnalystStats || (isResolving && variant === 'analyst');

  const {
    leaderboard,
    analystScore,
    isLeaderboardLoading,
    isLeaderboardLoadingMore,
    isAnalystScoreLoading,
    leaderboardError,
    analystScoreError,
    hasMoreLeaderboard,
    loadMoreLeaderboard,
    retryLeaderboard,
    retryAnalystScore,
  } = usePredictionsDashboardData({ loadAnalystScore: flags.showAnalystStats });

  const showAnalystStatsLoading =
    flags.showAnalystStats && !analystScore && !analystScoreError;
  const showLeaderboardHeading = flags.showLeaderboardHeading;

  return (
    <div className="space-y-6">
      {showAnalystStatsBlock && (
        <>
          {analystScoreError && !isAnalystScoreLoading ? (
            <ErrorState
              title="Could not load your stats"
              message={analystScoreError}
              onRetry={retryAnalystScore}
              retryDisabled={!isOnline}
            />
          ) : analystScore && !showAnalystStatsLoading ? (
            <AnalystStatsSection score={analystScore} />
          ) : (
            <AnalystStatsSection isLoading />
          )}
        </>
      )}
      {flags.showSavedAnalysts && <SavedAnalystsSection />}

      {leaderboardError && !isLeaderboardLoading ? (
        <ErrorState
          title="Could not load leaderboard"
          message={leaderboardError}
          onRetry={retryLeaderboard}
          retryDisabled={!isOnline}
        />
      ) : (
        <LeaderboardSection
          entries={leaderboard}
          isLoading={isLeaderboardLoading}
          showHeading={showLeaderboardHeading}
          showAnalytics={flags.showLeaderboardAnalytics}
          showSaveAnalyst={flags.showLeaderboardSaveAnalyst}
          analyticsRequiresUpgrade={flags.analyticsRequiresUpgrade}
          hasMore={hasMoreLeaderboard}
          isLoadingMore={isLeaderboardLoadingMore}
          onLoadMore={() => void loadMoreLeaderboard()}
          loadMoreDisabled={!isOnline}
        />
      )}
    </div>
  );
}
