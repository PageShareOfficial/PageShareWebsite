import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Discover',
  description:
    'Discover accounts, stocks, and crypto on PageShare. Search, explore news, and follow market discussions.',
};

export default function DiscoverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
