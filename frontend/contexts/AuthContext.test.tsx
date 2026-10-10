/**
 * @vitest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { ACCOUNT_LOAD_ERROR_MESSAGE } from '@/utils/auth/accountLoadError';

const api = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  getBaseUrl: vi.fn(),
}));
const reportAccountLoadFailure = vi.hoisted(() => vi.fn());
const session = vi.hoisted(() => ({ access_token: 'token', user: { id: 'user-1' } }));

vi.mock('@/lib/api/client', () => api);
vi.mock('@/lib/feedCache', () => ({ clearFeedCache: vi.fn() }));
vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  usePathname: () => '/home',
}));
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}));
vi.mock('@/utils/auth/accountLoadError', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/auth/accountLoadError')>()),
  reportAccountLoadFailure,
}));

let latestAuth: ReturnType<typeof useAuth> | null = null;

function AuthProbe() {
  latestAuth = useAuth();
  return (
    <>
      <p data-testid="username">{latestAuth.backendUser?.username ?? 'none'}</p>
      <p data-testid="error">{latestAuth.backendUserError ?? 'none'}</p>
      <p data-testid="loading">{String(latestAuth.loading)}</p>
    </>
  );
}

function renderProvider() {
  render(
    <AuthProvider>
      <AuthProbe />
    </AuthProvider>
  );
}

describe('AuthProvider backend user loading', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.getBaseUrl.mockReturnValue('https://api.example.com');
    api.apiPost.mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
    latestAuth = null;
  });

  it('loads the backend user without an error', async () => {
    api.apiGet.mockResolvedValue({ id: 'user-1', username: 'alice' });
    renderProvider();

    await waitFor(() => expect(screen.getByTestId('username')).toHaveTextContent('alice'));
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });

  it('exposes and reports a failed /users/me instead of hiding it', async () => {
    const failure = new Error('down');
    api.apiGet.mockRejectedValue(failure);
    renderProvider();

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent(ACCOUNT_LOAD_ERROR_MESSAGE)
    );
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(reportAccountLoadFailure).toHaveBeenCalledWith(failure, 'auth_context');
  });

  it('clears the error when a retry succeeds', async () => {
    api.apiGet.mockRejectedValueOnce(new Error('down'));
    renderProvider();
    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent(ACCOUNT_LOAD_ERROR_MESSAGE)
    );

    api.apiGet.mockResolvedValue({ id: 'user-1', username: 'alice' });
    await act(async () => latestAuth?.refreshBackendUser());

    expect(screen.getByTestId('username')).toHaveTextContent('alice');
    expect(screen.getByTestId('error')).toHaveTextContent('none');
  });
});
