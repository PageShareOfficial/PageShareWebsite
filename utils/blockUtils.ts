import { Post, Comment } from '@/types';
import { saveToStorage } from './storageUtils';

const BLOCKED_USERS_KEY_PREFIX = 'pageshare_blocked_users_';

/**
 * Get the localStorage key for a user's blocked users list
 */
const getBlockedUsersKey = (userHandle: string): string => {
  return `${BLOCKED_USERS_KEY_PREFIX}${userHandle}`;
};

/**
 * Block a user (completely hide their content and prevent interactions)
 */
export const blockUser = (userHandle: string, targetHandle: string): void => {
  if (typeof window === 'undefined') return;
  
  // Prevent blocking self
  if (userHandle === targetHandle) return;

  const blockedUsers = getBlockedUsers(userHandle);
  
  // Prevent duplicates
  if (!blockedUsers.includes(targetHandle)) {
    blockedUsers.push(targetHandle);
    saveToStorage(getBlockedUsersKey(userHandle), blockedUsers);
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new Event('blockedUsersUpdated'));
  }
};

/**
 * Unblock a user
 */
export const unblockUser = (userHandle: string, targetHandle: string): void => {
  if (typeof window === 'undefined') return;

  const blockedUsers = getBlockedUsers(userHandle);
  const filteredBlockedUsers = blockedUsers.filter((handle) => handle !== targetHandle);
  
  if (filteredBlockedUsers.length !== blockedUsers.length) {
    saveToStorage(getBlockedUsersKey(userHandle), filteredBlockedUsers);
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new Event('blockedUsersUpdated'));
  }
};

/**
 * Check if a user is blocked
 */
export const isBlocked = (userHandle: string, targetHandle: string): boolean => {
  if (typeof window === 'undefined') return false;

  const blockedUsers = getBlockedUsers(userHandle);
  return blockedUsers.includes(targetHandle);
};

/**
 * Get all blocked user handles for a user
 */
export const getBlockedUsers = (userHandle: string): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(getBlockedUsersKey(userHandle));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading blocked users from localStorage:', error);
  }

  return [];
};

/**
 * Filter out posts from blocked users
 */
export const filterBlockedPosts = (posts: Post[], blockedUsers: string[]): Post[] => {
  if (blockedUsers.length === 0) return posts;
  
  return posts.filter((post) => !blockedUsers.includes(post.author.handle));
};

/**
 * Filter out comments from blocked users
 */
export const filterBlockedComments = (comments: Comment[], blockedUsers: string[]): Comment[] => {
  if (blockedUsers.length === 0) return comments;
  
  return comments.filter((comment) => !blockedUsers.includes(comment.author.handle));
};

/**
 * Toggle block status (block if not blocked, unblock if blocked)
 */
export const toggleBlock = (userHandle: string, targetHandle: string): void => {
  if (isBlocked(userHandle, targetHandle)) {
    unblockUser(userHandle, targetHandle);
  } else {
    blockUser(userHandle, targetHandle);
  }
};

