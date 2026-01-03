'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Loader2, Search } from 'lucide-react';
import { WatchlistItem } from '@/types';
import { fetchTickerData, searchTickers, SearchSuggestion } from '@/utils/stockApi';

interface ManageWatchlistModalProps {
  isOpen: boolean;
  onClose: () => void;
  watchlist: WatchlistItem[];
  onUpdateWatchlist: (watchlist: WatchlistItem[]) => void;
}

export default function ManageWatchlistModal({ 
  isOpen, 
  onClose, 
  watchlist,
  onUpdateWatchlist 
}: ManageWatchlistModalProps) {
  const [tickerInput, setTickerInput] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isClient, setIsClient] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debounced search for autocomplete
  useEffect(() => {
    if (!isClient) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const query = tickerInput.trim();
    
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchTickers(query);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error searching tickers:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [tickerInput, isClient]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSuggestions]);

  if (!isOpen || !isClient) return null;

  const handleSelectSuggestion = async (suggestion: SearchSuggestion) => {
    setTickerInput(suggestion.ticker);
    setShowSuggestions(false);
    setSuggestions([]);
    await handleAddTicker(suggestion.ticker);
  };

  const handleAddTicker = async (ticker?: string) => {
    const tickerToAdd = ticker || tickerInput.trim().toUpperCase();
    
    if (!tickerToAdd) {
      setError('Please enter a ticker symbol or select from suggestions');
      return;
    }

    // Check if ticker already exists
    if (watchlist.some(item => item.ticker === tickerToAdd)) {
      setError('This ticker is already in your watchlist');
      return;
    }

    setIsLoading(true);
    setError('');
    setShowSuggestions(false);

    try {
      // Fetch real-time data from API
      const tickerData = await fetchTickerData(tickerToAdd);
      
      if (!tickerData) {
        setError(`Ticker "${tickerToAdd}" not found. Please enter a valid US stock or cryptocurrency ticker (e.g., AAPL, BTC, ETH).`);
        setIsLoading(false);
        return;
      }

      // Add to watchlist
      const newWatchlistItem: WatchlistItem = {
        ticker: tickerData.ticker,
        name: tickerData.name,
        price: tickerData.price,
        change: tickerData.change,
      };

      onUpdateWatchlist([...watchlist, newWatchlistItem]);
      setTickerInput('');
      setError('');
      setSuggestions([]);
    } catch (err) {
      console.error('Error fetching ticker data:', err);
      setError('Failed to fetch ticker data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveTicker = (tickerToRemove: string) => {
    onUpdateWatchlist(watchlist.filter(item => item.ticker !== tickerToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      } else {
        handleAddTicker();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 p-4" 
      onClick={onClose}
    >
      <div 
        className="bg-black border border-white/10 rounded-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Manage Watchlist</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Add Ticker Section */}
        <div className="mb-6 relative">
          <label htmlFor="ticker-input" className="block text-sm font-medium text-gray-300 mb-2">
            Add Ticker (US Stocks & Crypto)
          </label>
          <div className="relative flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                id="ticker-input"
                type="text"
                value={tickerInput}
                onChange={(e) => {
                  setTickerInput(e.target.value);
                  setError('');
                }}
                onKeyDown={handleKeyPress}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="Search by ticker (AAPL) or name (Apple)..."
                disabled={isLoading}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              />
              
              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-black border border-white/10 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                >
                  {isSearching && (
                    <div className="px-4 py-3 text-sm text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Searching...
                    </div>
                  )}
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion.ticker}-${index}`}
                      type="button"
                      onClick={() => handleSelectSuggestion(suggestion)}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                        index === selectedIndex ? 'bg-white/10' : ''
                      } ${index > 0 ? 'border-t border-white/5' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">
                              {suggestion.ticker}
                            </span>
                            <span className={`text-xs px-1.5 py-0.5 rounded ${
                              suggestion.type === 'crypto'
                                ? 'bg-purple-500/20 text-purple-300'
                                : 'bg-blue-500/20 text-blue-300'
                            }`}>
                              {suggestion.type === 'crypto' ? 'Crypto' : 'Stock'}
                            </span>
                          </div>
                          <div className="text-sm text-gray-400 truncate mt-0.5">
                            {suggestion.name}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleAddTicker()}
              disabled={isLoading || !tickerInput.trim()}
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
            Search by ticker symbol (AAPL, BTC) or company name (Apple, Bitcoin). Select from suggestions or press Enter.
          </p>
        </div>

        {/* Watchlist Items */}
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Your Watchlist ({watchlist.length})
          </h3>
          {watchlist.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>Your watchlist is empty</p>
              <p className="text-sm mt-1">Add tickers above to track stocks</p>
            </div>
          ) : (
            <div className="space-y-2">
              {watchlist.map((item) => (
                <div
                  key={item.ticker}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white">{item.ticker}</div>
                    <div className="text-xs text-gray-400 truncate">{item.name}</div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-white">${item.price.toFixed(2)}</span>
                      <span
                        className={`text-xs font-medium ${
                          item.change >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {item.change >= 0 ? '+' : ''}
                        {item.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveTicker(item.ticker)}
                    className="ml-3 p-2 text-gray-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label={`Remove ${item.ticker}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
