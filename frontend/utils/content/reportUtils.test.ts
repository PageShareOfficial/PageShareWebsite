import { describe, expect, it, vi } from 'vitest';
import { getReportedContentPath } from '@/utils/content/reportUtils';

vi.mock('@/lib/api/reportApi', () => ({
  createReport: vi.fn(),
}));

describe('getReportedContentPath', () => {
  it('links a post report to the post page', () => {
    expect(
      getReportedContentPath({
        contentType: 'post',
        contentId: 'post-1',
        reportedUserHandle: 'alice',
      })
    ).toBe('/alice/posts/post-1');
  });

  it('links a comment report to its parent post with a comment anchor', () => {
    expect(
      getReportedContentPath({
        contentType: 'comment',
        contentId: 'c9',
        postId: 'post-1',
        reportedUserHandle: 'alice',
      })
    ).toBe('/alice/posts/post-1#comment-c9');
  });

  it('returns null for a comment report without a parent post id', () => {
    expect(
      getReportedContentPath({
        contentType: 'comment',
        contentId: 'c9',
        reportedUserHandle: 'alice',
      })
    ).toBeNull();
  });
});
