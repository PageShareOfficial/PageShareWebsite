'use client';

import AnalystStatsSection from '@/components/app/predictions/AnalystStatsSection';
import LeaderboardSection from '@/components/app/predictions/leaderboard/LeaderboardSection';
import SavedAnalystsSection from '@/components/app/predictions/SavedAnalystsSection';
import {
  SAMPLE_ANALYST_SCORE,
  SAMPLE_LEADERBOARD,
} from '@/constants/predictions/sampleData';
import { usePredictionsDashboardFlags } from '@/hooks/predictions/usePredictionsDashboardFlags';
import { usePredictionsView } from '@/hooks/predictions/usePredictionsView';

export default function PredictionsDashboard() {
  const { variant } = usePredictionsView();
  const flags = usePredictionsDashboardFlags(variant);

  return (
    <div className="space-y-6">
      {flags.showAnalystStats && <AnalystStatsSection score={SAMPLE_ANALYST_SCORE} />}

      {flags.showSavedAnalysts && <SavedAnalystsSection />}

      <LeaderboardSection
        entries={SAMPLE_LEADERBOARD}
        showHeading={flags.showLeaderboardHeading}
        showAnalytics={flags.showLeaderboardAnalytics}
        analyticsRequiresUpgrade={flags.analyticsRequiresUpgrade}
      />
    </div>
  );
}
