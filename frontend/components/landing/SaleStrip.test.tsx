/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SaleStrip from './SaleStrip';

vi.mock('@/hooks/billing/useActiveSale', () => ({
  useSaleStrip: () => [
    {
      code: 'EARLYCOMERS15',
      percentOff: 15,
      name: 'Early Access',
      offer: 'Black Friday starts early',
      headline: 'Early Access',
      startsAt: '2026-11-12T00:00:00Z',
      endsAt: '2026-11-27T00:00:00Z',
    },
    {
      code: 'BLACKFRIDAY30',
      percentOff: 30,
      name: 'Black Friday',
      offer: 'Our biggest offer of the year',
      headline: 'Black Friday to Cyber Monday',
      startsAt: '2026-11-27T00:00:00Z',
      endsAt: '2026-12-02T00:00:00Z',
    },
  ],
}));

function mockMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('SaleStrip', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-19T08:00:00Z'));
    mockMotion(false);
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it('flips from Early Access to Black Friday', () => {
    render(<SaleStrip />);
    expect(screen.getByText('Early Access')).toBeInTheDocument();
    expect(screen.queryByText('Black Friday to Cyber Monday')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(screen.getByText('Black Friday to Cyber Monday')).toBeInTheDocument();
    expect(screen.queryByText('Early Access')).not.toBeInTheDocument();
  });

  it('keeps both faces on screen when motion is reduced', () => {
    mockMotion(true);
    render(<SaleStrip />);
    expect(screen.getByText('Early Access')).toBeInTheDocument();
    expect(screen.getByText('Black Friday to Cyber Monday')).toBeInTheDocument();
  });
});
