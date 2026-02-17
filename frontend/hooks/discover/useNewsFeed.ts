import { useState, useEffect, useCallback, useRef } from 'react';
import { NewsArticle, NewsCategory } from '@/types/discover';
import { getBaseUrl } from '@/lib/api/client';
import { getCachedNews, setCachedNews, removeExpiredNewsCacheEntries } from '@/utils/discover/newsCacheUtils';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

const API_BASE = getBaseUrl();
const NEWS_ENDPOINT = API_BASE ? `${API_BASE}/api/v1/news` : '/api/news';

// Page 1: 20 articles, page 2+: 10 articles
const PAGE1_SIZE = 20;
const PAGE2_PLUS_SIZE = 10;

interface UseNewsFeedOptions {
  category?: NewsCategory;
  autoRefresh?: boolean;
  refreshInterval?: number;
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
}

/**
 * Hook to fetch and manage news feed by category.
 * No search. Page 1: 20 articles, page 2+: 10 articles.
 */
export function useNewsFeed(options: UseNewsFeedOptions = {}): UseNewsFeedResult {
  const {
    category: initialCategory = 'all',
    autoRefresh = false,
    refreshInterval = 15 * 60 * 1000,
    initialPage = 1,
  } = options;

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [category, setCategory] = useState<NewsCategory>(initialCategory);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(initialPage);
  const [hasMore, setHasMore] = useState(true);

  const ongoingRequestsRef = useRef<Map<string, Promise<{ articles: NewsArticle[]; totalArticles: number }>>>(new Map());

  // Clean expired cache entries once when hook is first used
  useEffect(() => {
    removeExpiredNewsCacheEntries();
  }, []);

  const getExpectedSize = (pageNum: number) => (pageNum === 1 ? PAGE1_SIZE : PAGE2_PLUS_SIZE);

  const loadNews = useCallback(async (cat: NewsCategory, pageNum: number, append: boolean = false) => {
    setIsLoading(true);
    setError(null);

    try {
      let newArticles: NewsArticle[] = [];
      let totalArticles = 0;

      const cached = getCachedNews(cat, pageNum);
      if (cached) {
        newArticles = cached.articles;
        totalArticles = cached.totalArticles;

        if (append) {
          setArticles((prev) => {
            const updated = [...prev, ...newArticles];
            setHasMore(totalArticles > 0 ? updated.length < totalArticles : newArticles.length === getExpectedSize(pageNum));
            return updated;
          });
        } else {
          setArticles(newArticles);
          setHasMore(totalArticles > 0 ? newArticles.length < totalArticles : newArticles.length === getExpectedSize(pageNum));
        }
        setIsLoading(false);
        return;
      }

      const requestKey = `${cat}_${pageNum}`;
      const ongoingRequest = ongoingRequestsRef.current.get(requestKey);
      if (ongoingRequest) {
        const result = await ongoingRequest;
        if (append) {
          setArticles((prev) => {
            const updated = [...prev, ...result.articles];
            setHasMore(result.totalArticles > 0 ? updated.length < result.totalArticles : result.articles.length === getExpectedSize(pageNum));
            return updated;
          });
        } else {
          setArticles(result.articles);
          setHasMore(result.totalArticles > 0 ? result.articles.length < result.totalArticles : result.articles.length === getExpectedSize(pageNum));
        }
        setIsLoading(false);
        return;
      }

      const apiUrl = `${NEWS_ENDPOINT}?category=${cat}&page=${pageNum}`;

      const requestPromise = (async (): Promise<{ articles: NewsArticle[]; totalArticles: number }> => {
        try {
          const response = await fetch(apiUrl);
          if (!response.ok) {
            throw new Error(`Failed to fetch news: ${response.statusText}`);
          }
          const data = await response.json();
          const items = data.articles || [];
          const total = data.totalArticles || 0;

          if (items.length > 0) {
            setCachedNews(cat, pageNum, items, total);
          }

          if (append) {
            setArticles((prev) => {
              const updated = [...prev, ...items];
              setHasMore(total > 0 ? updated.length < total : items.length === getExpectedSize(pageNum));
              return updated;
            });
          } else {
            setArticles(items);
            setHasMore(total > 0 ? items.length < total : items.length === getExpectedSize(pageNum));
          }

          return { articles: items, totalArticles: total };
        } finally {
          ongoingRequestsRef.current.delete(requestKey);
        }
      })();

      ongoingRequestsRef.current.set(requestKey, requestPromise);
      await requestPromise;
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load news. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialCategory !== category) {
      setCategory(initialCategory);
    }
  }, [initialCategory, category]);

  useEffect(() => {
    loadNews(category, 1, false).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPage(1);
    setArticles([]);
    loadNews(category, 1, false);
  }, [category, loadNews]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => loadNews(category, 1, false), refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, category, loadNews]);

  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await loadNews(category, nextPage, true);
  }, [isLoading, hasMore, page, category, loadNews]);

  const refresh = useCallback(async () => {
    setPage(1);
    setArticles([]);
    await loadNews(category, 1, false);
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
  };
}
