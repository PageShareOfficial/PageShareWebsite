'use client';

import { useRouter } from 'next/navigation';
import { SearchResult } from '@/types/discover';
import { User } from '@/types';
import { StockData } from '@/utils/api/stockApi';
import { navigateToTicker } from '@/utils/core/navigationUtils';
import AccountSearchResult from './AccountSearchResult';
import TickerSearchResult from './TickerSearchResult';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import { WatchlistItem } from '@/types';
import LoadingState from '@/components/app/common/LoadingState';
import EmptyState from '@/components/app/common/EmptyState';
interface SearchResultsContainerProps {
  results: SearchResult[];
  isLoading: boolean;
  onAccountFollowChange?: () => void;
  className?: string;
}

/**
 * Container component that displays search results
 * Shows AccountSearchResult for accounts and TickerSearchResult for tickers
 */
export default function SearchResultsContainer({
  results,
  isLoading,
  onAccountFollowChange,
  className = '',
}: SearchResultsContainerProps) {
  const router = useRouter();
  const { currentUser } = useCurrentUser();
  const { watchlist, setWatchlist } = useWatchlist();

  const handleAddToWatchlist = (item: WatchlistItem) => {
    setWatchlist((prev) => [...prev, item]);
  };

  const handleTickerClick = (ticker: string) => {
    navigateToTicker(ticker, router);
  };

  // Separate results by type
  const accountResults = results.filter((r): r is { type: 'account'; data: User } => r.type === 'account');
  const stockResults = results.filter((r): r is { type: 'stock'; data: StockData } => r.type === 'stock');
  const cryptoResults = results.filter((r): r is { type: 'crypto'; data: StockData } => r.type === 'crypto');

  if (isLoading) {
    return <LoadingState text="Searching..." className={className} />;
  }

  if (results.length === 0) {
    return (
      <EmptyState
        icon="search"
        title="No results found"
        description="Try a different query or check for typos."
        className={className}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Account Results */}
      {accountResults.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Accounts ({accountResults.length})
          </h3>
          <div className="space-y-3">
            {accountResults.map((result) => (
              <AccountSearchResult
                key={result.data.handle}
                user={result.data}
              />
            ))}
          </div>
        </div>
      )}

      {/* Stock Results */}
      {stockResults.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Stocks ({stockResults.length})
          </h3>
          <div className="space-y-3">
            {stockResults.map((result) => (
              <TickerSearchResult
                key={result.data.ticker}
                tickerData={result.data}
                type="stock"
                watchlist={watchlist}
                onAddToWatchlist={handleAddToWatchlist}
                onTickerClick={handleTickerClick}
              />
            ))}
          </div>
        </div>
      )}

      {/* Crypto Results */}
      {cryptoResults.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-gray-300 mb-3">
            Cryptocurrencies ({cryptoResults.length})
          </h3>
          <div className="space-y-3">
            {cryptoResults.map((result) => (
              <TickerSearchResult
                key={result.data.ticker}
                tickerData={result.data}
                type="crypto"
                watchlist={watchlist}
                onAddToWatchlist={handleAddToWatchlist}
                onTickerClick={handleTickerClick}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
