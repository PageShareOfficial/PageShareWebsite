// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { getSaleEligibility } from '@/lib/api/saleEligibility';
import {
  resetSaleEligibilityCache,
  useSaleRedeemable,
} from '@/hooks/billing/useSaleRedeemable';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/lib/api/saleEligibility', () => ({
  getSaleEligibility: vi.fn(),
}));

describe('useSaleRedeemable', () => {
  beforeEach(() => {
    resetSaleEligibilityCache();
    vi.mocked(getSaleEligibility).mockReset();
    vi.mocked(useAuth).mockReturnValue({
      session: { access_token: 'token' },
    } as ReturnType<typeof useAuth>);
  });

  it('checks eligibility while Premium is closed and keeps the answer', async () => {
    let resolveEligibility: (eligible: boolean) => void = () => undefined;
    vi.mocked(getSaleEligibility).mockReturnValue(
      new Promise((resolve) => {
        resolveEligibility = resolve;
      })
    );

    const hook = renderHook(
      ({ active }) => useSaleRedeemable(active),
      { initialProps: { active: false } }
    );

    expect(getSaleEligibility).toHaveBeenCalledWith('token');
    expect(hook.result.current).toBeNull();

    await act(async () => {
      resolveEligibility(true);
    });
    hook.rerender({ active: true });

    expect(hook.result.current).toBe(true);
    expect(getSaleEligibility).toHaveBeenCalledTimes(1);
  });

  it('returns the cached answer on the next open without another request', async () => {
    vi.mocked(getSaleEligibility).mockResolvedValue(false);
    const first = renderHook(() => useSaleRedeemable(true));

    await waitFor(() => {
      expect(first.result.current).toBe(false);
    });

    const reopened = renderHook(() => useSaleRedeemable(true));
    expect(reopened.result.current).toBe(false);
    expect(getSaleEligibility).toHaveBeenCalledTimes(1);
  });
});
