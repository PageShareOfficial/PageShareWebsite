import { describe, expect, it } from 'vitest';
import type { Post } from '@/types';
import { isQuotePost, removeDeletedPost, resolveRepostedPost } from './quotedPostUtils';

function makePost(id: string, overrides: Partial<Post> = {}): Post {
  return {
    id,
    author: { id: `user-${id}`, displayName: `User ${id}`, handle: `user${id}`, avatar: '' },
    createdAt: '1m',
    content: `content ${id}`,
    stats: { likes: 0, comments: 0, reposts: 0 },
    userInteractions: { liked: false, reposted: false },
    ...overrides,
  };
}

describe('isQuotePost', () => {
  it('is true for explicit quote posts, even when the original id was cleared', () => {
    expect(isQuotePost(makePost('b', { repostType: 'quote', originalPostId: 'a' }))).toBe(true);
    expect(isQuotePost(makePost('b', { repostType: 'quote' }))).toBe(true);
  });

  it('treats an original id without a repost type as a quote (profile list shape)', () => {
    expect(isQuotePost(makePost('b', { originalPostId: 'a' }))).toBe(true);
  });

  it('is false for normal reposts and plain posts', () => {
    expect(isQuotePost(makePost('b', { repostType: 'normal', originalPostId: 'a' }))).toBe(false);
    expect(isQuotePost(makePost('b'))).toBe(false);
  });
});

describe('resolveRepostedPost', () => {
  const original = makePost('a');

  it('prefers the copy embedded by the API', () => {
    const embedded = makePost('a', { content: 'embedded' });
    const quote = makePost('b', { repostType: 'quote', originalPostId: 'a', quotedPost: embedded });
    expect(resolveRepostedPost(quote, [original])).toBe(embedded);
  });

  it('falls back to the loaded list', () => {
    const quote = makePost('b', { repostType: 'quote', originalPostId: 'a' });
    expect(resolveRepostedPost(quote, [original])).toBe(original);
  });

  it('returns undefined when the original is gone', () => {
    const quote = makePost('b', { repostType: 'quote', originalPostId: 'a' });
    expect(resolveRepostedPost(quote, [])).toBeUndefined();
  });

  it('returns undefined for plain posts', () => {
    expect(resolveRepostedPost(makePost('c'), [original])).toBeUndefined();
  });
});

describe('removeDeletedPost', () => {
  const original = makePost('a');
  const normalRepost = makePost('r', { repostType: 'normal', originalPostId: 'a' });
  const quote = makePost('b', { repostType: 'quote', originalPostId: 'a', quotedPost: original });
  const unrelated = makePost('c');

  it('removes the post and its normal reposts but keeps quote posts', () => {
    const result = removeDeletedPost([original, normalRepost, quote, unrelated], 'a');
    expect(result.map((post) => post.id)).toEqual(['b', 'c']);
  });

  it('drops the embedded copy so the quote renders as deleted', () => {
    const [updatedQuote] = removeDeletedPost([quote], 'a');
    expect(updatedQuote.quotedPost).toBeUndefined();
    expect(updatedQuote.originalPostId).toBe('a');
    expect(resolveRepostedPost(updatedQuote, [])).toBeUndefined();
  });

  it('leaves posts quoting something else untouched', () => {
    const otherQuote = makePost('d', { repostType: 'quote', originalPostId: 'c', quotedPost: unrelated });
    const [result] = removeDeletedPost([otherQuote], 'a');
    expect(result).toBe(otherQuote);
  });

  it('returns the list unchanged for an empty id', () => {
    const posts = [original, quote];
    expect(removeDeletedPost(posts, '')).toBe(posts);
  });
});
