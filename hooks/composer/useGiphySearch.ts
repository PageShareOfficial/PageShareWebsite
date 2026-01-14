import { useState, useEffect } from 'react';

interface UseGiphySearchResult {
  gifSearchQuery: string;
  debouncedGifSearch: string;
  setGifSearchQuery: (query: string) => void;
  clearGifSearch: () => void;
}

/**
 * Hook to manage Giphy search query with debouncing
 * Debounces search query to avoid excessive API calls
 */
export function useGiphySearch(): UseGiphySearchResult {
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [debouncedGifSearch, setDebouncedGifSearch] = useState('');

  // Debounce GIF search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGifSearch(gifSearchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [gifSearchQuery]);

  const clearGifSearch = () => {
    setGifSearchQuery('');
    setDebouncedGifSearch('');
  };

  return {
    gifSearchQuery,
    debouncedGifSearch,
    setGifSearchQuery,
    clearGifSearch,
  };
}

