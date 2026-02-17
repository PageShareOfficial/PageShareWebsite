import { useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import { searchUsersBackend } from '@/lib/api/searchApi';
import { normalizeSearchQuery } from '@/utils/discover/searchUtils';
import { useAuth } from '@/contexts/AuthContext';

interface UseAccountSearchOptions {
  minQueryLength?: number;
  debounceMs?: number;
  enabled?: boolean;
  limit?: number;
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
 * Account search: backend is source of truth (GET /search?type=users).
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

  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<User[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isClient, setIsClient] = useState(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !enabled) return;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const normalizedQuery = normalizeSearchQuery(query);

    if (normalizedQuery.length < minQueryLength) {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedIndex(-1);
      return;
    }

    setIsSearching(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const results = await searchUsersBackend(normalizedQuery, limit, accessToken);
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
  }, [query, isClient, enabled, minQueryLength, debounceMs, limit, accessToken]);

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

  const handleSelectSuggestion = (suggestion: User) => {
    setQuery(`@${suggestion.handle}`);
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

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
