import type { BillingInterval, PlanId } from '@/types/billing';

export interface BillingStatusSnapshot {
  is_premium?: boolean;
  plan_id?: PlanId | null;
  interval?: BillingInterval | null;
}

export interface PlanCardUiState {
  isCurrentBilling: boolean;
  canSwitchInterval: boolean;
  isCrossPlanLocked: boolean;
}

/**
 * Derive plan-card CTA state from billing status and the selected interval tab.
 * Premium users may change interval on their seat only — not Analyst ↔ Investor.
 */
export function resolvePlanCardUiState(
  billingStatus: BillingStatusSnapshot | null | undefined,
  planId: PlanId,
  selectedInterval: BillingInterval
): PlanCardUiState {
  const isPremium = billingStatus?.is_premium === true;
  const isUsersPlanType = isPremium && billingStatus?.plan_id === planId;
  const isCurrentBilling =
    isUsersPlanType && billingStatus?.interval === selectedInterval;

  return {
    isCurrentBilling,
    canSwitchInterval: Boolean(isUsersPlanType && !isCurrentBilling),
    isCrossPlanLocked: Boolean(isPremium && billingStatus?.plan_id !== planId),
  };
}

export const CROSS_PLAN_SWITCH_MESSAGE =
  "Analyst and Investor are separate plans and can't be switched in place.";
