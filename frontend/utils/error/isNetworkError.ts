import { getErrorMessage } from '@/utils/error/getErrorMessage';

export const OFFLINE_USER_MESSAGE =
  "You're offline. Check your connection and try again.";

/**
 * True when the browser is offline or a fetch likely failed due to connectivity.
 */
export function isNetworkError(err: unknown): boolean {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return true;
  }
  const message = getErrorMessage(err, '').toLowerCase();
  return (
    message.includes('failed to fetch') ||
    message.includes('network error') ||
    message.includes('load failed')
  );
}

export function resolveFetchErrorMessage(
  err: unknown,
  fallback: string,
  isOnline: boolean
): { message: string; isOffline: boolean } {
  if (!isOnline || isNetworkError(err)) {
    return { message: OFFLINE_USER_MESSAGE, isOffline: true };
  }
  return { message: getErrorMessage(err, fallback), isOffline: false };
}
