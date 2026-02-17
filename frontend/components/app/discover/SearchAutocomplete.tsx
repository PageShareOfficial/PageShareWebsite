'use client';

import { useRef, useState } from 'react';
import { Search, Clock, X, User as UserIcon, TrendingUp } from 'lucide-react';
import { User } from '@/types';
import { SearchSuggestion } from '@/utils/api/stockApi';
import { RecentSearch } from '@/types/discover';
import ImageWithFallback from '@/components/app/common/ImageWithFallback';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import { useClickOutside } from '@/hooks/common/useClickOutside';
import { getInitials } from '@/utils/core/textFormatting';
import Skeleton from '@/components/app/common/Skeleton';
import TickerTypeBadge from '@/components/app/common/TickerTypeBadge';
import UserBadge from '@/components/app/common/UserBadge';

interface SearchAutocompleteProps {
  // Input props
  query: string;
  onQueryChange: (query: string) => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  placeholder?: string;
  disabled?: boolean;
  
  // Suggestions
  accountSuggestions?: User[];
  tickerSuggestions?: SearchSuggestion[];
  recentSearches?: RecentSearch[];
  isSearching?: boolean;
  showSuggestions?: boolean;
  onShowSuggestionsChange?: (show: boolean) => void;
  
  // Selection
  selectedIndex?: number;
  onSelectAccount?: (user: User) => void;
  onSelectTicker?: (suggestion: SearchSuggestion) => void;
  onSelectRecentSearch?: (search: RecentSearch) => void;
  onRemoveRecentSearch?: (id: string) => void;
  
  // UI customization
  className?: string;
  inputClassName?: string;
}

/**
 * Generic search autocomplete component
 * Supports both account and ticker suggestions
 * Extracted from ManageWatchlistModal for reusability
 */
export default function SearchAutocomplete({
  query,
  onQueryChange,
  onKeyDown,
  placeholder = 'Search @username or $TICKER...',
  disabled = false,
  accountSuggestions = [],
  tickerSuggestions = [],
  recentSearches = [],
  isSearching = false,
  showSuggestions = false,
  onShowSuggestionsChange,
  selectedIndex = -1,
  onSelectAccount,
  onSelectTicker,
  onSelectRecentSearch,
  onRemoveRecentSearch,
  className = '',
  inputClassName = '',
}: SearchAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  // Close suggestions when clicking outside
  useClickOutside({
    ref: suggestionsRef,
    handler: () => {
      onShowSuggestionsChange?.(false);
      setIsFocused(false);
    },
    enabled: showSuggestions || isFocused,
    additionalRefs: [inputRef],
  });

  const hasQuery = query.trim().length > 0;
  const totalSuggestions = accountSuggestions.length + tickerSuggestions.length;
  const hasSuggestions = totalSuggestions > 0;
  const hasRecentSearches = recentSearches.length > 0 && !hasQuery;
  // Show dropdown if:
  // 1. showSuggestions is true AND (there are suggestions OR recent searches), OR
  // 2. Input is focused AND there are recent searches (when no query) - this handles the click-to-show case
  const shouldShowDropdown = (showSuggestions && (hasSuggestions || hasRecentSearches)) || 
                             (isFocused && hasRecentSearches && !hasQuery);

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const getRecentSearchIcon = (type: 'account' | 'ticker') => {
    switch (type) {
      case 'account':
        return <UserIcon className="w-4 h-4" />;
      case 'ticker':
        return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            setIsFocused(true);
            // When search bar is focused/clicked, always show dropdown if:
            // 1. There are recent searches (when no query), OR
            // 2. There are suggestions (when query exists)
            if (!hasQuery && recentSearches.length > 0) {
              // Show recent searches dropdown
              onShowSuggestionsChange?.(true);
            } else if (hasSuggestions) {
              // Show suggestions dropdown
              onShowSuggestionsChange?.(true);
            }
          }}
          onClick={() => {
            setIsFocused(true);
            // Also trigger on click to ensure dropdown appears
            if (!hasQuery && recentSearches.length > 0) {
              onShowSuggestionsChange?.(true);
            } else if (hasSuggestions) {
              onShowSuggestionsChange?.(true);
            }
          }}
          onBlur={() => {
            // Don't set to false immediately - let click outside handler manage it
            // This prevents dropdown from closing when clicking inside it
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${inputClassName}`}
        />

        {/* Autocomplete Suggestions Dropdown */}
        {shouldShowDropdown && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-black border border-white/10 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {/* Recent Searches (shown when query is empty) */}
            {hasRecentSearches && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-gray-400 border-b border-white/5">
                  Recent Searches
                </div>
                {recentSearches.slice(0, 5).map((recent, index) => {
                  const isSelected = selectedIndex === index;
                  return (
                    <button
                      key={recent.id}
                      type="button"
                      onClick={() => onSelectRecentSearch?.(recent)}
                      className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center justify-between group ${
                        isSelected ? 'bg-white/10' : ''
                      } ${index > 0 ? 'border-t border-white/5' : ''}`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {recent.type === 'account' ? (
                          <AvatarWithFallback
                            src={recent.image}
                            alt={recent.resultName || recent.query}
                            size={40}
                            className="flex-shrink-0"
                            fallbackText={getInitials(recent.resultName || recent.query)}
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden">
                            <ImageWithFallback
                              src={recent.image}
                              alt={recent.resultName || recent.query}
                              className="w-full h-full"
                              fallback={
                                <div className="w-full h-full flex items-center justify-center p-1.5 rounded bg-purple-500/20 text-purple-400">
                                  {getRecentSearchIcon(recent.type)}
                                </div>
                              }
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {recent.resultName || recent.query}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-gray-400 truncate">
                              {recent.query}
                            </span>
                            <span className="text-xs text-gray-500">•</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimeAgo(recent.timestamp)}
                            </span>
                          </div>
                        </div>
                      </div>
                      {onRemoveRecentSearch && (
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveRecentSearch(recent.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              onRemoveRecentSearch(recent.id);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-opacity ml-2 cursor-pointer"
                          aria-label="Remove search"
                        >
                          <X className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Search Suggestions (shown when query has results) */}
            {hasQuery && (
              <>
                {/* Skeleton Loaders (shown while searching and no suggestions yet) */}
                {isSearching && totalSuggestions === 0 && (
                  <>
                    {/* Account Skeleton */}
                    {Array.from({ length: 2 }).map((_, index) => (
                      <div
                        key={`account-skeleton-${index}`}
                        className={`px-4 py-3 ${index > 0 || tickerSuggestions.length > 0 || recentSearches.length > 0 ? 'border-t border-white/5' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar skeleton */}
                          <Skeleton variant="rectangular" width={40} height={40} rounded="rounded-lg" className="flex-shrink-0" />
                          <div className="flex-1 min-w-0 space-y-2">
                            {/* Name skeleton */}
                            <Skeleton variant="text" width="75%" height={16} />
                            {/* Handle skeleton */}
                            <Skeleton variant="text" width="50%" height={12} />
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Ticker Skeleton */}
                    {Array.from({ length: 1 }).map((_, index) => (
                      <div
                        key={`ticker-skeleton-${index}`}
                        className={`px-4 py-3 ${index > 0 || accountSuggestions.length > 0 || recentSearches.length > 0 ? 'border-t border-white/5' : ''}`}
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

                {/* Account Suggestions */}
                {accountSuggestions.length > 0 && (
                  <>
                    {accountSuggestions.map((user, index) => {
                      const globalIndex = recentSearches.length + index;
                      const isSelected = selectedIndex === globalIndex;
                      
                      return (
                        <button
                          key={`account-${user.handle}-${index}`}
                          type="button"
                          onClick={() => onSelectAccount?.(user)}
                          className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                            isSelected ? 'bg-white/10' : ''
                          } ${index > 0 || tickerSuggestions.length > 0 || recentSearches.length > 0 ? 'border-t border-white/5' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden">
                              <ImageWithFallback
                                src={user.avatar}
                                alt={user.displayName}
                                className="w-full h-full"
                                fallback={
                                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-white bg-white/10">
                                    {getInitials(user.displayName)}
                                  </div>
                                }
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-white truncate">
                                  {user.displayName}
                                </span>
                                {user.badge && (
                                  <UserBadge badge={user.badge} size="sm" />
                                )}
                              </div>
                              <div className="text-sm text-gray-400 truncate mt-0.5">
                                @{user.handle}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Ticker Suggestions */}
                {tickerSuggestions.length > 0 && (
                  <>
                    {tickerSuggestions.map((suggestion, index) => {
                      const globalIndex = recentSearches.length + accountSuggestions.length + index;
                      const isSelected = selectedIndex === globalIndex;
                      
                      
                      return (
                        <button
                          key={`ticker-${suggestion.ticker}-${index}`}
                          type="button"
                          onClick={() => onSelectTicker?.(suggestion)}
                          className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                            isSelected ? 'bg-white/10' : ''
                          } ${index > 0 || accountSuggestions.length > 0 || recentSearches.length > 0 ? 'border-t border-white/5' : ''}`}
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
                  </>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
