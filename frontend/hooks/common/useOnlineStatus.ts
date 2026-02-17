import { useState, useEffect } from 'react';

/**
 * Tracks browser online/offline state.
 * Uses navigator.onLine and listens to 'online' / 'offline' events.
 * Initial state is always true so server and client match (avoids hydration error).
 * Real value is set in useEffect after mount.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
