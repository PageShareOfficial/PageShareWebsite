import { beforeEach, describe, expect, it, vi } from 'vitest';
import { needsOnboarding, resolvePostAuthPath } from '@/utils/auth/postAuthRedirect';
import { ROUTES } from '@/constants/routes';
import { AccountLoadError } from '@/utils/auth/accountLoadError';

const api = vi.hoisted(() => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
  getBaseUrl: vi.fn(),
}));

vi.mock('@/lib/api/client', () => api);

const reportAccountLoadFailure = vi.hoisted(() => vi.fn());
vi.mock('@/utils/auth/accountLoadError', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils/auth/accountLoadError')>()),
  reportAccountLoadFailure,
}));

const TOKEN = 'token';

describe('needsOnboarding', () => {
  it('flags placeholder usernames only', () => {
    expect(needsOnboarding('user_abc123')).toBe(true);
    expect(needsOnboarding('alice')).toBe(false);
  });
});

describe('resolvePostAuthPath', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    api.getBaseUrl.mockReturnValue('https://api.example.com');
    api.apiPost.mockResolvedValue(undefined);
  });

  it('sends onboarded users home and new users to onboarding', async () => {
    api.apiGet.mockResolvedValueOnce({ username: 'alice' });
    await expect(resolvePostAuthPath(TOKEN)).resolves.toBe(ROUTES.home);

    api.apiGet.mockResolvedValueOnce({ username: 'user_abc' });
    await expect(resolvePostAuthPath(TOKEN)).resolves.toBe(ROUTES.onboarding);
  });

  it('starts the session and loads the profile in parallel', async () => {
    let releaseSessionStart: () => void = () => {};
    api.apiPost.mockReturnValue(new Promise<void>((resolve) => (releaseSessionStart = resolve)));
    api.apiGet.mockResolvedValue({ username: 'alice' });

    const pending = resolvePostAuthPath(TOKEN, { recordSessionStart: true });
    expect(api.apiGet).toHaveBeenCalledWith('/users/me', TOKEN);

    releaseSessionStart();
    await expect(pending).resolves.toBe(ROUTES.home);
    expect(api.apiPost).toHaveBeenCalledWith('/session/start', {}, TOKEN);
  });

  it('skips session start unless requested', async () => {
    api.apiGet.mockResolvedValue({ username: 'alice' });
    await resolvePostAuthPath(TOKEN);
    expect(api.apiPost).not.toHaveBeenCalled();
  });

  it('does not let a failed session start block sign-in', async () => {
    api.apiPost.mockRejectedValue(new Error('down'));
    api.apiGet.mockResolvedValue({ username: 'alice' });
    await expect(resolvePostAuthPath(TOKEN, { recordSessionStart: true })).resolves.toBe(
      ROUTES.home
    );
  });

  it('reports and throws instead of guessing onboarding when the profile fails', async () => {
    const failure = new Error('down');
    api.apiGet.mockRejectedValue(failure);

    await expect(resolvePostAuthPath(TOKEN)).rejects.toBeInstanceOf(AccountLoadError);
    expect(reportAccountLoadFailure).toHaveBeenCalledWith(failure, 'auth_callback');
  });

  it('goes to onboarding when no backend is configured', async () => {
    api.getBaseUrl.mockReturnValue('');
    await expect(resolvePostAuthPath(TOKEN)).resolves.toBe(ROUTES.onboarding);
    expect(api.apiGet).not.toHaveBeenCalled();
  });
});
