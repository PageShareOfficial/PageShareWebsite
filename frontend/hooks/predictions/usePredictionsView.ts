import { useSubscription } from '@/hooks/billing/useSubscription';

export type PredictionsViewVariant = 'free' | 'analyst' | 'investor';

export function usePredictionsView(): {
  variant: PredictionsViewVariant;
  isResolving: boolean;
} {
  const { isPremium, isAnalystPlan, isInvestorPlan, isLoading } = useSubscription();

  if (isLoading) {
    return { variant: 'free', isResolving: true };
  }
  if (isAnalystPlan) {
    return { variant: 'analyst', isResolving: false };
  }
  if (isInvestorPlan) {
    return { variant: 'investor', isResolving: false };
  }
  if (!isPremium) {
    return { variant: 'free', isResolving: false };
  }
  return { variant: 'analyst', isResolving: false };
}

export function usePredictionsPageHeader() {
  const { variant } = usePredictionsView();

  if (variant === 'analyst') {
    return { title: 'Dashboard', showLeaderboardIcon: false, showSubmit: true, submitAsLink: true };
  }
  if (variant === 'investor') {
    return { title: 'Dashboard', showLeaderboardIcon: false, showSubmit: false, submitAsLink: false };
  }
  return { title: 'Leaderboard', showLeaderboardIcon: true, showSubmit: true, submitAsLink: false };
}
