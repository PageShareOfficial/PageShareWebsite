import type { Metadata } from 'next';
import { Suspense } from 'react';
import AnalyticsFullscreenLayout from '@/components/app/layout/AnalyticsFullscreenLayout';
import Loading from '@/components/app/common/Loading';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Prediction performance scorecards and analyst analytics on PageShare',
  robots: { index: false, follow: false },
};

function AnalyticsPageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black">
      <Loading />
    </div>
  );
}

export default function AnalyticsRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AnalyticsFullscreenLayout>
      <Suspense fallback={<AnalyticsPageFallback />}>{children}</Suspense>
    </AnalyticsFullscreenLayout>
  );
}
