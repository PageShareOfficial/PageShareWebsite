'use client';

import Image from 'next/image';

const FEATURES = [
  {
    title: 'Make Predictions',
    description:
      'Share your market outlook with clarity. Track results. Build credibility.',
    visual: 'predictions',
  },
  {
    title: 'Discover Real Signals',
    description:
      'Follow top analysts. Uncover early narratives before the crowd.',
    visual: 'signals',
  },
  {
    title: 'Track & Analyze',
    description:
      'Advanced analytics to measure performance, accuracy, and conviction.',
    visual: 'analytics',
  },
  {
    title: 'AI That Gives You Edge',
    description:
      'Powerful models and tools to research, forecast, and stay ahead.',
    visual: 'ai',
  },
] as const;

const FEATURE_IMAGES: Record<
  (typeof FEATURES)[number]['visual'],
  { src: string; alt: string }
> = {
  predictions: {
    src: '/cta/image-01.png',
    alt: 'Layered prediction charts visualization',
  },
  signals: {
    src: '/cta/image-02.png',
    alt: 'Top analyst accuracy leaderboard',
  },
  analytics: {
    src: '/cta/image-03.png',
    alt: 'Analytics bar chart visualization',
  },
  ai: {
    src: '/cta/image-04.png',
    alt: 'AI intelligence cube visualization',
  },
};

function FeatureImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-24 sm:h-28 md:h-32 w-full flex items-center justify-center">
      <Image
        src={src}
        alt={alt}
        width={720}
        height={380}
        className="h-full w-auto max-w-full object-contain"
      />
    </div>
  );
}

function FeatureVisual({ type }: { type: (typeof FEATURES)[number]['visual'] }) {
  return <FeatureImage {...FEATURE_IMAGES[type]} />;
}

export default function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 py-20 sm:py-24 md:py-28 border-t border-white/10">
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12">
        <p className="text-center text-sm sm:text-base tracking-[0.2em] uppercase text-gray-400 mb-12 sm:mb-16">
          Built for those who see beyond the{' '}
          <span className="text-cyan-400">noise</span>
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="flex items-center gap-4 sm:gap-5 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-5 sm:p-6 hover:border-cyan-500/20 transition-colors"
            >
              <div className="shrink-0 w-[38%] sm:w-[42%] max-w-[160px] sm:max-w-[180px]">
                <FeatureVisual type={feature.visual} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base sm:text-lg font-semibold text-white mb-1.5 sm:mb-2">
                  {feature.title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
