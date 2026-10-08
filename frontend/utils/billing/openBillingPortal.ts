import { createPortalSession } from '@/lib/api/billingApi';

export interface OpenBillingPortalDeps {
  createSession: (accessToken: string) => Promise<{ url: string }>;
  openBlankTab: () => Window | null;
  navigateSameTab: (url: string) => void;
}

/**
 * `noopener` would make `window.open` return null, so the tab is opened without it and the
 * opener link is cut manually before the Stripe URL loads.
 */
function openDetachedBlankTab(): Window | null {
  const tab = window.open('', '_blank');
  if (tab) {
    tab.opener = null;
  }
  return tab;
}

const defaultDeps: OpenBillingPortalDeps = {
  createSession: createPortalSession,
  openBlankTab: openDetachedBlankTab,
  navigateSameTab: (url) => window.location.assign(url),
};

/**
 * Opens the Stripe billing portal in a new tab.
 *
 * Must be called synchronously from a click handler (before any `await`): browsers such as
 * Safari only allow popups during the user gesture, so the tab is opened first and pointed at
 * the portal once the session URL arrives. Falls back to the current tab if the popup was
 * blocked. Rethrows API errors after closing the empty tab.
 */
export async function openBillingPortal(
  accessToken: string,
  deps: OpenBillingPortalDeps = defaultDeps
): Promise<void> {
  if (!accessToken) {
    throw new Error('Sign in again to manage billing.');
  }

  const pendingTab = deps.openBlankTab();

  try {
    const { url } = await deps.createSession(accessToken);
    if (pendingTab && !pendingTab.closed) {
      pendingTab.location.href = url;
      return;
    }
    deps.navigateSameTab(url);
  } catch (error) {
    pendingTab?.close();
    throw error;
  }
}
