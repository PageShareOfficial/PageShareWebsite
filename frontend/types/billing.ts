/** Paid subscription plan identifiers (maps to Stripe products). */
export type PlanId = 'analyst' | 'investor';

export type BillingInterval = 'monthly' | 'yearly';

export const PLAN_IDS: readonly PlanId[] = ['analyst', 'investor'] as const;

export const BILLING_INTERVALS: readonly BillingInterval[] = [
  'monthly',
  'yearly',
] as const;

export function isPlanId(value: string): value is PlanId {
  return PLAN_IDS.includes(value as PlanId);
}

export function isBillingInterval(value: string): value is BillingInterval {
  return BILLING_INTERVALS.includes(value as BillingInterval);
}
