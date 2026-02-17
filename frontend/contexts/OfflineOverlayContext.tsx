'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';

interface OfflineOverlayContextValue {
  showOfflineOverlay: boolean;
  setShowOfflineOverlay: (show: boolean) => void;
}

const OfflineOverlayContext = createContext<OfflineOverlayContextValue>({
  showOfflineOverlay: false,
  setShowOfflineOverlay: () => {},
});

export function useOfflineOverlay() {
  return useContext(OfflineOverlayContext);
}

/**
 * Provides offline overlay state and intercepts in-app link clicks when offline.
 * When user clicks a link while offline, shows the overlay instead of navigating.
 * Overlay auto-hides when user is back online.
 */
export function OfflineOverlayProvider({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  const [showOfflineOverlay, setShowOfflineOverlay] = useState(false);

  const setShow = useCallback((show: boolean) => {
    setShowOfflineOverlay(show);
  }, []);

  useEffect(() => {
    if (isOnline) setShowOfflineOverlay(false);
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) return;

    const handleNavigationAttempt = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!link?.href || link.target === '_blank') return;

      try {
        const url = new URL(link.href);
        const isSameOrigin = url.origin === window.location.origin;
        const isInternalNav = url.pathname !== window.location.pathname;
        if (isSameOrigin && isInternalNav) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          setShowOfflineOverlay(true);
        }
      } catch {
        // ignore
      }
    };

    // Intercept pointerdown so we run before React/Next.js and before click fires.
    // This prevents client-side navigation and avoids the browser offline page.
    document.addEventListener('pointerdown', handleNavigationAttempt, true);
    document.addEventListener('click', handleNavigationAttempt, true);
    return () => {
      document.removeEventListener('pointerdown', handleNavigationAttempt, true);
      document.removeEventListener('click', handleNavigationAttempt, true);
    };
  }, [isOnline]);

  return (
    <OfflineOverlayContext.Provider value={{ showOfflineOverlay, setShowOfflineOverlay: setShow }}>
      {children}
    </OfflineOverlayContext.Provider>
  );
}
