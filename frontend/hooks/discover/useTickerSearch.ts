import { useState, useEffect, useRef } from 'react';
import { searchTickers, SearchSuggestion } from '@/utils/api/stockApi';

interface UseTickerSearchOptions {
  minQueryLength?: number; // Minimum characters before searching (default: 2)
  debounceMs?: number; // Debounce delay in milliseconds (default: 300)
  enabled?: boolean; // Whether search is enabled (default: true)
}

interface UseTickerSearchResult {
  query: string;
  setQuery: (query: string) => void;
  suggestions: SearchSuggestion[];
  isSearching: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSelectSuggestion: (suggestion: SearchSuggestion) => void;
  clearSuggestions: () => void;
  isClient: boolean;
}

/**
 * Hook for ticker search with debouncing and autocomplete
 * Extracted from ManageWatchlistModal for reusability
 */
export function useTickerSearch(
  options: UseTickerSearchOptions = {}
): UseTickerSearchResult {
  const {
    minQueryLength = 2,
    debounceMs = 300,
    enabled = true,
  } = options;

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isClient, setIsClient] = useState(false);
  
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set client-side flag
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debounced search for autocomplete
  useEffect(() => {
    if (!isClient || !enabled) return;

    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmedQuery = query.trim();
    
    // If query is too short, clear suggestions
    if (trimmedQuery.length < minQueryLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchTickers(trimmedQuery);
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
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, isClient, enabled, minQueryLength, debounceMs]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleSelectSuggestion(suggestions[selectedIndex]);
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
      setSelectedIndex(-1);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.ticker);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  // Clear all suggestions
  const clearSuggestions = () => {
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  return {
    query,
    setQuery,
    suggestions,
    isSearching,
    showSuggestions,
    setShowSuggestions,
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    handleSelectSuggestion,
    clearSuggestions,
    isClient,
  };
}
