import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createCheckoutSession,
  createPortalSession,
  getActiveSale,
  getBillingStatus,
  getSaleStrip,
} from './billingApi';
import { getSaleEligibility } from './saleEligibility';

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

  it('getActiveSale maps the live phase and returns null when the season is off', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      phase: {
        code: 'EARLYCOMERS15',
        percent_off: 15,
        name: 'Early Access',
        offer: 'Black Friday starts early',
        ends_at: '2026-11-27T00:00:00Z',
      },
    });
    await expect(getActiveSale()).resolves.toEqual({
      code: 'EARLYCOMERS15',
      percentOff: 15,
      name: 'Early Access',
      offer: 'Black Friday starts early',
      endsAt: '2026-11-27T00:00:00Z',
    });
    expect(apiGet).toHaveBeenCalledWith('/billing/sale');

    vi.mocked(apiGet).mockResolvedValueOnce({ phase: null });
    await expect(getActiveSale()).resolves.toBeNull();

    vi.mocked(apiGet).mockRejectedValueOnce(
      new Error('Unable to reach the server. Please try again later.')
    );
    await expect(getActiveSale()).resolves.toBeNull();
  });

  it('getSaleStrip maps both faces and returns none when the request fails', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({
      phase: null,
      faces: [
        {
          code: 'EARLYCOMERS15',
          percent_off: 15,
          name: 'Early Access',
          offer: 'Black Friday starts early',
          headline: 'Early Access',
          starts_at: '2026-11-12T00:00:00Z',
          ends_at: '2026-11-27T00:00:00Z',
        },
      ],
    });
    await expect(getSaleStrip()).resolves.toEqual([
      {
        code: 'EARLYCOMERS15',
        percentOff: 15,
        name: 'Early Access',
        offer: 'Black Friday starts early',
        headline: 'Early Access',
        startsAt: '2026-11-12T00:00:00Z',
        endsAt: '2026-11-27T00:00:00Z',
      },
    ]);

    vi.mocked(apiGet).mockResolvedValueOnce({ phase: null });
    await expect(getSaleStrip()).resolves.toEqual([]);

    vi.mocked(apiGet).mockRejectedValueOnce(new Error('Unable to reach the server'));
    await expect(getSaleStrip()).resolves.toEqual([]);
  });

  it('getSaleEligibility reads the signed-in flag and hides the strip when the check fails', async () => {
    vi.mocked(apiGet).mockResolvedValueOnce({ eligible: false });
    await expect(getSaleEligibility(accessToken)).resolves.toBe(false);
    expect(apiGet).toHaveBeenCalledWith('/billing/sale-eligibility', accessToken);

    vi.mocked(apiGet).mockResolvedValueOnce({ eligible: true });
    await expect(getSaleEligibility(accessToken)).resolves.toBe(true);

    vi.mocked(apiGet).mockRejectedValueOnce(new Error('Unable to reach the server'));
    await expect(getSaleEligibility(accessToken)).resolves.toBe(false);
  });

  it('getBillingStatus calls GET /billing/status', async () => {
    const status = {
      is_premium: true,
      plan_id: 'analyst' as const,
      status: 'active' as const,
      interval: 'monthly' as const,
      current_period_end: '2026-07-01T00:00:00Z',
      cancel_at_period_end: false,
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
