'use client';

import { useEffect, useState } from 'react';

/**
 * Countdown seconds remaining until lockEndsMs; marks expired at zero.
 */
export function usePriceLockCountdown(lockEndsMs: number | null) {
  const [lockRemainingSec, setLockRemainingSec] = useState(0);
  const [lockExpired, setLockExpired] = useState(false);

  useEffect(() => {
    if (!lockEndsMs) {
      setLockRemainingSec(0);
      return;
    }
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((lockEndsMs - now) / 1000));
      setLockRemainingSec(left);
      if (now >= lockEndsMs) {
        setLockExpired(true);
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [lockEndsMs]);

  return {
    lockRemainingSec,
    lockExpired,
    setLockExpired,
    setLockRemainingSec,
  };
}
