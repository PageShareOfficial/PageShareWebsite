import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { AccountLoadError } from '@/utils/auth/accountLoadError';
import { GET } from './route';

const exchangeCodeForSession = vi.hoisted(() => vi.fn());
const resolvePostAuthPath = vi.hoisted(() => vi.fn());

vi.mock('@supabase/ssr', () => ({
  createServerClient: (_url: string, _key: string, options: CallbackClientOptions) => ({
    auth: {
      exchangeCodeForSession: async (code: string) => {
        options.cookies.setAll([{ name: 'sb-session', value: 'set', options: { path: '/' } }]);
        return exchangeCodeForSession(code);
      },
    },
  }),
}));
vi.mock('@/utils/auth/postAuthRedirect', () => ({ resolvePostAuthPath }));

type SessionCookie = { name: string; value: string; options?: { path: string } };

type CallbackClientOptions = {
  cookies: { setAll: (cookies: SessionCookie[]) => void };
};

function callbackRequest(search = ''): NextRequest {
  return new NextRequest(`http://localhost:3000/auth/callback${search}`);
}

describe('GET /auth/callback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'publishable-key');
  });

  it('sends a missing code back to the landing page', async () => {
    const response = await GET(callbackRequest());

    expect(response.headers.get('location')).toBe('http://localhost:3000/?error=auth');
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('sends a failed exchange back to the landing page', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    exchangeCodeForSession.mockResolvedValue({ data: { session: null }, error: new Error('bad') });

    const response = await GET(callbackRequest('?code=one-time'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/?error=auth');
    expect(resolvePostAuthPath).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('sends a thrown exchange error back to the landing page', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    exchangeCodeForSession.mockRejectedValue(new Error('network'));

    const response = await GET(callbackRequest('?code=one-time'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/?error=auth');
    expect(resolvePostAuthPath).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it('fails loudly when the Supabase env is missing', async () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');

    await expect(GET(callbackRequest('?code=one-time'))).rejects.toThrow(
      /Missing NEXT_PUBLIC_SUPABASE_URL/
    );
    expect(exchangeCodeForSession).not.toHaveBeenCalled();
  });

  it('redirects a new user to onboarding and keeps the session cookie', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    resolvePostAuthPath.mockResolvedValue('/onboarding');

    const response = await GET(callbackRequest('?code=one-time'));

    expect(resolvePostAuthPath).toHaveBeenCalledWith('token');
    expect(response.headers.get('location')).toBe('http://localhost:3000/onboarding');
    expect(response.cookies.get('sb-session')?.value).toBe('set');
  });

  it('redirects a returning user home', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    resolvePostAuthPath.mockResolvedValue('/home');

    const response = await GET(callbackRequest('?code=one-time'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/home');
  });

  it('shows the retry page when the account cannot be loaded', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    resolvePostAuthPath.mockRejectedValue(new AccountLoadError());

    const response = await GET(callbackRequest('?code=one-time'));

    expect(response.headers.get('location')).toBe('http://localhost:3000/auth/account-error');
    expect(response.cookies.get('sb-session')?.value).toBe('set');
  });

  it('does not hide an unexpected account lookup failure', async () => {
    exchangeCodeForSession.mockResolvedValue({
      data: { session: { access_token: 'token' } },
      error: null,
    });
    resolvePostAuthPath.mockRejectedValue(new Error('unexpected'));

    await expect(GET(callbackRequest('?code=one-time'))).rejects.toThrow('unexpected');
  });
});
