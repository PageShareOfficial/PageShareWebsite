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
  /** Raw ISO timestamp from backend when available (used for full date/time views). */
  createdAtRaw?: string;
  content: string;
  media?: string[]; // URLs of uploaded images
  gifUrl?: string; // URL of selected GIF
  repostedFrom?: User; // Original author if this is a repost
  repostType?: 'normal' | 'quote'; // Type of repost
  originalPostId?: string; // Reference to original post ID (optimized for backend)
  /** When present, the original post that was quoted (from API). Use this to render the quoted tweet card. */
  quotedPost?: Post;
  poll?: {
    pollId?: string; // backend poll id for voting
    options: string[];
    duration: number; // in days (for display when no expiresAt)
    createdAt: string; // when poll was created
    votes?: { [optionIndex: number]: number }; // votes per option
    userVote?: number; // index of option user voted for (undefined if not voted)
    isFinished: boolean; // true if poll has ended
    expiresAt?: string; // ISO date when poll ends (from backend)
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
    pollId?: string; // backend poll id for voting
    options: string[];
    duration: number; // in days
    createdAt: string; // when poll was created
    votes?: { [optionIndex: number]: number }; // votes per option
    userVote?: number; // index of option user voted for (undefined if not voted)
    isFinished: boolean; // true if poll has ended
    expiresAt?: string; // ISO date when poll ends (from backend)
  };
  replies?: Comment[]; // Nested replies (optional for now)
}

