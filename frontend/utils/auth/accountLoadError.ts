import * as Sentry from '@sentry/nextjs';
import { logErrorToBackend } from '@/utils/error/logError';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

export const ACCOUNT_LOAD_ERROR_MESSAGE = "We couldn't load your account. Please try again.";

export type AccountLoadSource = 'auth_callback' | 'auth_context';

/** Raised when GET /users/me fails, so callers can show a retry instead of guessing a route. */
export class AccountLoadError extends Error {
  constructor() {
    super(ACCOUNT_LOAD_ERROR_MESSAGE);
    this.name = 'AccountLoadError';
  }
}

/** Records a failed GET /users/me in Sentry and the backend error log. Never throws. */
export function reportAccountLoadFailure(error: unknown, source: AccountLoadSource): void {
  logErrorToBackend({
    error_type: 'api',
    error_code: 'ACCOUNT_LOAD_FAILED',
    error_message: getErrorMessage(error, 'GET /users/me failed'),
    page_url: typeof window !== 'undefined' ? window.location.pathname : undefined,
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    metadata: { source, endpoint: '/users/me' },
  });
  try {
    Sentry.captureException(error, { tags: { area: 'account_load', source } });
  } catch {
    // Reporting must never break sign-in.
  }
}
