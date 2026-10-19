import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSaleEligibility } from '@/lib/api/saleEligibility';

const eligibilityByToken = new Map<string, boolean>();
const eligibilityRequests = new Map<string, Promise<boolean>>();

function loadSaleEligibility(accessToken: string): Promise<boolean> {
  const cached = eligibilityByToken.get(accessToken);
  if (cached !== undefined) return Promise.resolve(cached);
  const existing = eligibilityRequests.get(accessToken);
  if (existing) return existing;
  const request = getSaleEligibility(accessToken).then((eligible) => {
    eligibilityByToken.set(accessToken, eligible);
    eligibilityRequests.delete(accessToken);
    return eligible;
  });
  eligibilityRequests.set(accessToken, request);
  return request;
}

/** Test helper. Eligibility otherwise stays cached for the signed-in session. */
export function resetSaleEligibilityCache(): void {
  eligibilityByToken.clear();
  eligibilityRequests.clear();
}

/**
 * Null while unknown. False when this account cannot take a sale code.
 * The check starts as soon as a token exists, so opening Premium does not wait.
 */
export function useSaleRedeemable(active: boolean): boolean | null {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const [eligible, setEligible] = useState<boolean | null>(() => {
    if (!accessToken) return null;
    return eligibilityByToken.get(accessToken) ?? null;
  });

  useEffect(() => {
    if (!accessToken) {
      setEligible(null);
      return undefined;
    }
    let cancelled = false;
    loadSaleEligibility(accessToken).then((value) => {
      if (!cancelled) setEligible(value);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  if (!active) return null;
  return eligible;
}
