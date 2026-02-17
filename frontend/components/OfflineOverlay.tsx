'use client';

import { useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { useOfflineOverlay } from '../contexts/OfflineOverlayContext';

/**
 * Full-screen overlay when user tried to navigate while offline (YouTube-style).
 * Only closes when the user is back online (not on Retry or Escape).
 */
export default function OfflineOverlay() {
  const isOnline = useOnlineStatus();
  const { showOfflineOverlay, setShowOfflineOverlay } = useOfflineOverlay();

  useEffect(() => {
    if (!showOfflineOverlay || !isOnline) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowOfflineOverlay(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showOfflineOverlay, isOnline, setShowOfflineOverlay]);

  if (!showOfflineOverlay) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="offline-overlay-title"
      aria-describedby="offline-overlay-desc"
    >
      <div className="bg-black border border-white/10 rounded-2xl p-8 max-w-sm mx-4 text-center shadow-xl">
        <div className="flex justify-center mb-4">
          <div className="rounded-full bg-white/10 p-4">
            <WifiOff className="w-10 h-10 text-gray-400" aria-hidden />
          </div>
        </div>
        <h2 id="offline-overlay-title" className="text-xl font-semibold text-white mb-2">
          You&apos;re offline
        </h2>
        <p id="offline-overlay-desc" className="text-gray-400 text-sm">
          Check your network connection. This will close when you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
