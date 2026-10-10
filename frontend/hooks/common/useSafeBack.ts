'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants/routes';
import { canGoBackInApp } from '@/utils/core/navigationHistory';

/**
 * Returns a back handler that stays inside PageShare.
 * Goes back when there is an earlier in-app page; otherwise (shared link, new tab)
 * replaces the current entry with `fallbackPath` so the user never leaves the site.
 */
export function useSafeBack(fallbackPath: string = ROUTES.home): () => void {
  const router = useRouter();

  return useCallback(() => {
    if (canGoBackInApp()) {
      router.back();
      return;
    }
    router.replace(fallbackPath);
  }, [router, fallbackPath]);
}
