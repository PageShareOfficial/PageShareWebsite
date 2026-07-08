'use client';

import { useState } from 'react';
import { MdLeaderboard } from 'react-icons/md';
import ViewAnalystAnalyticsUpgradeModal from '@/components/app/modals/ViewAnalystAnalyticsUpgradeModal';
import LeaderboardDesktopTable from '@/components/app/predictions/leaderboard/LeaderboardDesktopTable';
import LeaderboardFooter from '@/components/app/predictions/leaderboard/LeaderboardFooter';
import LeaderboardMobileRow from '@/components/app/predictions/leaderboard/LeaderboardMobileRow';
import type { LeaderboardEntry } from '@/types/predictions';

interface LeaderboardSectionProps {
  entries: LeaderboardEntry[];
  showHeading: boolean;
  showAnalytics: boolean;
  analyticsRequiresUpgrade: boolean;
}

export default function LeaderboardSection({
  entries,
  showHeading,
  showAnalytics,
  analyticsRequiresUpgrade,
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

      <div className="overflow-hidden rounded-xl border border-white/10">
        <div className="space-y-2.5 px-3 py-3 lg:hidden">
          {entries.map((entry) => (
            <LeaderboardMobileRow
              key={`mobile-${entry.handle}`}
              entry={entry}
              showAnalytics={showAnalytics}
              analyticsRequiresUpgrade={analyticsRequiresUpgrade}
              onAnalyticsUpgradeRequired={openAnalyticsUpgrade}
            />
          ))}
        </div>

        <LeaderboardDesktopTable
          entries={entries}
          showAnalytics={showAnalytics}
          analyticsRequiresUpgrade={analyticsRequiresUpgrade}
          onAnalyticsUpgradeRequired={openAnalyticsUpgrade}
        />
        <LeaderboardFooter />
      </div>

      <ViewAnalystAnalyticsUpgradeModal
        isOpen={isAnalyticsUpgradeOpen}
        onClose={closeAnalyticsUpgrade}
      />
    </div>
  );
}
