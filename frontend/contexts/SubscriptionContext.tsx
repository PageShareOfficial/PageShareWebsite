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
import {
  clearSubscriptionPlanHint,
  writeSubscriptionPlanHint,
} from '@/utils/billing/subscriptionPlanHint';

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

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
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
      clearSubscriptionPlanHint();
      return;
    }

    if (billingStatusRef.current === null) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const status = await getBillingStatus(accessToken);
      setBillingStatus(status);
      writeSubscriptionPlanHint(
        status.is_premium ? (status.plan_id as PlanId | null) : null
      );
    } catch {
      setBillingStatus(DEFAULT_STATUS);
      writeSubscriptionPlanHint(null);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void refreshBillingStatus();
  }, [refreshBillingStatus]);

  const activePlanId = billingStatus?.is_premium
    ? billingStatus.plan_id
    : null;

  const value = useMemo(
    () => ({
      billingStatus,
      isPremium: billingStatus?.is_premium ?? false,
      activePlanId,
      isAnalystPlan: activePlanId === 'analyst',
      isInvestorPlan: activePlanId === 'investor',
      isLoading,
      error,
      refreshBillingStatus,
    }),
    [activePlanId, billingStatus, isLoading, error, refreshBillingStatus]
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
