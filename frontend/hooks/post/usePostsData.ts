import { useState, useEffect, useCallback, useRef } from 'react';
import { Post } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { getBaseUrl } from '@/lib/api/client';
import { listFeed, listPosts, mapPostResponseToPost, ListPostsResponse } from '@/lib/api/postApi';
import {
  CACHE_TTL_MS,
  getFeedCache,
  setFeedCache,
  clearFeedCache,
  isFeedCacheValid,
} from '@/lib/feedCache';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface UsePostsDataProps {
  page?: number;
  perPage?: number;
  /** User ID to load that user's posts (profile). Pass null when on profile but profile not loaded yet. */
  userId?: string | null;
  ticker?: string;
}

interface UsePostsDataResult {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  postsLoaded: boolean;
}

/**
 * Load posts from backend. Caches home feed to avoid refetch on tab switch.
 */
export function usePostsData({
  page = 1,
  perPage = 20,
  userId,
  ticker,
}: UsePostsDataProps = {}): UsePostsDataResult {
  const { session } = useAuth();
  const [posts, setPosts] = useState<Post[]>(() => {
    const isHomeFeed = !userId && !ticker;
    const cache = isHomeFeed ? getFeedCache() : null;
    if (cache && isFeedCacheValid()) {
      return cache.data;
    }
    return [];
  });
  const [loading, setLoading] = useState(() => {
    const isHomeFeed = !userId && !ticker;
    const cache = isHomeFeed ? getFeedCache() : null;
    return !(cache && isFeedCacheValid());
  });
  const [error, setError] = useState<string | null>(null);
  const currentUserIdRef = useRef(userId);
  const currentTickerRef = useRef(ticker);
  useEffect(() => {
    currentUserIdRef.current = userId;
    currentTickerRef.current = ticker;
  }, [userId, ticker]);

  const fetchPosts = useCallback(
    async (forceRefresh = false) => {
      const apiUrl = getBaseUrl();
      if (!apiUrl) {
        setPosts([]);
        setLoading(false);
        return;
      }
      if (userId === null) {
        setPosts([]);
        setLoading(false);
        setError(null);
        return;
      }

      const token = session?.access_token ?? null;
      const isHomeFeed = !userId && !ticker;

      if (isHomeFeed && !token) {
        setLoading(false);
        return;
      }

      const cache = isHomeFeed ? getFeedCache() : null;
      if (isHomeFeed && !forceRefresh && cache && isFeedCacheValid()) {
        setPosts(cache.data);
        setLoading(false);
        setError(null);
        return;
      }

      const requestedUserId = userId ?? undefined;
      const requestedTicker = ticker ?? undefined;
      setLoading(true);
      setError(null);
      try {
        const res: ListPostsResponse =
          isHomeFeed && token
            ? await listFeed(token, { page, per_page: perPage })
            : await listPosts(token, {
                page,
                per_page: perPage,
                user_id: requestedUserId,
                ticker: requestedTicker,
              });
        const mapped = res.data.map((p) => mapPostResponseToPost(p));
        if (!isHomeFeed) {
          const currentUserId = currentUserIdRef.current ?? undefined;
          const currentTicker = currentTickerRef.current ?? undefined;
          if (requestedUserId !== currentUserId || requestedTicker !== currentTicker) {
            return;
          }
        }
        setPosts(mapped);
        if (isHomeFeed && token) {
          setFeedCache(mapped, Date.now());
        }
      } catch (err) {
        const currentUserId = currentUserIdRef.current ?? undefined;
        const currentTicker = currentTickerRef.current ?? undefined;
        if (requestedUserId !== currentUserId || requestedTicker !== currentTicker) {
          return;
        }
        setError(getErrorMessage(err, 'Failed to load posts'));
        setPosts([]);
      } finally {
        setLoading(false);
      }
    },
    [session?.access_token, page, perPage, userId, ticker]
  );

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const refetch = useCallback(() => fetchPosts(true), [fetchPosts]);

  // Keep cache in sync when posts change (e.g. after adding a new post)
  useEffect(() => {
    const isHomeFeed = !userId && !ticker;
    if (isHomeFeed && posts.length > 0) {
      setFeedCache(posts, Date.now());
    }
  }, [posts, userId, ticker]);

  return {
    posts,
    setPosts,
    loading,
    error,
    refetch,
    postsLoaded: !loading,
  };
}
