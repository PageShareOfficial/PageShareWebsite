import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/api/billingApi', () => ({ createPortalSession: vi.fn() }));

import { openBillingPortal, type OpenBillingPortalDeps } from './openBillingPortal';

const PORTAL_URL = 'https://billing.stripe.com/session/test';

function createFakeTab(closed = false) {
  return { closed, close: vi.fn(), location: { href: '' } } as unknown as Window & {
    close: ReturnType<typeof vi.fn>;
  };
}

function createDeps(overrides: Partial<OpenBillingPortalDeps> = {}): OpenBillingPortalDeps {
  return {
    createSession: vi.fn().mockResolvedValue({ url: PORTAL_URL }),
    openBlankTab: vi.fn().mockReturnValue(createFakeTab()),
    navigateSameTab: vi.fn(),
    ...overrides,
  };
}

describe('openBillingPortal', () => {
  it('opens the tab before the session request and points it at the portal', async () => {
    const tab = createFakeTab();
    const callOrder: string[] = [];
    const deps = createDeps({
      openBlankTab: vi.fn(() => {
        callOrder.push('open');
        return tab;
      }),
      createSession: vi.fn(async () => {
        callOrder.push('session');
        return { url: PORTAL_URL };
      }),
    });

    await openBillingPortal('token', deps);

    expect(callOrder).toEqual(['open', 'session']);
    expect(tab.location.href).toBe(PORTAL_URL);
    expect(deps.navigateSameTab).not.toHaveBeenCalled();
  });

  it('falls back to the current tab when the popup is blocked', async () => {
    const deps = createDeps({ openBlankTab: vi.fn().mockReturnValue(null) });

    await openBillingPortal('token', deps);

    expect(deps.navigateSameTab).toHaveBeenCalledWith(PORTAL_URL);
  });

  it('falls back to the current tab when the user closed the new tab early', async () => {
    const deps = createDeps({ openBlankTab: vi.fn().mockReturnValue(createFakeTab(true)) });

    await openBillingPortal('token', deps);

    expect(deps.navigateSameTab).toHaveBeenCalledWith(PORTAL_URL);
  });

  it('closes the empty tab and rethrows when the session request fails', async () => {
    const tab = createFakeTab();
    const apiError = new Error('Portal unavailable');
    const deps = createDeps({
      openBlankTab: vi.fn().mockReturnValue(tab),
      createSession: vi.fn().mockRejectedValue(apiError),
    });

    await expect(openBillingPortal('token', deps)).rejects.toThrow('Portal unavailable');
    expect(tab.close).toHaveBeenCalled();
    expect(deps.navigateSameTab).not.toHaveBeenCalled();
  });

  it('rejects without opening a tab when the access token is missing', async () => {
    const deps = createDeps();

    await expect(openBillingPortal('', deps)).rejects.toThrow('Sign in again');
    expect(deps.openBlankTab).not.toHaveBeenCalled();
  });
});
