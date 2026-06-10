'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/app/layout/Topbar';
import MobileHeader from '@/components/app/layout/MobileHeader';
import DesktopHeader from '@/components/app/layout/DesktopHeader';
import SubmitPredictionForm from '@/components/app/predictions/SubmitPredictionForm';
import { getPredictionsSubmittedToday } from '@/utils/predictions/dailyPredictionLimit';
import { MAX_PREDICTIONS_PER_DAY } from '@/utils/predictions/predictionRules';

export default function SubmitPredictionPage() {
  const router = useRouter();
  const [predictionsLeft, setPredictionsLeft] = useState(MAX_PREDICTIONS_PER_DAY);

  useEffect(() => {
    const updateCount = () => {
      const used = getPredictionsSubmittedToday();
      setPredictionsLeft(Math.max(0, MAX_PREDICTIONS_PER_DAY - used));
    };
    updateCount();
    window.addEventListener('focus', updateCount);
    window.addEventListener('storage', updateCount);
    return () => {
      window.removeEventListener('focus', updateCount);
      window.removeEventListener('storage', updateCount);
    };
  }, []);

  const goToPredictions = () => {
    router.push('/predictions');
  };
  const predictionsLeftPill = (
    <div className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
      Predictions Left Today:{' '}
      <span className="font-semibold text-white">
        {predictionsLeft} / {MAX_PREDICTIONS_PER_DAY}
      </span>
    </div>
  );

  return (
    <>
      <MobileHeader
        title="Submit Prediction"
        onBack={goToPredictions}
        rightContent={predictionsLeftPill}
      />
      <div className="hidden md:block">
        <Topbar onUpgradeLabs={() => router.push('/plans')} />
      </div>

      <div className="flex-1 flex pb-16 md:pb-0 min-h-0">
        <div className="w-full border-l border-r border-white/10 flex flex-col min-h-0">
          <DesktopHeader
            title="Submit Prediction"
            onBack={goToPredictions}
            rightContent={predictionsLeftPill}
          />
          <div className="flex-1 overflow-y-auto">
            <div className="relative min-h-full px-3 py-5 sm:px-4 md:px-5 md:py-6 pb-8 bg-black">
              <SubmitPredictionForm />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
