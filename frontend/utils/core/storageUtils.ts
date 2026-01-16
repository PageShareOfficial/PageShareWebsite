import { Post } from '@/types';

// Helper function to get size of data in bytes
const getDataSize = (data: string): number => {
  return new Blob([data]).size;
};

// Helper function to clean up old posts if storage is getting full
const cleanupOldPosts = (posts: Post[]): Post[] => {
  // Keep only the most recent 500 posts to prevent storage overflow
  const maxPosts = 500;
  if (posts.length <= maxPosts) {
    return posts;
  }
  
  // Return the most recent posts (assuming newer posts are at the beginning)
  return posts.slice(0, maxPosts);
};

// Helper function to optimize posts for storage (remove large media URLs from old posts)
const optimizePostsForStorage = (posts: Post[], limit: number): Post[] => {
  const limited = posts.slice(0, limit);
  
  // For posts beyond the first 50, remove media URLs to save space
  // Keep only essential data
  return limited.map((post, index) => {
    if (index >= 50 && (post.media || post.gifUrl)) {
      // Remove media from older posts to save space
      const { media, gifUrl, ...postWithoutMedia } = post;
      return postWithoutMedia;
    }
    return post;
  });
};

// Helper function to try saving with progressively smaller limits
const trySaveWithLimit = (posts: Post[], limit: number): boolean => {
  try {
    const limitedPosts = posts.slice(0, limit);
    const postsJson = JSON.stringify(limitedPosts);
    const dataSize = getDataSize(postsJson);
    
    // Check if still too large (use 3MB as safe limit)
    const maxSize = 3 * 1024 * 1024; // 3MB in bytes
    
    if (dataSize > maxSize && limit > 10) {
      // Try with optimized posts (remove media from older posts)
      const optimizedPosts = optimizePostsForStorage(posts, limit);
      const optimizedJson = JSON.stringify(optimizedPosts);
      const optimizedSize = getDataSize(optimizedJson);
      
      if (optimizedSize > maxSize) {
        // Still too large, try smaller limit
        return false;
      }
      
      localStorage.setItem('pageshare_posts', optimizedJson);
      console.warn(`Posts data optimized and limited to ${limit} most recent posts`);
      return true;
    }
    
    localStorage.setItem('pageshare_posts', postsJson);
    return true;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      return false;
    }
    throw error;
  }
};

// Safe function to save posts to localStorage with error handling and size management
export const savePostsToStorage = (posts: Post[]): void => {
  if (typeof window === 'undefined') return; // SSR safety
  
  if (!posts || posts.length === 0) {
    // Don't save empty arrays
    return;
  }
  
  try {
    const postsToSave = cleanupOldPosts(posts);
    const postsJson = JSON.stringify(postsToSave);
    const dataSize = getDataSize(postsJson);
    
    // Check if data is too large (localStorage limit is typically 5-10MB)
    // Use 3MB as a safe limit to leave room for other data
    const maxSize = 3 * 1024 * 1024; // 3MB in bytes
    
    if (dataSize > maxSize) {
      // Try progressively smaller limits
      const limits = [200, 100, 50, 25, 10];
      let saved = false;
      
      for (const limit of limits) {
        if (trySaveWithLimit(posts, limit)) {
          saved = true;
          break;
        }
      }
      
      if (!saved) {
        // Last resort: clear everything and save just the 10 most recent posts
        try {
          localStorage.removeItem('pageshare_posts');
          const minimalPosts = optimizePostsForStorage(posts, 10);
          localStorage.setItem('pageshare_posts', JSON.stringify(minimalPosts));
          console.warn('Cleared old posts and saved only 10 most recent posts (optimized)');
        } catch (finalError) {
          console.error('Failed to save posts to localStorage even with minimal data:', finalError);
          // At this point, we can't save. The app will continue to work but data won't persist.
        }
      }
    } else {
      localStorage.setItem('pageshare_posts', postsJson);
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // Try progressively smaller limits
      const limits = [200, 100, 50, 25, 10];
      let saved = false;
      
      for (const limit of limits) {
        try {
          if (trySaveWithLimit(posts, limit)) {
            saved = true;
            break;
          }
        } catch {
          // Continue to next limit
        }
      }
      
      if (!saved) {
        // Last resort: clear and save minimal data
        try {
          localStorage.removeItem('pageshare_posts');
          const minimalPosts = optimizePostsForStorage(posts, 10);
          localStorage.setItem('pageshare_posts', JSON.stringify(minimalPosts));
          console.warn('localStorage quota exceeded, saved only 10 most recent posts (optimized)');
        } catch (finalError) {
          console.error('Failed to save posts to localStorage even after aggressive cleanup:', finalError);
          // Silently fail - app continues to work without persistence
        }
      }
    } else {
      console.error('Error saving posts to localStorage:', error);
    }
  }
};

// Safe function to save any data to localStorage with error handling
export const saveToStorage = (key: string, data: any): void => {
  if (typeof window === 'undefined') return; // SSR safety
  
  try {
    const json = JSON.stringify(data);
    localStorage.setItem(key, json);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.error(`localStorage quota exceeded while saving ${key}:`, error);
      // Try to clear some space by removing old data
      try {
        // Remove old posts if this is not the posts key
        if (key !== 'pageshare_posts') {
          const oldPosts = localStorage.getItem('pageshare_posts');
          if (oldPosts) {
            const parsed = JSON.parse(oldPosts);
            if (Array.isArray(parsed) && parsed.length > 100) {
              const limited = parsed.slice(0, 100);
              localStorage.setItem('pageshare_posts', JSON.stringify(limited));
              // Retry saving the original data
              localStorage.setItem(key, JSON.stringify(data));
              return;
            }
          }
        }
      } catch (retryError) {
        console.error(`Failed to save ${key} to localStorage after cleanup:`, retryError);
      }
    } else {
      console.error(`Error saving ${key} to localStorage:`, error);
    }
  }
};

