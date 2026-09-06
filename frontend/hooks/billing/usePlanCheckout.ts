'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import {
  createCheckoutSession,
  createPortalSession,
  switchSubscriptionPlan,
} from '@/lib/api/billingApi';
import type { BillingInterval, PlanId } from '@/types/billing';
import { buildCheckoutReturnUrls } from '@/utils/billing/checkoutReturnUrls';
import { CROSS_PLAN_SWITCH_MESSAGE } from '@/utils/billing/resolvePlanCardUiState';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface UsePlanCheckoutResult {
  checkoutError: string | null;
  checkingOutPlanId: PlanId | null;
  clearCheckoutError: () => void;
  handleSelectPlan: (planId: PlanId, interval: BillingInterval) => Promise<void>;
}

function isExactActivePlan(
  isPremium: boolean,
  currentPlanId: PlanId | null | undefined,
  currentInterval: BillingInterval | null | undefined,
  planId: PlanId,
  interval: BillingInterval
): boolean {
  return (
    isPremium && currentPlanId === planId && currentInterval === interval
  );
}

function isCrossPlanSwitch(
  isPremium: boolean,
  currentPlanId: PlanId | null | undefined,
  targetPlanId: PlanId
): boolean {
  return isPremium && currentPlanId != null && currentPlanId !== targetPlanId;
}

async function openBillingPortal(accessToken: string): Promise<void> {
  const { url } = await createPortalSession(accessToken);
  window.open(url, '_blank', 'noopener,noreferrer');
}

async function switchIntervalAndReturn(
  accessToken: string,
  planId: PlanId,
  interval: BillingInterval,
  redirectTo: (url: string) => void
): Promise<void> {
  await switchSubscriptionPlan(accessToken, {
    plan_id: planId,
    interval,
  });
  const { success_url } = buildCheckoutReturnUrls();
  redirectTo(success_url);
}

async function startNewCheckout(
  accessToken: string,
  planId: PlanId,
  interval: BillingInterval,
  redirectTo: (url: string) => void
): Promise<void> {
  const { success_url, cancel_url } = buildCheckoutReturnUrls();
  const { url } = await createCheckoutSession(accessToken, {
    plan_id: planId,
    interval,
    success_url,
    cancel_url,
  });
  redirectTo(url);
}

export function usePlanCheckout(): UsePlanCheckoutResult {
  const router = useRouter();
  const { session } = useAuth();
  const { billingStatus } = useSubscription();
  const isOnline = useOnlineStatus();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [checkingOutPlanId, setCheckingOutPlanId] = useState<PlanId | null>(null);
  const checkoutInFlightRef = useRef(false);

  const clearCheckoutError = useCallback(() => {
    setCheckoutError(null);
  }, []);

  const redirectToStripe = useCallback((url: string) => {
    window.location.assign(url);
  }, []);

  const handleSelectPlan = useCallback(
    async (planId: PlanId, interval: BillingInterval) => {
      if (checkoutInFlightRef.current) {
        return;
      }

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

      checkoutInFlightRef.current = true;
      setCheckingOutPlanId(planId);

      try {
        const isPremium = billingStatus?.is_premium === true;

        if (
          isExactActivePlan(
            isPremium,
            billingStatus?.plan_id,
            billingStatus?.interval,
            planId,
            interval
          )
        ) {
          await openBillingPortal(accessToken);
          return;
        }

        if (isCrossPlanSwitch(isPremium, billingStatus?.plan_id, planId)) {
          setCheckoutError(CROSS_PLAN_SWITCH_MESSAGE);
          return;
        }

        if (isPremium) {
          await switchIntervalAndReturn(
            accessToken,
            planId,
            interval,
            redirectToStripe
          );
          return;
        }

        await startNewCheckout(accessToken, planId, interval, redirectToStripe);
      } catch (error) {
        setCheckoutError(
          getErrorMessage(error, 'Could not start checkout. Please try again.')
        );
      } finally {
        checkoutInFlightRef.current = false;
        setCheckingOutPlanId(null);
      }
    },
    [
      billingStatus?.is_premium,
      billingStatus?.plan_id,
      billingStatus?.interval,
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
