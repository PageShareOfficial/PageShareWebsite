/**
 * Sentry client-side init. Only runs when NEXT_PUBLIC_SENTRY_DSN is set.
 * Required by @sentry/nextjs withSentryConfig (webpack). For Turbopack, use instrumentation-client.ts.
 */
import * as Sentry from '@sentry/nextjs';

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  });
}
