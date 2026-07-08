'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark } from 'lucide-react';
import Topbar from '@/components/app/layout/Topbar';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import AuthorBadges from '@/components/app/common/AuthorBadges';
import SaveAnalystButton from '@/components/app/predictions/SaveAnalystButton';
import SeeAnalystAnalyticsButton from '@/components/app/predictions/SeeAnalystAnalyticsButton';
import { useSavedAnalysts } from '@/contexts/SavedAnalystsContext';
import { navigateToProfile } from '@/utils/core/navigationUtils';

export default function MyAnalystsPage() {
  const router = useRouter();
  const { savedAnalysts } = useSavedAnalysts();

  return (
    <>
      <Topbar />
      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
          <header className="mb-6">
            <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
              <Bookmark className="h-6 w-6 text-emerald-400/90" aria-hidden />
              My analysts
            </h1>
            <p className="mt-2 text-sm text-gray-400">
              Analysts you saved from the predictions leaderboard.
            </p>
          </header>

          {savedAnalysts.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-12 text-center">
              <p className="text-sm text-gray-400 mb-4">
                You have not saved any analysts yet.
              </p>
              <Link
                href="/predictions"
                className="inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-100"
              >
                Browse leaderboard
              </Link>
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
