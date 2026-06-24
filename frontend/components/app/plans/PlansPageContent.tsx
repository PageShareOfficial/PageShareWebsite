'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import {
  Shield,
  Lock,
  BadgeCheck,
  BarChart3,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import PlanCard from './PlanCard';
import { usePlanCheckout } from '@/hooks/billing/usePlanCheckout';
import { useSubscription } from '@/contexts/SubscriptionContext';
import {
  PLANS,
  TRUST_PILLARS,
  type BillingInterval,
  type PlanDefinition,
} from './planData';

const PILLAR_ACCENT: Record<(typeof TRUST_PILLARS)[number]['accent'], string> = {
  violet: 'border-violet-500/20 bg-violet-500/5',
  blue: 'border-blue-500/20 bg-blue-500/5',
  emerald: 'border-emerald-500/20 bg-emerald-500/5',
  amber: 'border-amber-500/20 bg-amber-500/5',
};

const PILLAR_ICON_COLOR: Record<(typeof TRUST_PILLARS)[number]['accent'], string> = {
  violet: 'text-violet-400',
  blue: 'text-blue-400',
  emerald: 'text-emerald-400',
  amber: 'text-amber-400',
};

const PILLAR_ICONS: Record<(typeof TRUST_PILLARS)[number]['icon'], LucideIcon> = {
  lock: Lock,
  'badge-check': BadgeCheck,
  'bar-chart': BarChart3,
  sparkles: Sparkles,
};

interface PlansPageContentProps {
  billingInterval?: BillingInterval;
  onBillingIntervalChange?: (interval: BillingInterval) => void;
}

export default function PlansPageContent({
  billingInterval: billingIntervalProp,
  onBillingIntervalChange,
}: PlansPageContentProps) {
  const [internalBillingInterval, setInternalBillingInterval] =
    useState<BillingInterval>('monthly');
  const billingInterval = billingIntervalProp ?? internalBillingInterval;
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
      {checkoutError && (
        <div
          className="mb-4 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3"
          role="alert"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
          <p className="flex-1 text-sm text-red-200">{checkoutError}</p>
          <button
            type="button"
            onClick={clearCheckoutError}
            className="shrink-0 rounded-full p-1 text-red-300 hover:bg-red-500/20"
            aria-label="Dismiss checkout error"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {isCheckoutBusy && (
        <div className="mb-4 flex items-center justify-center gap-2 text-sm text-gray-300">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          Redirecting to secure checkout...
        </div>
      )}

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

      <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 mb-8">
        {PLANS.map((plan) => {
          const isCurrentPlan =
            billingStatus?.is_premium === true &&
            billingStatus.plan_id === plan.id;
          const hasOtherActivePlan =
            billingStatus?.is_premium === true &&
            billingStatus.plan_id !== plan.id;

          return (
            <PlanCard
              key={plan.id}
              plan={plan}
              interval={billingInterval}
              onSelectPlan={onSelectPlan}
              isLoading={checkingOutPlanId === plan.id}
              isCurrentPlan={isCurrentPlan}
              hasOtherActivePlan={hasOtherActivePlan}
              disabled={isCheckoutBusy}
              className="flex-1 min-w-0"
            />
          );
        })}
      </div>

      <section
        className="grid grid-cols-4 gap-2 sm:gap-3 mb-8"
        aria-label="Platform trust pillars"
      >
        {TRUST_PILLARS.map((pillar) => {
          const Icon = PILLAR_ICONS[pillar.icon];
          return (
            <div
              key={pillar.title}
              className={`rounded-xl border p-2.5 sm:p-3 flex flex-col items-center text-center ${PILLAR_ACCENT[pillar.accent]}`}
            >
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center mb-2 ${PILLAR_ACCENT[pillar.accent]}`}
              >
                <Icon
                  className={`w-4 h-4 sm:w-5 sm:h-5 ${PILLAR_ICON_COLOR[pillar.accent]}`}
                  aria-hidden
                />
              </div>
              <h3 className="text-[10px] sm:text-xs font-semibold text-white mb-1 leading-tight">
                {pillar.title}
              </h3>
              <p className="text-[9px] sm:text-[11px] text-gray-400 leading-snug">
                {pillar.description}
              </p>
            </div>
          );
        })}
      </section>

      <footer className="rounded-2xl border border-white/10 bg-white/[0.03] flex gap-3 p-4 mb-4">
        <div className="w-9 h-9 rounded-xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center shrink-0">
          <Shield className="w-4 h-4 text-cyan-400" aria-hidden />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-white mb-1.5">Not financial advice.</h3>
          <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed">
            PageShare is an educational and informational platform for structured
            market commentary and prediction history. Nothing on PageShare is
            financial advice or a recommendation to buy, sell, or hold any asset.
          </p>
        </div>
      </footer>
    </div>
  );
}
