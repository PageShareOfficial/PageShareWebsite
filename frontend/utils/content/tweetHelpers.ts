import { Tweet, User } from '@/types';

export interface CreateTweetParams {
  content: string;
  author: User;
  mediaUrls?: string[]; // URLs of uploaded images (data URLs or URLs)
  gifUrl?: string;
  poll?: {
    options: string[];
    duration: number;
  };
}

/**
 * Creates a new tweet object
 */
export function createTweet({
  content,
  author,
  mediaUrls,
  gifUrl,
  poll,
}: CreateTweetParams): Tweet {
  const now = new Date();
  const createdAt = formatRelativeTime(now);

  const tweet: Tweet = {
    id: `tweet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    author: {
      id: author.id,
      displayName: author.displayName,
      handle: author.handle,
      avatar: author.avatar,
      badge: author.badge,
    },
    createdAt,
    content,
    stats: {
      likes: 0,
      comments: 0,
      reposts: 0,
    },
    userInteractions: {
      liked: false,
      reposted: false,
    },
  };

  if (mediaUrls && mediaUrls.length > 0) {
    tweet.media = mediaUrls;
  }

  if (gifUrl) {
    tweet.gifUrl = gifUrl;
  }

  if (poll && poll.options.length >= 2) {
    tweet.poll = {
      options: poll.options,
      duration: poll.duration,
      createdAt,
      votes: {},
      userVote: undefined,
      isFinished: false,
    };
  }

  return tweet;
}

/**
 * Formats a date to relative time (e.g., "2h", "5m", "1d")
 */
function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'now';
  } else if (diffMins < 60) {
    return `${diffMins}m`;
  } else if (diffHours < 24) {
    return `${diffHours}h`;
  } else if (diffDays < 7) {
    return `${diffDays}d`;
  } else {
    // For older posts, show date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
}

