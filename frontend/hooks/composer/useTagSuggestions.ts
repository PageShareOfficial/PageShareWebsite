'use client';

import { useEffect } from 'react';
import type { User } from '@/types';
import type { SearchSuggestion } from '@/utils/api/stockApi';
import type { ActiveTag } from '@/utils/composer/activeTag';
import { useAccountSearch } from '@/hooks/discover/useAccountSearch';
import { useTickerSearch } from '@/hooks/discover/useTickerSearch';

export interface TagSuggestions {
  tickers: SearchSuggestion[];
  accounts: User[];
  isSearching: boolean;
}

const ACCOUNT_SUGGESTION_LIMIT = 10;

/** Searches tickers for `$query` and accounts for `@query`, reusing the discover search hooks. */
export function useTagSuggestions(activeTag: ActiveTag | null): TagSuggestions {
  const tickerSearch = useTickerSearch({ minQueryLength: 1 });
  const accountSearch = useAccountSearch({ limit: ACCOUNT_SUGGESTION_LIMIT });
  const { setQuery: setTickerQuery } = tickerSearch;
  const { setQuery: setAccountQuery } = accountSearch;

  const tickerQuery = activeTag?.trigger === '$' ? activeTag.query : '';
  const accountQuery = activeTag?.trigger === '@' ? activeTag.query : '';

  useEffect(() => setTickerQuery(tickerQuery), [tickerQuery, setTickerQuery]);
  useEffect(() => setAccountQuery(accountQuery), [accountQuery, setAccountQuery]);

  return {
    tickers: tickerQuery ? tickerSearch.suggestions : [],
    accounts: accountQuery ? accountSearch.suggestions : [],
    isSearching: activeTag?.trigger === '$' ? tickerSearch.isSearching : accountSearch.isSearching,
  };
}
