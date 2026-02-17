'use client';

import { useEffect } from 'react';

/**
 * Registers the offline service worker so the custom offline page
 * is shown when the user has no connection and the app can't load.
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      !('serviceWorker' in navigator) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return;
    }

    navigator.serviceWorker.register('/sw-offline.js').catch(() => {});
  }, []);

  return null;
}
