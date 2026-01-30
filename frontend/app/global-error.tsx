'use client';

/**
 * Root-level error handler for App Router. Catches errors that escape segment boundaries
 * (e.g. in root layout). Required by Sentry for full React error coverage.
 * See: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#capture-react-render-errors
 */
import * as Sentry from '@sentry/nextjs';
import NextError from 'next/error';
import { useEffect } from 'react';

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="bg-black">
      <body className="bg-black text-white min-h-screen flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-2xl md:text-3xl font-bold mb-4">Something went wrong</h1>
          <p className="text-gray-400 mb-6">
            {error.message || 'An unexpected error occurred'}
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors font-medium"
            >
              Try again
            </button>
            <button
              type="button"
              onClick={() => (window.location.href = '/')}
              className="px-6 py-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors font-medium border border-white/20"
            >
              Go home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
