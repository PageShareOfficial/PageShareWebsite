'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import RightRail from '@/components/app/layout/RightRail';
import MobileHeader from '@/components/app/layout/MobileHeader';
import DesktopHeader from '@/components/app/layout/DesktopHeader';
import TickerHeader from '@/components/app/ticker/TickerHeader';
import TickerKeyMetrics from '@/components/app/ticker/TickerKeyMetrics';
import TickerPriceChart from '@/components/app/ticker/TickerPriceChart';
import TickerOverview from '@/components/app/ticker/TickerOverview';
import TickerMetricsGrid from '@/components/app/ticker/TickerMetricsGrid';
import TickerPriceStats from '@/components/app/ticker/TickerPriceStats';
import TickerActions from '@/components/app/ticker/TickerActions';
import TickerSkeleton from '@/components/app/ticker/TickerSkeleton';
import ManageWatchlistModal from '@/components/app/modals/ManageWatchlistModal';
import ErrorState from '@/components/app/common/ErrorState';
import { useTickerDetail } from '@/hooks/ticker/useTickerDetail';
import { useTickerChart } from '@/hooks/ticker/useTickerChart';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import { WatchlistItem } from '@/types';

/**
 * Ticker detail page
 * Displays comprehensive information about a stock or cryptocurrency
 */
export default function TickerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const tickername = params.tickername as string;
  
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);
  const [chartTimeRange, setChartTimeRange] = useState<'1d' | '5d' | '30d' | '90d' | '180d' | '1y' | 'all'>('30d');
  const { watchlist, setWatchlist } = useWatchlist();
  
  const { data, type, isLoading, error, refetch } = useTickerDetail({
    ticker: tickername,
  });

  const { data: chartData, isLoading: isChartLoading, error: chartError } = useTickerChart({
    ticker: tickername,
    tickerType: type,
    timeRange: chartTimeRange,
    enabled: !!type && !!data,
  });

  // Get ticker name for header
  const tickerName = data?.name || tickername.toUpperCase();
  const tickerSymbol = type === 'stock' 
    ? (data as any)?.ticker 
    : (data as any)?.symbol?.toUpperCase() || tickername.toUpperCase();

  // Check if ticker is in watchlist
  const isInWatchlist = watchlist.some((item) => item.ticker === tickername.toUpperCase());

  // Get price and change for actions
  const price = type === 'stock' 
    ? (data as any)?.price 
    : (data as any)?.currentPrice || 0;
  const change = type === 'stock'
    ? (data as any)?.changePercent
    : (data as any)?.priceChangePercent24h || 0;

  // Handle add to watchlist
  const handleAddToWatchlist = () => {
    // Get image from data
    const image = type === 'stock'
      ? (data as any)?.image
      : (data as any)?.image || '';
    
    const watchlistItem: WatchlistItem = {
      ticker: tickername.toUpperCase(),
      name: tickerName,
      price: price,
      change: change,
      image: image,
    };
    setWatchlist((prev) => [...prev, watchlistItem]);
  };

  // Handle remove from watchlist
  const handleRemoveFromWatchlist = () => {
    setWatchlist((prev) => prev.filter((item) => item.ticker !== tickername.toUpperCase()));
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex justify-center">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
            <Topbar onUpgradeLabs={() => router.push('/plans')} />
            <div className="flex-1 flex pb-16 md:pb-0">
              <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
                <TickerSkeleton />
              </div>
            </div>
          </div>
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={() => setIsManageWatchlistOpen(true)}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
          />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data || !type) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex justify-center">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
            <Topbar onUpgradeLabs={() => router.push('/plans')} />
            <div className="flex-1 flex pb-16 md:pb-0">
              <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
                <ErrorState
                  title={error === 'Ticker not found' ? 'Ticker Not Found' : 'Something went wrong'}
                  message={
                    error === 'Ticker not found'
                      ? `The ticker "${tickername.toUpperCase()}" could not be found.`
                      : error || 'Failed to load ticker data. Please try again.'
                  }
                  onRetry={() => refetch()}
                />
              </div>
            </div>
          </div>
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={() => setIsManageWatchlistOpen(true)}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
          />
        </div>
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
          {/* Mobile Header - Mobile Only */}
          <MobileHeader title={tickerName} />

          {/* Top Bar - Desktop Only */}
          <div className="hidden md:block">
            <Topbar onUpgradeLabs={() => router.push('/plans')} />
          </div>

          {/* Desktop Header with Back Button - Desktop/iPad Only */}
          <DesktopHeader title={tickerName} subtitle={`$${tickerSymbol}`} />

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
              {/* Ticker Header */}
              <TickerHeader data={data} type={type} />

              {/* Actions */}
              <TickerActions
                ticker={tickername.toUpperCase()}
                name={tickerName}
                type={type}
                price={price}
                change={change}
                isInWatchlist={isInWatchlist}
                onAddToWatchlist={handleAddToWatchlist}
                onRemoveFromWatchlist={handleRemoveFromWatchlist}
              />

              {/* Key Metrics */}
              <TickerKeyMetrics data={data} type={type} />

              {/* Price Chart */}
              <TickerPriceChart
                ticker={tickername.toUpperCase()}
                tickerType={type}
                data={chartData}
                isLoading={isChartLoading}
                error={chartError}
                timeRange={chartTimeRange}
                onTimeRangeChange={setChartTimeRange}
              />

              {/* Overview */}
              <TickerOverview data={data} type={type} />

              {/* Price Stats */}
              <TickerPriceStats data={data} type={type} />

              {/* Metrics Grid */}
              <TickerMetricsGrid data={data} type={type} />
            </div>
          </div>
        </div>

        {/* Right Rail - Desktop Only */}
        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={() => setIsManageWatchlistOpen(true)}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
          />
        </div>
      </div>

      {/* Manage Watchlist Modal */}
      <ManageWatchlistModal
        isOpen={isManageWatchlistOpen}
        onClose={() => setIsManageWatchlistOpen(false)}
        watchlist={watchlist}
        onUpdateWatchlist={setWatchlist}
      />
    </div>
  );
}
