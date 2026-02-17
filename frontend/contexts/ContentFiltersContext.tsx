'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Post, Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  listContentFilters,
  muteUserApi,
  unmuteUserApi,
  blockUserApi,
  unblockUserApi,
  type ContentFiltersResponse,
  type FilteredUserItem,
} from '@/lib/api/contentFiltersApi';
import { getContextCache, setContextCache, invalidateContextCache } from '@/lib/contextCache';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface ContentFiltersContextValue {
  mutedUsers: FilteredUserItem[];
  blockedUsers: FilteredUserItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isMutedById: (userId: string) => boolean;
  isBlockedById: (userId: string) => boolean;
  isMutedByHandle: (handle: string) => boolean;
  isBlockedByHandle: (handle: string) => boolean;
  mute: (user: { id: string; username: string; displayName: string }) => Promise<void>;
  unmute: (userId: string) => Promise<void>;
  block: (user: { id: string; username: string; displayName: string }) => Promise<void>;
  unblock: (userId: string) => Promise<void>;
  filterPosts: (posts: Post[]) => Post[];
  filterComments: (comments: Comment[]) => Comment[];
}

const defaultContentFiltersContextValue: ContentFiltersContextValue = {
  mutedUsers: [],
  blockedUsers: [],
  loading: false,
  error: null,
  refresh: async () => {},
  isMutedById: () => false,
  isBlockedById: () => false,
  isMutedByHandle: () => false,
  isBlockedByHandle: () => false,
  mute: async () => {},
  unmute: async () => {},
  block: async () => {},
  unblock: async () => {},
  filterPosts: (posts) => posts,
  filterComments: (comments) => comments,
};

const ContentFiltersContext = createContext<ContentFiltersContextValue | null>(null);

const CACHE_NAME = 'content-filters';

export function ContentFiltersProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;
  const userId = session?.user?.id ?? '';

  const [filters, setFilters] = useState<ContentFiltersResponse>({
    muted_users: [],
    blocked_users: [],
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadFilters = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!accessToken || !userId) {
        setFilters({ muted_users: [], blocked_users: [] });
        return;
      }
      const cached = getContextCache<ContentFiltersResponse>(CACHE_NAME, userId);
      if (cached) {
        setFilters(cached);
        return;
      }
      if (!opts.silent) {
        setLoading(true);
        setError(null);
      }
      try {
        const data = await listContentFilters(accessToken);
        setFilters(data);
        setContextCache(CACHE_NAME, userId, data);
      } catch (e) {
        if (!opts.silent) {
          setError(getErrorMessage(e, 'Failed to load content filters'));
        }
      } finally {
        if (!opts.silent) {
          setLoading(false);
        }
      }
    },
    [accessToken, userId]
  );

  useEffect(() => {
    if (accessToken && userId) {
      loadFilters({ silent: false });
    } else {
      setFilters({ muted_users: [], blocked_users: [] });
    }
  }, [accessToken, userId, loadFilters]);

  const mutedIdSet = useMemo(
    () => new Set(filters.muted_users.map((u) => u.id)),
    [filters.muted_users]
  );
  const blockedIdSet = useMemo(
    () => new Set(filters.blocked_users.map((u) => u.id)),
    [filters.blocked_users]
  );

  const mutedHandleSet = useMemo(
    () => new Set(filters.muted_users.map((u) => u.username)),
    [filters.muted_users]
  );
  const blockedHandleSet = useMemo(
    () => new Set(filters.blocked_users.map((u) => u.username)),
    [filters.blocked_users]
  );

  const isMutedById = useCallback(
    (userId: string) => mutedIdSet.has(userId),
    [mutedIdSet]
  );

  const isBlockedById = useCallback(
    (userId: string) => blockedIdSet.has(userId),
    [blockedIdSet]
  );

  const isMutedByHandle = useCallback(
    (handle: string) => mutedHandleSet.has(handle),
    [mutedHandleSet]
  );

  const isBlockedByHandle = useCallback(
    (handle: string) => blockedHandleSet.has(handle),
    [blockedHandleSet]
  );

  const optimisticUpdate = useCallback(
    (updater: (prev: ContentFiltersResponse) => ContentFiltersResponse) => {
      setFilters((prev) => updater(prev));
    },
    []
  );

  const mute = useCallback(
    async (user: { id: string; username: string; displayName: string }) => {
      if (!accessToken) return;
      if (mutedIdSet.has(user.id)) return;

      const previous = filters;
      optimisticUpdate((prev) => ({
        ...prev,
        muted_users: [
          ...prev.muted_users,
          {
            id: user.id,
            username: user.username,
            display_name: user.displayName,
            muted_at: new Date().toISOString(),
            blocked_at: null,
          },
        ],
      }));

      try {
        await muteUserApi(user.id, accessToken);
        invalidateContextCache(CACHE_NAME, userId);
      } catch (e) {
        // Roll back on error
        setFilters(previous);
        throw e;
      }
    },
    [accessToken, mutedIdSet, filters, optimisticUpdate, userId]
  );

  const unmute = useCallback(
    async (userId: string) => {
      if (!accessToken) return;
      if (!mutedIdSet.has(userId)) return;

      const previous = filters;
      optimisticUpdate((prev) => ({
        ...prev,
        muted_users: prev.muted_users.filter((u) => u.id !== userId),
      }));

      try {
        await unmuteUserApi(userId, accessToken);
        invalidateContextCache(CACHE_NAME, userId);
      } catch (e) {
        setFilters(previous);
        throw e;
      }
    },
    [accessToken, mutedIdSet, filters, optimisticUpdate, userId]
  );

  const block = useCallback(
    async (user: { id: string; username: string; displayName: string }) => {
      if (!accessToken) return;
      if (blockedIdSet.has(user.id)) return;

      const previous = filters;
      optimisticUpdate((prev) => ({
        ...prev,
        blocked_users: [
          ...prev.blocked_users,
          {
            id: user.id,
            username: user.username,
            display_name: user.displayName,
            blocked_at: new Date().toISOString(),
            muted_at: null,
          },
        ],
      }));

      try {
        await blockUserApi(user.id, accessToken);
        invalidateContextCache(CACHE_NAME, userId);
      } catch (e) {
        setFilters(previous);
        throw e;
      }
    },
    [accessToken, blockedIdSet, filters, optimisticUpdate, userId]
  );

  const unblock = useCallback(
    async (userId: string) => {
      if (!accessToken) return;
      if (!blockedIdSet.has(userId)) return;

      const previous = filters;
      optimisticUpdate((prev) => ({
        ...prev,
        blocked_users: prev.blocked_users.filter((u) => u.id !== userId),
      }));

      try {
        await unblockUserApi(userId, accessToken);
        invalidateContextCache(CACHE_NAME, userId);
      } catch (e) {
        setFilters(previous);
        throw e;
      }
    },
    [accessToken, blockedIdSet, filters, optimisticUpdate, userId]
  );

  const filterPosts = useCallback(
    (posts: Post[]): Post[] => {
      if (!posts.length) return posts;
      return posts.filter((post) => {
        const userId = post.author.id;
        const handle = post.author.handle;
        if (blockedIdSet.has(userId) || blockedHandleSet.has(handle)) {
          return false;
        }
        if (mutedIdSet.has(userId) || mutedHandleSet.has(handle)) {
          // Muted: hide from feeds but they may still be visible elsewhere
          return false;
        }
        return true;
      });
    },
    [blockedIdSet, blockedHandleSet, mutedIdSet, mutedHandleSet]
  );

  const filterComments = useCallback(
    (comments: Comment[]): Comment[] => {
      if (!comments.length) return comments;
      return comments.filter((comment) => {
        const userId = comment.author.id;
        const handle = comment.author.handle;
        if (blockedIdSet.has(userId) || blockedHandleSet.has(handle)) {
          return false;
        }
        return true;
      });
    },
    [blockedIdSet, blockedHandleSet]
  );

  const value: ContentFiltersContextValue = {
    mutedUsers: filters.muted_users,
    blockedUsers: filters.blocked_users,
    loading,
    error,
    refresh: () => loadFilters({ silent: false }),
    isMutedById,
    isBlockedById,
    isMutedByHandle,
    isBlockedByHandle,
    mute,
    unmute,
    block,
    unblock,
    filterPosts,
    filterComments,
  };

  return <ContentFiltersContext.Provider value={value}>{children}</ContentFiltersContext.Provider>;
}

export function useContentFiltersContext(): ContentFiltersContextValue {
  const ctx = useContext(ContentFiltersContext);
  return ctx ?? defaultContentFiltersContextValue;
}
