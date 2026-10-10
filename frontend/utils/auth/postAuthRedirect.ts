import { apiGet, apiPost, getBaseUrl } from '@/lib/api/client';
import { ROUTES } from '@/constants/routes';
import { AccountLoadError, reportAccountLoadFailure } from '@/utils/auth/accountLoadError';

type PostAuthPath = typeof ROUTES.onboarding | typeof ROUTES.home;

export function needsOnboarding(username: string): boolean {
  return username.startsWith('user_');
}

/** Session tracking is best-effort; it must never block or fail sign-in. */
export async function recordSessionStart(accessToken: string): Promise<void> {
  try {
    await apiPost('/session/start', {}, accessToken);
  } catch (err) {
    console.warn('[session] start failed', err);
  }
}

async function resolveDestinationFromProfile(accessToken: string): Promise<PostAuthPath> {
  let user: { username: string };
  try {
    user = await apiGet<{ username: string }>('/users/me', accessToken);
  } catch (err) {
    reportAccountLoadFailure(err, 'auth_callback');
    throw new AccountLoadError();
  }
  return needsOnboarding(user.username) ? ROUTES.onboarding : ROUTES.home;
}

/**
 * Picks where to send a freshly signed-in user. Session start and the profile lookup run in
 * parallel (both bootstrap the `users` row server-side), saving a backend round trip.
 * @throws AccountLoadError when the account cannot be loaded (never guesses onboarding).
 */
export async function resolvePostAuthPath(
  accessToken: string,
  options?: { recordSessionStart?: boolean }
): Promise<PostAuthPath> {
  if (!getBaseUrl()) {
    return ROUTES.onboarding;
  }

  const [destination] = await Promise.all([
    resolveDestinationFromProfile(accessToken),
    options?.recordSessionStart ? recordSessionStart(accessToken) : Promise.resolve(),
  ]);
  return destination;
}
