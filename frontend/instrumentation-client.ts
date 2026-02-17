/**
 * Client-side instrumentation (runs before React hydration).
 * Sentry init is in sentry.client.config.ts (required by @sentry/nextjs webpack plugin).
 * When migrating to Turbopack, move Sentry init here and remove sentry.client.config.ts.
 */
import * as Sentry from '@sentry/nextjs';

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;