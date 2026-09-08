'use client';

import { Bookmark } from 'lucide-react';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { useSavedAnalysts } from '@/hooks/predictions/useSavedAnalysts';
import type { SavedAnalyst } from '@/types/savedAnalyst';

interface SaveAnalystButtonProps {
  analyst: SavedAnalyst;
  className?: string;
  requiresUpgrade?: boolean;
  onUpgradeRequired?: () => void;
}

export default function SaveAnalystButton({
  analyst,
  className = '',
  requiresUpgrade = false,
  onUpgradeRequired,
}: SaveAnalystButtonProps) {
  const isOnline = useOnlineStatus();
  const { isSaved, toggleSavedAnalyst } = useSavedAnalysts();
  const saved = !requiresUpgrade && isSaved(analyst.handle);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (!isOnline) {
      return;
    }
    if (requiresUpgrade) {
      onUpgradeRequired?.();
      return;
    }
    void toggleSavedAnalyst(analyst).catch(() => {
      /* optimistic rollback handled in context */
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isOnline}
      aria-label={
        !isOnline
          ? 'Connect to the internet to save analysts'
          : requiresUpgrade
            ? `Upgrade to save ${analyst.displayName}`
            : saved
              ? `Remove ${analyst.displayName} from saved analysts`
              : `Save ${analyst.displayName}`
      }
      title={
        !isOnline
          ? 'Connect to the internet to continue'
          : requiresUpgrade
            ? 'Upgrade to save analysts'
            : saved
              ? 'Saved analyst'
              : 'Save analyst'
      }
      className={`rounded-lg p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none ${
        saved
          ? 'text-emerald-400 hover:text-emerald-300'
          : 'text-gray-400 hover:bg-white/5 hover:text-emerald-300'
      } ${className}`}
    >
      <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} aria-hidden />
    </button>
  );
}
