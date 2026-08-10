import Link from 'next/link';
import Image from 'next/image';
import { BarChart3, Lock, TrendingUp, Users } from 'lucide-react';

const TRUST_PILLS = [
  { icon: Lock, label: 'Locked Records' },
  { icon: TrendingUp, label: 'Earned Credibility' },
  { icon: Users, label: 'Analyst Discoverability' },
  { icon: BarChart3, label: 'Analytics Intelligence' },
] as const;

interface LandingHeroProps {
  compact?: boolean;
  showLogo?: boolean;
}

export default function LandingHero({ compact = false, showLogo = false }: LandingHeroProps) {
  return (
    <div className={compact ? 'space-y-4 text-center lg:text-left' : 'space-y-6 sm:space-y-8'}>
      {showLogo && (
        <div className={compact ? 'mb-2 flex justify-center lg:justify-start' : 'mb-4 sm:mb-6'}>
          <Link href="/" className="block">
            <Image
              src="/pageshare_final.png"
              alt="PageShare Logo"
              width={200}
              height={200}
              className={
                compact
                  ? 'w-auto h-12 sm:h-14'
                  : 'w-auto h-16 sm:h-20 md:h-24 lg:h-32'
              }
              priority
            />
          </Link>
        </div>
      )}

      <div className={`space-y-3 sm:space-y-4 ${compact ? '' : 'max-w-2xl'}`}>
        <div className="space-y-1 sm:space-y-1.5">
          <div
            className={`inline-block max-w-full rounded-lg border border-teal-500/30 px-3 py-1 ${
              compact ? 'mx-auto lg:mx-0' : ''
            }`}
          >
            <span className="text-xs sm:text-sm font-semibold leading-snug bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
              The Trust Layer for Crypto Market Intelligence
            </span>
          </div>
          <h1
          className={
            compact
              ? 'text-2xl sm:text-3xl font-black leading-tight tracking-tight'
              : 'text-4xl sm:text-5xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-[0.95] tracking-tight'
          }
        >
          <span className="block">Evidence Based Crypto Predictions</span>
          <span className="block pb-3 bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-500 bg-clip-text text-transparent">
            Proof over Hype
          </span>
        </h1>
        </div>
        <p
          className={
            compact
              ? 'text-sm text-gray-400 leading-relaxed max-w-md mx-auto lg:mx-0'
              : 'text-sm sm:text-base md:text-lg lg:text-xl text-gray-300 leading-relaxed'
          }
        >
          A crypto social media intelligence network where market noise becomes trusted intelligence - turning insight into conversation, predictions into proof, analyst expertise into verifiable track records, and investor discovery into credible signal.
        </p>
      </div>

      <div
        className={`grid grid-cols-4 gap-1.5 sm:gap-2 w-full pt-1 ${
          compact ? 'max-w-lg mx-auto lg:mx-0' : 'max-w-2xl pt-2 sm:pt-4'
        }`}
      >
        {TRUST_PILLS.map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex min-w-0 items-center justify-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-1.5 py-1.5 sm:gap-1.5 sm:px-2"
          >
            <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" aria-hidden />
            <span className="min-w-0 text-[10px] sm:text-xs text-gray-300 font-medium leading-tight">
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
