import type { BillingStatus } from '@/lib/api/billingApi';

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  trialing: 'Trial',
  past_due: 'Past due',
  canceled: 'Canceled',
  incomplete: 'Incomplete',
  none: 'Free',
};

const PLAN_LABELS = {
  analyst: 'Analyst',
  investor: 'Investor',
} as const;

export function getBillingRowSubtitle(
  billingStatus: BillingStatus | null | undefined
): string {
  if (!billingStatus?.is_premium || !billingStatus.plan_id) {
    return 'Free plan';
  }

  const planName = PLAN_LABELS[billingStatus.plan_id];
  const status =
    STATUS_LABELS[billingStatus.status] ?? STATUS_LABELS.active;
  return `${planName} · ${status}`;
}
