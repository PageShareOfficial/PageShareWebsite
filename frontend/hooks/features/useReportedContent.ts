'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Post, Comment } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { listMyReports, type ReportHistoryItemResponse } from '@/lib/api/reportApi';
import { isAutoHideReportedEnabled } from '@/utils/content/reportUtils';

interface UseReportedContentResult {
  loading: boolean;
  reportedPostIds: Set<string>;
  reportedCommentIds: Set<string>;
  filterReportedPosts: (posts: Post[], reporterHandle: string) => Post[];
  filterReportedComments: (comments: Comment[], reporterHandle: string) => Comment[];
}

export function useReportedContent(): UseReportedContentResult {
  const { session } = useAuth();
  const accessToken = session?.access_token ?? null;

  const [reportedPostIds, setReportedPostIds] = useState<Set<string>>(new Set());
  const [reportedCommentIds, setReportedCommentIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!accessToken) {
      setReportedPostIds(new Set());
      setReportedCommentIds(new Set());
      return;
    }

    let cancelled = false;

    const loadReports = async () => {
      setLoading(true);
      try {
        const items = await listMyReports(accessToken);
        if (cancelled) return;

        const postIds = new Set<string>();
        const commentIds = new Set<string>();

        items.forEach((r: ReportHistoryItemResponse) => {
          if (r.content_type === 'post') {
            postIds.add(r.content_id);
          } else if (r.content_type === 'comment') {
            commentIds.add(r.content_id);
          }
        });

        setReportedPostIds(postIds);
        setReportedCommentIds(commentIds);
      } catch {
        if (!cancelled) {
          setReportedPostIds(new Set());
          setReportedCommentIds(new Set());
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReports();

    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  const filterReportedPosts = (posts: Post[], reporterHandle: string): Post[] => {
    if (!reporterHandle || !isAutoHideReportedEnabled(reporterHandle)) return posts;
    if (reportedPostIds.size === 0) return posts;
    return posts.filter((post) => !reportedPostIds.has(post.id));
  };

  const filterReportedComments = (comments: Comment[], reporterHandle: string): Comment[] => {
    if (!reporterHandle || !isAutoHideReportedEnabled(reporterHandle)) return comments;
    if (reportedCommentIds.size === 0) return comments;
    return comments.filter((comment) => !reportedCommentIds.has(comment.id));
  };

  // Freeze sets for callers so they don't accidentally mutate internal state
  const reportedPostIdsView = useMemo(() => new Set(reportedPostIds), [reportedPostIds]);
  const reportedCommentIdsView = useMemo(() => new Set(reportedCommentIds), [reportedCommentIds]);

  return {
    loading,
    reportedPostIds: reportedPostIdsView,
    reportedCommentIds: reportedCommentIdsView,
    filterReportedPosts,
    filterReportedComments,
  };
}
