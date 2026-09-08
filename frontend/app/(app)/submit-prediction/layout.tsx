import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Submit Prediction',
  description: 'Submit a price prediction on PageShare',
  robots: { index: false, follow: false },
};

export default function SubmitPredictionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
