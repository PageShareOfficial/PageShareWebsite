import type { PredictionsViewVariant } from '@/hooks/predictions/usePredictionsView';

export interface PredictionsDashboardFlags {
  showAnalystStats: boolean;
  showSavedAnalysts: boolean;
  showLeaderboardHeading: boolean;
  showLeaderboardAnalytics: boolean;
  showLeaderboardSaveAnalyst: boolean;
  analyticsRequiresUpgrade: boolean;
  maskLeaderboardIdentity: boolean;
}

export function usePredictionsDashboardFlags(
  variant: PredictionsViewVariant
): PredictionsDashboardFlags {
  return {
    showAnalystStats: variant === 'analyst',
    showSavedAnalysts: variant === 'investor',
    showLeaderboardHeading: variant !== 'free',
    showLeaderboardAnalytics: variant === 'investor' || variant === 'free',
    showLeaderboardSaveAnalyst: variant === 'investor',
    analyticsRequiresUpgrade: variant === 'free',
    maskLeaderboardIdentity: variant === 'free' || variant === 'analyst',
  };
}
