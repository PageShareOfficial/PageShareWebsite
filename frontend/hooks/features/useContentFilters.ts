 'use client';

import { Post, Comment } from '@/types';
import { useContentFiltersContext } from '@/contexts/ContentFiltersContext';

interface UseContentFiltersProps {
  currentUserHandle: string;
  isClient: boolean;
}

interface UseContentFiltersResult {
  mutedUsers: string[];
  blockedUsers: string[];
  filterPosts: (posts: Post[]) => Post[];
  filterComments: (comments: Comment[]) => Comment[];
}

/**
 * Hook to manage muted/blocked users and provide filtering functions
 * Listens for updates to muted/blocked users
 */
export function useContentFilters({ 
  currentUserHandle, 
  isClient 
}: UseContentFiltersProps): UseContentFiltersResult {
  // For now we ignore currentUserHandle/isClient and rely on backend auth in the context
  const {
    mutedUsers: mutedUserItems,
    blockedUsers: blockedUserItems,
    filterPosts,
    filterComments,
  } = useContentFiltersContext();

  const mutedUsers = mutedUserItems.map((u) => u.username);
  const blockedUsers = blockedUserItems.map((u) => u.username);

  return {
    mutedUsers,
    blockedUsers,
    filterPosts,
    filterComments,
  };
}

