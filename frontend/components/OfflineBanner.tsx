'use client';

import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';

/**
 * Fixed banner at the top when the user has no internet connection.
 * Shown across all pages so the user knows why actions may fail.
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="alert"
      className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-amber-500/95 text-black px-4 py-2.5 text-sm font-medium shadow-md"
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden />
      <span>You&apos;re offline. Check your connection and try again.</span>
    </div>
  );
}
