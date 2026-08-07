'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getBillingStatus, type BillingStatus } from '@/lib/api/billingApi';
import { getBaseUrl } from '@/lib/api/client';
import type { PlanId } from '@/types/billing';
import { parseSubscriptionPlanId } from '@/utils/user/mapApiAuthor';

interface SubscriptionContextValue {
  billingStatus: BillingStatus | null;
  isPremium: boolean;
  activePlanId: PlanId | null;
  isAnalystPlan: boolean;
  isInvestorPlan: boolean;
  isLoading: boolean;
  error: string | null;
  refreshBillingStatus: () => Promise<void>;
}

const DEFAULT_STATUS: BillingStatus = {
  is_premium: false,
  plan_id: null,
  status: 'none',
  interval: null,
  current_period_end: null,
  cancel_at_period_end: false,
  past_due_grace_ends_at: null,
  credit_balance: 0,
  currency: null,
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

function resolveEntitlementFlags(
  billingStatus: BillingStatus | null,
  isLoading: boolean,
  bootstrapPlanId: PlanId | null
): {
  activePlanId: PlanId | null;
  isPremium: boolean;
  isResolving: boolean;
} {
  if (billingStatus !== null) {
    const activePlanId = billingStatus.is_premium
      ? parseSubscriptionPlanId(billingStatus.plan_id) ?? null
      : null;
    return {
      activePlanId,
      isPremium: billingStatus.is_premium,
      isResolving: false,
    };
  }

  if (bootstrapPlanId) {
    return {
      activePlanId: bootstrapPlanId,
      isPremium: true,
      isResolving: true,
    };
  }

  return {
    activePlanId: null,
    isPremium: false,
    isResolving: isLoading,
  };
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session, backendUser, loading: authLoading } = useAuth();
  const [billingStatus, setBillingStatus] = useState<BillingStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const billingStatusRef = useRef(billingStatus);
  billingStatusRef.current = billingStatus;

  const refreshBillingStatus = useCallback(async () => {
    const accessToken = session?.access_token;
    if (!accessToken || !getBaseUrl()) {
      setBillingStatus(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (billingStatusRef.current === null) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const status = await getBillingStatus(accessToken);
      setBillingStatus(status);
    } catch {
      setBillingStatus(DEFAULT_STATUS);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void refreshBillingStatus();
  }, [refreshBillingStatus]);

  const bootstrapPlanId =
    parseSubscriptionPlanId(backendUser?.subscription_plan_id) ?? null;

  const { activePlanId, isPremium, isResolving } = resolveEntitlementFlags(
    billingStatus,
    isLoading,
    bootstrapPlanId
  );

  const canFetchBilling = Boolean(session?.access_token && getBaseUrl());
  const isBillingUnsettled = canFetchBilling && billingStatus === null;

  // Auth `loading` stays true until /users/me finishes on app routes (success or failure).
  // Do not treat backendUser === null alone as pending (fetch errors and `/` skip profile).
  // Do wait for the first billing response when logged in so we do not flash the upgrade card.
  const isEntitlementResolved =
    !isResolving && !authLoading && !isBillingUnsettled;

  const value = useMemo(
    () => ({
      billingStatus,
      isPremium,
      activePlanId,
      isAnalystPlan: activePlanId === 'analyst',
      isInvestorPlan: activePlanId === 'investor',
      isLoading: !isEntitlementResolved,
      error,
      refreshBillingStatus,
    }),
    [
      activePlanId,
      billingStatus,
      error,
      isEntitlementResolved,
      isPremium,
      refreshBillingStatus,
    ]
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}
