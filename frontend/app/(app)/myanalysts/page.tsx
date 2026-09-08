'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { UserPlus } from 'lucide-react';
import Topbar from '@/components/app/layout/Topbar';
import MobileHeader from '@/components/app/layout/MobileHeader';
import DesktopHeader from '@/components/app/layout/DesktopHeader';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import AuthorBadges from '@/components/app/common/AuthorBadges';
import ErrorState from '@/components/app/common/ErrorState';
import SaveAnalystButton from '@/components/app/predictions/SaveAnalystButton';
import SeeAnalystAnalyticsButton from '@/components/app/predictions/SeeAnalystAnalyticsButton';
import { useSavedAnalysts } from '@/hooks/predictions/useSavedAnalysts';
import { navigateToProfile } from '@/utils/core/navigationUtils';

const PAGE_SUBTITLE = 'Analysts you saved from the predictions leaderboard.';

export default function MyAnalystsPage() {
  const router = useRouter();
  const { savedAnalysts, loadError, isLoading, refreshSavedAnalysts } = useSavedAnalysts();

  const goToPredictions = () => {
    router.push('/predictions');
  };

  return (
    <>
      <MobileHeader title="My analysts" onBack={goToPredictions} />
      <div className="hidden md:block">
        <Topbar />
      </div>
      <DesktopHeader
        title="My analysts"
        subtitle={PAGE_SUBTITLE}
        onBack={goToPredictions}
        withSideBorders
      />

      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
          {isLoading ? (
            <p className="text-sm text-gray-500">Loading saved analysts…</p>
          ) : loadError ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03]">
              <ErrorState message={loadError} onRetry={() => void refreshSavedAnalysts()} />
            </div>
          ) : savedAnalysts.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-12 text-center">
              <div className="mx-auto flex max-w-xs flex-col items-center gap-3">
                <span className="flex h-20 w-20 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10">
                  <UserPlus className="h-10 w-10 text-emerald-400/90" aria-hidden />
                </span>
                <p className="text-sm font-medium text-gray-300">Add analysts</p>
                <Link
                  href="/predictions"
                  className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
                >
                  Browse leaderboard
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-white/10">
              {savedAnalysts.map((analyst) => (
                <div
                  key={analyst.id}
                  className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => navigateToProfile(analyst.handle, router)}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left transition-colors hover:opacity-90"
                  >
                    <AvatarWithFallback
                      src={analyst.avatar}
                      alt={analyst.displayName}
                      size={48}
                      className="shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-white">
                          {analyst.displayName}
                        </span>
                        <AuthorBadges
                          subscriptionPlanId={analyst.subscriptionPlanId ?? 'analyst'}
                          size="sm"
                        />
                      </div>
                      <p className="truncate text-xs text-gray-500">@{analyst.handle}</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <SeeAnalystAnalyticsButton
                      displayName={analyst.displayName}
                      handle={analyst.handle}
                    />
                    <SaveAnalystButton analyst={analyst} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
