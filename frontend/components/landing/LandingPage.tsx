'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import AuthTabs from '@/components/auth/AuthTabs';
import LandingHero from '@/components/landing/LandingHero';
import HowWeWorkSection from '@/components/landing/HowWeWorkSection';
import FounderVideoSection from '@/components/landing/FounderVideoSection';
import BottomCTA from '@/components/landing/BottomCTA';
import SiteFooter from '@/components/app/layout/SiteFooter';
import CryptoTickerBar from '@/components/landing/CryptoTickerBar';
import SaleStrip from '@/components/landing/SaleStrip';
import type { TopCrypto } from '@/utils/api/topCryptosApi';
import {
  AUTH_ERROR_CODES,
  ROUTES,
  isAuthErrorCode,
  type AuthErrorCode,
} from '@/constants/routes';

const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  [AUTH_ERROR_CODES.auth]: 'Sign-in link expired or invalid. Please try signing in again.',
  [AUTH_ERROR_CODES.resetExpired]: 'Password reset link expired. Please request a new one.',
};

type LandingPageProps = Readonly<{ topCryptos: readonly TopCrypto[] }>;

function HomeContent({ topCryptos }: LandingPageProps) {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const authInitialError = isAuthErrorCode(errorParam)
    ? AUTH_ERROR_MESSAGES[errorParam]
    : undefined;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0 bg-black" aria-hidden />

      <CryptoTickerBar cryptos={topCryptos} />
      <SaleStrip />

      <header className="relative z-10 lg:hidden flex justify-center items-center py-6 sm:py-8 border-b border-white/10">
        <Link href={ROUTES.landing} className="block">
          <Image
            src="/pageshare_final.png"
            alt="PageShare Logo"
            width={200}
            height={200}
            className="w-auto h-12 sm:h-16 md:h-20"
            priority
          />
        </Link>
      </header>

      <main className="flex-1 relative z-10 flex items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="lg:hidden mb-8 sm:mb-10 max-w-lg mx-auto">
            <LandingHero compact />
          </div>

          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-20 xl:gap-24 2xl:gap-32 items-center">
            <div className="hidden lg:block">
              <LandingHero showLogo />
            </div>
            <div className="flex items-center justify-center w-full">
              <AuthTabs initialError={authInitialError} />
            </div>
          </div>
        </div>
      </main>

      <div className="relative z-10">
        <HowWeWorkSection />
        <FounderVideoSection />
        <BottomCTA />
      </div>

      <SiteFooter layout="landing" />
    </div>
  );
}

function HomeFallback() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="animate-pulse text-gray-400">Loading...</div>
    </div>
  );
}

export default function LandingPage({ topCryptos }: LandingPageProps) {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent topCryptos={topCryptos} />
    </Suspense>
  );
}
