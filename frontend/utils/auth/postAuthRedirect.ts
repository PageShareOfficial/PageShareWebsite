import { apiGet, apiPost, getBaseUrl } from '@/lib/api/client';
import { ROUTES } from '@/constants/routes';

type PostAuthPath = typeof ROUTES.onboarding | typeof ROUTES.home;

export function needsOnboarding(username: string): boolean {
  return username.startsWith('user_');
}

export async function resolvePostAuthPath(
  accessToken: string,
  options?: { recordSessionStart?: boolean }
): Promise<PostAuthPath> {
  const apiUrl = getBaseUrl();

  if (options?.recordSessionStart && apiUrl) {
    try {
      await apiPost('/session/start', {}, accessToken);
    } catch {
      // Session tracking is best-effort.
    }
  }

  if (!apiUrl) {
    return ROUTES.onboarding;
  }

  try {
    const user = await apiGet<{ username: string }>('/users/me', accessToken);
    return needsOnboarding(user.username) ? ROUTES.onboarding : ROUTES.home;
  } catch {
    return ROUTES.onboarding;
  }
}
