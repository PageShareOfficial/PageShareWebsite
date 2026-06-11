'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const ANALYST_AVATARS = [
  { src: '/cta/avatar-1.jpg', alt: 'Analyst portrait' },
  { src: '/cta/avatar-2.jpg', alt: 'Investor portrait' },
  { src: '/cta/avatar-3.jpg', alt: 'Trader portrait' },
  { src: '/cta/avatar-4.jpg', alt: 'Analyst portrait' },
  { src: '/cta/avatar-5.jpg', alt: 'Investor portrait' },
] as const;

export default function BottomCTA() {
  const scrollToSignup = () => {
    document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' });
    window.dispatchEvent(new Event('pageshare:open-signup'));
  };

  return (
    <section className="relative z-10 py-12 sm:py-16 md:py-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-white/10 bg-[#0a0f14]">
          <div className="flex flex-col lg:flex-row">
            <div className="relative w-full lg:w-[42%] min-h-[220px] sm:min-h-[260px] lg:min-h-[320px] shrink-0">
              <Image
                src="/cta/earth.jpg"
                alt="Earth viewed from space"
                fill
                className="object-cover object-left"
                sizes="(max-width: 1024px) 100vw, 42vw"
              />
            </div>

            <div className="flex-1 px-6 sm:px-10 md:px-14 py-10 sm:py-14 md:py-16 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
              <div className="max-w-xl">
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
                  Ready to turn{' '}
                  <span className="text-cyan-400">insights into impact?</span>
                </h2>
                <p className="mt-3 text-sm sm:text-base text-gray-400">
                  Join thousands who are building the future of market intelligence.
                </p>

                <div className="mt-5 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {ANALYST_AVATARS.map((avatar) => (
                      <div
                        key={avatar.src}
                        className="relative w-8 h-8 rounded-full border-2 border-[#0a0f14] overflow-hidden"
                      >
                        <Image
                          src={avatar.src}
                          alt={avatar.alt}
                          fill
                          className="object-cover"
                          sizes="32px"
                        />
                      </div>
                    ))}
                  </div>
                  <p className="text-xs sm:text-sm text-gray-400">
                    Join the network of analysts &amp; investors
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={scrollToSignup}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-colors shadow-[0_0_30px_rgba(34,211,238,0.35)] shrink-0"
              >
                Create your account
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
