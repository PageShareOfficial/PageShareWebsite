import SeeAnalystAnalyticsButton from '@/components/app/predictions/SeeAnalystAnalyticsButton';
import type { LeaderboardEntry } from '@/types/predictions';

interface LeaderboardAccuracyActionsProps {
  entry: LeaderboardEntry;
  showAnalytics: boolean;
  analyticsRequiresUpgrade: boolean;
  onAnalyticsUpgradeRequired: () => void;
  layout?: 'mobile' | 'desktop';
}

export default function LeaderboardAccuracyActions({
  entry,
  showAnalytics,
  analyticsRequiresUpgrade,
  onAnalyticsUpgradeRequired,
  layout = 'mobile',
}: LeaderboardAccuracyActionsProps) {
  const isDesktop = layout === 'desktop';

  return (
    <div
      className={
        isDesktop
          ? 'flex items-center justify-end gap-1.5'
          : 'flex shrink-0 items-center gap-3'
      }
    >
      <div className={isDesktop ? undefined : 'text-right'}>
        {!isDesktop && (
          <div className="text-[11px] uppercase tracking-wide text-gray-500">Accuracy</div>
        )}
        <div
          className={`tabular-nums font-medium text-emerald-400 ${
            isDesktop ? 'text-emerald-400/90' : 'font-semibold'
          }`}
        >
          {entry.winRatePercent}%
        </div>
      </div>
      {showAnalytics && (
        <SeeAnalystAnalyticsButton
          displayName={entry.displayName}
          handle={entry.handle}
          className="shrink-0"
          requiresUpgrade={analyticsRequiresUpgrade}
          onUpgradeRequired={onAnalyticsUpgradeRequired}
        />
      )}
    </div>
  );
}
