'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import MobileHeader from '@/components/app/layout/MobileHeader';
import DesktopHeader from '@/components/app/layout/DesktopHeader';
import ErrorState from '@/components/app/common/ErrorState';
import Loading from '@/components/app/common/Loading';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import AnalyticsAccessGate from '@/components/app/predictions/analytics/AnalyticsAccessGate';
import AnalyticsDashboardTab from '@/components/app/predictions/analytics/AnalyticsDashboardTab';
import AnalyticsDashboardSkeleton from '@/components/app/predictions/analytics/AnalyticsDashboardSkeleton';
import AnalyticsPredictionsTab from '@/components/app/predictions/analytics/AnalyticsPredictionsTab';
import AnalyticsTabBar, {
  type AnalyticsTabId,
} from '@/components/app/predictions/analytics/AnalyticsTabBar';
import {
  ANALYTICS_CALL_QUERY,
  getAnalyticsPath,
  parseAnalyticsTabParam,
} from '@/utils/predictions/analyticsRoutes';
import { pulseOfflineBanner } from '@/utils/offline/pulseOfflineBanner';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';
import type { AnalyticsAccessState } from '@/hooks/predictions/usePredictionAnalytics';

interface AnalyticsPageContentProps {
  subjectUsername?: string;
}

function AnalyticsStaleDashboardBanner() {
  return (
    <p className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100/95" role="status">
      Offline — showing the last loaded dashboard. Reconnect to refresh.
    </p>
  );
}

function AnalyticsPageBody({
  subjectUsername,
  accessState,
  dashboard,
  dashboardErrorMessage,
  dashboardErrorOffline,
  isShowingStaleDashboard,
  isAuthenticating,
  onRetryDashboard,
}: {
  subjectUsername?: string;
  accessState: AnalyticsAccessState;
  dashboard: PredictionAnalyticsDashboard | null;
  dashboardErrorMessage: string | null;
  dashboardErrorOffline: boolean;
  isShowingStaleDashboard: boolean;
  isAuthenticating: boolean;
  onRetryDashboard: () => void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnline = useOnlineStatus();
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>(() =>
    parseAnalyticsTabParam(searchParams.get('tab'))
  );
  const callIdFromUrl = searchParams.get(ANALYTICS_CALL_QUERY);
  const isOwnAnalytics = !subjectUsername?.trim();
  const displayUsername =
    dashboard?.subject.username ?? subjectUsername?.trim() ?? '';
  const subjectDisplayName =
    dashboard?.subject.display_name?.trim() ||
    dashboard?.subject.username ||
    subjectUsername?.trim() ||
    '';
  const mobileHeaderTitle = isOwnAnalytics
    ? 'Analytics'
    : `${subjectDisplayName}'s Analytics`;
  const desktopHeaderTitle = isOwnAnalytics
    ? 'Analytics'
    : `${subjectDisplayName}'s Analytics`;
  const subtitle = isOwnAnalytics
    ? 'Your prediction performance scorecard.'
    : `Prediction performance for @${displayUsername}.`;

  const handleTabChange = (tab: AnalyticsTabId) => {
    if (!isOnline && tab !== activeTab) {
      pulseOfflineBanner();
      return;
    }
    setActiveTab(tab);
    const callId = tab === 'predictions' ? callIdFromUrl : null;
    router.replace(
      getAnalyticsPath(subjectUsername, { tab, callId }),
      { scroll: false }
    );
  };

  const handlePredictionSelect = (id: string) => {
    if (!isOnline) {
      pulseOfflineBanner();
      return;
    }
    router.replace(
      getAnalyticsPath(subjectUsername, {
        tab: 'predictions',
        callId: id,
      }),
      { scroll: false }
    );
  };

  useEffect(() => {
    setActiveTab(parseAnalyticsTabParam(searchParams.get('tab')));
  }, [searchParams]);

  const goToPredictions = () => {
    router.push('/predictions');
  };

  const isDashboardLoading =
    accessState === 'loading' && dashboard == null;
  const dashboardTabError =
    accessState === 'error' && dashboard == null ? dashboardErrorMessage : null;

  if (isAuthenticating) {
    return (
      <>
        <MobileHeader title={mobileHeaderTitle} onBack={goToPredictions} />
        <DesktopHeader
          title={desktopHeaderTitle}
          subtitle={subtitle}
          onBack={goToPredictions}
          withSideBorders={false}
        />

        <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-10 sm:px-6 lg:px-8">
          <Loading text="Authenticating..." />
        </main>
      </>
    );
  }

  return (
    <>
      <MobileHeader title={mobileHeaderTitle} onBack={goToPredictions} />
      <DesktopHeader
        title={desktopHeaderTitle}
        subtitle={subtitle}
        onBack={goToPredictions}
        withSideBorders={false}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-10 sm:px-6 lg:px-8">
        <AnalyticsTabBar activeTab={activeTab} onTabChange={handleTabChange} />
        <div className={activeTab === 'dashboard' ? undefined : 'hidden'}>
          {isShowingStaleDashboard ? <AnalyticsStaleDashboardBanner /> : null}
          {isDashboardLoading ? (
            <AnalyticsDashboardSkeleton isOwnAnalytics={isOwnAnalytics} />
          ) : dashboardTabError ? (
            <ErrorState
              title={
                dashboardErrorOffline ? "You're offline" : 'Could not load analytics'
              }
              message={dashboardTabError}
              onRetry={onRetryDashboard}
              retryDisabled={!isOnline}
            />
          ) : dashboard ? (
            <AnalyticsDashboardTab
              dashboard={dashboard}
              isOwnAnalytics={isOwnAnalytics}
            />
          ) : null}
        </div>

        <div
          className={activeTab === 'predictions' ? undefined : 'hidden'}
          aria-hidden={activeTab !== 'predictions'}
        >
          <AnalyticsPredictionsTab
            subjectUsername={subjectUsername}
            selectedIdFromUrl={callIdFromUrl}
            onSelectedIdChange={handlePredictionSelect}
          />
        </div>
      </main>
    </>
  );
}

export default function AnalyticsPageContent({
  subjectUsername,
}: AnalyticsPageContentProps) {
  return (
    <AnalyticsAccessGate subjectUsername={subjectUsername}>
      {({
        accessState,
        dashboard,
        errorMessage,
        isOfflineError,
        isShowingStaleDashboard,
        isAuthenticating,
        retry,
      }) => (
        <AnalyticsPageBody
          subjectUsername={subjectUsername}
          accessState={accessState}
          dashboard={dashboard}
          dashboardErrorMessage={
            accessState === 'not_found'
              ? null
              : accessState === 'error'
                ? errorMessage
                : null
          }
          dashboardErrorOffline={isOfflineError}
          isShowingStaleDashboard={isShowingStaleDashboard}
          isAuthenticating={isAuthenticating}
          onRetryDashboard={retry}
        />
      )}
    </AnalyticsAccessGate>
  );
}
