/**
 * Server/edge instrumentation (Next.js calls register() once per runtime at startup).
 * Without this file the server and edge Sentry configs never run, so server-side errors go unreported.
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

export const onRequestError = Sentry.captureRequestError;
