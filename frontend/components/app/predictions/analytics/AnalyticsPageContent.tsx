'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/app/layout/MobileHeader';
import DesktopHeader from '@/components/app/layout/DesktopHeader';
import ErrorState from '@/components/app/common/ErrorState';
import AnalyticsAccessGate from '@/components/app/predictions/analytics/AnalyticsAccessGate';
import AnalyticsDashboardTab from '@/components/app/predictions/analytics/AnalyticsDashboardTab';
import AnalyticsDashboardSkeleton, {
  AnalyticsPredictionsTabSkeleton,
} from '@/components/app/predictions/analytics/AnalyticsDashboardSkeleton';
import AnalyticsPredictionsTab from '@/components/app/predictions/analytics/AnalyticsPredictionsTab';
import AnalyticsTabBar, {
  type AnalyticsTabId,
} from '@/components/app/predictions/analytics/AnalyticsTabBar';
import type { PredictionAnalyticsDashboard } from '@/lib/api/predictionApi';

interface AnalyticsPageContentProps {
  subjectUsername?: string;
}

function AnalyticsPageBody({
  subjectUsername,
  dashboard,
  isLoading,
  isNotFound,
  errorMessage,
  onRetry,
}: {
  subjectUsername?: string;
  dashboard: PredictionAnalyticsDashboard | null;
  isLoading: boolean;
  isNotFound: boolean;
  errorMessage: string | null;
  onRetry: () => void;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AnalyticsTabId>('dashboard');
  const isOwnAnalytics = !subjectUsername?.trim();
  const displayUsername =
    dashboard?.subject.username ?? subjectUsername?.trim() ?? '';
  const headerTitle = isOwnAnalytics ? 'Analytics' : `@${displayUsername}`;
  const subtitle = isOwnAnalytics
    ? 'Your prediction performance scorecard.'
    : `Prediction performance for @${displayUsername}.`;

  const goToPredictions = () => {
    router.push('/predictions');
  };

  const showDashboardSkeleton = isLoading || dashboard == null;

  return (
    <>
      <MobileHeader title={headerTitle} onBack={goToPredictions} />
      <DesktopHeader
        title={headerTitle}
        subtitle={subtitle}
        onBack={goToPredictions}
        withSideBorders={false}
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 pb-10 sm:px-6 lg:px-8">
        {isNotFound ? (
          <ErrorState
            title="Analyst not found"
            message="This profile does not have analyst analytics available."
            onRetry={goToPredictions}
          />
        ) : errorMessage ? (
          <ErrorState
            title="Could not load analytics"
            message={errorMessage}
            onRetry={onRetry}
          />
        ) : (
          <>
            <AnalyticsTabBar
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {activeTab === 'dashboard' ? (
              showDashboardSkeleton ? (
                <AnalyticsDashboardSkeleton />
              ) : (
                <AnalyticsDashboardTab
                  dashboard={dashboard!}
                  isOwnAnalytics={isOwnAnalytics}
                  onOpenPredictionsTab={() => setActiveTab('predictions')}
                />
              )
            ) : showDashboardSkeleton ? (
              <AnalyticsPredictionsTabSkeleton />
            ) : (
              <AnalyticsPredictionsTab />
            )}
          </>
        )}
      </main>
    </>
  );
}

export default function AnalyticsPageContent({
  subjectUsername,
}: AnalyticsPageContentProps) {
  return (
    <AnalyticsAccessGate subjectUsername={subjectUsername}>
      {({ accessState, dashboard, errorMessage, retry }) => (
        <AnalyticsPageBody
          subjectUsername={subjectUsername}
          dashboard={dashboard}
          isLoading={accessState === 'loading'}
          isNotFound={accessState === 'not_found'}
          errorMessage={accessState === 'error' ? errorMessage : null}
          onRetry={retry}
        />
      )}
    </AnalyticsAccessGate>
  );
}
