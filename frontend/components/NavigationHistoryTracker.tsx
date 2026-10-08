'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { recordPathnameChange, recordPopNavigation } from '@/utils/core/navigationHistory';

// Layout effects run before every passive effect in the tree, so pages that navigate back
// from their own useEffect (e.g. /plans) already see the new pathname recorded.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Feeds route changes into the in-app history tracker used by `useSafeBack`. */
export default function NavigationHistoryTracker() {
  const pathname = usePathname();

  useEffect(() => {
    window.addEventListener('popstate', recordPopNavigation);
    return () => window.removeEventListener('popstate', recordPopNavigation);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (pathname) recordPathnameChange(pathname);
  }, [pathname]);

  return null;
}
