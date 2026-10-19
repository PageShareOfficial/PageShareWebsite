// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { getSaleSnapshot } from '@/lib/api/billingApi';
import {
  prefetchSale,
  resetSaleCache,
  useSaleStrip,
} from '@/hooks/billing/useActiveSale';

vi.mock('@/lib/api/billingApi', () => ({
  getSaleSnapshot: vi.fn(),
}));

const face = {
  code: 'EARLYCOMERS15',
  percentOff: 15,
  name: 'Early Access',
  offer: 'Black Friday starts early',
  headline: 'Early Access',
  startsAt: '2026-11-12T00:00:00Z',
  endsAt: '2026-11-27T00:00:00Z',
};

describe('sale strip cache', () => {
  beforeEach(() => {
    resetSaleCache();
    vi.mocked(getSaleSnapshot).mockReset();
    vi.mocked(getSaleSnapshot).mockResolvedValue({ phase: null, faces: [face] });
  });

  it('reuses one request and paints cached faces on the next open', async () => {
    const first = renderHook(() => useSaleStrip());
    const second = prefetchSale();

    await waitFor(() => {
      expect(first.result.current).toEqual([face]);
    });
    await expect(second).resolves.toEqual({ phase: null, faces: [face] });
    expect(getSaleSnapshot).toHaveBeenCalledTimes(1);

    const reopened = renderHook(() => useSaleStrip());
    expect(reopened.result.current).toEqual([face]);
  });
});
