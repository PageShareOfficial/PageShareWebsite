'use client';

import Link from 'next/link';
import Logo from '@/components/Logo';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  return (
    <div className="h-screen bg-black text-white overflow-hidden flex flex-col">
      {/* Vibrant Black Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-black"></div>

      {/* Minimal Navbar */}
      <nav className="relative z-50 border-b border-white/10 bg-black">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="group hover:opacity-80 transition-opacity">
              <Logo size={40} />
            </Link>
            <div className="flex items-center gap-4">
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content - No Scroll */}
      <main className="flex-1 relative z-10 flex items-center justify-center overflow-hidden">
        <div className="w-full max-w-[1800px] mx-auto px-8 lg:px-16 xl:px-20 2xl:px-24">
          <div className="grid lg:grid-cols-2 gap-20 lg:gap-28 xl:gap-32 2xl:gap-40 items-center h-full">
            
            {/* Left Column - Premium Content */}
            <div className="space-y-8 max-w-2xl ml-0 lg:ml-8 xl:ml-12 2xl:ml-16">
              {/* Premium Headline with Creative Typography */}
              <div className="space-y-6">
                <h1 className="text-6xl lg:text-7xl xl:text-8xl font-black leading-[0.95] tracking-tight">
                  <span className="block">{t('shareMarket')}</span>
                  <span className="block bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
                    {t('thoughts')}
                  </span>
                  <span className="block mt-2">{t('discover')}</span>
                  <span className="block bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
                    {t('signal')}
                  </span>
                </h1>
                <p className="text-xl lg:text-2xl text-gray-300 leading-relaxed">
                  {t('subheadline')}
                </p>
              </div>

              {/* Professional Feature Pills - Twitter Style */}
              <div className="flex flex-wrap gap-3 pt-4">
                <button className="px-4 py-2 bg-white/5 border border-white/20 rounded-full text-sm text-white font-medium hover:bg-white/10 hover:border-white/30 hover:scale-105 transition-all duration-200">
                  {t('notBrokerage')}
                </button>
                <button className="px-4 py-2 bg-white/5 border border-white/20 rounded-full text-sm text-white font-medium hover:bg-white/10 hover:border-white/30 hover:scale-105 transition-all duration-200">
                  {t('stocksEtfCrypto')}
                </button>
                <button className="px-4 py-2 bg-white/5 border border-white/20 rounded-full text-sm text-white font-medium hover:bg-white/10 hover:border-white/30 hover:scale-105 transition-all duration-200">
                  {t('labsAi')}
                </button>
              </div>

            </div>

            {/* Right Column - Auth Card */}
            <div className="flex items-center justify-center lg:justify-end">
              <div className="w-full max-w-lg bg-black p-10 mr-0 lg:mr-8 xl:mr-12 2xl:mr-16">
                <div className="space-y-6">
                  <div className="text-left">
                    <h2 className="text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-4">PageShare</h2>
                    <p className="text-2xl lg:text-3xl font-black text-white mb-8">Join now.</p>
                  </div>

                  <Link
                    href="/signup"
                    className="w-full px-6 py-3 bg-white rounded-full text-gray-900 font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center"
                    aria-label="Sign up"
                  >
                    Sign up
                  </Link>

                  <p className="text-xs text-gray-500 text-center leading-relaxed">
                    {t('termsText')}{" "}
                    <Link href="/terms" className="text-cyan-400 hover:underline">{t('termsOfService')}</Link>
                    {" "}{t('and')}{" "}
                    <Link href="/privacy" className="text-cyan-400 hover:underline">{t('privacyPolicy')}</Link>
                    , {t('including')}{" "}
                    <Link href="#" className="text-cyan-400 hover:underline">{t('cookieUse')}</Link>.
                  </p>

                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400 mb-3 text-center">{t('alreadyHaveAccount')}</p>
                    <Link
                      href="/signin"
                      className="w-full px-6 py-3 bg-transparent border border-white/20 rounded-full text-white font-semibold hover:bg-white/10 transition-colors flex items-center justify-center"
                      aria-label={t('signIn')}
                    >
                      {t('signIn')}
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-black">
        <div className="max-w-[1800px] mx-auto px-8 lg:px-16 xl:px-20 2xl:px-24 py-4">
          <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-gray-500">
            <Link href="#" className="hover:text-white transition-colors">{t('about')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="#" className="hover:text-white transition-colors">{t('helpCenter')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="/terms" className="hover:text-white transition-colors">{t('termsOfService')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="/privacy" className="hover:text-white transition-colors">{t('privacyPolicy')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="#" className="hover:text-white transition-colors">{t('cookiePolicy')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="#" className="hover:text-white transition-colors">{t('accessibility')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="#" className="hover:text-white transition-colors">{t('disclaimer')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="#" className="hover:text-white transition-colors">{t('blog')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="#" className="hover:text-white transition-colors">{t('careers')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="#" className="hover:text-white transition-colors">{t('brandResources')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="#" className="hover:text-white transition-colors">{t('api')}</Link>
            <span className="text-gray-600">|</span>
            <Link href="#" className="hover:text-white transition-colors">{t('contact')}</Link>
          </nav>
          <div className="mt-4 text-center">
            <p className="text-gray-500 text-xs">{t('copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
