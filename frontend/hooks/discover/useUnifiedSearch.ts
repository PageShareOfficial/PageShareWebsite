import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/types';
import { SearchSuggestion } from '@/utils/api/stockApi';
import { SearchResult } from '@/types/discover';
import { detectSearchType, normalizeSearchQuery, shouldSearchAccounts, shouldSearchTickers } from '@/utils/discover/searchUtils';
import { navigateToProfile, navigateToTicker } from '@/utils/core/navigationUtils';
import { useTickerSearch } from './useTickerSearch';
import { useAccountSearch } from './useAccountSearch';
import { useRecentSearches } from './useRecentSearches';

interface UseUnifiedSearchOptions {
  minQueryLength?: number;
  debounceMs?: number;
  enabled?: boolean;
  onSearchResult?: (result: SearchResult) => void; // Callback when user selects a result
}

interface UseUnifiedSearchResult {
  query: string;
  setQuery: (query: string) => void;
  accountSuggestions: User[];
  tickerSuggestions: SearchSuggestion[];
  isSearching: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  selectedIndex: number;
  setSelectedIndex: (index: number) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleSelectAccount: (user: User) => void;
  handleSelectTicker: (suggestion: SearchSuggestion) => void;
  clearSuggestions: () => void;
  searchType: 'account' | 'ticker' | 'unknown';
  isClient: boolean;
}

/**
 * Unified search hook that combines account and ticker search
 * Automatically detects search type and searches accordingly
 * Handles navigation and recent searches
 */
export function useUnifiedSearch(
  options: UseUnifiedSearchOptions = {}
): UseUnifiedSearchResult {
  const {
    minQueryLength = 1,
    debounceMs = 300,
    enabled = true,
    onSearchResult,
  } = options;

  const router = useRouter();
  const { addSearch } = useRecentSearches();

  // Use individual search hooks
  const tickerSearch = useTickerSearch({
    minQueryLength: 2, // Tickers need at least 2 chars
    debounceMs,
    enabled: enabled && shouldSearchTickers(''), // Will be updated dynamically
  });

  const accountSearch = useAccountSearch({
    minQueryLength: 1,
    debounceMs,
    enabled: enabled && shouldSearchAccounts(''), // Will be updated dynamically
    limit: 10, // Limit account results
  });

  // Unified query state
  const [query, setQuery] = useState('');
  const [searchType, setSearchType] = useState<'account' | 'ticker' | 'unknown'>('unknown');

  // Update search type when query changes
  const updateSearchType = useCallback((newQuery: string) => {
    const detected = detectSearchType(newQuery);
    setSearchType(detected);
    
    // Update individual hooks' enabled state
    const shouldSearchAcc = shouldSearchAccounts(newQuery);
    const shouldSearchTick = shouldSearchTickers(newQuery);
    
    // Note: We can't directly control enabled state of hooks, so we'll filter results instead
  }, []);

  // Sync query to both hooks
  const handleSetQuery = useCallback((newQuery: string) => {
    setQuery(newQuery);
    updateSearchType(newQuery);
    
    // Normalize query (remove @ and $ prefixes)
    const normalized = normalizeSearchQuery(newQuery);
    
    // Update individual hooks based on search type
    // If type is unknown, update both; otherwise update only the relevant one
    const searchType = detectSearchType(newQuery);
    if (searchType === 'unknown') {
      // Unknown type: search both (let both hooks search with the normalized query)
      tickerSearch.setQuery(normalized);
      accountSearch.setQuery(normalized);
    } else if (searchType === 'ticker') {
      // Ticker type: only search tickers
      tickerSearch.setQuery(normalized);
      accountSearch.setQuery(''); // Clear account search
    } else if (searchType === 'account') {
      // Account type: only search accounts
      accountSearch.setQuery(normalized);
      tickerSearch.setQuery(''); // Clear ticker search
    }
  }, [updateSearchType, tickerSearch, accountSearch]);

  // Combined suggestions (prioritize accounts, then tickers)
  const accountSuggestions = shouldSearchAccounts(query) ? accountSearch.suggestions : [];
  const tickerSuggestions = shouldSearchTickers(query) ? tickerSearch.suggestions : [];
  
  // Combined loading state
  const isSearching = accountSearch.isSearching || tickerSearch.isSearching;
  
  // Combined show suggestions
  const showSuggestions = (accountSearch.showSuggestions || tickerSearch.showSuggestions) && 
                          (accountSuggestions.length > 0 || tickerSuggestions.length > 0);
  
  // Unified selected index (accounts first, then tickers)
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const totalSuggestions = accountSuggestions.length + tickerSuggestions.length;

  // Handle account selection
  const handleSelectAccount = useCallback((user: User) => {
    // Save to recent searches
    addSearch({
      query: `@${user.handle}`,
      type: 'account',
      resultId: user.handle,
      resultName: user.displayName,
      image: user.avatar, // Include avatar image
    });

    // Navigate to user profile
    navigateToProfile(user.handle, router);

    // Call callback if provided
    if (onSearchResult) {
      onSearchResult({ type: 'account', data: user });
    }

    // Clear suggestions
    accountSearch.clearSuggestions();
    tickerSearch.clearSuggestions();
    setQuery('');
  }, [router, addSearch, onSearchResult, accountSearch, tickerSearch]);

  // Handle ticker selection
  const handleSelectTicker = useCallback(async (suggestion: SearchSuggestion) => {
    const ticker = suggestion.ticker.toUpperCase();
    
    // Determine correct type: prioritize stock detection for common stock patterns
    // Known crypto tickers should be crypto, everything else that looks like a stock should be stock
    const knownCryptoTickers = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'AVAX', 'LTC', 'LINK', 'UNI', 'ATOM', 'ETC', 'XLM', 'ALGO', 'VET', 'ICP'];
    const isKnownCrypto = knownCryptoTickers.includes(ticker);
    const isLikelyStock = ticker.length <= 5 && /^[A-Z]+$/.test(ticker) && !isKnownCrypto;
    
    // Use correct type: if it's a known crypto, use crypto; if it's likely a stock, use stock; otherwise use suggestion type
    const correctType = isKnownCrypto ? 'crypto' : (isLikelyStock ? 'stock' : (suggestion.type === 'crypto' ? 'crypto' : 'stock'));
    
    // Save to recent searches with correct type
    addSearch({
      query: suggestion.ticker,
      type: correctType,
      resultId: suggestion.ticker,
      resultName: suggestion.name,
      image: suggestion.image, // Include ticker logo/image
    });

    // Navigate directly to ticker detail page
    navigateToTicker(suggestion.ticker, router);

    // Clear suggestions
    accountSearch.clearSuggestions();
    tickerSearch.clearSuggestions();
    setQuery('');
  }, [router, addSearch, accountSearch, tickerSearch]);

  // Unified keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0) {
        if (selectedIndex < accountSuggestions.length) {
          // Account suggestion
          handleSelectAccount(accountSuggestions[selectedIndex]);
        } else {
          // Ticker suggestion
          const tickerIndex = selectedIndex - accountSuggestions.length;
          handleSelectTicker(tickerSuggestions[tickerIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => 
        prev < totalSuggestions - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      accountSearch.setShowSuggestions(false);
      tickerSearch.setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  }, [
    selectedIndex,
    accountSuggestions,
    tickerSuggestions,
    totalSuggestions,
    handleSelectAccount,
    handleSelectTicker,
    accountSearch,
    tickerSearch,
  ]);

  // Clear all suggestions
  const clearSuggestions = useCallback(() => {
    accountSearch.clearSuggestions();
    tickerSearch.clearSuggestions();
    setQuery('');
    setSelectedIndex(-1);
  }, [accountSearch, tickerSearch]);

  return {
    query,
    setQuery: handleSetQuery,
    accountSuggestions,
    tickerSuggestions,
    isSearching,
    showSuggestions,
    setShowSuggestions: (show: boolean) => {
      accountSearch.setShowSuggestions(show);
      tickerSearch.setShowSuggestions(show);
    },
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    handleSelectAccount,
    handleSelectTicker,
    clearSuggestions,
    searchType,
    isClient: accountSearch.isClient && tickerSearch.isClient,
  };
}
