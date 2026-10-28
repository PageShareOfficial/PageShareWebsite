'use client';

import { useEffect, useState } from 'react';
import { buildExpiryWindowFromStart } from '@/utils/predictions/predictionRules';
import { parseDatetimeLocal, toDatetimeLocalValue } from '@/utils/predictions/datetimeLocal';
import { clampDatetimeToWindow } from '@/utils/predictions/clampDatetimeToWindow';

/**
 * Expiry datetime value and min/max bounds tied to an active price lock.
 */
export function useExpiryWindowBounds(
  lockStartMs: number | null,
  lockExpired: boolean
) {
  const [expiryValue, setExpiryValue] = useState('');
  const [expiryMinMax, setExpiryMinMax] = useState<{ min: string; max: string }>({
    min: '',
    max: '',
  });

  useEffect(() => {
    if (!lockStartMs || lockExpired) return;
    const syncBounds = () => {
      const { min, max } = buildExpiryWindowFromStart(Date.now());
      setExpiryMinMax({
        min: toDatetimeLocalValue(min),
        max: toDatetimeLocalValue(max),
      });
    };
    syncBounds();
    const id = window.setInterval(syncBounds, 30_000);
    return () => window.clearInterval(id);
  }, [lockStartMs, lockExpired]);

  const syncExpiryBoundsOnly = (submitMs: number) => {
    const { min, max } = buildExpiryWindowFromStart(submitMs);
    setExpiryMinMax({
      min: toDatetimeLocalValue(min),
      max: toDatetimeLocalValue(max),
    });
  };

  const refreshExpiryPickerBounds = (submitMs: number, currentExpiry?: string) => {
    const { min, max, defaultExpiry } = buildExpiryWindowFromStart(submitMs);
    setExpiryMinMax({
      min: toDatetimeLocalValue(min),
      max: toDatetimeLocalValue(max),
    });
    const parsed = currentExpiry ? parseDatetimeLocal(currentExpiry) : null;
    const clamped = clampDatetimeToWindow(parsed, min, max);
    setExpiryValue(toDatetimeLocalValue(clamped ?? defaultExpiry));
  };

  return {
    expiryValue,
    setExpiryValue,
    expiryMinMax,
    syncExpiryBoundsOnly,
    refreshExpiryPickerBounds,
  };
}
