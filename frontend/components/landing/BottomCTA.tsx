'use client';

import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

const GET_STARTED_BUTTON_CLASS =
  'mt-6 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-400 text-black font-semibold hover:bg-cyan-300 transition-colors w-full sm:w-auto shadow-[0_0_20px_rgba(34,211,238,0.25)]';

export default function BottomCTA() {
  const scrollToSignup = () => {
    document.getElementById('auth')?.scrollIntoView({ behavior: 'smooth' });
    window.dispatchEvent(new Event('pageshare:open-signup'));
  };

  return (
    <section
      id="get-started"
      className="relative z-10 pt-6 pb-12 sm:pt-8 sm:pb-16 md:pt-10 md:pb-20"
      aria-labelledby="get-started-heading"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <header className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base tracking-[0.2em] uppercase text-gray-400 mb-3">
            Get started
          </p>
          <h2
            id="get-started-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight"
          >
            Everybody are joining us on<br />
            <span className="text-cyan-400">Trust and Merit</span>
          </h2>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          <div
            id="for-analysts"
            className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent p-6 sm:p-8 flex flex-col"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white">For analysts</h2>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Put your calls on the record. Build a track record investors can evaluate
              with evidence - not follower counts.
            </p>
            <div className="relative mt-6 w-full aspect-[4/3] max-h-48 sm:max-h-56">
              <Image
                src="/story/Analyst_persona.png"
                alt="Analyst persona illustration"
                fill
                className="object-contain object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <button
              type="button"
              onClick={scrollToSignup}
              className={GET_STARTED_BUTTON_CLASS}
            >
              Get Started
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          </div>

          <div
            id="for-investors"
            className="rounded-2xl border border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-transparent p-6 sm:p-8 flex flex-col"
          >
            <h2 className="text-xl sm:text-2xl font-bold text-white">For investors</h2>
            <p className="mt-3 text-sm text-gray-400 leading-relaxed">
              Compare analysts on settled history, scorecards, and diligence-style
              summaries - decision support, not hype.
            </p>
            <div className="relative mt-6 w-full aspect-[4/3] max-h-48 sm:max-h-56">
              <Image
                src="/story/Investor_persona.png"
                alt="Investor persona illustration"
                fill
                className="object-contain object-center"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <button
              type="button"
              onClick={scrollToSignup}
              className={GET_STARTED_BUTTON_CLASS}
            >
              Get Started
              <ArrowRight className="w-4 h-4" aria-hidden />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
