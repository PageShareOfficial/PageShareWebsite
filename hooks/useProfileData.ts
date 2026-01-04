import { useState, useEffect } from 'react';
import { Post, WatchlistItem, Comment } from '@/types';
import { mockPosts, mockComments } from '@/data/mockData';

export function useProfileData() {
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [allComments, setAllComments] = useState<Comment[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Function to load posts from localStorage
  const loadPostsFromStorage = () => {
    const saved = localStorage.getItem('pageshare_posts');
    if (saved) {
      try {
        const parsedPosts = JSON.parse(saved);
        if (Array.isArray(parsedPosts) && parsedPosts.length > 0) {
          setPosts(parsedPosts);
          return;
        }
      } catch {
        // If parsing fails, use mockPosts
      }
    }
    setPosts(mockPosts);
  };

  // Load posts, watchlist, and comments from localStorage on client side only
  useEffect(() => {
    setIsClient(true);
    
    // Load watchlist
    const savedWatchlist = localStorage.getItem('pageshare_watchlist');
    if (savedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        if (Array.isArray(parsedWatchlist)) {
          setWatchlist(parsedWatchlist);
        }
      } catch {
        // If parsing fails, keep empty watchlist
      }
    }
    
    // Load posts
    loadPostsFromStorage();

    // Listen for storage changes (when posts are updated from other tabs/pages)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'pageshare_posts' && e.newValue) {
        try {
          const parsedPosts = JSON.parse(e.newValue);
          if (Array.isArray(parsedPosts)) {
            setPosts(parsedPosts);
          }
        } catch {
          // Ignore invalid data
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also reload posts when page becomes visible (user navigates back)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadPostsFromStorage();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load comments from localStorage after posts are loaded
  useEffect(() => {
    if (!isClient || posts.length === 0) return;

    const loadedComments: Comment[] = [];
    
    // First, add mock comments
    loadedComments.push(...mockComments);
    
    // Then, load user-created comments from localStorage for all posts
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
            // Only add comments that aren't already in loadedComments (avoid duplicates)
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
  }, [isClient, posts]);

  // Save posts to localStorage whenever they change (client side only)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('pageshare_posts', JSON.stringify(posts));
    }
  }, [posts, isClient]);

  // Save watchlist to localStorage whenever it changes
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('pageshare_watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist, isClient]);

  return {
    posts,
    setPosts,
    watchlist,
    setWatchlist,
    allComments,
    setAllComments,
    isClient,
  };
}

