import { Post } from '@/types';
import { saveToStorage } from './storageUtils';

const BOOKMARKS_KEY_PREFIX = 'pageshare_bookmarks_';

/**
 * Get the localStorage key for a user's bookmarks
 */
const getBookmarksKey = (userHandle: string): string => {
  return `${BOOKMARKS_KEY_PREFIX}${userHandle}`;
};

/**
 * Add a post to bookmarks
 */
export const addBookmark = (postId: string, userHandle: string): void => {
  if (typeof window === 'undefined') return;

  const bookmarks = getBookmarks(userHandle);
  
  // Prevent duplicates
  if (!bookmarks.includes(postId)) {
    bookmarks.push(postId);
    saveToStorage(getBookmarksKey(userHandle), bookmarks);
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new Event('bookmarksUpdated'));
  }
};

/**
 * Remove a post from bookmarks
 */
export const removeBookmark = (postId: string, userHandle: string): void => {
  if (typeof window === 'undefined') return;

  const bookmarks = getBookmarks(userHandle);
  const filteredBookmarks = bookmarks.filter((id) => id !== postId);
  
  if (filteredBookmarks.length !== bookmarks.length) {
    saveToStorage(getBookmarksKey(userHandle), filteredBookmarks);
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new Event('bookmarksUpdated'));
  }
};

/**
 * Check if a post is bookmarked
 */
export const isBookmarked = (postId: string, userHandle: string): boolean => {
  if (typeof window === 'undefined') return false;

  const bookmarks = getBookmarks(userHandle);
  return bookmarks.includes(postId);
};

/**
 * Get all bookmarked post IDs for a user
 */
export const getBookmarks = (userHandle: string): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(getBookmarksKey(userHandle));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading bookmarks from localStorage:', error);
  }

  return [];
};

/**
 * Get Post objects for all bookmarked posts
 */
export const getBookmarkedPosts = (userHandle: string, allPosts: Post[]): Post[] => {
  const bookmarkedIds = getBookmarks(userHandle);
  return allPosts.filter((post) => bookmarkedIds.includes(post.id));
};

/**
 * Toggle bookmark status (add if not bookmarked, remove if bookmarked)
 */
export const toggleBookmark = (postId: string, userHandle: string): void => {
  if (isBookmarked(postId, userHandle)) {
    removeBookmark(postId, userHandle);
  } else {
    addBookmark(postId, userHandle);
  }
};

