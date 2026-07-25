'use client';

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import PredictionSubmitUpgradeModal from '@/components/app/modals/PredictionSubmitUpgradeModal';
import ViewAnalystAnalyticsUpgradeModal from '@/components/app/modals/ViewAnalystAnalyticsUpgradeModal';
import {
  usePredictionAnalytics,
  type AnalyticsAccessState,
} from '@/hooks/predictions/usePredictionAnalytics';

interface AnalyticsAccessGateProps {
  subjectUsername?: string;
  children: (state: {
    accessState: AnalyticsAccessState;
    dashboard: ReturnType<typeof usePredictionAnalytics>['dashboard'];
    errorMessage: string | null;
    retry: () => void;
  }) => ReactNode;
}

export default function AnalyticsAccessGate({
  subjectUsername,
  children,
}: AnalyticsAccessGateProps) {
  const router = useRouter();
  const isOwnAnalytics = !subjectUsername?.trim();
  const { accessState, dashboard, errorMessage, retry } =
    usePredictionAnalytics(subjectUsername);

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    if (accessState !== 'forbidden') {
      setShowUpgradeModal(false);
      return;
    }
    setShowUpgradeModal(true);
  }, [accessState]);

  const handleCloseUpgrade = () => {
    setShowUpgradeModal(false);
    router.replace('/predictions');
  };

  if (accessState === 'forbidden') {
    return (
      <>
        {isOwnAnalytics ? (
          <PredictionSubmitUpgradeModal
            isOpen={showUpgradeModal}
            onClose={handleCloseUpgrade}
          />
        ) : (
          <ViewAnalystAnalyticsUpgradeModal
            isOpen={showUpgradeModal}
            onClose={handleCloseUpgrade}
          />
        )}
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <p className="text-sm text-gray-400">
            {isOwnAnalytics
              ? 'Analyst subscription required to view analytics.'
              : 'Investor subscription required to view analyst analytics.'}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      {children({ accessState, dashboard, errorMessage, retry })}
    </>
  );
}
