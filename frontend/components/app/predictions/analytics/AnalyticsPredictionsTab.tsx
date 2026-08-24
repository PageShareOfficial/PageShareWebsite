'use client';

import ErrorState from '@/components/app/common/ErrorState';
import Loading from '@/components/app/common/Loading';
import Skeleton from '@/components/app/common/Skeleton';
import AnalyticsPredictionDetailCard from '@/components/app/predictions/analytics/AnalyticsPredictionDetailCard';
import AnalyticsPredictionNumberStrip from '@/components/app/predictions/analytics/AnalyticsPredictionNumberStrip';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { useAnalyticsPredictions } from '@/hooks/predictions/useAnalyticsPredictions';

interface AnalyticsPredictionsTabProps {
  subjectUsername?: string;
  selectedIdFromUrl?: string | null;
  onSelectedIdChange?: (id: string) => void;
}

function PredictionsStripSkeleton() {
  return (
    <Skeleton variant="rectangular" width="100%" height={120} rounded="rounded-2xl" />
  );
}

export default function AnalyticsPredictionsTab({
  subjectUsername,
  selectedIdFromUrl,
  onSelectedIdChange,
}: AnalyticsPredictionsTabProps) {
  const isOnline = useOnlineStatus();
  const {
    indexItems,
    selectedId,
    setSelectedId,
    detail,
    isIndexLoading,
    isAuthenticating,
    isDetailLoading,
    indexErrorMessage,
    indexErrorOffline,
    detailErrorMessage,
    retryIndex,
    retryDetail,
  } = useAnalyticsPredictions(subjectUsername, {
    selectedIdFromUrl,
    onSelectedIdChange,
  });

  if (isAuthenticating) {
    return <Loading />;
  }

  if (isIndexLoading) {
    return (
      <div className="space-y-4" aria-busy="true" aria-label="Loading predictions">
        <PredictionsStripSkeleton />
        <Skeleton variant="rectangular" width="100%" height={280} rounded="rounded-xl" />
      </div>
    );
  }

  if (indexErrorMessage && indexItems.length === 0) {
    return (
      <ErrorState
        title={indexErrorOffline ? "You're offline" : 'Could not load predictions'}
        message={indexErrorMessage}
        onRetry={retryIndex}
        retryDisabled={!isOnline}
      />
    );
  }

  if (indexItems.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-16 text-center">
        <p className="text-sm font-medium text-white">No predictions yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-gray-400">
          Locked calls will appear here newest first, one at a time.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="overflow-visible rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:p-4">
        <AnalyticsPredictionNumberStrip
          items={indexItems}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />
      </section>

      {detailErrorMessage ? (
        <div
          className="rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-3 text-center"
          role="alert"
        >
          <p className="text-sm text-red-200">{detailErrorMessage}</p>
          <button
            type="button"
            onClick={retryDetail}
            disabled={!isOnline}
            className="mt-2 text-xs font-semibold text-white underline underline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Retry details
          </button>
        </div>
      ) : null}

      <AnalyticsPredictionDetailCard
        detail={detail}
        isLoading={isDetailLoading && detail == null}
        showSettleOnViewHint={!subjectUsername}
      />
    </div>
  );
}
