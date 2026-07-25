import type { PlanId } from '@/types/billing';

const PLAN_HINT_KEY = 'pageshare_subscription_plan_hint';

const VALID_HINTS = new Set<PlanId>(['analyst', 'investor']);

export function readSubscriptionPlanHint(): PlanId | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const value = sessionStorage.getItem(PLAN_HINT_KEY);
    if (value && VALID_HINTS.has(value as PlanId)) {
      return value as PlanId;
    }
  } catch {
    // sessionStorage unavailable
  }
  return null;
}

export function writeSubscriptionPlanHint(planId: PlanId | null): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (planId && VALID_HINTS.has(planId)) {
      sessionStorage.setItem(PLAN_HINT_KEY, planId);
    } else {
      sessionStorage.removeItem(PLAN_HINT_KEY);
    }
  } catch {
    // ignore
  }
}

export function clearSubscriptionPlanHint(): void {
  writeSubscriptionPlanHint(null);
}
