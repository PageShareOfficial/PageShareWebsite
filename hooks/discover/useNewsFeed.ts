import { useState, useEffect, useCallback, useRef } from 'react';
import { NewsArticle, NewsCategory } from '@/types/discover';
import { getCachedNews, setCachedNews } from '@/utils/discover/newsCacheUtils';

interface UseNewsFeedOptions {
  category?: NewsCategory;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds (default: 5 minutes)
  initialPage?: number;
}

interface UseNewsFeedResult {
  articles: NewsArticle[];
  category: NewsCategory;
  setCategory: (category: NewsCategory) => void;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  searchNews: (query: string) => Promise<void>;
  clearSearch: () => void;
  isSearching: boolean;
}

/**
 * Hook to fetch and manage news feed
 * Supports category filtering, pagination, search, and auto-refresh
 */
export function useNewsFeed(options: UseNewsFeedOptions = {}): UseNewsFeedResult {
  const {
    category: initialCategory = 'all',
    autoRefresh = false, // Default to false to control API calls and reduce usage
    refreshInterval = 15 * 60 * 1000, // 15 minutes
    initialPage = 1,
  } = options;

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState<NewsCategory>(initialCategory);
  const [isLoading, setIsLoading] = useState(true); // Start with loading = true to show loading state
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  // Track ongoing requests to prevent duplicates
  const ongoingRequestsRef = useRef<Map<string, Promise<{ articles: NewsArticle[]; totalArticles: number }>>>(new Map());

  // Load news articles with client-side caching
  const loadNews = useCallback(async (cat: NewsCategory, pageNum: number, append: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      let newArticles: NewsArticle[] = [];
      let totalArticles = 0;

      // Check cache first (skip cache for search queries)
      if (!searchQuery) {
        const cached = getCachedNews(cat, pageNum);
        if (cached) {
          newArticles = cached.articles;
          totalArticles = cached.totalArticles;
          
          if (append) {
            setArticles((prev) => {
              const updated = [...prev, ...newArticles];
              if (totalArticles > 0) {
                setHasMore(updated.length < totalArticles);
              } else {
                setHasMore(newArticles.length === 5 || newArticles.length === 20);
              }
              return updated;
            });
          } else {
            setArticles(newArticles);
            if (totalArticles > 0) {
              setHasMore(newArticles.length < totalArticles);
            } else {
              setHasMore(newArticles.length === 5 || newArticles.length === 20);
            }
          }
          setIsLoading(false);
          return;
        }
      }

      // Create a unique key for this request
      const requestKey = searchQuery 
        ? `search_${searchQuery}_${pageNum}`
        : `${cat}_${pageNum}`;

      // Check if there's already an ongoing request for this key
      const ongoingRequest = ongoingRequestsRef.current.get(requestKey);
      if (ongoingRequest) {
        // Wait for the existing request to complete and use its result
        const result = await ongoingRequest;
        if (append) {
          setArticles((prev) => {
            const updated = [...prev, ...result.articles];
            if (result.totalArticles > 0) {
              setHasMore(updated.length < result.totalArticles);
            } else {
              const expectedSize = pageNum === 1 ? 5 : 20;
              setHasMore(result.articles.length === expectedSize);
            }
            return updated;
          });
        } else {
          setArticles(result.articles);
          if (result.totalArticles > 0) {
            setHasMore(result.articles.length < result.totalArticles);
          } else {
            const expectedSize = pageNum === 1 ? 5 : 20;
            setHasMore(result.articles.length === expectedSize);
          }
        }
        setIsLoading(false);
        return;
      }

      // Fetch from API if not cached
      const apiUrl = searchQuery 
        ? `/api/news?q=${encodeURIComponent(searchQuery)}&page=${pageNum}`
        : `/api/news?category=${cat}&page=${pageNum}`;

      // Create and store the request promise
      const requestPromise = (async (): Promise<{ articles: NewsArticle[]; totalArticles: number }> => {
        try {
          const response = await fetch(apiUrl);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch news: ${response.statusText}`);
          }
          
          const data = await response.json();
          
          const newArticles = data.articles || [];
          const totalArticles = data.totalArticles || 0;
          
          // Cache the results (only for category-based queries, not search)
          if (!searchQuery && newArticles.length > 0) {
            setCachedNews(cat, pageNum, newArticles, totalArticles);
          }

          if (append) {
            setArticles((prev) => {
              const updated = [...prev, ...newArticles];
              if (totalArticles > 0) {
                setHasMore(updated.length < totalArticles);
              } else {
                const expectedSize = pageNum === 1 ? 5 : 20;
                setHasMore(newArticles.length === expectedSize);
              }
              return updated;
            });
          } else {
            setArticles(newArticles);
            if (totalArticles > 0) {
              setHasMore(newArticles.length < totalArticles);
            } else {
              const expectedSize = pageNum === 1 ? 5 : 20;
              setHasMore(newArticles.length === expectedSize);
            }
          }

          return { articles: newArticles, totalArticles };
        } finally {
          // Remove the request from ongoing requests
          ongoingRequestsRef.current.delete(requestKey);
        }
      })();

      // Store the request promise
      ongoingRequestsRef.current.set(requestKey, requestPromise);
      
      // Wait for the request to complete
      await requestPromise;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load news. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery]);

  // Sync internal category state with prop changes
  useEffect(() => {
    if (initialCategory !== category) {
      // Clear search when category changes via prop
      if (searchQuery) {
        setSearchQuery(null);
        setIsSearching(false);
      }
      setCategory(initialCategory);
    }
  }, [initialCategory, category, searchQuery]);

  // Initial load
  useEffect(() => {
    loadNews(category, 1, false).catch(() => {
      // Error already handled in loadNews
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // Reload when category changes (this will be debounced by NewsSection)
  useEffect(() => {
    if (searchQuery) return; // Don't reload if searching
    setPage(1);
    setArticles([]);
    loadNews(category, 1, false);
  }, [category, loadNews, searchQuery]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || searchQuery) return;

    const interval = setInterval(() => {
      loadNews(category, 1, false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, category, loadNews, searchQuery]);

  // Load more (pagination)
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    const nextPage = page + 1;
    setPage(nextPage);
    await loadNews(category, nextPage, true);
  }, [isLoading, hasMore, page, category, loadNews]);

  // Refresh current page
  const refresh = useCallback(async () => {
    setPage(1);
    setArticles([]);
    await loadNews(category, 1, false);
  }, [category, loadNews]);

  // Search news
  const searchNews = useCallback(async (query: string) => {
    if (!query.trim()) {
      clearSearch();
      return;
    }

    setIsSearching(true);
    setSearchQuery(query);
    setPage(1);
    setArticles([]);
    setError(null);

    try {
      const response = await fetch(`/api/news?q=${encodeURIComponent(query)}&page=1`);
      if (!response.ok) {
        throw new Error(`Failed to search news: ${response.statusText}`);
      }
      const data = await response.json();
      const results = data.articles || [];
      const totalArticles = data.totalArticles || 0;
      setArticles(results);
      
      // Use totalArticles if available, otherwise estimate based on results
      if (totalArticles > 0) {
        setHasMore(results.length < totalArticles);
      } else {
        // For search, page 1 uses 5 articles
        setHasMore(results.length === 5 || results.length === 20);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search news. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery(null);
    setPage(1);
    setArticles([]);
    setIsSearching(false);
    loadNews(category, 1, false);
  }, [category, loadNews]);

  return {
    articles,
    category,
    setCategory,
    isLoading,
    error,
    page,
    hasMore,
    loadMore,
    refresh,
    searchNews,
    clearSearch,
    isSearching,
  };
}
