import { User } from '@/types';
import { mockUsers, mockFollows } from '@/data/mockData';

// Get all users from mockUsers
export const getAllUsers = (): User[] => {
  if (typeof window === 'undefined') return []; // SSR safety
  return Object.values(mockUsers).map((user) => ({
    id: user.id,
    displayName: user.displayName,
    handle: user.handle,
    avatar: user.avatar,
    badge: user.badge,
  }));
};

// Get followers for a user (users who follow this user)
export const getFollowers = (username: string): User[] => {
  if (typeof window === 'undefined') return []; // SSR safety
  const normalizedUsername = username.toLowerCase();
  const stored = localStorage.getItem(`pageshare_followers_${normalizedUsername}`);
  
  if (stored) {
    try {
      const followerHandles: string[] = JSON.parse(stored);
      return followerHandles
        .map((handle) => {
          const user = mockUsers[handle.toLowerCase()];
          if (user) {
            return {
              id: user.id,
              displayName: user.displayName,
              handle: user.handle,
              avatar: user.avatar,
              badge: user.badge,
            } as User;
          }
          return null;
        })
        .filter((user): user is User => user !== null);
    } catch {
      return [];
    }
  }
  
  // Return empty array if no followers stored
  return [];
};

// Get following for a user (users this user follows)
export const getFollowing = (username: string): User[] => {
  if (typeof window === 'undefined') return []; // SSR safety
  const normalizedUsername = username.toLowerCase();
  const stored = localStorage.getItem(`pageshare_following_${normalizedUsername}`);
  
  if (stored) {
    try {
      const followingHandles: string[] = JSON.parse(stored);
      return followingHandles
        .map((handle) => {
          const user = mockUsers[handle.toLowerCase()];
          if (user) {
            return {
              id: user.id,
              displayName: user.displayName,
              handle: user.handle,
              avatar: user.avatar,
              badge: user.badge,
            } as User;
          }
          return null;
        })
        .filter((user): user is User => user !== null);
    } catch {
      return [];
    }
  }
  
  // Return empty array if no following stored
  return [];
};

// Check if currentUser follows targetUser
export const isFollowing = (currentUserHandle: string, targetUserHandle: string): boolean => {
  if (typeof window === 'undefined') return false; // SSR safety
  const normalizedCurrent = currentUserHandle.toLowerCase();
  const normalizedTarget = targetUserHandle.toLowerCase();
  
  if (normalizedCurrent === normalizedTarget) return false; // Can't follow yourself
  
  const stored = localStorage.getItem(`pageshare_following_${normalizedCurrent}`);
  if (stored) {
    try {
      const followingHandles: string[] = JSON.parse(stored);
      return followingHandles.map((h) => h.toLowerCase()).includes(normalizedTarget);
    } catch {
      return false;
    }
  }
  return false;
};

// Follow a user
export const followUser = (currentUserHandle: string, targetUserHandle: string): void => {
  if (typeof window === 'undefined') return; // SSR safety
  const normalizedCurrent = currentUserHandle.toLowerCase();
  const normalizedTarget = targetUserHandle.toLowerCase();
  
  if (normalizedCurrent === normalizedTarget) return; // Can't follow yourself
  
  // Add to current user's following list
  const currentFollowing = getFollowing(normalizedCurrent).map((u) => u.handle.toLowerCase());
  if (!currentFollowing.includes(normalizedTarget)) {
    currentFollowing.push(normalizedTarget);
    localStorage.setItem(`pageshare_following_${normalizedCurrent}`, JSON.stringify(currentFollowing));
  }
  
  // Add current user to target user's followers list
  const targetFollowers = getFollowers(normalizedTarget).map((u) => u.handle.toLowerCase());
  if (!targetFollowers.includes(normalizedCurrent)) {
    targetFollowers.push(normalizedCurrent);
    localStorage.setItem(`pageshare_followers_${normalizedTarget}`, JSON.stringify(targetFollowers));
  }
};

// Unfollow a user
export const unfollowUser = (currentUserHandle: string, targetUserHandle: string): void => {
  if (typeof window === 'undefined') return; // SSR safety
  const normalizedCurrent = currentUserHandle.toLowerCase();
  const normalizedTarget = targetUserHandle.toLowerCase();
  
  if (normalizedCurrent === normalizedTarget) return; // Can't unfollow yourself
  
  // Remove from current user's following list
  const currentFollowing = getFollowing(normalizedCurrent).map((u) => u.handle.toLowerCase());
  const updatedFollowing = currentFollowing.filter((h) => h !== normalizedTarget);
  localStorage.setItem(`pageshare_following_${normalizedCurrent}`, JSON.stringify(updatedFollowing));
  
  // Remove current user from target user's followers list
  const targetFollowers = getFollowers(normalizedTarget).map((u) => u.handle.toLowerCase());
  const updatedFollowers = targetFollowers.filter((h) => h !== normalizedCurrent);
  localStorage.setItem(`pageshare_followers_${normalizedTarget}`, JSON.stringify(updatedFollowers));
};

// Get follower count for a user
export const getFollowerCount = (username: string): number => {
  return getFollowers(username).length;
};

// Get following count for a user
export const getFollowingCount = (username: string): number => {
  return getFollowing(username).length;
};

// Initialize mock follow relationships for demo users
export const initializeMockFollows = (): void => {
  // Only initialize if not already done (check for one user's data)
  if (typeof window === 'undefined') return; // Only run on client side
  
  if (localStorage.getItem('pageshare_mock_follows_initialized')) {
    return;
  }

  // Initialize followers and following for each user
  Object.keys(mockFollows).forEach((followerHandle) => {
    const followingList = mockFollows[followerHandle] || [];
    
    // Set following list for this user
    localStorage.setItem(
      `pageshare_following_${followerHandle.toLowerCase()}`,
      JSON.stringify(followingList)
    );

    // Add this user to each followed user's followers list
    followingList.forEach((followedHandle) => {
      const followedFollowersKey = `pageshare_followers_${followedHandle.toLowerCase()}`;
      const existingFollowers = localStorage.getItem(followedFollowersKey);
      let followersList: string[] = [];
      
      if (existingFollowers) {
        try {
          followersList = JSON.parse(existingFollowers);
        } catch {
          followersList = [];
        }
      }
      
      if (!followersList.includes(followerHandle.toLowerCase())) {
        followersList.push(followerHandle.toLowerCase());
        localStorage.setItem(followedFollowersKey, JSON.stringify(followersList));
      }
    });
  });

  // Mark as initialized
  localStorage.setItem('pageshare_mock_follows_initialized', 'true');
};

