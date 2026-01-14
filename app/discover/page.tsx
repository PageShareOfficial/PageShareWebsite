'use client';

import { useState } from 'react';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import RightRail from '@/components/app/layout/RightRail';
import DiscoverSearchBar from '@/components/app/discover/DiscoverSearchBar';
import NewsSection from '@/components/app/discover/NewsSection';
import ManageWatchlistModal from '@/components/app/modals/ManageWatchlistModal';
import { useRouter } from 'next/navigation';
import { useWatchlist } from '@/hooks/features/useWatchlist';

/**
 * Discover page - Main page for searching accounts, stocks, and crypto
 * Features:
 * - Unified search for accounts and tickers
 * - Recent searches sidebar
 * - News feed with categories
 * - Search results display
 */
export default function DiscoverPage() {
  const router = useRouter();
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);
  
  const { watchlist, setWatchlist } = useWatchlist();

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          {/* Top Bar - Mobile Only */}
          <Topbar onUpgradeLabs={() => router.push('/plans')} />

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
              {/* Search Bar */}
              <div className="mb-6 sticky top-0 z-10 bg-black pb-4">
                <DiscoverSearchBar
                  placeholder="Search @username or $TICKER..."
                  className="w-full"
                />
              </div>

              {/* News Feed */}
              <div className="space-y-6">
                <NewsSection className="flex-1" />
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={() => setIsManageWatchlistOpen(true)}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
          />
        </div>
      </div>

      {/* Modals */}
      <ManageWatchlistModal
        isOpen={isManageWatchlistOpen}
        onClose={() => setIsManageWatchlistOpen(false)}
        watchlist={watchlist}
        onUpdateWatchlist={setWatchlist}
      />
    </div>
  );
}
