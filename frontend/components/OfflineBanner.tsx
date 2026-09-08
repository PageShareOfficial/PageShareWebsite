'use client';

import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { subscribeOfflineBannerPulse } from '@/utils/offline/pulseOfflineBanner';

/**
 * Fixed banner at the top when the user has no internet connection.
 * Pulses when the user tries an action that requires network (tab switch, etc.).
 */
export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [pulseGeneration, setPulseGeneration] = useState(0);

  useEffect(() => {
    return subscribeOfflineBannerPulse(() => {
      setPulseGeneration((value) => value + 1);
    });
  }, []);

  if (isOnline) {
    return null;
  }

  return (
    <div
      key={pulseGeneration}
      role="alert"
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 bg-amber-500/95 text-black px-4 py-2.5 text-sm font-medium shadow-md ${
        pulseGeneration > 0 ? 'animate-pulse' : ''
      }`}
      aria-live="polite"
    >
      <WifiOff className="w-4 h-4 flex-shrink-0" aria-hidden />
      <span>You&apos;re offline. Check your connection and try again.</span>
    </div>
  );
}
