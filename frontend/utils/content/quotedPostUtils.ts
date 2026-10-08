import type { Post } from '@/types';
import { isTweet } from './postUtils';

/**
 * Quote posts are their own posts that embed another one. The API may send only
 * `originalPostId` (profile lists), so a missing `repostType` with an id still means quote.
 * When the quoted original is hard-deleted the id is cleared, so `repostType` alone counts too.
 */
export function isQuotePost(post: Post): boolean {
  if (!isTweet(post)) return false;
  if (post.repostType === 'quote') return true;
  return Boolean(post.originalPostId) && post.repostType !== 'normal';
}

/**
 * The post a repost points at: the copy embedded by the API first, else the one already in
 * the loaded list. `undefined` for a quote post means the original is gone (the API only
 * omits it when the original was deleted).
 */
export function resolveRepostedPost(post: Post, allPosts: Post[] = []): Post | undefined {
  if (!isTweet(post) || !post.repostType || !post.originalPostId) return undefined;
  if (post.quotedPost) return post.quotedPost;
  return allPosts.find((candidate) => candidate.id === post.originalPostId);
}

/**
 * Local list update after deleting `deletedPostId`, mirroring the server:
 * the post and its normal reposts disappear, while quote posts of it stay (they are separate
 * posts) and lose their embedded copy so they render as "post deleted".
 */
export function removeDeletedPost(posts: Post[], deletedPostId: string): Post[] {
  if (!deletedPostId) return posts;

  return posts
    .filter((post) => post.id !== deletedPostId)
    .filter((post) => !(isTweet(post) && post.repostType === 'normal' && post.originalPostId === deletedPostId))
    .map((post) => {
      if (!isTweet(post) || post.originalPostId !== deletedPostId || !post.quotedPost) return post;
      const { quotedPost: _removed, ...withoutQuotedPost } = post;
      return withoutQuotedPost;
    });
}
