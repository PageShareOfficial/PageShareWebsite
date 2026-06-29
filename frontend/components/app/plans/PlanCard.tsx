'use client';

import { ArrowRight, Check, Loader2 } from 'lucide-react';
import PlanTickRibbon from './PlanTickRibbon';
import { YEARLY_DISCOUNT_PERCENT, type BillingInterval, type PlanDefinition } from './planData';

interface PlanCardProps {
  plan: PlanDefinition;
  interval: BillingInterval;
  onSelectPlan: (planId: PlanDefinition['id']) => void;
  isLoading?: boolean;
  isCurrentPlan?: boolean;
  hasOtherActivePlan?: boolean;
  disabled?: boolean;
  className?: string;
}

const THEME_STYLES = {
  analyst: {
    border: 'border-blue-500/40 shadow-[0_0_24px_rgba(59,130,246,0.12)]',
    glow: 'from-blue-500/[0.08]',
    tick: 'text-blue-400',
    badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    checkRing: 'bg-blue-600 border-transparent',
    check: 'text-white',
    button: 'bg-blue-600 hover:bg-blue-500 text-white',
    savings: 'bg-blue-500/15 text-blue-300 border-blue-500/40',
  },
  investor: {
    border: 'border-emerald-500/40 shadow-[0_0_24px_rgba(16,185,129,0.12)]',
    glow: 'from-emerald-500/[0.08]',
    tick: 'text-emerald-400',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    checkRing: 'bg-emerald-600 border-transparent',
    check: 'text-white',
    button: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    savings: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  },
} as const;

function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US');
}

export default function PlanCard({
  plan,
  interval,
  onSelectPlan,
  isLoading = false,
  isCurrentPlan = false,
  hasOtherActivePlan = false,
  disabled = false,
  className = '',
}: PlanCardProps) {
  const styles = THEME_STYLES[plan.theme];
  const prices = plan.pricing[interval];
  const periodLabel = interval === 'monthly' ? '/month' : '/year';
  const priceClass = 'text-3xl sm:text-4xl font-black tracking-tight';
  const buttonLabel = isCurrentPlan
    ? 'Manage subscription'
    : hasOtherActivePlan
      ? `Switch to ${plan.roleTitle}`
      : plan.ctaLabel;
  const isButtonDisabled = disabled || isLoading;

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-gradient-to-b ${styles.glow} to-black/40 pt-6 pb-5 px-5 sm:px-6 transition-colors ${styles.border} ${className}`}
    >
      <PlanTickRibbon theme={plan.theme} />

      <header className="text-center mb-4">
        <p className={`text-sm font-semibold mb-0.5 ${styles.tick}`}>{plan.tickLabel}</p>
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
          {plan.roleTitle}
        </h2>
        <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">{plan.tagline}</p>
        <span
          className={`inline-block mt-3 text-[10px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border ${styles.badge}`}
        >
          {isCurrentPlan ? 'Current plan' : plan.badge}
        </span>
      </header>

      <div className="text-center mb-4">
        <div className="flex items-baseline justify-center gap-2 flex-wrap">
          <span className={`${priceClass} text-gray-500 line-through`}>
            ${formatPrice(prices.original)}
          </span>
          <span className={`${priceClass} text-white`}>
            ${formatPrice(prices.discounted)}
          </span>
          <span className={`${priceClass} text-gray-400`}>{periodLabel}</span>
        </div>
        <p className="mt-3">
          <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wide uppercase ${styles.savings}`}
          >
            Save {YEARLY_DISCOUNT_PERCENT}%
          </span>
        </p>
      </div>

      <ul className="flex-1 space-y-2.5 mb-5">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-300">
            <span
              className={`w-5 h-5 shrink-0 rounded-full flex items-center justify-center mt-0.5 ${styles.checkRing}`}
            >
              <Check className={`w-3 h-3 ${styles.check}`} strokeWidth={3} aria-hidden />
            </span>
            <span className="leading-snug">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onSelectPlan(plan.id)}
        disabled={isButtonDisabled}
        className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${styles.button}`}
      >
        {isLoading ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
        ) : (
          <>
            {buttonLabel}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </>
        )}
      </button>
    </article>
  );
}
