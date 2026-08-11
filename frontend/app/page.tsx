'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import AuthTabs from '@/components/auth/AuthTabs';
import LandingHero from '@/components/landing/LandingHero';
import HowWeWorkSection from '@/components/landing/HowWeWorkSection';
import BottomCTA from '@/components/landing/BottomCTA';
import LandingFooterSocial from '@/components/landing/LandingFooterSocial';

function HomeContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const authInitialError =
    errorParam === 'auth'
      ? 'Sign-in link expired or invalid. Please try signing in again.'
      : errorParam === 'reset_expired'
        ? 'Password reset link expired. Please request a new one.'
        : undefined;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0 bg-black" aria-hidden />

      <header className="relative z-10 lg:hidden flex justify-center items-center py-6 sm:py-8 border-b border-white/10">
        <Link href="/" className="block">
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
        <BottomCTA />
      </div>

      <footer className="relative z-10 border-t border-white/10 bg-black mt-auto">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6">
          <nav className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-500">
            <Link href="/about" className="hover:text-white transition-colors px-1">
              About
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/coming-soon?page=Help-Center"
              className="hover:text-white transition-colors px-1"
            >
              Help Center
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link href="/terms" className="hover:text-white transition-colors px-1">
              Terms of Service
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link href="/privacy" className="hover:text-white transition-colors px-1">
              Privacy Policy
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link href="/cookies" className="hover:text-white transition-colors px-1">
              Cookie Policy
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/coming-soon?page=Accessibility"
              className="hover:text-white transition-colors px-1"
            >
              Accessibility
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link href="/disclaimer" className="hover:text-white transition-colors px-1">
              Disclaimer
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/coming-soon?page=Blog"
              className="hover:text-white transition-colors px-1"
            >
              Blog
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/coming-soon?page=Careers"
              className="hover:text-white transition-colors px-1"
            >
              Careers
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/coming-soon?page=Brand-Resources"
              className="hover:text-white transition-colors px-1"
            >
              Brand Resources
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/coming-soon?page=API"
              className="hover:text-white transition-colors px-1"
            >
              API
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link
              href="/coming-soon?page=Contact"
              className="hover:text-white transition-colors px-1"
            >
              Contact
            </Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <span className="px-1 text-gray-500">Our Socials</span>
            <LandingFooterSocial />
          </nav>
          <div className="mt-3 sm:mt-4 text-center">
            <p className="text-gray-500 text-[10px] sm:text-xs px-4 leading-relaxed">
              © 2025 PageShare is not a securities broker-dealer, investment adviser, or any
              other type of financial professional. No content on the PageShare platform should
              be considered an offer, solicitation of an offer, or advice to buy or sell
              securities or any other type of investment or financial product. By using the
              PageShare platform, you understand and agree that PageShare does not provide
              investment advice, recommend any security, transaction, or order, issue
              securities, produce or provide research.
            </p>
          </div>
        </div>
      </footer>
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

export default function Home() {
  return (
    <Suspense fallback={<HomeFallback />}>
      <HomeContent />
    </Suspense>
  );
}
