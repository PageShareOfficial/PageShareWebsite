'use client';

import SearchAutocomplete from './SearchAutocomplete';
import { useUnifiedSearch } from '@/hooks/discover/useUnifiedSearch';
import { useRecentSearches } from '@/hooks/discover/useRecentSearches';
import { SearchResult } from '@/types/discover';
import { useRouter } from 'next/navigation';
import { navigateToProfile, navigateToTicker } from '@/utils/core/navigationUtils';
import { RecentSearch } from '@/types/discover';

interface DiscoverSearchBarProps {
  onSearchResult?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Main search bar component for Discover page
 * Integrates SearchAutocomplete with useUnifiedSearch hook
 * Handles both account and ticker search
 */
export default function DiscoverSearchBar({
  onSearchResult,
  placeholder = 'Search @username or $TICKER...',
  className = '',
}: DiscoverSearchBarProps) {
  const router = useRouter();
  const { recentSearches, removeSearch, isClient } = useRecentSearches();
  
  const unifiedSearch = useUnifiedSearch({
    minQueryLength: 1,
    debounceMs: 300,
    enabled: true,
    onSearchResult: (result) => {
      // Call parent callback if provided
      onSearchResult?.(result);
    },
  });

  const handleSelectRecentSearch = (search: RecentSearch) => {
    if (search.type === 'account' && search.resultId) {
      navigateToProfile(search.resultId, router);
    } else if ((search.type === 'stock' || search.type === 'crypto') && search.resultId) {
      // For tickers, navigate directly to ticker detail page
      navigateToTicker(search.resultId, router);
    }
  };

  // Enhanced keyboard handler that accounts for recent searches
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const hasQuery = unifiedSearch.query.trim().length > 0;
    const hasRecentSearches = isClient && recentSearches.length > 0 && !hasQuery;
    const recentSearchesCount = hasRecentSearches ? Math.min(recentSearches.length, 5) : 0;

    if (hasRecentSearches) {
      // Handle keyboard navigation for recent searches
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const currentIndex = unifiedSearch.selectedIndex;
        unifiedSearch.setSelectedIndex(
          currentIndex < recentSearchesCount - 1 ? currentIndex + 1 : currentIndex
        );
        return;
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const currentIndex = unifiedSearch.selectedIndex;
        unifiedSearch.setSelectedIndex(currentIndex > 0 ? currentIndex - 1 : -1);
        return;
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (unifiedSearch.selectedIndex >= 0 && unifiedSearch.selectedIndex < recentSearchesCount) {
          handleSelectRecentSearch(recentSearches[unifiedSearch.selectedIndex]);
        }
        return;
      } else if (e.key === 'Escape') {
        e.preventDefault();
        unifiedSearch.setShowSuggestions(false);
        unifiedSearch.setSelectedIndex(-1);
        return;
      }
    }

    // For query-based suggestions, use the unified search handler
    unifiedSearch.handleKeyDown(e);
  };

  return (
    <div className={className}>
      <SearchAutocomplete
        query={unifiedSearch.query}
        onQueryChange={unifiedSearch.setQuery}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={!unifiedSearch.isClient || !isClient}
        accountSuggestions={unifiedSearch.accountSuggestions}
        tickerSuggestions={unifiedSearch.tickerSuggestions}
        recentSearches={isClient ? recentSearches : []}
        isSearching={unifiedSearch.isSearching}
        showSuggestions={unifiedSearch.showSuggestions}
        onShowSuggestionsChange={unifiedSearch.setShowSuggestions}
        selectedIndex={unifiedSearch.selectedIndex}
        onSelectAccount={unifiedSearch.handleSelectAccount}
        onSelectTicker={unifiedSearch.handleSelectTicker}
        onSelectRecentSearch={handleSelectRecentSearch}
        onRemoveRecentSearch={removeSearch}
      />
    </div>
  );
}
