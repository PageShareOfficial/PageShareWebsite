import { Post } from '@/types';
import { isTweet, mockUsers } from '@/data/mockData';
import { User } from '@/types';

export interface ProfileUser extends User {
  joinedDate: string;
  followers: number;
  following: number;
  bio: string;
  interests: string[];
}

// Mock user data - in real implementation, fetch from API based on username
export const getUserByUsername = (username: string): ProfileUser | null => {
  // Normalize username to lowercase for matching
  const normalizedUsername = username.toLowerCase();

  // If user not in mock data, create a default profile (for current user or new users)
  if (mockUsers[normalizedUsername]) {
    return mockUsers[normalizedUsername];
  }
  
  // Fallback: create a default profile for the username
  // In real implementation, this would fetch from API
  return {
    id: `user-${normalizedUsername}`,
    displayName: normalizedUsername.charAt(0).toUpperCase() + normalizedUsername.slice(1),
    handle: normalizedUsername,
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedUsername}`,
    badge: 'Public',
    joinedDate: new Date().toISOString().split('T')[0],
    followers: 0,
    following: 0,
    bio: '',
    interests: [],
  };
};

// Get current user with updated profile from localStorage
export const getCurrentUser = (): User => {
  if (typeof window === 'undefined') {
    // SSR fallback
    const mockUser = mockUsers['johndoe'];
    return {
      id: mockUser.id,
      displayName: mockUser.displayName,
      handle: mockUser.handle,
      avatar: mockUser.avatar,
      badge: mockUser.badge,
    };
  }

  // Default current user handle
  const currentUserHandle = 'johndoe';
  const profileKey = `pageshare_profile_${currentUserHandle.toLowerCase()}`;
  const savedProfile = localStorage.getItem(profileKey);
  
  // Get base user from mockUsers
  const baseUser = mockUsers[currentUserHandle.toLowerCase()] || mockUsers['johndoe'];
  
  if (savedProfile) {
    try {
      const saved = JSON.parse(savedProfile);
      // Merge saved profile with base user, prioritizing saved avatar and displayName
      return {
        id: baseUser.id,
        displayName: saved.displayName || baseUser.displayName,
        handle: baseUser.handle,
        avatar: saved.avatar || baseUser.avatar,
        badge: baseUser.badge,
      };
    } catch {
      // If parsing fails, use base user
    }
  }
  
  return {
    id: baseUser.id,
    displayName: baseUser.displayName,
    handle: baseUser.handle,
    avatar: baseUser.avatar,
    badge: baseUser.badge,
  };
};

// Calculate user stats from posts
export const calculateUserStats = (username: string, posts: Post[]) => {
  const userPosts = posts.filter((post) => {
    if (isTweet(post)) {
      // Count original posts and quote reposts (not normal reposts)
      if (post.repostType === 'normal') return false;
      return post.author.handle === username;
    }
    return false;
  });

  const totalLikes = userPosts.reduce((sum, post) => sum + post.stats.likes, 0);

  return {
    posts: userPosts.length,
    replies: 0, // Will be calculated from comments in real implementation
    likes: totalLikes,
  };
};

