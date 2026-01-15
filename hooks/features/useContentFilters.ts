import { useState, useEffect } from 'react';
import { Post, Comment } from '@/types';
import { getMutedUsers } from '@/utils/user/muteUtils';
import { getBlockedUsers, filterBlockedPosts, filterBlockedComments } from '@/utils/user/blockUtils';

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
  const [mutedUsers, setMutedUsers] = useState<string[]>([]);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);

  // Load muted and blocked users
  useEffect(() => {
    if (!isClient || !currentUserHandle) return;

    const loadFilters = () => {
      setMutedUsers(getMutedUsers(currentUserHandle));
      setBlockedUsers(getBlockedUsers(currentUserHandle));
    };

    loadFilters();

    // Listen for updates
    const handleMutedUsersUpdated = () => {
      setMutedUsers(getMutedUsers(currentUserHandle));
    };

    const handleBlockedUsersUpdated = () => {
      setBlockedUsers(getBlockedUsers(currentUserHandle));
    };

    window.addEventListener('mutedUsersUpdated', handleMutedUsersUpdated);
    window.addEventListener('blockedUsersUpdated', handleBlockedUsersUpdated);

    return () => {
      window.removeEventListener('mutedUsersUpdated', handleMutedUsersUpdated);
      window.removeEventListener('blockedUsersUpdated', handleBlockedUsersUpdated);
    };
  }, [isClient, currentUserHandle]);

  // Filter posts - exclude muted and blocked users
  const filterPosts = (posts: Post[]): Post[] => {
    let filtered = filterBlockedPosts(posts, blockedUsers);
    
    // Filter out muted users' posts from feed
    if (mutedUsers.length > 0) {
      filtered = filtered.filter((post) => !mutedUsers.includes(post.author.handle));
    }
    
    return filtered;
  };

  // Filter comments - exclude blocked users
  const filterComments = (comments: Comment[]): Comment[] => {
    return filterBlockedComments(comments, blockedUsers);
  };

  return {
    mutedUsers,
    blockedUsers,
    filterPosts,
    filterComments,
  };
}

