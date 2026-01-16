'use client';

import { useState } from 'react';
import { Plus, Check, Share2 } from 'lucide-react';
import { shareContent } from '@/utils/core/clipboardUtils';

interface TickerActionsProps {
  ticker: string;
  name: string;
  type: 'stock' | 'crypto';
  price: number;
  change: number;
  isInWatchlist: boolean;
  onAddToWatchlist: () => void;
  onRemoveFromWatchlist: () => void;
}

/**
 * Action buttons component
 * Add to Watchlist and Share functionality
 */
export default function TickerActions({
  ticker,
  name,
  type,
  price,
  change,
  isInWatchlist,
  onAddToWatchlist,
  onRemoveFromWatchlist,
}: TickerActionsProps) {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = async () => {
    const success = await shareContent({
      title: `${name} (${ticker})`,
      text: `Check out ${ticker} on PageShare`,
      url: `${window.location.origin}/ticker/${ticker}`,
    });
    
    if (success) {
      setIsSharing(true);
      setTimeout(() => setIsSharing(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-3 mb-6">
      {/* Add to Watchlist Button */}
      {isInWatchlist ? (
        <button
          onClick={onRemoveFromWatchlist}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-gray-300 rounded-lg hover:bg-white/20 transition-colors"
        >
          <Check className="w-4 h-4" />
          <span>In Watchlist</span>
        </button>
      ) : (
        <button
          onClick={onAddToWatchlist}
          className="flex items-center gap-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Watchlist</span>
        </button>
      )}

      {/* Share Button */}
      <button
        onClick={handleShare}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
      >
        <Share2 className="w-4 h-4" />
        <span>{isSharing ? 'Copied!' : 'Share'}</span>
      </button>
    </div>
  );
}
