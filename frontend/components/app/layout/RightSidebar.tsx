'use client';

import RightRail from './RightRail';
import { useWatchlist } from '@/hooks/features/useWatchlist';

/**
 * Shared right sidebar wrapper.
 * Keeps page files clean by centralizing RightRail + watchlist wiring.
 */
export default function RightSidebar() {
  const {
    watchlist,
    setWatchlist,
    loading: watchlistLoading,
    openManageModal,
  } = useWatchlist();

  return (
    <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
      <RightRail
        watchlist={watchlist}
        onManageWatchlist={openManageModal}
        onUpdateWatchlist={setWatchlist}
        isLoading={watchlistLoading}
      />
    </div>
  );
}
