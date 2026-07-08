'use client';

import { Bookmark } from 'lucide-react';
import { useSavedAnalysts } from '@/contexts/SavedAnalystsContext';
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
  const { isSaved, toggleSavedAnalyst } = useSavedAnalysts();
  const saved = !requiresUpgrade && isSaved(analyst.handle);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (requiresUpgrade) {
      onUpgradeRequired?.();
      return;
    }
    toggleSavedAnalyst(analyst);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={
        requiresUpgrade
          ? `Upgrade to save ${analyst.displayName}`
          : saved
            ? `Remove ${analyst.displayName} from saved analysts`
            : `Save ${analyst.displayName}`
      }
      title={requiresUpgrade ? 'Upgrade to save analysts' : saved ? 'Saved analyst' : 'Save analyst'}
      className={`rounded-lg p-1.5 transition-colors ${
        saved
          ? 'text-emerald-400 hover:text-emerald-300'
          : 'text-gray-400 hover:bg-white/5 hover:text-emerald-300'
      } ${className}`}
    >
      <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} aria-hidden />
    </button>
  );
}
