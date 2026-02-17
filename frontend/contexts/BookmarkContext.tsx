'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Post } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { addBookmark as apiAddBookmark, removeBookmark as apiRemoveBookmark, listBookmarks, BookmarkedPostItem } from '@/lib/api/bookmarkApi';
import { formatRelativeTime } from '@/utils/core/dateUtils';
import { getContextCache, setContextCache, invalidateContextCache } from '@/lib/contextCache';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

function mapBookmarkedItemToPost(item: BookmarkedPostItem): Post {
  const dateStr = item.created_at ?? item.bookmarked_at;
  const date = new Date(dateStr);
  const displayTime = Number.isNaN(date.getTime()) ? 'now' : formatRelativeTime(date);

  return {
    id: item.id,
    author: {
      id: item.author.username,
      displayName: item.author.display_name,
      handle: item.author.username,
      avatar: item.author.profile_picture_url ?? '',
      badge: undefined,
    },
    content: item.content,
    createdAt: displayTime,
    stats: { likes: 0, comments: 0, reposts: 0 },
    userInteractions: { liked: false, reposted: false },
  };
}

interface BookmarkContextValue {
  bookmarkedIds: Set<string>;
  bookmarkedPosts: Post[];
  loading: boolean;
  error: string | null;
  isBookmarked: (postId: string) => boolean;
  addBookmark: (postId: string) => Promise<void>;
  removeBookmark: (postId: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const BookmarkContext = createContext<BookmarkContextValue | null>(null);

const BOOKMARKS_CACHE_NAME = 'bookmarks';

interface BookmarkCacheEntry {
  ids: string[];
  posts: Post[];
}

export function BookmarkProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const userId = session?.user?.id ?? '';
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBookmarks = useCallback(async () => {
    const token = session?.access_token;
    if (!token || !userId) {
      setBookmarkedIds(new Set());
      setBookmarkedPosts([]);
      return;
    }

    const cached = getContextCache<BookmarkCacheEntry>(BOOKMARKS_CACHE_NAME, userId);
    if (cached) {
      setBookmarkedIds(new Set(cached.ids));
      setBookmarkedPosts(cached.posts);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await listBookmarks(token, { per_page: 50 });
      const ids = res.data.map((p) => p.id);
      const posts = res.data.map(mapBookmarkedItemToPost);
      setBookmarkedIds(new Set(ids));
      setBookmarkedPosts(posts);
      setContextCache(BOOKMARKS_CACHE_NAME, userId, { ids, posts });
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load bookmarks');
      const isValidationError = /\b(validation|422|unprocessable)\b/i.test(msg);
      setError(isValidationError ? 'Please retry' : msg);
      setBookmarkedIds(new Set());
      setBookmarkedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, userId]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const isBookmarked = useCallback(
    (postId: string) => bookmarkedIds.has(postId),
    [bookmarkedIds]
  );

  const addBookmark = useCallback(
    async (postId: string) => {
      const token = session?.access_token;
      if (!token) return;

      setBookmarkedIds((prev) => new Set(prev).add(postId));
      try {
        await apiAddBookmark(postId, token);
        invalidateContextCache(BOOKMARKS_CACHE_NAME, userId);
        await fetchBookmarks();
      } catch {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          next.delete(postId);
          return next;
        });
      }
    },
    [session?.access_token, userId, fetchBookmarks]
  );

  const removeBookmark = useCallback(
    async (postId: string) => {
      const token = session?.access_token;
      if (!token) return;

      setBookmarkedIds((prev) => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setBookmarkedPosts((prev) => prev.filter((p) => p.id !== postId));
      try {
        await apiRemoveBookmark(postId, token);
        invalidateContextCache(BOOKMARKS_CACHE_NAME, userId);
      } catch {
        invalidateContextCache(BOOKMARKS_CACHE_NAME, userId);
        await fetchBookmarks();
      }
    },
    [session?.access_token, userId, fetchBookmarks]
  );

  const value: BookmarkContextValue = {
    bookmarkedIds,
    bookmarkedPosts,
    loading,
    error,
    isBookmarked,
    addBookmark,
    removeBookmark,
    refetch: fetchBookmarks,
  };

  return <BookmarkContext.Provider value={value}>{children}</BookmarkContext.Provider>;
}

export function useBookmarks() {
  const ctx = useContext(BookmarkContext);
  if (!ctx) throw new Error('useBookmarks must be used within BookmarkProvider');
  return ctx;
}
