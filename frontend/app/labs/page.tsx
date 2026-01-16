'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GiBinoculars } from 'react-icons/gi';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import RightRail from '@/components/app/layout/RightRail';
import ManageWatchlistModal from '@/components/app/modals/ManageWatchlistModal';
import { useWatchlist } from '@/hooks/features/useWatchlist';

export default function LabsPage() {
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
            <div className="w-full border-l border-r border-white/10 px-4 py-12 md:py-16 lg:py-20">
              <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-8">
                {/* Large Icon */}
                <GiBinoculars className="w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 text-white" />

                {/* Heading */}
                <div className="space-y-4 max-w-md">
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white">
                    Labs
                  </h1>
                  <p className="text-lg md:text-xl lg:text-2xl text-gray-300 leading-relaxed">
                    Pioneering AI-powered features launch monthly. Watch out this space for new features.
                  </p>
                </div>

                {/* Coming Soon Badge */}
                <div className="mt-8">
                  <span className="inline-flex items-center px-6 py-3 bg-white/5 border border-white/20 rounded-full text-sm md:text-base text-white font-medium">
                    Coming soon
                  </span>
                </div>
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

