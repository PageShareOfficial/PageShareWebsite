import { apiGet, apiPost, getBaseUrl } from '@/lib/api/client';

export function needsOnboarding(username: string): boolean {
  return username.startsWith('user_');
}

export async function resolvePostAuthPath(
  accessToken: string,
  options?: { recordSessionStart?: boolean }
): Promise<'/onboarding' | '/home'> {
  const apiUrl = getBaseUrl();

  if (options?.recordSessionStart && apiUrl) {
    try {
      await apiPost('/session/start', {}, accessToken);
    } catch {
      // Session tracking is best-effort.
    }
  }

  if (!apiUrl) {
    return '/onboarding';
  }

  try {
    const user = await apiGet<{ username: string }>('/users/me', accessToken);
    return needsOnboarding(user.username) ? '/onboarding' : '/home';
  } catch {
    return '/onboarding';
  }
}
