'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePremiumOverlay } from '@/contexts/PremiumOverlayContext';

/**
 * /plans opens the premium overlay instead of rendering a page.
 * Keeps the route for bookmarks and upgrade links that still push here.
 */
export default function PlansPage() {
  const router = useRouter();
  const { openPremium } = usePremiumOverlay();

  useEffect(() => {
    openPremium();
    if (window.history.length > 1) {
      router.back();
    } else {
      router.replace('/home');
    }
  }, [openPremium, router]);

  return null;
}
