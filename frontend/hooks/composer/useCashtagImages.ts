'use client';

import { useEffect, useState } from 'react';

interface TickerBatchItem {
  ticker: string;
  data: { image?: string } | null;
}

/**
 * Fetches ticker logo URLs for a list of symbols via the batch API.
 */
export function useCashtagImages(symbols: string[]): Record<string, string> {
  const [imageByTicker, setImageByTicker] = useState<Record<string, string>>({});

  const symbolsKey = symbols.join(',');

  useEffect(() => {
    if (symbols.length === 0) {
      setImageByTicker({});
      return;
    }

    const controller = new AbortController();

    fetch(`/api/ticker/batch?symbols=${encodeURIComponent(symbolsKey)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((json: { data?: TickerBatchItem[] } | null) => {
        const nextMap: Record<string, string> = {};
        for (const item of json?.data ?? []) {
          const image = item.data?.image?.trim();
          if (item.ticker && image) {
            nextMap[item.ticker.toUpperCase()] = image;
          }
        }
        setImageByTicker(nextMap);
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setImageByTicker({});
        }
      });

    return () => controller.abort();
  }, [symbols.length, symbolsKey]);

  return imageByTicker;
}
