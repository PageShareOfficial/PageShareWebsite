import { Tweet, User, Post } from '@/types';
import { isTweet } from '@/data/mockData';

export interface CreateRepostParams {
  originalPost: Post;
  currentUser: User;
  quoteText?: string;
}

export function createNormalRepost({ originalPost, currentUser }: CreateRepostParams): Tweet | null {
  // Create a normal repost
  return {
    id: `repost-${Date.now()}`,
    author: {
      id: currentUser.id || 'current-user',
      displayName: currentUser.displayName,
      handle: currentUser.handle,
      avatar: currentUser.avatar,
      badge: currentUser.badge || 'Verified',
    },
    createdAt: 'now',
    content: '',
    repostType: 'normal',
    originalPostId: originalPost.id, // Store only the ID (optimized for backend)
    stats: {
      likes: 0,
      comments: 0,
      reposts: 0,
    },
    userInteractions: {
      liked: false,
      reposted: true,
    },
  };
}

export function createQuoteRepost({
  originalPost,
  currentUser,
  quoteText,
}: CreateRepostParams): Tweet | null {
  if (!quoteText) return null;

  // Create a quote repost
  return {
    id: `repost-${Date.now()}`,
    author: {
      id: currentUser.id || 'current-user',
      displayName: currentUser.displayName,
      handle: currentUser.handle,
      avatar: currentUser.avatar,
      badge: currentUser.badge || 'Verified',
    },
    createdAt: 'now',
    content: quoteText,
    repostType: 'quote',
    originalPostId: originalPost.id, // Store only the ID (optimized for backend)
    stats: {
      likes: 0,
      comments: 0,
      reposts: 0,
    },
    userInteractions: {
      liked: false,
      reposted: true,
    },
  };
}

export function incrementRepostCount(posts: Post[], postId: string): Post[] {
  return posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          stats: {
            ...post.stats,
            reposts: post.stats.reposts + 1,
          },
        }
      : post
  );
}

