import { Clock, Lock } from 'lucide-react';
import { LOCK_DURATION_MS } from '@/utils/predictions/predictionRules';

interface PriceLockBannerProps {
  lockExpired: boolean;
  lockRemainingSec: number;
  className?: string;
}

export default function PriceLockBanner({
  lockExpired,
  lockRemainingSec,
  className = '',
}: PriceLockBannerProps) {
  const lockMinutes = Math.floor(LOCK_DURATION_MS / 60_000);
  const countdown = lockExpired
    ? 'Expired'
    : `${Math.floor(lockRemainingSec / 60)}:${String(lockRemainingSec % 60).padStart(2, '0')}`;

  return (
    <div
      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 ${
        lockExpired
          ? 'border-red-500/40 bg-red-500/10'
          : 'border-cyan-500/40 bg-cyan-500/10'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex min-w-0 items-center gap-2">
        <Lock className="h-4 w-4 flex-shrink-0 text-gray-300" />
        <p className="truncate text-sm text-white">
          Current price is locked for {lockMinutes} min
        </p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-1.5 text-xs tabular-nums text-gray-300">
        <Clock className="h-3.5 w-3.5" />
        {countdown}
      </div>
    </div>
  );
}
