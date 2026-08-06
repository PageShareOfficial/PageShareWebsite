'use client';

import { Bookmark, UserPlus } from 'lucide-react';
import SavedAnalystsCarousel from '@/components/app/predictions/saved-analysts/SavedAnalystsCarousel';
import ShowAllButton from '@/components/app/common/ShowAllButton';
import LoadingState from '@/components/app/common/LoadingState';
import ErrorState from '@/components/app/common/ErrorState';
import { useSavedAnalysts } from '@/hooks/predictions/useSavedAnalysts';

interface SavedAnalystsSectionProps {
  /** True while predictions view is waiting on subscription (parent gates auth). */
  isEntitlementResolving?: boolean;
}

export default function SavedAnalystsSection({
  isEntitlementResolving = false,
}: SavedAnalystsSectionProps) {
  const { savedAnalysts, isLoading, loadError, refreshSavedAnalysts } =
    useSavedAnalysts();
  const isPendingList = isEntitlementResolving || isLoading;

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Bookmark className="h-5 w-5 text-emerald-400/90" aria-hidden />
        My Analysts
      </h2>

      {isPendingList ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03]">
          <LoadingState text="Loading saved analysts…" size="sm" />
        </div>
      ) : loadError ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03]">
          <ErrorState
            message={loadError}
            onRetry={() => void refreshSavedAnalysts()}
          />
        </div>
      ) : savedAnalysts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
          <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
            <span className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
              <UserPlus className="h-10 w-10 text-emerald-400/90" aria-hidden />
            </span>
            <p className="text-sm font-medium text-gray-300">Add Your Analysts</p>
          </div>
        </div>
      ) : (
        <SavedAnalystsCarousel analysts={savedAnalysts} />
      )}
      {!isPendingList && <ShowAllButton href="/myanalysts" />}
    </section>
  );
}
