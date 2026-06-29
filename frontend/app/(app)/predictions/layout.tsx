import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Predictions',
  description: 'Crypto predictions, verified outcomes, and analyst leaderboards on PageShare',
  robots: { index: false, follow: false },
};

export default function PredictionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
