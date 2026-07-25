'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { MdLeaderboard } from 'react-icons/md';
import Topbar from '@/components/app/layout/Topbar';
import Loading from '@/components/app/common/Loading';
import PredictionsDashboard from '@/components/app/predictions/PredictionsDashboard';
import PredictionSubmitUpgradeModal from '@/components/app/modals/PredictionSubmitUpgradeModal';
import { useAuth } from '@/contexts/AuthContext';
import { usePredictionsPageHeader } from '@/hooks/predictions/usePredictionsView';

export default function PredictionsPage() {
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const { loading: authLoading } = useAuth();
  const header = usePredictionsPageHeader();

  const submitButtonClass =
    'inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-black transition-colors hover:bg-gray-100';

  if (authLoading) {
    return (
      <>
        <Topbar />
        <div className="flex flex-1 items-center justify-center pb-16 md:pb-0 min-h-[50vh]">
          <Loading />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar />
      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
          <header className="mb-6 flex items-center justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
                {header.showLeaderboardIcon && (
                  <MdLeaderboard className="h-6 w-6 text-amber-400/90" aria-hidden />
                )}
                {header.title}
              </h1>
            </div>
            {header.showSubmit &&
              (header.submitAsLink ? (
                <Link href="/submit-prediction" prefetch className={submitButtonClass}>
                  <Plus className="w-4 h-4" aria-hidden />
                  Submit
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className={submitButtonClass}
                >
                  <Plus className="w-4 h-4" aria-hidden />
                  Submit
                </button>
              ))}
          </header>
          <PredictionsDashboard />
        </div>
      </div>

      <PredictionSubmitUpgradeModal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
      />
    </>
  );
}
