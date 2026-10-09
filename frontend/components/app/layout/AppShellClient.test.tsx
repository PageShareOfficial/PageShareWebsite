/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import AppShellClient from './AppShellClient';

const authState = vi.hoisted(() => ({ session: null as object | null, loading: false }));

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authState }));

vi.mock('@/hooks/predictions/useSavedAnalysts', () => ({
  SavedAnalystsProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/contexts/PremiumOverlayContext', () => ({
  PremiumOverlayProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/app/plans/PremiumOverlay', () => ({ default: () => null }));
vi.mock('@/components/app/billing/CheckoutReturnBanner', () => ({ default: () => null }));
vi.mock('./Sidebar', () => ({ default: () => <div data-testid="signed-in-sidebar" /> }));
vi.mock('./RightSidebar', () => ({ default: () => <div data-testid="right-sidebar" /> }));
vi.mock('./UnauthSidebar', () => ({ default: () => <div data-testid="unauth-sidebar" /> }));

function renderShell(initialSignedIn: boolean) {
  render(
    <AppShellClient initialSignedIn={initialSignedIn}>
      <p>Page content</p>
    </AppShellClient>
  );
}

describe('AppShellClient', () => {
  beforeEach(() => {
    authState.session = null;
    authState.loading = false;
  });

  afterEach(cleanup);

  it('shows the public chrome to signed-out visitors', () => {
    renderShell(false);
    expect(screen.getByTestId('unauth-sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('signed-in-sidebar')).not.toBeInTheDocument();
    expect(screen.getByText('Page content')).toBeInTheDocument();
  });

  it('shows the signed-in chrome when a session exists', () => {
    authState.session = { access_token: 'token' };
    renderShell(false);
    expect(screen.getByTestId('signed-in-sidebar')).toBeInTheDocument();
    expect(screen.getByTestId('right-sidebar')).toBeInTheDocument();
    expect(screen.queryByTestId('unauth-sidebar')).not.toBeInTheDocument();
  });

  it('uses the server hint while the session is loading', () => {
    authState.loading = true;
    renderShell(false);
    expect(screen.getByTestId('unauth-sidebar')).toBeInTheDocument();
  });

  it('trusts the loaded session over a stale server hint', () => {
    renderShell(true);
    expect(screen.getByTestId('unauth-sidebar')).toBeInTheDocument();
  });
});
