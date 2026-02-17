'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * Custom offline page (YouTube-style). Shown when the user has no connection
 * and the app can't load — e.g. after refresh or opening the site while offline.
 * Also reachable at /offline when already in the app.
 */
export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="text-center space-y-8 max-w-md">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="rounded-full bg-white/10 p-6">
            <WifiOff className="w-16 h-16 text-gray-400" aria-hidden />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            You&apos;re offline
          </h1>
          <p className="text-gray-400">
            Check your internet connection and try again.
          </p>
        </div>

        {/* Retry button */}
        <button
          onClick={handleRetry}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Try again
        </button>
      </div>
    </div>
  );
}
