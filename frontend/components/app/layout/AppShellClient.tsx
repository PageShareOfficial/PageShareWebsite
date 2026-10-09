'use client';

import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PremiumOverlayProvider } from '@/contexts/PremiumOverlayContext';
import { SavedAnalystsProvider } from '@/hooks/predictions/useSavedAnalysts';
import PremiumOverlay from '@/components/app/plans/PremiumOverlay';
import CheckoutReturnBanner from '@/components/app/billing/CheckoutReturnBanner';
import Sidebar from '@/components/app/layout/Sidebar';
import RightSidebar from '@/components/app/layout/RightSidebar';
import PublicAppChrome from '@/components/app/layout/PublicAppChrome';

function SignedInChrome({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
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
    </>
  );
}

type AppShellClientProps = Readonly<{
  children: React.ReactNode;
  /** Server-side hint used until the client session has loaded. */
  initialSignedIn: boolean;
}>;

/** Signed-out visitors get the public chrome and never see the signed-in sidebars. */
export default function AppShellClient({ children, initialSignedIn }: AppShellClientProps) {
  const { session, loading } = useAuth();
  const isSignedIn = loading ? initialSignedIn : Boolean(session);

  return (
    <SavedAnalystsProvider>
      <PremiumOverlayProvider>
        {isSignedIn ? (
          <SignedInChrome>{children}</SignedInChrome>
        ) : (
          <PublicAppChrome>{children}</PublicAppChrome>
        )}
      </PremiumOverlayProvider>
    </SavedAnalystsProvider>
  );
}
