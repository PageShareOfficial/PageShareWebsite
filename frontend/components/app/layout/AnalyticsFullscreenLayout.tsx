'use client';

import { Suspense } from 'react';
import { PremiumOverlayProvider } from '@/contexts/PremiumOverlayContext';
import { SavedAnalystsProvider } from '@/hooks/predictions/useSavedAnalysts';
import PremiumOverlay from '@/components/app/plans/PremiumOverlay';
import CheckoutReturnBanner from '@/components/app/billing/CheckoutReturnBanner';

/**
 * Full-viewport layout for prediction analytics (no three-column app shell).
 */
export default function AnalyticsFullscreenLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SavedAnalystsProvider>
      <PremiumOverlayProvider>
        <div className="min-h-screen w-full bg-black">{children}</div>
        <Suspense fallback={null}>
          <CheckoutReturnBanner />
        </Suspense>
        <PremiumOverlay />
      </PremiumOverlayProvider>
    </SavedAnalystsProvider>
  );
}
