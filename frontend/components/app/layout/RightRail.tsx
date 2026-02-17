'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { WatchlistItem } from '@/types';
import { navigateToTicker } from '@/utils/core/navigationUtils';
import PriceChangeDisplay from '@/components/app/common/PriceChangeDisplay';
import TickerImage from '@/components/app/ticker/TickerImage';
import Skeleton from '@/components/app/common/Skeleton';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { useOfflineOverlay } from '@/contexts/OfflineOverlayContext';

interface RightRailProps {
  watchlist: WatchlistItem[];
  onManageWatchlist: () => void;
  onUpgradeLabs: () => void;
  onUpdateWatchlist: (watchlist: WatchlistItem[]) => void;
  isLoading?: boolean;
}

export default function RightRail({
  watchlist,
  onManageWatchlist,
  onUpgradeLabs,
  onUpdateWatchlist,
  isLoading = false,
}: RightRailProps) {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const { setShowOfflineOverlay } = useOfflineOverlay();

  const handleUpgradeClick = () => {
    if (isOnline) onUpgradeLabs();
    else setShowOfflineOverlay(true);
  };

  const handleWatchlistRowClick = (ticker: string) => {
    if (!isOnline) setShowOfflineOverlay(true);
    else navigateToTicker(ticker, router);
  };

  return (
    <aside className="hidden lg:flex flex-col w-[350px] sticky top-0 h-screen pt-6 overflow-y-auto">
      <div className="flex flex-col gap-6 pb-6">
        {/* Watchlist Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/watchlist"
              prefetch={true}
              className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Watchlist
            </Link>
            <button
              type="button"
              onClick={onManageWatchlist}
              disabled={!isOnline}
              className="p-1.5 text-gray-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              aria-label="Manage watchlist"
              title={!isOnline ? 'Connect to the internet to continue' : 'Manage watchlist'}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="flex items-center gap-3 p-2"
                >
                  {/* Image Skeleton */}
                  <Skeleton variant="rectangular" width={40} height={40} rounded="rounded-lg" />
                  
                  <div className="min-w-0 flex-1">
                    <Skeleton variant="text" width={60} height={16} className="mb-2" />
                    <Skeleton variant="text" width="80%" height={12} />
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <Skeleton variant="text" width={50} height={16} className="mb-1" />
                    <Skeleton variant="text" width={40} height={12} />
                  </div>
                </div>
              ))}
            </div>
          ) : watchlist.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm mb-2">Your watchlist is empty</p>
              <button
                type="button"
                onClick={onManageWatchlist}
                disabled={!isOnline}
                title={!isOnline ? 'Connect to the internet to continue' : undefined}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
              >
                Add tickers to track
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlist.map((item) => (
                <div
                  key={item.ticker}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleWatchlistRowClick(item.ticker)}
                  onKeyDown={(e) => e.key === 'Enter' && handleWatchlistRowClick(item.ticker)}
                  className={`flex items-center gap-3 rounded-lg p-2 transition-colors ${isOnline ? 'cursor-pointer hover:bg-white/5' : 'cursor-not-allowed opacity-70'}`}
                  title={!isOnline ? 'Connect to the internet to view ticker' : undefined}
                >
                  {/* Ticker Image */}
                  <TickerImage
                    src={item.image}
                    ticker={item.ticker}
                    size="sm"
                  />
                  
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white truncate">{item.ticker}</div>
                    <div className="text-xs text-gray-400 truncate">{item.name}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-medium text-white">${item.price.toFixed(2)}</div>
                    <PriceChangeDisplay 
                      change={(item.price * item.change) / 100} 
                      changePercent={item.change}
                      size="sm"
                      showIcon={false}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Labs Pro Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white mb-2">Premium</h2>
          <p className="text-sm text-gray-300 mb-4">
            Premium AI tools, deeper filters, and credibility analytics.
          </p>
          <button
            type="button"
            onClick={handleUpgradeClick}
            disabled={!isOnline}
            title={!isOnline ? 'Connect to the internet to continue' : undefined}
            className="w-full px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
          >
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}

