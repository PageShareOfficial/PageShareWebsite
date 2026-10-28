import { Post } from '@/types';

/**
 * Type guard: a feed post with content (and optional repost fields).
 * Use before reading repostType, originalPostId, quotedPost, etc.
 */
export function isPost(post: Post | null | undefined): post is Post {
  return post != null && 'content' in post;
}
