import { useState, useEffect } from 'react';
import { Comment, Post } from '@/types';
import { mockComments } from '@/data/mockData';

interface UseCommentsProps {
  posts: Post[];
}

interface UseCommentsResult {
  allComments: Comment[];
  setAllComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  isClient: boolean;
}

/**
 * Hook to load and manage comments from localStorage
 * Listens for comment updates and storage changes
 */
export function useComments({ posts }: UseCommentsProps): UseCommentsResult {
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Load comments from localStorage
  const loadComments = () => {
    const loadedComments: Comment[] = [];
    loadedComments.push(...mockComments);
    
    // Get all post IDs from current posts
    const allPostIds = new Set<string>();
    posts.forEach((post) => {
      allPostIds.add(post.id);
    });
    
    // Load comments for each post
    allPostIds.forEach((postId) => {
      const savedComments = localStorage.getItem(`pageshare_comments_${postId}`);
      if (savedComments) {
        try {
          const parsedComments = JSON.parse(savedComments);
          if (Array.isArray(parsedComments)) {
            parsedComments.forEach((comment: Comment) => {
              if (!loadedComments.find(c => c.id === comment.id)) {
                loadedComments.push(comment);
              }
            });
          }
        } catch {
          // Skip invalid comments
        }
      }
    });
    
    setAllComments(loadedComments);
  };

  useEffect(() => {
    setIsClient(true);
    loadComments();

    // Listen for storage changes (when comments are updated from other tabs/pages)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key && e.key.startsWith('pageshare_comments_')) {
        loadComments();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Listen for custom event (same-tab updates)
    const handleCommentsUpdated = () => {
      loadComments();
    };

    window.addEventListener('commentsUpdated', handleCommentsUpdated);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('commentsUpdated', handleCommentsUpdated);
    };
  }, [posts.length]); // Reload when posts change

  return {
    allComments,
    setAllComments,
    isClient,
  };
}

