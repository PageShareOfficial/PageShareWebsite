'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import AuthTabs from '@/components/auth/AuthTabs';
import FeaturesSection from '@/components/landing/FeaturesSection';
import BottomCTA from '@/components/landing/BottomCTA';
import { Shield, UserCheck, Brain, Zap } from 'lucide-react';

const HERO_FEATURES = [
  { icon: Shield, line1: 'Verified', line2: 'Predictions' },
  { icon: UserCheck, line1: 'Analyst', line2: 'Credibility' },
  { icon: Brain, line1: 'AI-Powered', line2: 'Research' },
  { icon: Zap, line1: 'Early', line2: 'Narratives' },
] as const;

function HomeContent() {
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-black"></div>

      {/* Logo header - mobile & tablet only */}
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

      {/* Main Content */}
      <main className="flex-1 relative z-10 flex items-center justify-center py-8 sm:py-12 md:py-16 lg:py-20">
        <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid lg:grid-cols-2 gap-8 sm:gap-12 md:gap-16 lg:gap-20 xl:gap-24 2xl:gap-32 items-center">
            
            {/* Left Column - Premium Content (Hidden on Mobile/Tablet) */}
            <div className="hidden lg:block space-y-6 sm:space-y-8 max-w-2xl mx-auto lg:mx-0 lg:ml-0 xl:ml-8 2xl:ml-12">
              {/* Logo - Inline with Left Column */}
              <div className="mb-4 sm:mb-6">
                <Link href="/" className="block">
                  <Image
                    src="/pageshare_final.png"
                    alt="PageShare Logo"
                    width={200}
                    height={200}
                    className="w-auto h-16 sm:h-20 md:h-24 lg:h-28"
                    priority
                  />
                </Link>
              </div>

              {/* Premium Headline with Creative Typography */}
              <div className="space-y-4 sm:space-y-6">
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tight">
                  <span className="block">Share Crypto Insights &</span>
                  <span className="block bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
                    Discover Alpha
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed">
                PageShare turns market ideas into structured predictions, measurable track records, and actionable intelligence for traders, analysts, investors, and institutions.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-5 pt-2 sm:pt-4 w-full">
                {HERO_FEATURES.map(({ icon: Icon, line1, line2 }) => (
                  <div key={`${line1}-${line2}`} className="flex items-center gap-2.5 shrink-0">
                    <div className="w-11 h-11 shrink-0 rounded-xl border border-cyan-500/20 bg-cyan-500/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs sm:text-sm text-gray-300 font-medium whitespace-nowrap">
                        {line1}
                      </span>
                      <span className="text-xs sm:text-sm text-gray-300 font-medium whitespace-nowrap">
                        {line2}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

            </div>

            {/* Right Column - Auth Card */}
            <div className="flex items-center justify-center w-full">
              <AuthTabs initialError={errorParam === 'auth' ? 'Sign-in link expired or invalid. Please try signing in again.' : errorParam === 'reset_expired' ? 'Password reset link expired. Please request a new one.' : undefined} />
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-8 sm:py-12 md:py-16">
        <div className="max-w-[1400px] mx-auto flex justify-center">
          <Image
            src="/cta/landing-photo.png"
            alt="PageShare prediction dashboard with market narrative insights"
            width={1400}
            height={700}
            className="w-full h-auto max-w-full object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1400px"
          />
        </div>
      </section>

      <div className="relative z-10">
        <FeaturesSection />
        <BottomCTA />
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black mt-auto">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-4 sm:py-6">
          <nav className="flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 md:gap-x-4 gap-y-2 text-xs sm:text-sm text-gray-500">
            <Link href="/about" className="hover:text-white transition-colors px-1">About</Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link href="/coming-soon?page=Help-Center" className="hover:text-white transition-colors px-1">Help Center</Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link href="/terms" className="hover:text-white transition-colors px-1">Terms of Service</Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link href="/privacy" className="hover:text-white transition-colors px-1">Privacy Policy</Link>
            <span className="text-gray-600 hidden sm:inline">|</span>
            <Link href="/cookies" className="hover:text-white transition-colors px-1">Cookie Policy</Link>
            <span className="text-gray-600 hidden md:inline">|</span>
            <Link href="/coming-soon?page=Accessibility" className="hover:text-white transition-colors px-1 hidden md:inline">Accessibility</Link>
            <span className="text-gray-600 hidden md:inline">|</span>
            <Link href="/disclaimer" className="hover:text-white transition-colors px-1">Disclaimer</Link>
            <span className="text-gray-600 hidden lg:inline">|</span>
            <Link href="/coming-soon?page=Blog" className="hover:text-white transition-colors px-1 hidden lg:inline">Blog</Link>
            <span className="text-gray-600 hidden lg:inline">|</span>
            <Link href="/coming-soon?page=Careers" className="hover:text-white transition-colors px-1 hidden lg:inline">Careers</Link>
            <span className="text-gray-600 hidden xl:inline">|</span>
            <Link href="/coming-soon?page=Brand-Resources" className="hover:text-white transition-colors px-1 hidden xl:inline">Brand Resources</Link>
            <span className="text-gray-600 hidden xl:inline">|</span>
            <Link href="/coming-soon?page=API" className="hover:text-white transition-colors px-1 hidden xl:inline">API</Link>
            <span className="text-gray-600 hidden xl:inline">|</span>
            <Link href="/coming-soon?page=Contact" className="hover:text-white transition-colors px-1 hidden xl:inline">Contact</Link>
          </nav>
          <div className="mt-3 sm:mt-4 text-center">
            <p className="text-gray-500 text-[10px] sm:text-xs px-4 leading-relaxed">
              © 2025 PageShare is not a securities broker-dealer, investment adviser, or any other type of financial professional. No content on the PageShare platform should be considered an offer, solicitation of an offer, or advice to buy or sell securities or any other type of investment or financial product. By using the PageShare platform, you understand and agree that PageShare does not provide investment advice, recommend any security, transaction, or order, issue securities, produce or provide research.
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