import { useState, useEffect } from 'react';
import { Post } from '@/types';
import { mockPosts, isTweet } from '@/data/mockData';
import { savePostsToStorage } from '@/utils/core/storageUtils';

interface UsePostsDataProps {
  initialPosts?: Post[];
  validateReposts?: boolean;
  postId?: string; // For post detail page - check if specific post exists
}

interface UsePostsDataResult {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  postsLoaded: boolean;
  isClient: boolean;
}

/**
 * Hook to load and manage posts from localStorage
 * Handles repost validation and post existence checks
 */
export function usePostsData({ 
  initialPosts, 
  validateReposts = false,
  postId 
}: UsePostsDataProps = {}): UsePostsDataResult {
  const [posts, setPosts] = useState<Post[]>(initialPosts || mockPosts);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    const saved = localStorage.getItem('pageshare_posts');
    if (saved) {
      try {
        const parsedPosts = JSON.parse(saved);
        
        if (!Array.isArray(parsedPosts) || parsedPosts.length === 0) {
          setPosts(initialPosts || mockPosts);
          setPostsLoaded(true);
          return;
        }

        // For post detail page - check if specific post exists
        if (postId) {
          const postExists = parsedPosts.some((p: Post) => p.id === postId);
          if (postExists) {
            setPosts(parsedPosts);
            setPostsLoaded(true);
            return;
          }
        }

        // Validate reposts if requested
        if (validateReposts) {
          const hasRepostStructure = parsedPosts.some((p: Post) => {
            if (isTweet(p)) {
              return p.repostType !== undefined && p.originalPostId !== undefined;
            }
            return false;
          });
          
          const hasMockReposts = parsedPosts.some((p: Post) => 
            p.id === 'repost-1' || p.id === 'repost-2' || p.id === 'repost-3' || p.id === 'repost-4'
          );
          
          const hasUserCreatedPosts = parsedPosts.some((p: Post) => {
            const id = p.id;
            return (id.startsWith('repost-') && id.includes('-') && id.split('-').length > 2) ||
                   (id.startsWith('tweet-') && id.includes('-') && id.split('-').length > 2);
          });
          
          if (hasUserCreatedPosts) {
            setPosts(parsedPosts);
          } else if (hasRepostStructure || hasMockReposts) {
            const repostPosts = parsedPosts.filter((p: Post) => 
              p.id === 'repost-1' || p.id === 'repost-2' || p.id === 'repost-3' || p.id === 'repost-4'
            );
            const allRepostsValid = repostPosts.every((p: Post) => {
              if (isTweet(p)) {
                return p.repostType !== undefined && p.originalPostId !== undefined;
              }
              return false;
            });
            
            if (allRepostsValid && repostPosts.length > 0) {
              setPosts(parsedPosts);
            } else {
              setPosts(initialPosts || mockPosts);
              savePostsToStorage(initialPosts || mockPosts);
            }
          } else {
            setPosts(parsedPosts);
          }
        } else {
          // No validation needed, use parsed posts
          setPosts(parsedPosts);
        }
      } catch {
        setPosts(initialPosts || mockPosts);
      }
    } else {
      setPosts(initialPosts || mockPosts);
    }
    
    setPostsLoaded(true);
  }, [initialPosts, validateReposts, postId]);

  return {
    posts,
    setPosts,
    postsLoaded,
    isClient,
  };
}

