import { useSubscription } from '@/hooks/billing/useSubscription';
import { readSubscriptionPlanHint } from '@/utils/billing/subscriptionPlanHint';

export type PredictionsViewVariant = 'free' | 'analyst' | 'investor';

function resolveVariant(
  isLoading: boolean,
  isAnalystPlan: boolean,
  isInvestorPlan: boolean,
  isPremium: boolean
): { variant: PredictionsViewVariant; isResolving: boolean } {
  const planHint = readSubscriptionPlanHint();

  if (isLoading) {
    if (isAnalystPlan || planHint === 'analyst') {
      return { variant: 'analyst', isResolving: true };
    }
    if (isInvestorPlan || planHint === 'investor') {
      return { variant: 'investor', isResolving: true };
    }
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

export function usePredictionsView(): {
  variant: PredictionsViewVariant;
  isResolving: boolean;
} {
  const { isPremium, isAnalystPlan, isInvestorPlan, isLoading } = useSubscription();
  return resolveVariant(isLoading, isAnalystPlan, isInvestorPlan, isPremium);
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
