import { Post, User } from '@/types';
import { isTweet } from '@/utils/content/postUtils';

export interface ProfileUser extends User {
  joinedDate: string;
  followers: number;
  following: number;
  bio: string;
  interests: string[];
}

/** Minimal placeholder user when no auth/backend user is available. */
const ANONYMOUS_USER: User = {
  id: '',
  displayName: '',
  handle: '',
  avatar: '',
};

/**
 * Fallback current user when no backend/session is available (e.g. before auth loads).
 * When authenticated, useCurrentUser() provides the real user from the API.
 */
export function getCurrentUser(): User {
  if (typeof window === 'undefined') {
    return { ...ANONYMOUS_USER };
  }
  return { ...ANONYMOUS_USER };
}

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

