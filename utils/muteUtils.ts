import { saveToStorage } from './storageUtils';

const MUTED_USERS_KEY_PREFIX = 'pageshare_muted_users_';

/**
 * Get the localStorage key for a user's muted users list
 */
const getMutedUsersKey = (userHandle: string): string => {
  return `${MUTED_USERS_KEY_PREFIX}${userHandle}`;
};

/**
 * Mute a user (hide their posts from feed, but still visible on their profile)
 */
export const muteUser = (userHandle: string, targetHandle: string): void => {
  if (typeof window === 'undefined') return;
  
  // Prevent muting self
  if (userHandle === targetHandle) return;

  const mutedUsers = getMutedUsers(userHandle);
  
  // Prevent duplicates
  if (!mutedUsers.includes(targetHandle)) {
    mutedUsers.push(targetHandle);
    saveToStorage(getMutedUsersKey(userHandle), mutedUsers);
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new Event('mutedUsersUpdated'));
  }
};

/**
 * Unmute a user
 */
export const unmuteUser = (userHandle: string, targetHandle: string): void => {
  if (typeof window === 'undefined') return;

  const mutedUsers = getMutedUsers(userHandle);
  const filteredMutedUsers = mutedUsers.filter((handle) => handle !== targetHandle);
  
  if (filteredMutedUsers.length !== mutedUsers.length) {
    saveToStorage(getMutedUsersKey(userHandle), filteredMutedUsers);
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new Event('mutedUsersUpdated'));
  }
};

/**
 * Check if a user is muted
 */
export const isMuted = (userHandle: string, targetHandle: string): boolean => {
  if (typeof window === 'undefined') return false;

  const mutedUsers = getMutedUsers(userHandle);
  return mutedUsers.includes(targetHandle);
};

/**
 * Get all muted user handles for a user
 */
export const getMutedUsers = (userHandle: string): string[] => {
  if (typeof window === 'undefined') return [];

  try {
    const saved = localStorage.getItem(getMutedUsersKey(userHandle));
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Error loading muted users from localStorage:', error);
  }

  return [];
};

/**
 * Toggle mute status (mute if not muted, unmute if muted)
 */
export const toggleMute = (userHandle: string, targetHandle: string): void => {
  if (isMuted(userHandle, targetHandle)) {
    unmuteUser(userHandle, targetHandle);
  } else {
    muteUser(userHandle, targetHandle);
  }
};

