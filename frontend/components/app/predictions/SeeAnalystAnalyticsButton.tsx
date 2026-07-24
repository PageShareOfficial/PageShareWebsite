'use client';

import { useRouter } from 'next/navigation';
import { BarChart3 } from 'lucide-react';
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

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isOnline}
      aria-label={
        !isOnline
          ? 'Connect to the internet to view analytics'
          : requiresUpgrade
            ? `Upgrade to view ${displayName}'s analytics`
            : `View ${displayName}'s analytics`
      }
      title={
        !isOnline
          ? 'Connect to the internet to continue'
          : requiresUpgrade
            ? 'Upgrade to view analyst analytics'
            : 'See analytics'
      }
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/10 text-gray-300 transition-colors hover:border-white/25 hover:bg-white/15 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none ${className}`}
    >
      <BarChart3 className="h-5 w-5" aria-hidden />
    </button>
  );
}
