import { useEffect } from 'react';
import { Post } from '@/types';
import { isTweet } from '@/data/mockData';
import { savePostsToStorage } from '@/utils/storageUtils';

interface UsePostSyncProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  currentUserHandle: string;
  isClient: boolean;
  enabled?: boolean;
}

/**
 * Hook to sync posts to localStorage and sync repost flags
 * Handles saving posts and ensuring repost flags are consistent
 */
export function usePostSync({ 
  posts, 
  setPosts,
  currentUserHandle, 
  isClient,
  enabled = true 
}: UsePostSyncProps): void {
  // Save posts to localStorage whenever they change (debounced to prevent too frequent saves)
  useEffect(() => {
    if (!enabled || !isClient || typeof window === 'undefined' || posts.length === 0) return;
    
    // Debounce saves to prevent rapid-fire saves during reposts
    const timeoutId = setTimeout(() => {
      savePostsToStorage(posts);
    }, 500); // Wait 500ms after last change
    
    return () => clearTimeout(timeoutId);
  }, [posts, isClient, enabled]);

  // Sync userInteractions.reposted flags with actual repost entries
  // This fixes any inconsistencies where repost entries exist but flags are false
  useEffect(() => {
    if (!enabled || !isClient || posts.length === 0 || !currentUserHandle) return;
    
    // Find all reposts by current user
    const userReposts = posts.filter((post) => {
      if (!isTweet(post)) return false;
      if (!(post.repostType === 'normal' || post.repostType === 'quote')) return false;
      if (!post.originalPostId) return false;
      if (post.author.handle !== currentUserHandle) return false;
      return true;
    });

    // Check if any original posts need flag updates
    const needsUpdate = posts.some((post) => {
      const hasRepost = userReposts.some((repost) => repost.originalPostId === post.id);
      return (hasRepost && post.userInteractions.reposted === false) ||
             (!hasRepost && post.userInteractions.reposted === true);
    });

    if (needsUpdate) {
      setPosts((prev) => {
        // Update original posts' userInteractions.reposted flags
        return prev.map((post) => {
          const hasRepost = userReposts.some((repost) => repost.originalPostId === post.id);
          
          if (hasRepost && post.userInteractions.reposted === false) {
            return {
              ...post,
              userInteractions: {
                ...post.userInteractions,
                reposted: true,
              },
            };
          }
          
          if (!hasRepost && post.userInteractions.reposted === true) {
            return {
              ...post,
              userInteractions: {
                ...post.userInteractions,
                reposted: false,
              },
            };
          }
          
          return post;
        });
      });
    }
  }, [posts.length, currentUserHandle, isClient, enabled, setPosts]); // Run when posts are loaded
}

