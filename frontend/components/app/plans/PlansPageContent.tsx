'use client';

import { AlertCircle, Loader2, X } from 'lucide-react';
import PlanCard from './PlanCard';
import PlansFaq from './PlansFaq';
import { usePlanCheckout } from '@/hooks/billing/usePlanCheckout';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { resolvePlanCardUiState } from '@/utils/billing/resolvePlanCardUiState';
import { PLANS, type BillingInterval, type PlanDefinition } from './planData';

interface PlansPageContentProps {
  billingInterval?: BillingInterval;
  onBillingIntervalChange?: (interval: BillingInterval) => void;
}

function CheckoutErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div
      className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
      role="alert"
    >
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
      <p className="flex-1 text-sm text-red-200">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-full p-1 text-red-300 hover:bg-red-500/20"
        aria-label="Dismiss checkout error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function PlansHero() {
  return (
    <header className="text-center mb-6">
      <p className="text-xs sm:text-sm font-semibold tracking-[0.2em] uppercase text-cyan-400 mb-2">
        Premium Access
      </p>
      <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
        Upgrade Your{' '}
        <span className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Edge.
        </span>
      </h1>
      <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
        Unlock advanced tools, deeper insights, and build real credibility or
        discover real signal with data-driven confidence.
      </p>
    </header>
  );
}

export default function PlansPageContent({
  billingInterval = 'monthly',
}: PlansPageContentProps) {
  const { billingStatus } = useSubscription();
  const {
    checkoutError,
    checkingOutPlanId,
    clearCheckoutError,
    handleSelectPlan,
  } = usePlanCheckout();

  const onSelectPlan = (planId: PlanDefinition['id']) => {
    void handleSelectPlan(planId, billingInterval);
  };

  const isCheckoutBusy = checkingOutPlanId !== null;

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-4 sm:py-6">
      {checkoutError ? (
        <CheckoutErrorBanner message={checkoutError} onDismiss={clearCheckoutError} />
      ) : null}

      {isCheckoutBusy ? (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-300">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Redirecting to secure checkout...
        </div>
      ) : null}

      <PlansHero />

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-8">
        {PLANS.map((plan) => {
          const cardState = resolvePlanCardUiState(
            billingStatus,
            plan.id,
            billingInterval
          );

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              interval={billingInterval}
              onSelectPlan={onSelectPlan}
              isLoading={checkingOutPlanId === plan.id}
              isCurrentBilling={cardState.isCurrentBilling}
              canSwitchInterval={cardState.canSwitchInterval}
              isCrossPlanLocked={cardState.isCrossPlanLocked}
              disabled={isCheckoutBusy}
              className="flex-1 min-w-0"
            />
          );
        })}
      </div>

      <PlansFaq />
    </div>
  );
}
