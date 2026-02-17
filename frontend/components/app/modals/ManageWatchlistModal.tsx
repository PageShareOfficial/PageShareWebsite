'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Loader2, Search } from 'lucide-react';
import { WatchlistItem } from '@/types';
import { fetchCryptoData, SearchSuggestion, StockData } from '@/utils/api/stockApi';
import { useTickerSearch } from '@/hooks/discover/useTickerSearch';
import ImageWithFallback from '@/components/app/common/ImageWithFallback';
import { useClickOutside } from '@/hooks/common/useClickOutside';
import Modal from '@/components/app/common/Modal';
import { getInitials } from '@/utils/core/textFormatting';
import Skeleton from '@/components/app/common/Skeleton';
import TickerTypeBadge from '@/components/app/common/TickerTypeBadge';
import EmptyState from '@/components/app/common/EmptyState';
import TickerImage from '@/components/app/ticker/TickerImage';
import PriceChangeDisplay from '@/components/app/common/PriceChangeDisplay';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';

interface ManageWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (watchlist: WatchlistItem[]) => void;
  onAddTicker?: (item: WatchlistItem) => Promise<void> | void;
  onRemoveTicker?: (ticker: string) => Promise<void> | void;
}

export default function ManageWatchlistModal({ 
  isOpen, 
  onClose, 
  watchlist,
  onUpdateWatchlist,
  onAddTicker,
  onRemoveTicker,
}: ManageWatchlistModalProps) {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isOnline = useOnlineStatus();

  // Use the ticker search hook
  const tickerSearch = useTickerSearch({
    minQueryLength: 2,
    debounceMs: 300,
    enabled: isOpen, // Only enable search when modal is open
  });

  // Reset search when modal closes
  useEffect(() => {
    if (!isOpen) {
      // Clear search when modal closes
      tickerSearch.setQuery('');
      tickerSearch.clearSuggestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]); // Only depend on isOpen - tickerSearch functions are stable

  // Close suggestions when clicking outside
  useClickOutside({
    ref: suggestionsRef,
    handler: () => {
      tickerSearch.setShowSuggestions(false);
    },
    enabled: tickerSearch.showSuggestions,
    additionalRefs: [inputRef],
  });

  if (!isOpen || !tickerSearch.isClient) return null;

  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    tickerSearch.setQuery(suggestion.ticker);
    tickerSearch.setShowSuggestions(false);
    tickerSearch.clearSuggestions();
    await handleAddTicker(suggestion.ticker);
  };

  const handleAddTicker = async (ticker?: string) => {
    if (!isOnline) return;
    const tickerToAdd = ticker || tickerSearch.query.trim().toUpperCase();
    
    if (!tickerToAdd) {
      setError('Please enter a ticker symbol or select from suggestions');
      return;
    }

    if (watchlist.some(item => item.ticker === tickerToAdd)) {
      setError('This ticker is already in your watchlist');
      return;
    }

    setIsLoading(true);
    setError('');
    tickerSearch.setShowSuggestions(false);

    try {
      const tickerData: StockData | null = await fetchCryptoData(tickerToAdd);
      
      if (!tickerData) {
        setError(
          `Ticker "${tickerToAdd}" not found. Please enter a valid cryptocurrency ticker (e.g., BTC, ETH, SOL).`
        );
        return;
      }

      // Build watchlist item
      const newWatchlistItem: WatchlistItem = {
        ticker: tickerData.ticker,
        name: tickerData.name,
        price: tickerData.price,
        change: tickerData.change,
        image: tickerData.image,
      };

      if (onAddTicker) {
        await onAddTicker(newWatchlistItem);
      } else {
        onUpdateWatchlist([...watchlist, newWatchlistItem]);
      }
      tickerSearch.setQuery('');
      setError('');
      tickerSearch.clearSuggestions();
    } catch (err) {
      console.error('Error fetching ticker data:', err);
      setError('Failed to fetch ticker data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTicker = async (tickerToRemove: string) => {
    if (!isOnline) return;
    if (onRemoveTicker) {
      await onRemoveTicker(tickerToRemove);
    } else {
      onUpdateWatchlist(watchlist.filter(item => item.ticker !== tickerToRemove));
    }
  };

  // Enhanced keyboard handler that handles Enter without selection (adds ticker directly)
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (tickerSearch.selectedIndex >= 0 && tickerSearch.suggestions[tickerSearch.selectedIndex]) {
        // Suggestion selected, add it to watchlist
        handleSelectSuggestion(tickerSearch.suggestions[tickerSearch.selectedIndex]);
      } else {
        // No suggestion selected, add ticker directly
        handleAddTicker();
      }
    } else {
      // Delegate other keys to hook's handler (ArrowUp/Down, Escape)
      tickerSearch.handleKeyDown(e);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Manage Watchlist"
      maxWidth="md"
      className="p-6"
    >

        {/* Add Ticker Section */}
        <div className="mb-6 relative">
          {!isOnline && (
            <p className="text-sm text-amber-400 mb-2">Connect to the internet to add or remove tickers.</p>
          )}
          <label htmlFor="ticker-input" className="block text-sm font-medium text-gray-300 mb-2">
            Add Ticker (Crypto)
          </label>
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                id="ticker-input"
                type="text"
                value={tickerSearch.query}
                onChange={(e) => {
                  tickerSearch.setQuery(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (tickerSearch.suggestions.length > 0) {
                    tickerSearch.setShowSuggestions(true);
                  }
                }}
                placeholder="Search by ticker (AAPL) or name (Apple)..."
                disabled={isLoading || !isOnline}
                title={!isOnline ? 'Connect to the internet to continue' : undefined}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              
              {/* Autocomplete Suggestions Dropdown */}
              {tickerSearch.showSuggestions && (tickerSearch.suggestions.length > 0 || tickerSearch.isSearching) && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-black border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {/* Skeleton Loaders (shown while searching) */}
                  {tickerSearch.isSearching && tickerSearch.suggestions.length === 0 && (
                    <>
                      {Array.from({ length: 3 }).map((_, index) => (
                        <div
                          key={`skeleton-${index}`}
                          className={`px-4 py-3 ${index > 0 ? 'border-t border-white/5' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Image skeleton */}
                            <Skeleton variant="rectangular" width={40} height={40} rounded="rounded-lg" className="flex-shrink-0" />
                            <div className="flex-1 min-w-0 space-y-2">
                              {/* Ticker + badge skeleton */}
                              <div className="flex items-center gap-2">
                                <Skeleton variant="text" width={80} height={16} />
                                <Skeleton variant="text" width={64} height={16} />
                              </div>
                              {/* Name skeleton */}
                              <Skeleton variant="text" width="67%" height={12} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {tickerSearch.suggestions.map((suggestion, index) => {
                    
                    return (
                      <button
                        key={`${suggestion.ticker}-${index}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(suggestion)}
                        disabled={!isOnline}
                        className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                          index === tickerSearch.selectedIndex ? 'bg-white/10' : ''
                        } ${index > 0 ? 'border-t border-white/5' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden bg-white/5">
                            <ImageWithFallback
                              src={suggestion.image}
                              alt={suggestion.name}
                              className="w-full h-full"
                              fallback={
                                <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-white/10">
                                  {getInitials(suggestion.name)}
                                </div>
                              }
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-white">
                                {suggestion.ticker}
                              </span>
                              <TickerTypeBadge type={suggestion.type} size="sm" />
                            </div>
                            <div className="text-sm text-gray-400 truncate mt-0.5">
                              {suggestion.name}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleAddTicker()}
              disabled={isLoading || !tickerSearch.query.trim() || !isOnline}
              title={!isOnline ? 'Connect to the internet to continue' : undefined}
              className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {isLoading ? 'Adding...' : 'Add'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-400">{error}</p>
          )}
          <p className="mt-2 text-xs text-gray-500">
            Search by ticker symbol (BTC, ETH) or name (Bitcoin, Ethereum).
          </p>
        </div>

        {/* Watchlist Items */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Your Watchlist ({watchlist.length})
          </h3>
          {watchlist.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="Your watchlist is empty"
              description="Add tickers above to track cryptocurrencies"
            />
          ) : (
            <div className="space-y-3">
              {watchlist.map((item) => {
                return (
                  <div
                    key={item.ticker}
                    className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors relative"
                  >
                    {/* Ticker Image */}
                    <TickerImage
                      src={item.image}
                      ticker={item.ticker}
                      size="sm"
                      className="z-10"
                    />
                    
                    <div className="flex-1 min-w-0 z-10">
                      <div className="font-medium text-white">{item.ticker}</div>
                      <div className="text-xs text-gray-400 truncate">{item.name}</div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-white">${item.price.toFixed(2)}</span>
                        <PriceChangeDisplay 
                          change={(item.price * item.change) / 100} 
                          changePercent={item.change}
                          size="sm"
                          showIcon={false}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveTicker(item.ticker)}
                      disabled={!isOnline}
                      title={!isOnline ? 'Connect to the internet to continue' : undefined}
                      className="ml-3 p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0 z-10 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                      aria-label={`Remove ${item.ticker}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
    </Modal>
  );
}
