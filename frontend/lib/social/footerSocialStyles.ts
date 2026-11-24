export type FooterSocialDensity = 'default' | 'compact';

export function getFooterSocialStyles(density: FooterSocialDensity) {
  const compact = density === 'compact';
  return {
    container: compact ? 'gap-1' : 'gap-1.5 sm:gap-2',
    button: compact
      ? 'inline-flex h-6 w-6 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-white/10 hover:text-gray-300 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400/50'
      : 'inline-flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gray-500 transition-colors hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-400 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cyan-400/50',
    icon: compact ? 'h-3 w-3' : 'h-3.5 w-3.5 sm:h-4 sm:w-4',
  };
}
