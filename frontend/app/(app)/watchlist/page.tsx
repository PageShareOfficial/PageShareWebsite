'use client';

import { useRouter } from 'next/navigation';
import Topbar from '@/components/app/layout/Topbar';
import { Plus } from '@/constants/icons';
import { navigateToTicker } from '@/utils/core/navigationUtils';
import PriceChangeDisplay from '@/components/app/common/PriceChangeDisplay';
import TickerImage from '@/components/app/ticker/TickerImage';
import Skeleton from '@/components/app/common/Skeleton';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import { PrimaryButton } from '@/components/app/common/Button';

export default function WatchlistPage() {
  const router = useRouter();
  const { watchlist, loading: watchlistLoading, setWatchlist, openManageModal } = useWatchlist();

  if (watchlistLoading) {
    return (
      <>
        <Topbar />
        <div className="flex-1 flex pb-16 md:pb-0">
          <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
                {/* Header skeleton */}
                <div className="hidden md:flex items-center justify-between mb-6">
                  <Skeleton variant="rectangular" width={128} height={32} />
                  <div className="flex items-center gap-2">
                    <Skeleton variant="rectangular" width={80} height={40} />
                    <Skeleton variant="rectangular" width={96} height={40} />
                  </div>
                </div>
                {/* Mobile header skeleton */}
                <div className="md:hidden flex items-center justify-between mb-6">
                  <Skeleton variant="rectangular" width={96} height={28} />
                  <div className="flex items-center gap-2">
                    <Skeleton variant="rectangular" width={80} height={40} />
                    <Skeleton variant="rectangular" width={80} height={40} />
                  </div>
                </div>
                {/* Watchlist item skeletons */}
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={`skeleton-${index}`}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <Skeleton variant="rectangular" width={48} height={48} rounded="rounded-lg" />
                          <div className="min-w-0">
                            <Skeleton variant="text" width={72} height={20} className="mb-2" />
                            <Skeleton variant="text" width={140} height={14} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <Skeleton variant="text" width={88} height={22} className="mb-2" />
                          <Skeleton variant="text" width={92} height={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar />
      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
              {/* Header - Desktop and Tablet */}
              <div className="hidden md:flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold text-white">Watchlist</h1>
                <div className="flex items-center gap-2">
                  <PrimaryButton type="button" onClick={openManageModal}>
                    Manage
                  </PrimaryButton>
                </div>
              </div>

              {/* Mobile Header with Manage Button */}
              <div className="md:hidden flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold text-white">Watchlist</h1>
                <div className="flex items-center gap-2">
                  <PrimaryButton type="button" onClick={openManageModal}>
                    Add Ticker
                  </PrimaryButton>
                </div>
              </div>

              {/* Watchlist Items */}
              {watchlist.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-white/5 rounded-lg flex items-center justify-center">
                      <Plus className="w-8 h-8 text-gray-400" />
                    </div>
                  </div>
                  <p className="text-lg text-gray-300 mb-2">Your watchlist is empty</p>
                  <p className="text-sm text-gray-400">
                    Add tickers to track your favorite stocks
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {watchlist.map((item) => (
                    <div
                      key={item.ticker}
                      onClick={() => navigateToTicker(item.ticker, router)}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <TickerImage
                            src={item.image}
                            ticker={item.ticker}
                            size="md"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-white text-lg leading-tight">
                              {item.ticker}
                            </div>
                            <div className="text-sm text-gray-400 truncate mt-1">
                              {item.name}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-xs text-gray-500 mb-1">Price</div>
                          <div className="text-white font-semibold text-lg leading-tight">
                            ${item.price.toFixed(2)}
                          </div>
                          <div className="mt-1">
                            <PriceChangeDisplay
                              change={(item.price * item.change) / 100}
                              changePercent={item.change}
                              size="sm"
                              showIcon={false}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
        </div>
      </div>
    </>
  );
}

