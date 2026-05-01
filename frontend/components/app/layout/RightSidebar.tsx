'use client';

import { useRouter } from 'next/navigation';
import RightRail from './RightRail';
import { useWatchlist } from '@/hooks/features/useWatchlist';

interface RightSidebarProps {
  upgradePath?: string;
}

/**
 * Shared right sidebar wrapper.
 * Keeps page files clean by centralizing RightRail + watchlist wiring.
 */
export default function RightSidebar({ upgradePath = '/plans' }: RightSidebarProps) {
  const router = useRouter();
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
        onUpgradeLabs={() => router.push(upgradePath)}
        onUpdateWatchlist={setWatchlist}
        isLoading={watchlistLoading}
      />
    </div>
  );
}
