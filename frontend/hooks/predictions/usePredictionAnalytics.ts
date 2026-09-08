'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { getBaseUrl } from '@/lib/api/client';
import {
  getMyPredictionAnalytics,
  getPredictionAnalyticsForUser,
  type PredictionAnalyticsDashboard,
} from '@/lib/api/predictionApi';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
import {
  isNetworkError,
  OFFLINE_USER_MESSAGE,
  resolveFetchErrorMessage,
} from '@/utils/error/isNetworkError';

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
  isOfflineError: boolean;
  isShowingStaleDashboard: boolean;
  isAuthenticating: boolean;
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
  const isOnline = useOnlineStatus();
  const accessToken = session?.access_token;
  const isOwnAnalytics = !subjectUsername?.trim();

  const [accessState, setAccessState] = useState<AnalyticsAccessState>('loading');
  const [dashboard, setDashboard] = useState<PredictionAnalyticsDashboard | null>(
    null
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOfflineError, setIsOfflineError] = useState(false);
  const [isShowingStaleDashboard, setIsShowingStaleDashboard] = useState(false);
  const [fetchKey, setFetchKey] = useState(0);

  const retry = useCallback(() => {
    if (!isOnline) {
      return;
    }
    setFetchKey((key) => key + 1);
  }, [isOnline]);

  const wasOfflineRef = useRef(false);
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (!wasOfflineRef.current) {
      return;
    }
    wasOfflineRef.current = false;
    if (accessState === 'error' || isOfflineError) {
      retry();
    }
  }, [accessState, isOfflineError, isOnline, retry]);

  useEffect(() => {
    if (authLoading || subscriptionLoading) {
      setAccessState('loading');
      return;
    }

    if (!accessToken || !getBaseUrl()) {
      setAccessState('forbidden');
      setDashboard(null);
      setErrorMessage(null);
      setIsOfflineError(false);
      setIsShowingStaleDashboard(false);
      return;
    }

    if (isOwnAnalytics) {
      if (!isAnalystPlan) {
        setAccessState('forbidden');
        setDashboard(null);
        setErrorMessage(null);
        setIsOfflineError(false);
        setIsShowingStaleDashboard(false);
        return;
      }
    } else if (!isInvestorPlan) {
      setAccessState('forbidden');
      setDashboard(null);
      setErrorMessage(null);
      setIsOfflineError(false);
      setIsShowingStaleDashboard(false);
      return;
    }

    if (!isOnline) {
      setDashboard((previous) => {
        if (previous) {
          setAccessState('ready');
          setIsShowingStaleDashboard(true);
          setErrorMessage(null);
          setIsOfflineError(true);
        } else {
          setAccessState('error');
          setErrorMessage(OFFLINE_USER_MESSAGE);
          setIsOfflineError(true);
          setIsShowingStaleDashboard(false);
        }
        return previous;
      });
      return;
    }

    let cancelled = false;
    setAccessState('loading');
    setErrorMessage(null);
    setIsOfflineError(false);
    setIsShowingStaleDashboard(false);

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
          setDashboard(null);
          setIsOfflineError(false);
          setIsShowingStaleDashboard(false);
          return;
        }
        if (
          lower.includes('subscription required') ||
          lower.includes('403') ||
          lower.includes('forbidden')
        ) {
          setAccessState('forbidden');
          setDashboard(null);
          setIsOfflineError(false);
          setIsShowingStaleDashboard(false);
          return;
        }

        const { message: resolved, isOffline } = resolveFetchErrorMessage(
          err,
          message,
          isOnline
        );

        setDashboard((previous) => {
          if (previous && isNetworkError(err)) {
            setAccessState('ready');
            setIsShowingStaleDashboard(true);
            setErrorMessage(null);
            setIsOfflineError(true);
            return previous;
          }
          setAccessState('error');
          setErrorMessage(resolved);
          setIsOfflineError(isOffline);
          setIsShowingStaleDashboard(false);
          return null;
        });
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
    isOnline,
    isOwnAnalytics,
    subjectUsername,
    subscriptionLoading,
  ]);

  const isAuthenticating = authLoading;

  return {
    accessState,
    dashboard,
    errorMessage,
    isOfflineError,
    isShowingStaleDashboard,
    isAuthenticating,
    retry,
  };
}
