export interface User {
  id: string;
  displayName: string;
  handle: string;
  avatar: string;
  badge?: 'Verified' | 'Public';
}

// Normal tweet/post (from TweetComposer)
export interface Tweet {
  id: string;
  author: User;
  createdAt: string;
  content: string;
  media?: string[]; // URLs of uploaded images
  gifUrl?: string; // URL of selected GIF
  repostedFrom?: User; // Original author if this is a repost
  repostType?: 'normal' | 'quote'; // Type of repost
  originalPostId?: string; // Reference to original post ID (optimized for backend)
  poll?: {
    options: string[];
    duration: number; // in days
    createdAt: string; // when poll was created
    votes?: { [optionIndex: number]: number }; // votes per option
    userVote?: number; // index of option user voted for (undefined if not voted)
    isFinished: boolean; // true if poll has ended
  };
  stats: {
    likes: number;
    comments: number;
    reposts: number;
  };
  userInteractions: {
    liked: boolean;
    reposted: boolean;
  };
}

// All posts are tweets
export type Post = Tweet;

export interface WatchlistItem {
  ticker: string;
  name: string;
  change: number; // percentage
  price: number;
  image?: string; // Logo/image URL
}

export interface Comment {
  id: string;
  postId: string; // ID of the post this comment belongs to
  author: User;
  content: string;
  createdAt: string;
  likes: number;
  userLiked: boolean;
  media?: string[]; // URLs of uploaded images
  gifUrl?: string; // URL of selected GIF
  poll?: {
    options: string[];
    duration: number; // in days
    createdAt: string; // when poll was created
    votes?: { [optionIndex: number]: number }; // votes per option
    userVote?: number; // index of option user voted for (undefined if not voted)
    isFinished: boolean; // true if poll has ended
  };
  replies?: Comment[]; // Nested replies (optional for now)
}

