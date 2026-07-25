'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { getBaseUrl } from '@/lib/api/client';
import {
  getMyPredictionAnalytics,
  getPredictionAnalyticsForUser,
  type PredictionAnalyticsDashboard,
} from '@/lib/api/predictionApi';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

export type AnalyticsAccessState =
  | 'loading'
  | 'ready'
  | 'forbidden'
  | 'not_found'
  | 'error';

interface UsePredictionAnalyticsResult {
  accessState: AnalyticsAccessState;
  dashboard: PredictionAnalyticsDashboard | null;
  errorMessage: string | null;
  retry: () => void;
}

export function usePredictionAnalytics(
  subjectUsername?: string
): UsePredictionAnalyticsResult {
  const { session, loading: authLoading } = useAuth();
  const {
    isAnalystPlan,
    isInvestorPlan,
    isLoading: subscriptionLoading,
  } = useSubscription();
  const accessToken = session?.access_token;
  const isOwnAnalytics = !subjectUsername?.trim();

  const [accessState, setAccessState] = useState<AnalyticsAccessState>('loading');
  const [dashboard, setDashboard] = useState<PredictionAnalyticsDashboard | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const retry = useCallback(() => {
    setFetchKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (authLoading || subscriptionLoading) {
      setAccessState('loading');
      return;
    }

    if (!accessToken || !getBaseUrl()) {
      setAccessState('forbidden');
      setDashboard(null);
      setErrorMessage(null);
      return;
    }

    if (isOwnAnalytics) {
      if (!isAnalystPlan) {
        setAccessState('forbidden');
        setDashboard(null);
        setErrorMessage(null);
        return;
      }
    } else if (!isInvestorPlan) {
      setAccessState('forbidden');
      setDashboard(null);
      setErrorMessage(null);
      return;
    }

    let cancelled = false;
    setAccessState('loading');
    setErrorMessage(null);

    const load = async () => {
      try {
        const data = isOwnAnalytics
          ? await getMyPredictionAnalytics(accessToken)
          : await getPredictionAnalyticsForUser(subjectUsername!, accessToken);
        if (cancelled) return;
        setDashboard(data);
        setAccessState('ready');
      } catch (err) {
        if (cancelled) return;
        const message = getErrorMessage(err, 'Unable to load analytics');
        const lower = message.toLowerCase();
        if (lower.includes('not found')) {
          setAccessState('not_found');
        } else if (
          lower.includes('subscription required') ||
          lower.includes('403') ||
          lower.includes('forbidden')
        ) {
          setAccessState('forbidden');
        } else {
          setAccessState('error');
          setErrorMessage(message);
        }
        setDashboard(null);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    authLoading,
    fetchKey,
    isAnalystPlan,
    isInvestorPlan,
    isOwnAnalytics,
    subjectUsername,
    subscriptionLoading,
  ]);

  return { accessState, dashboard, errorMessage, retry };
}
