import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Events',
  description: 'Upcoming crypto conferences, summits and meetups',
  robots: { index: false, follow: false },
};

export default function EventsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
