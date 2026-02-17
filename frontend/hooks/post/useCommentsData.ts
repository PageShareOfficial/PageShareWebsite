import { useEffect, useState } from 'react';
import { Comment, User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { formatRelativeTime } from '@/utils/core/dateUtils';
import {
  CommentResponse,
  CreateCommentPayload,
  createComment,
  deleteComment,
  listComments,
  toggleCommentReaction,
} from '@/lib/api/commentApi';
import { votePoll } from '@/lib/api/postApi';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface UseCommentsDataOptions {
  postId: string;
  currentUser: User;
  pageSize?: number;
}

interface UseCommentsDataResult {
  comments: Comment[];
  setComments: React.Dispatch<React.SetStateAction<Comment[]>>;
  loading: boolean;
  error: string | null;
  loadMore: () => Promise<void>;
  hasMore: boolean;
  isLoadingMore: boolean;
  refresh: () => Promise<void>;
  handleAddComment: (
    text: string,
    mediaFiles?: File[],
    gifUrl?: string,
    poll?: { options: string[]; duration: number },
    previewUrls?: string[]
  ) => Promise<void>;
  handleDeleteComment: (commentId: string) => Promise<void>;
  handleToggleLikeComment: (commentId: string) => Promise<void>;
  handleVoteOnCommentPoll: (commentId: string, optionIndex: number) => Promise<void>;
}

function mapCommentResponseToComment(res: CommentResponse): Comment {
  const mapped: Comment = {
    id: res.id,
    postId: res.post_id,
    author: {
      id: res.author.id,
      displayName: res.author.display_name,
      handle: res.author.username,
      avatar: res.author.profile_picture_url ?? '',
    },
    content: res.content,
    createdAt: formatRelativeTime(new Date(res.created_at)),
    likes: res.likes,
    userLiked: res.user_liked,
    media: res.media_urls && res.media_urls.length > 0 ? res.media_urls : undefined,
    gifUrl: res.gif_url ?? undefined,
  };
  if (res.poll) {
    mapped.poll = {
      pollId: res.poll.poll_id,
      options: res.poll.options,
      duration: 1,
      createdAt: formatRelativeTime(new Date(res.created_at)),
      votes: res.poll.results ?? {},
      userVote: res.poll.user_vote ?? undefined,
      isFinished: res.poll.is_finished,
      expiresAt: res.poll.expires_at,
    };
  }
  return mapped;
}

export function useCommentsData({
  postId,
  currentUser,
  pageSize = 20,
}: UseCommentsDataOptions): UseCommentsDataResult {
  const { session } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accessToken = session?.access_token ?? null;

  const fetchPage = async (pageToLoad: number, append: boolean) => {
    if (!postId || !accessToken) {
      setComments([]);
      setHasMore(false);
      return;
    }
    if (append) {
      setIsLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }
    try {
      const res = await listComments(postId, accessToken, { page: pageToLoad, per_page: pageSize });
      const mapped = res.data.map(mapCommentResponseToComment);
      setComments((prev) => (append ? [...prev, ...mapped] : mapped));
      const more = pageToLoad * pageSize < res.pagination.total;
      setHasMore(more);
      setPage(pageToLoad);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load comments'));
      if (!append) {
        setComments([]);
      }
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    setComments([]);
    setPage(1);
    setHasMore(true);
    if (postId && accessToken) {
      fetchPage(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, accessToken]);

  const loadMore = async () => {
    if (loading || isLoadingMore || !hasMore) return;
    await fetchPage(page + 1, true);
  };

  const refresh = async () => {
    await fetchPage(1, false);
  };

  const handleAddComment = async (
    text: string,
    mediaFiles?: File[],
    gifUrl?: string,
    poll?: { options: string[]; duration: number },
    previewUrls?: string[]
  ) => {
    if (!text.trim()) return;
    if (!accessToken) {
      setError('You must be signed in to comment.');
      return;
    }

    const hasPoll = poll && poll.options.filter((o) => o.trim()).length >= 2;

    // Optimistic comment
    const tempId = `temp-comment-${Date.now()}`;
    const optimistic: Comment = {
      id: tempId,
      postId,
      author: currentUser,
      content: text.trim(),
      createdAt: 'now',
      likes: 0,
      userLiked: false,
    };
    if (previewUrls && previewUrls.length > 0) {
      optimistic.media = previewUrls;
    }
    if (hasPoll) {
      optimistic.poll = {
        options: poll!.options.filter((o) => o.trim()),
        duration: poll!.duration,
        createdAt: 'now',
        votes: {},
        userVote: undefined,
        isFinished: false,
      };
    }
    setComments((prev) => [optimistic, ...prev]);

    try {
      const payload: CreateCommentPayload = {
        content: text.trim(),
        gif_url: gifUrl || undefined,
        poll: hasPoll
          ? { options: poll!.options.filter((o) => o.trim()), duration_days: poll!.duration }
          : undefined,
      };
      const res = await createComment(postId, payload, mediaFiles, accessToken);
      const newComment = mapCommentResponseToComment(res);
      setComments((prev) =>
        prev.map((c) =>
          c.id === tempId
            ? {
                // preserve any optimistic like/poll state the user may have changed
                ...newComment,
                likes: c.likes,
                userLiked: c.userLiked,
                poll: c.poll ?? newComment.poll,
              }
            : c
        )
      );
    } catch (err) {
      setComments((prev) => prev.filter((c) => c.id !== tempId));
      setError(getErrorMessage(err, 'Failed to post comment'));
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!accessToken) {
      setError('You must be signed in to delete comments.');
      return;
    }
    const prev = comments;
    setComments((c) => c.filter((cm) => cm.id !== commentId));
    try {
      await deleteComment(commentId, accessToken);
    } catch (err) {
      setComments(prev);
      setError(getErrorMessage(err, 'Failed to delete comment'));
    }
  };

  const handleToggleLikeComment = async (commentId: string) => {
    if (!accessToken) {
      setError('You must be signed in to like comments.');
      return;
    }

    const target = comments.find((c) => c.id === commentId);
    // For optimistic comments that aren't yet persisted, just update local state and skip API.
    if (target && target.id.startsWith('temp-comment-')) {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;
          const liked = !c.userLiked;
          return {
            ...c,
            userLiked: liked,
            likes: liked ? c.likes + 1 : Math.max(0, c.likes - 1),
          };
        })
      );
      return;
    }

    setComments((prev) =>
      prev.map((c) => {
        if (c.id !== commentId) return c;
        const liked = !c.userLiked;
        return {
          ...c,
          userLiked: liked,
          likes: liked ? c.likes + 1 : Math.max(0, c.likes - 1),
        };
      })
    );
    try {
      const res = await toggleCommentReaction(commentId, accessToken);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                userLiked: res.reacted,
                likes: res.reaction_count,
              }
            : c
        )
      );
    } catch (err) {
      // On error, best effort revert
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId) return c;
          const liked = !c.userLiked;
          return {
            ...c,
            userLiked: liked,
            likes: liked ? c.likes + 1 : Math.max(0, c.likes - 1),
          };
        })
      );
      setError(getErrorMessage(err, 'Failed to like comment'));
    }
  };

  const handleVoteOnCommentPoll = async (commentId: string, optionIndex: number) => {
    if (!accessToken) {
      setError('You must be signed in to vote on polls.');
      return;
    }
    const comment = comments.find((c) => c.id === commentId);
    if (!comment || !comment.poll || comment.poll.isFinished || comment.poll.userVote !== undefined) {
      return;
    }
    const pollId = comment.poll.pollId;
    if (!pollId) return;
    try {
      const { data } = await votePoll(pollId, optionIndex, accessToken);
      setComments((prev) =>
        prev.map((c) => {
          if (c.id !== commentId || !c.poll) return c;
          return {
            ...c,
            poll: {
              ...c.poll,
              votes: data.results ?? {},
              userVote: data.option_index,
            },
          };
        })
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to record poll vote'));
    }
  };

  return {
    comments,
    setComments,
    loading,
    error,
    loadMore,
    hasMore,
    isLoadingMore,
    refresh,
    handleAddComment,
    handleDeleteComment,
    handleToggleLikeComment,
    handleVoteOnCommentPoll,
  };
}
