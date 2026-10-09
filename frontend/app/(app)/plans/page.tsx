'use client';

import { useEffect } from 'react';
import { usePremiumOverlay } from '@/contexts/PremiumOverlayContext';
import { useSafeBack } from '@/hooks/common/useSafeBack';

/**
 * /plans opens the premium overlay instead of rendering a page.
 * Keeps the route for bookmarks and upgrade links that still push here.
 */
export default function PlansPage() {
  const { openPremium } = usePremiumOverlay();
  const goBack = useSafeBack();

  useEffect(() => {
    openPremium();
    goBack();
  }, [openPremium, goBack]);

  return null;
}
