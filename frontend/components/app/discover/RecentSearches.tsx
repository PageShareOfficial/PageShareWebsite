'use client';

import { X, User, DollarSign, TrendingUp, Clock } from 'lucide-react';
import { useRecentSearches } from '@/hooks/discover/useRecentSearches';
import { RecentSearch } from '@/types/discover';
import { useRouter } from 'next/navigation';

interface RecentSearchesProps {
  onSearchClick?: (query: string, type: 'account' | 'stock' | 'crypto') => void;
  maxDisplay?: number; // Max items to display per type
  className?: string;
}

/**
 * Recent searches sidebar component
 * Shows recent searches grouped by type
 * Click to re-search, clear individual or all
 */
export default function RecentSearches({
  onSearchClick,
  maxDisplay = 5,
  className = '',
}: RecentSearchesProps) {
  const router = useRouter();
  const {
    recentSearches,
    recentSearchesByType,
    removeSearch,
    clearAll,
    isClient,
  } = useRecentSearches();

  if (!isClient) {
    return null;
  }

  const handleSearchClick = (search: RecentSearch) => {
    if (onSearchClick) {
      onSearchClick(search.query, search.type);
    } else {
      // Default behavior: navigate or perform search
      if (search.type === 'account' && search.resultId) {
        router.push(`/${search.resultId}`);
      }
      // For tickers, no default behavior when onSearchClick is not provided
    }
  };

  const handleRemoveClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeSearch(id);
  };

  const getTypeIcon = (type: 'account' | 'stock' | 'crypto') => {
    switch (type) {
      case 'account':
        return <User className="w-4 h-4" />;
      case 'crypto':
        return <TrendingUp className="w-4 h-4" />;
      case 'stock':
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: 'account' | 'stock' | 'crypto') => {
    switch (type) {
      case 'account':
        return 'Accounts';
      case 'crypto':
        return 'Crypto';
      case 'stock':
        return 'Stocks';
    }
  };

  const getTypeColor = (type: 'account' | 'stock' | 'crypto') => {
    switch (type) {
      case 'account':
        return 'text-blue-400';
      case 'crypto':
        return 'text-purple-400';
      case 'stock':
        return 'text-green-400';
    }
  };

  // Format timestamp to relative time
  const formatTimeAgo = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const displayAccounts = recentSearchesByType.accounts.slice(0, maxDisplay);
  const displayStocks = recentSearchesByType.stocks.slice(0, maxDisplay);
  const displayCryptos = recentSearchesByType.cryptos.slice(0, maxDisplay);
  const hasAnySearches = recentSearches.length > 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Recent Searches</h3>
        {hasAnySearches && (
          <button
            onClick={clearAll}
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {!hasAnySearches ? (
        <div className="text-center py-8 text-gray-400">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent searches</p>
          <p className="text-xs mt-1 text-gray-500">
            Your searches will appear here
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Accounts */}
          {displayAccounts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-400" />
                {getTypeLabel('account')}
              </h4>
              <div className="space-y-1">
                {displayAccounts.map((search) => (
                  <div
                    key={search.id}
                    onClick={() => handleSearchClick(search)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getTypeIcon(search.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">
                          {search.resultName || search.query}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="truncate">{search.query}</span>
                          <span>·</span>
                          <span>{formatTimeAgo(search.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveClick(e, search.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      aria-label="Remove search"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stocks */}
          {displayStocks.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-400" />
                {getTypeLabel('stock')}
              </h4>
              <div className="space-y-1">
                {displayStocks.map((search) => (
                  <div
                    key={search.id}
                    onClick={() => handleSearchClick(search)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getTypeIcon(search.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">
                          {search.resultId || search.query}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="truncate">{search.resultName || search.query}</span>
                          <span>·</span>
                          <span>{formatTimeAgo(search.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveClick(e, search.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      aria-label="Remove search"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Crypto */}
          {displayCryptos.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-purple-400" />
                {getTypeLabel('crypto')}
              </h4>
              <div className="space-y-1">
                {displayCryptos.map((search) => (
                  <div
                    key={search.id}
                    onClick={() => handleSearchClick(search)}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {getTypeIcon(search.type)}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-white truncate">
                          {search.resultId || search.query}
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <span className="truncate">{search.resultName || search.query}</span>
                          <span>·</span>
                          <span>{formatTimeAgo(search.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveClick(e, search.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-white/10 rounded transition-all"
                      aria-label="Remove search"
                    >
                      <X className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
