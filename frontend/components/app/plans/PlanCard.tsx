'use client';

import { ArrowRight, Check, Loader2 } from 'lucide-react';
import PlanTickRibbon from './PlanTickRibbon';
import type { BillingInterval, PlanDefinition } from './planData';

interface PlanCardProps {
  plan: PlanDefinition;
  interval: BillingInterval;
  onSelectPlan: (planId: PlanDefinition['id']) => void;
  isLoading?: boolean;
  /** Exact plan + billing interval the user pays for. */
  isCurrentBilling?: boolean;
  /** Same plan type, different interval — allow switch. */
  canSwitchInterval?: boolean;
  /** Other plan type while subscribed — block Analyst ↔ Investor. */
  isCrossPlanLocked?: boolean;
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

type PlanThemeStyles = (typeof THEME_STYLES)[keyof typeof THEME_STYLES];

function formatPrice(amount: number): string {
  return amount.toLocaleString('en-US');
}

function getDisplayPrice(plan: PlanDefinition, interval: BillingInterval): number {
  if (interval === 'monthly') {
    return plan.pricing.monthly.amount;
  }
  return plan.pricing.yearly.amountPerMonth;
}

function resolveButtonLabel(input: {
  isCurrentBilling: boolean;
  isCrossPlanLocked: boolean;
  canSwitchInterval: boolean;
  ctaLabel: string;
}): string {
  if (input.isCurrentBilling) return 'Manage subscription';
  if (input.isCrossPlanLocked) return 'Not available';
  if (input.canSwitchInterval) return 'Switch plan';
  return input.ctaLabel;
}

function PlanCardHeader({
  plan,
  styles,
  isCurrentBilling,
}: {
  plan: PlanDefinition;
  styles: PlanThemeStyles;
  isCurrentBilling: boolean;
}) {
  return (
    <header className="text-center mb-4">
      <p className={`text-sm font-semibold mb-0.5 ${styles.tick}`}>{plan.tickLabel}</p>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-white leading-tight">
          {plan.roleTitle}
        </h2>
        {isCurrentBilling ? (
          <span
            className={`shrink-0 text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full border ${styles.badge}`}
          >
            Current plan
          </span>
        ) : null}
      </div>
      <p className="text-xs sm:text-sm text-gray-400 mt-2 leading-relaxed">{plan.tagline}</p>
    </header>
  );
}

function PlanCardPricing({
  displayAmount,
  monthsFree,
  styles,
}: {
  displayAmount: number;
  monthsFree: number;
  styles: PlanThemeStyles;
}) {
  const priceClass = 'text-3xl sm:text-4xl font-black tracking-tight';

  return (
    <div className="text-center mb-4">
      <div className="flex items-baseline justify-center gap-2 flex-wrap">
        <span className={`${priceClass} text-white`}>${formatPrice(displayAmount)}</span>
        <span className={`${priceClass} text-gray-400`}>/month</span>
      </div>
      {monthsFree > 0 ? (
        <p
          className={`mt-2 inline-block text-[11px] font-bold tracking-wide uppercase px-3 py-1 rounded-full border ${styles.savings}`}
        >
          Get {monthsFree} months free when billed annually
        </p>
      ) : null}
    </div>
  );
}

function PlanFeatureList({
  features,
  styles,
}: {
  features: string[];
  styles: PlanThemeStyles;
}) {
  return (
    <ul className="flex-1 space-y-2.5 mb-5">
      {features.map((feature) => (
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
  );
}

function PlanCardCta({
  label,
  isLoading,
  isCrossPlanLocked,
  disabled,
  buttonClassName,
  onClick,
}: {
  label: string;
  isLoading: boolean;
  isCrossPlanLocked: boolean;
  disabled: boolean;
  buttonClassName: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${buttonClassName}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden />
      ) : (
        <>
          {label}
          {!isCrossPlanLocked ? <ArrowRight className="w-4 h-4" aria-hidden /> : null}
        </>
      )}
    </button>
  );
}

export default function PlanCard({
  plan,
  interval,
  onSelectPlan,
  isLoading = false,
  isCurrentBilling = false,
  canSwitchInterval = false,
  isCrossPlanLocked = false,
  disabled = false,
  className = '',
}: PlanCardProps) {
  const styles = THEME_STYLES[plan.theme];
  const displayAmount = getDisplayPrice(plan, interval);
  const monthsFree = plan.pricing.yearly.monthsFree;
  const buttonLabel = resolveButtonLabel({
    isCurrentBilling,
    isCrossPlanLocked,
    canSwitchInterval,
    ctaLabel: plan.ctaLabel,
  });
  const isButtonDisabled = disabled || isLoading || isCrossPlanLocked;
  const lockedOpacity = isCrossPlanLocked ? 'opacity-70' : '';

  return (
    <article
      className={`relative flex flex-col rounded-2xl border bg-gradient-to-b ${styles.glow} to-black/40 pt-6 pb-5 px-5 sm:px-6 transition-colors ${styles.border} ${className} ${lockedOpacity}`}
    >
      <PlanTickRibbon theme={plan.theme} />
      <PlanCardHeader plan={plan} styles={styles} isCurrentBilling={isCurrentBilling} />
      <PlanCardPricing
        displayAmount={displayAmount}
        monthsFree={monthsFree}
        styles={styles}
      />
      <PlanFeatureList features={plan.features} styles={styles} />
      <PlanCardCta
        label={buttonLabel}
        isLoading={isLoading}
        isCrossPlanLocked={isCrossPlanLocked}
        disabled={isButtonDisabled}
        buttonClassName={styles.button}
        onClick={() => onSelectPlan(plan.id)}
      />
    </article>
  );
}
