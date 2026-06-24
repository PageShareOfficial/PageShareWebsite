import { apiGet, apiPost } from '@/lib/api/client';
import type { BillingInterval, PlanId } from '@/types/billing';

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'incomplete'
  | 'none';

export interface BillingStatus {
  is_premium: boolean;
  plan_id: PlanId | null;
  status: SubscriptionStatus;
  interval: BillingInterval | null;
  current_period_end: string | null;
  past_due_grace_ends_at: string | null;
}

export interface CreateCheckoutSessionRequest {
  plan_id: PlanId;
  interval: BillingInterval;
  success_url: string;
  cancel_url: string;
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

export async function getBillingStatus(
  accessToken: string
): Promise<BillingStatus> {
  return apiGet<BillingStatus>('/billing/status', accessToken);
}

export async function createCheckoutSession(
  accessToken: string,
  payload: CreateCheckoutSessionRequest
): Promise<CheckoutSessionResponse> {
  return apiPost<CheckoutSessionResponse>(
    '/billing/checkout',
    payload,
    accessToken
  );
}

export async function createPortalSession(
  accessToken: string
): Promise<PortalSessionResponse> {
  return apiPost<PortalSessionResponse>('/billing/portal', {}, accessToken);
}
