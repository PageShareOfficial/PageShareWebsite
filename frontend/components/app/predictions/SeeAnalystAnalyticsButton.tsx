'use client';

import { useRouter } from 'next/navigation';
import { BarChart3, Lock } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { getAnalyticsPath } from '@/utils/predictions/analyticsRoutes';

interface SeeAnalystAnalyticsButtonProps {
  displayName: string;
  handle: string;
  className?: string;
  requiresUpgrade?: boolean;
  onUpgradeRequired?: () => void;
}

export default function SeeAnalystAnalyticsButton({
  displayName,
  handle,
  className = '',
  requiresUpgrade = false,
  onUpgradeRequired,
}: SeeAnalystAnalyticsButtonProps) {
  const router = useRouter();
  const isOnline = useOnlineStatus();

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isOnline) {
      return;
    }
    if (requiresUpgrade) {
      onUpgradeRequired?.();
      return;
    }
    router.push(getAnalyticsPath(handle));
  };

  const upgradeLabel = 'Unlock who these analysts are';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isOnline}
      aria-label={
        !isOnline
          ? 'Connect to the internet to view analytics'
          : requiresUpgrade
            ? upgradeLabel
            : `View ${displayName}'s analytics`
      }
      title={
        !isOnline
          ? 'Connect to the internet to continue'
          : requiresUpgrade
            ? upgradeLabel
            : 'See analytics'
      }
      className={
        requiresUpgrade
          ? `relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-emerald-400/40 bg-emerald-500/10 text-emerald-300 transition-colors hover:border-emerald-300/60 hover:bg-emerald-500/15 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none ${className}`
          : `flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-gray-300 transition-colors hover:border-white/25 hover:bg-white/15 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none ${className}`
      }
    >
      <BarChart3 className="h-5 w-5" aria-hidden />
      {requiresUpgrade && (
        <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full border border-black/80 bg-emerald-400 text-black">
          <Lock className="h-2 w-2" strokeWidth={3} aria-hidden />
        </span>
      )}
    </button>
  );
}
