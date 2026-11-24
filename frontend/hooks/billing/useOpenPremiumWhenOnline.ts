'use client';

import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { useOfflineOverlay } from '@/contexts/OfflineOverlayContext';
import { usePremiumOverlay } from '@/contexts/PremiumOverlayContext';

/** Opens premium overlay when online; otherwise shows the offline overlay. */
export function useOpenPremiumWhenOnline() {
  const isOnline = useOnlineStatus();
  const { setShowOfflineOverlay } = useOfflineOverlay();
  const { openPremium } = usePremiumOverlay();

  const openPremiumPlans = () => {
    if (isOnline) {
      openPremium();
      return;
    }
    setShowOfflineOverlay(true);
  };

  return { openPremiumPlans, isOnline };
}
