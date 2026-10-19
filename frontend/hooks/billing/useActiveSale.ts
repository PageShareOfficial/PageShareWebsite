import { useEffect, useState } from 'react';
import {
  getSaleSnapshot,
  type ActiveSale,
  type SaleSnapshot,
  type SaleStripFace,
} from '@/lib/api/billingApi';

const EMPTY_SALE: SaleSnapshot = { phase: null, faces: [] };

let cachedSale: SaleSnapshot | null = null;
let saleRequest: Promise<SaleSnapshot> | null = null;

/** Start the public sale request before the premium overlay opens. */
export function prefetchSale(): Promise<SaleSnapshot> {
  if (cachedSale) return Promise.resolve(cachedSale);
  if (!saleRequest) {
    saleRequest = getSaleSnapshot().then((snapshot) => {
      cachedSale = snapshot;
      return snapshot;
    });
  }
  return saleRequest;
}

/** Test helper. The sale cache otherwise lives for the whole page. */
export function resetSaleCache(): void {
  cachedSale = null;
  saleRequest = null;
}

function useSaleSnapshot(): SaleSnapshot {
  const [snapshot, setSnapshot] = useState<SaleSnapshot>(
    () => cachedSale ?? EMPTY_SALE
  );

  useEffect(() => {
    let cancelled = false;
    prefetchSale().then((next) => {
      if (!cancelled) setSnapshot(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return snapshot;
}

/** The live sale phase, or null when the season is off or the request fails. */
export function useActiveSale(): ActiveSale | null {
  return useSaleSnapshot().phase;
}

/** Strip faces for the landing page and the premium overlay. */
export function useSaleStrip(): SaleStripFace[] {
  return useSaleSnapshot().faces;
}
