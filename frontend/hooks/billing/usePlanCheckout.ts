'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import {
  createCheckoutSession,
  createPortalSession,
} from '@/lib/api/billingApi';
import type { BillingInterval, PlanId } from '@/types/billing';
import { buildCheckoutReturnUrls } from '@/utils/billing/checkoutReturnUrls';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface UsePlanCheckoutResult {
  checkoutError: string | null;
  checkingOutPlanId: PlanId | null;
  clearCheckoutError: () => void;
  handleSelectPlan: (planId: PlanId, interval: BillingInterval) => Promise<void>;
}

export function usePlanCheckout(): UsePlanCheckoutResult {
  const router = useRouter();
  const { session } = useAuth();
  const { billingStatus } = useSubscription();
  const isOnline = useOnlineStatus();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<PlanId | null>(null);

  const clearCheckoutError = useCallback(() => {
    setCheckoutError(null);
  }, []);

  const redirectToStripe = useCallback((url: string) => {
    window.location.assign(url);
  }, []);

  const handleSelectPlan = useCallback(
    async (planId: PlanId, interval: BillingInterval) => {
      setCheckoutError(null);

      if (!isOnline) {
        setCheckoutError('You are offline. Connect to the internet to subscribe.');
        return;
      }

      const accessToken = session?.access_token;
      if (!accessToken) {
        setCheckoutError('Sign in to subscribe to a premium plan.');
        router.push('/');
        return;
      }

      setCheckingOutPlanId(planId);

      try {
        const hasActivePlan =
          billingStatus?.is_premium && billingStatus.plan_id === planId;

        if (hasActivePlan) {
          const { url } = await createPortalSession(accessToken);
          window.open(url, '_blank', 'noopener,noreferrer');
          setCheckingOutPlanId(null);
          return;
        }

        const { success_url, cancel_url } = buildCheckoutReturnUrls();
        const { url } = await createCheckoutSession(accessToken, {
          plan_id: planId,
          interval,
          success_url,
          cancel_url,
        });

        redirectToStripe(url);
      } catch (error) {
        setCheckingOutPlanId(null);
        setCheckoutError(
          getErrorMessage(error, 'Could not start checkout. Please try again.')
        );
      }
    },
    [
      billingStatus?.is_premium,
      billingStatus?.plan_id,
      isOnline,
      redirectToStripe,
      router,
      session?.access_token,
    ]
  );

  return {
    checkoutError,
    checkingOutPlanId,
    clearCheckoutError,
    handleSelectPlan,
  };
}
