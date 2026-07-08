'use client';

import { Bookmark } from 'lucide-react';
import SavedAnalystsCarousel from '@/components/app/predictions/saved-analysts/SavedAnalystsCarousel';
import ShowAllButton from '@/components/app/common/ShowAllButton';
import { useSavedAnalysts } from '@/contexts/SavedAnalystsContext';

export default function SavedAnalystsSection() {
  const { savedAnalysts } = useSavedAnalysts();

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
        <Bookmark className="h-5 w-5 text-emerald-400/90" aria-hidden />
        Saved analysts
      </h2>

      {savedAnalysts.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center">
          <p className="text-sm text-gray-400">
            No saved analysts yet. Use the bookmark on the leaderboard below to build your list.
          </p>
        </div>
      ) : (
        <SavedAnalystsCarousel analysts={savedAnalysts} />
      )}
      <ShowAllButton href="/myanalysts" />
    </section>
  );
}
