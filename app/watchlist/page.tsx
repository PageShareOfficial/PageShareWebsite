'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/app/Sidebar';
import Topbar from '@/components/app/Topbar';
import ManageWatchlistModal from '@/components/app/ManageWatchlistModal';
import { WatchlistItem } from '@/types';
import { Settings, Plus, RefreshCw } from 'lucide-react';
import { updateWatchlistPrices } from '@/utils/watchlistApi';

export default function WatchlistPage() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load watchlist from localStorage
    const savedWatchlist = localStorage.getItem('pageshare_watchlist');
    if (savedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        if (Array.isArray(parsedWatchlist)) {
          setWatchlist(parsedWatchlist);
        }
      } catch {
        // If parsing fails, keep empty watchlist
      }
    }
  }, []);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('pageshare_watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist, isClient]);

  const handleRefresh = async () => {
    if (watchlist.length === 0 || isRefreshing) return;
    
    setIsRefreshing(true);
    try {
      const updatedWatchlist = await updateWatchlistPrices(watchlist);
      setWatchlist(updatedWatchlist);
    } catch (error) {
      console.error('Error refreshing watchlist:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          {/* Top Bar - Mobile Only */}
          <Topbar onUpgradeLabs={() => window.location.href = '/plans'} />

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Watchlist</h1>
                <div className="flex items-center gap-2">
                  {watchlist.length > 0 && (
                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Refresh watchlist"
                      title="Refresh prices"
                    >
                      <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
                      <span className="hidden md:inline">Refresh</span>
                    </button>
                  )}
                  <button
                    onClick={() => setIsManageModalOpen(true)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2"
                    aria-label="Manage watchlist"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="hidden md:inline">Manage</span>
                  </button>
                </div>
              </div>

              {/* Watchlist Items */}
              {watchlist.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-lg text-gray-300 mb-2">Your watchlist is empty</p>
                  <p className="text-sm text-gray-400 mb-6">
                    Add tickers to track your favorite stocks
                  </p>
                  <button
                    onClick={() => setIsManageModalOpen(true)}
                    className="px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 mx-auto"
                  >
                    <Plus className="w-5 h-5" />
                    Add Tickers
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {watchlist.map((item) => (
                    <div
                      key={item.ticker}
                      className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white text-lg mb-1">
                          {item.ticker}
                        </div>
                        <div className="text-sm text-gray-400 truncate mb-2">
                          {item.name}
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-xs text-gray-500">Price</span>
                            <div className="text-white font-medium">
                              ${item.price.toFixed(2)}
                            </div>
                          </div>
                          <div>
                            <span className="text-xs text-gray-500">Change</span>
                            <div
                              className={`font-medium ${
                                item.change >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}
                            >
                              {item.change >= 0 ? '+' : ''}
                              {item.change.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Manage Watchlist Modal */}
      <ManageWatchlistModal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        watchlist={watchlist}
        onUpdateWatchlist={setWatchlist}
      />
    </div>
  );
}

