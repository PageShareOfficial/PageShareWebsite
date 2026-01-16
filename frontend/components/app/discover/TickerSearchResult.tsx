'use client';

import { useState } from 'react';
import { StockData } from '@/utils/api/stockApi';
import { WatchlistItem } from '@/types';
import { Plus } from 'lucide-react';
import TickerTypeBadge from '@/components/app/common/TickerTypeBadge';
import PriceChangeDisplay from '@/components/app/common/PriceChangeDisplay';

interface TickerSearchResultProps {
  tickerData: StockData;
  type: 'stock' | 'crypto';
  watchlist?: WatchlistItem[];
  onAddToWatchlist?: (item: WatchlistItem) => void;
  onTickerClick?: (ticker: string) => void; // Optional: for showing detailed view
}

/**
 * Ticker search result card
 * Shows ticker info with option to add to watchlist
 * Reuses WatchlistItem display pattern
 */
export default function TickerSearchResult({
  tickerData,
  type,
  watchlist = [],
  onAddToWatchlist,
  onTickerClick,
}: TickerSearchResultProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isInWatchlist = watchlist.some(item => item.ticker === tickerData.ticker);

  const handleAddToWatchlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isInWatchlist || !onAddToWatchlist) return;

    const watchlistItem: WatchlistItem = {
      ticker: tickerData.ticker,
      name: tickerData.name,
      price: tickerData.price,
      change: tickerData.change,
      image: tickerData.image,
    };

    onAddToWatchlist(watchlistItem);
  };

  const handleCardClick = () => {
    if (onTickerClick) {
      onTickerClick(tickerData.ticker);
    }
  };


  return (
    <div
      onClick={handleCardClick}
      className={`p-4 bg-white/5 border border-white/10 rounded-xl transition-colors ${
        onTickerClick ? 'cursor-pointer hover:bg-white/10' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-lg">
              {tickerData.ticker}
            </span>
            <TickerTypeBadge type={type} size="sm" />
          </div>
          
          <div className="text-sm text-gray-400 truncate mb-3">
            {tickerData.name}
          </div>
          
          <div className="flex items-center gap-4">
            <div>
              <span className="text-xs text-gray-500">Price</span>
              <div className="text-white font-medium">
                ${tickerData.price.toFixed(2)}
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500">Change</span>
              <PriceChangeDisplay 
                change={tickerData.changeAmount || 0} 
                changePercent={tickerData.change}
                size="sm"
              />
            </div>
          </div>
        </div>

        {onAddToWatchlist && (
          <button
            onClick={handleAddToWatchlist}
            disabled={isInWatchlist}
            className={`ml-4 px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 flex-shrink-0 ${
              isInWatchlist
                ? 'bg-white/10 text-gray-400 cursor-not-allowed'
                : 'bg-white text-black hover:bg-gray-100'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>{isInWatchlist ? 'In Watchlist' : 'Add'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
