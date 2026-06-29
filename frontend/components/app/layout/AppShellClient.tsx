'use client';

import { Suspense } from 'react';
import { PremiumOverlayProvider } from '@/contexts/PremiumOverlayContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import PremiumOverlay from '@/components/app/plans/PremiumOverlay';
import CheckoutReturnBanner from '@/components/app/billing/CheckoutReturnBanner';
import Sidebar from '@/components/app/layout/Sidebar';
import RightSidebar from '@/components/app/layout/RightSidebar';

export default function AppShellClient({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SubscriptionProvider>
      <PremiumOverlayProvider>
        <div className="min-h-screen bg-black">
          <div className="flex justify-center">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">{children}</div>
            <RightSidebar />
          </div>
        </div>
        <Suspense fallback={null}>
          <CheckoutReturnBanner />
        </Suspense>
        <PremiumOverlay />
      </PremiumOverlayProvider>
    </SubscriptionProvider>
  );
}
