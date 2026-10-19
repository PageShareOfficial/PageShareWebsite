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
  cancel_at_period_end: boolean;
  past_due_grace_ends_at: string | null;
  credit_balance: number;
  currency: string | null;
}

export interface CreateCheckoutSessionRequest {
  plan_id: PlanId;
  interval: BillingInterval;
  success_url: string;
  cancel_url: string;
}

export interface SwitchPlanRequest {
  plan_id: PlanId;
  interval: BillingInterval;
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

export interface ActiveSale {
  code: string;
  percentOff: number;
  name: string;
  offer: string;
  /** Exclusive end of the phase, ISO UTC. */
  endsAt: string;
}

export interface SaleStripFace {
  code: string;
  percentOff: number;
  name: string;
  offer: string;
  headline: string;
  startsAt: string;
  endsAt: string;
}

interface SalePhasePayload {
  code: string;
  percent_off: number;
  name: string;
  offer: string;
  ends_at: string;
}

interface SaleStripFacePayload extends SalePhasePayload {
  headline: string;
  starts_at: string;
}

interface ActiveSaleResponse {
  phase: SalePhasePayload | null;
  faces?: SaleStripFacePayload[];
}

export interface SaleSnapshot {
  phase: ActiveSale | null;
  faces: SaleStripFace[];
}

const EMPTY_SALE: SaleSnapshot = { phase: null, faces: [] };

function mapPhase(phase: SalePhasePayload): ActiveSale {
  return {
    code: phase.code,
    percentOff: phase.percent_off,
    name: phase.name,
    offer: phase.offer,
    endsAt: phase.ends_at,
  };
}

function mapStripFace(face: SaleStripFacePayload): SaleStripFace {
  return {
    ...mapPhase(face),
    headline: face.headline,
    startsAt: face.starts_at,
  };
}

/** One read of the public sale. Empty when the request cannot be completed. */
export async function getSaleSnapshot(): Promise<SaleSnapshot> {
  try {
    const response = await apiGet<ActiveSaleResponse>('/billing/sale');
    return {
      phase: response.phase ? mapPhase(response.phase) : null,
      faces: (response.faces ?? []).map(mapStripFace),
    };
  } catch {
    return EMPTY_SALE;
  }
}

/** Null when the season is off or the sale request cannot be completed. */
export async function getActiveSale(): Promise<ActiveSale | null> {
  const snapshot = await getSaleSnapshot();
  return snapshot.phase;
}

/** Rotating strip faces. Empty when the teaser is off or the request fails. */
export async function getSaleStrip(): Promise<SaleStripFace[]> {
  const snapshot = await getSaleSnapshot();
  return snapshot.faces;
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

export async function switchSubscriptionPlan(
  accessToken: string,
  payload: SwitchPlanRequest
): Promise<BillingStatus> {
  return apiPost<BillingStatus>('/billing/switch', payload, accessToken);
}

export async function createPortalSession(
  accessToken: string
): Promise<PortalSessionResponse> {
  return apiPost<PortalSessionResponse>('/billing/portal', {}, accessToken);
}
