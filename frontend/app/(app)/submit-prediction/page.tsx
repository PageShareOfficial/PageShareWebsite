'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import MobileHeader from '@/components/app/layout/MobileHeader';
import DesktopHeader from '@/components/app/layout/DesktopHeader';
import SubmitPredictionForm, {
  type PredictionPriceLockState,
} from '@/components/app/predictions/SubmitPredictionForm';
import FloatingPriceLockOverlay from '@/components/app/predictions/FloatingPriceLockOverlay';
import Skeleton from '@/components/app/common/Skeleton';
import { usePredictionSubmissionQuota } from '@/hooks/predictions/usePredictionSubmissionQuota';
import { useScrollPastAnchor } from '@/hooks/predictions/useScrollPastAnchor';
import { MAX_PREDICTIONS_PER_DAY } from '@/utils/predictions/predictionRules';

const INITIAL_LOCK_STATE: PredictionPriceLockState = {
  isVisible: false,
  lockExpired: false,
  lockRemainingSec: 0,
};

export default function SubmitPredictionPage() {
  const router = useRouter();
  const columnRef = useRef<HTMLDivElement>(null);
  const mobilePinRef = useRef<HTMLDivElement>(null);
  const desktopPinRef = useRef<HTMLDivElement>(null);
  const lockBannerRef = useRef<HTMLDivElement>(null);
  const [lockState, setLockState] = useState<PredictionPriceLockState>(INITIAL_LOCK_STATE);
  const { isPastAnchor: showFloatingLock, containerRect } = useScrollPastAnchor(
    lockBannerRef,
    lockState.isVisible,
    columnRef,
    mobilePinRef,
    desktopPinRef,
  );
  const { quota, canSubmit, refresh, isLoading } = usePredictionSubmissionQuota();

  const goToPredictions = () => {
    router.push('/predictions');
  };
  const showQuotaPill = !isLoading && quota !== null;
  const predictionsLeftPill = showQuotaPill ? (
    <div className="text-xs sm:text-sm text-gray-400 whitespace-nowrap">
      Predictions Left Today:{' '}
      <span className="font-semibold text-white">
        {quota.remaining} / {MAX_PREDICTIONS_PER_DAY}
      </span>
    </div>
  ) : (
    <Skeleton variant="text" width={96} height={16} rounded={true} />
  );

  return (
    <>
      <MobileHeader
        ref={mobilePinRef}
        title="Submit Prediction"
        onBack={goToPredictions}
        rightContent={predictionsLeftPill}
      />
      <DesktopHeader
        ref={desktopPinRef}
        title="Submit Prediction"
        onBack={goToPredictions}
        rightContent={predictionsLeftPill}
      />

      <div ref={columnRef} className="flex flex-1 flex-col pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10">
          <div className="bg-black px-3 py-5 pb-8 sm:px-4 md:px-5 md:py-6">
            <SubmitPredictionForm
              quota={quota}
              canSubmit={canSubmit}
              quotaLoading={isLoading}
              refreshQuota={refresh}
              lockBannerRef={lockBannerRef}
              onLockStateChange={setLockState}
            />
          </div>
        </div>
      </div>

      <FloatingPriceLockOverlay
        visible={lockState.isVisible && showFloatingLock}
        containerRect={containerRect}
        lockExpired={lockState.lockExpired}
        lockRemainingSec={lockState.lockRemainingSec}
      />
    </>
  );
}
