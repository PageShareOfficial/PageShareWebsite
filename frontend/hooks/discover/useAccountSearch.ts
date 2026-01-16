import { useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import { searchUsers } from '@/utils/api/userSearchApi';
import { normalizeSearchQuery } from '@/utils/discover/searchUtils';

interface UseAccountSearchOptions {
  minQueryLength?: number; // Minimum characters before searching (default: 1)
  debounceMs?: number; // Debounce delay in milliseconds (default: 300)
  enabled?: boolean; // Whether search is enabled (default: true)
  limit?: number; // Maximum number of results (default: 20)
}

interface UseAccountSearchResult {
  query: string;
  setQuery: (query: string) => void;
  suggestions: User[];
  isSearching: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSelectSuggestion: (suggestion: User) => void;
  clearSuggestions: () => void;
  isClient: boolean;
}

/**
 * Hook for account/user search with debouncing and autocomplete
 * Similar pattern to useTickerSearch but searches for users
 */
export function useAccountSearch(
  options: UseAccountSearchOptions = {}
): UseAccountSearchResult {
  const {
    minQueryLength = 1,
    debounceMs = 300,
    enabled = true,
    limit = 20,
  } = options;

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
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

    // Normalize query (remove @ prefix)
    const normalizedQuery = normalizeSearchQuery(query);
    
    // If query is too short, clear suggestions
    if (normalizedQuery.length < minQueryLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);
    
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchUsers(normalizedQuery, limit);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Error searching users:', error);
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
  }, [query, isClient, enabled, minQueryLength, debounceMs, limit]);

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
  const handleSelectSuggestion = (suggestion: User) => {
    setQuery(`@${suggestion.handle}`);
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
