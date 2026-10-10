import type { Metadata } from 'next';
import LandingPage from '@/components/landing/LandingPage';
import { fetchTopCryptos } from '@/utils/api/topCryptosApi';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default async function Home() {
  const topCryptos = await fetchTopCryptos();
  return <LandingPage topCryptos={topCryptos} />;
}
