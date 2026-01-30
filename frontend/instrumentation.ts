/**
 * Next.js instrumentation – loads Sentry server/edge configs in the correct lifecycle.
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */
import * as Sentry from '@sentry/nextjs';

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }
  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

// Capture errors from Server Components, middleware, and API routes (Next.js 15+)
export const onRequestError = Sentry.captureRequestError;
