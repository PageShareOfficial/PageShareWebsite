import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Plans & Pricing',
  description:
    'Upgrade your PageShare experience. Choose a plan that fits your needs for stocks, NFTs and crypto discussions.',
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
