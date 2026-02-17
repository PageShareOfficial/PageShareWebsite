import { Post, Tweet } from '@/types';

/**
 * Type guard: narrows Post to Tweet (post with content, repostType, etc.).
 * Use before accessing repostType, originalPostId, quotedPost, and other Tweet-only fields.
 */
export function isTweet(post: Post): post is Tweet {
  return post != null && 'content' in post;
}
