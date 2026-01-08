'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, Plus } from 'lucide-react';
import { WatchlistItem } from '@/types';
import { updateWatchlistPrices } from '@/utils/watchlistApi';

interface RightRailProps {
  watchlist: WatchlistItem[];
  onManageWatchlist: () => void;
  onUpgradeLabs: () => void;
  onUpdateWatchlist: (watchlist: WatchlistItem[]) => void;
}

export default function RightRail({
  watchlist,
  onManageWatchlist,
  onUpgradeLabs,
  onUpdateWatchlist,
}: RightRailProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (watchlist.length === 0 || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const updatedWatchlist = await updateWatchlistPrices(watchlist);
      onUpdateWatchlist(updatedWatchlist);
    } catch (error) {
      console.error('Error refreshing watchlist:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <aside className="hidden lg:flex flex-col w-[350px] sticky top-0 h-screen pt-6 overflow-y-auto">
      <div className="flex flex-col gap-6 pb-6">
        {/* Watchlist Card */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/watchlist')}
              className="text-lg font-semibold text-white hover:text-cyan-400 transition-colors cursor-pointer"
            >
              Watchlist
            </button>
            <div className="flex items-center gap-2">
              {watchlist.length > 0 && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 text-gray-400 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Refresh watchlist"
                  title="Refresh prices"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              )}
              <button
                onClick={onManageWatchlist}
                className="p-1.5 text-gray-400 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Manage watchlist"
                title="Manage watchlist"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          {watchlist.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm mb-2">Your watchlist is empty</p>
              <button
                onClick={onManageWatchlist}
                className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                Add tickers to track
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {watchlist.map((item) => (
                <div key={item.ticker} className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-white truncate">{item.ticker}</div>
                    <div className="text-xs text-gray-400 truncate">{item.name}</div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <div className="font-medium text-white">${item.price.toFixed(2)}</div>
                    <div
                      className={`text-xs font-medium ${
                        item.change >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {item.change >= 0 ? '+' : ''}
                      {item.change.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Labs Pro Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl p-5 flex-shrink-0">
          <h2 className="text-lg font-semibold text-white mb-2">Labs Pro</h2>
          <p className="text-sm text-gray-300 mb-4">
            Premium AI tools, deeper filters, and credibility analytics.
          </p>
          <button
            onClick={onUpgradeLabs}
            className="w-full px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors"
          >
            Upgrade
          </button>
        </div>
      </div>
    </aside>
  );
}

