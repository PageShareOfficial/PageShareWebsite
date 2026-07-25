import type { Metadata } from 'next';
import AnalyticsFullscreenLayout from '@/components/app/layout/AnalyticsFullscreenLayout';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'Prediction performance scorecards and analyst analytics on PageShare',
  robots: { index: false, follow: false },
};

export default function AnalyticsRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AnalyticsFullscreenLayout>{children}</AnalyticsFullscreenLayout>;
}
