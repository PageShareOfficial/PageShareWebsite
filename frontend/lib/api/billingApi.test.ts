import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCheckoutSession,
  createPortalSession,
  getBillingStatus,
} from './billingApi';

vi.mock('./client', () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

import { apiGet, apiPost } from './client';

const accessToken = 'test-token';

describe('billingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getBillingStatus calls GET /billing/status', async () => {
    const status = {
      is_premium: true,
      plan_id: 'analyst' as const,
      status: 'active' as const,
      interval: 'monthly' as const,
      current_period_end: '2026-07-01T00:00:00Z',
      past_due_grace_ends_at: null,
    };
    vi.mocked(apiGet).mockResolvedValue(status);

    await expect(getBillingStatus(accessToken)).resolves.toEqual(status);
    expect(apiGet).toHaveBeenCalledWith('/billing/status', accessToken);
  });

  it('createCheckoutSession posts checkout payload', async () => {
    const payload = {
      plan_id: 'investor' as const,
      interval: 'yearly' as const,
      success_url: 'https://app.test/home?checkout=success',
      cancel_url: 'https://app.test/home?checkout=canceled',
    };
    vi.mocked(apiPost).mockResolvedValue({ url: 'https://checkout.stripe.test' });

    await expect(createCheckoutSession(accessToken, payload)).resolves.toEqual({
      url: 'https://checkout.stripe.test',
    });
    expect(apiPost).toHaveBeenCalledWith(
      '/billing/checkout',
      payload,
      accessToken
    );
  });

  it('createPortalSession posts to /billing/portal', async () => {
    vi.mocked(apiPost).mockResolvedValue({ url: 'https://billing.stripe.test' });

    await expect(createPortalSession(accessToken)).resolves.toEqual({
      url: 'https://billing.stripe.test',
    });
    expect(apiPost).toHaveBeenCalledWith('/billing/portal', {}, accessToken);
  });
});
