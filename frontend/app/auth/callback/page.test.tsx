/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, waitFor } from '@testing-library/react';
import AuthCallbackPage from './page';

const replace = vi.hoisted(() => vi.fn());
const searchParams = vi.hoisted(() => ({ value: new URLSearchParams('code=one-time-code') }));
const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  exchangeCodeForSession: vi.fn(),
  onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
}));
const resolvePostAuthPath = vi.hoisted(() => vi.fn());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams.value,
}));
vi.mock('@/lib/supabase/client', () => ({ createClient: () => ({ auth }) }));
vi.mock('@/utils/auth/postAuthRedirect', () => ({ resolvePostAuthPath }));

const session = { access_token: 'token', user: { id: 'user-1' } };

describe('AuthCallbackPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchParams.value = new URLSearchParams('code=one-time-code');
  });

  afterEach(cleanup);

  it('uses the session the client already exchanged instead of exchanging the code again', async () => {
    auth.getSession.mockResolvedValue({ data: { session } });
    resolvePostAuthPath.mockResolvedValue('/onboarding');

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/onboarding'));
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(resolvePostAuthPath).toHaveBeenCalledWith('token', { recordSessionStart: true });
  });

  it('does not record a session start when no auth redirect params are present', async () => {
    searchParams.value = new URLSearchParams();
    auth.getSession.mockResolvedValue({ data: { session } });
    resolvePostAuthPath.mockResolvedValue('/home');

    render(<AuthCallbackPage />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/home'));
    expect(resolvePostAuthPath).toHaveBeenCalledWith('token', { recordSessionStart: false });
  });
});
