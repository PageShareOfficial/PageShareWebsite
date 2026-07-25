type OfflineBannerPulseListener = () => void;

const listeners = new Set<OfflineBannerPulseListener>();

/** Subscribe to offline “attempt blocked” pulses (e.g. analytics tab switch). */
export function subscribeOfflineBannerPulse(
  listener: OfflineBannerPulseListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Scroll to top and highlight the global offline banner. */
export function pulseOfflineBanner(): void {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  listeners.forEach((listener) => listener());
}
