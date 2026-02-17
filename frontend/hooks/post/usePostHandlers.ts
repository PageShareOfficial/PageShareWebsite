import { useState } from 'react';
import { Post } from '@/types';
import { isTweet } from '@/utils/content/postUtils';
import { createNormalRepost, createQuoteRepost, incrementRepostCount } from '@/utils/content/repostHelpers';
import { User } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import {
  createPost,
  createRepost,
  deletePost,
  deleteRepost,
  mapPostResponseToPost,
  votePoll,
  togglePostReaction,
} from '@/lib/api/postApi';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface UsePostHandlersProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  currentUser: User;
  onDeleteRedirect?: (postId: string) => void;
  onDeleteSuccess?: () => void;
}

export function usePostHandlers({ posts, setPosts, currentUser, onDeleteRedirect, onDeleteSuccess }: UsePostHandlersProps) {
  const { session } = useAuth();
  const [isQuoteRepostOpen, setIsQuoteRepostOpen] = useState(false);
  const [quoteRepostPostId, setQuoteRepostPostId] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [postError, setPostError] = useState<string | null>(null);

  const hasUserReposted = (postId: string): boolean => {
    return posts.some(
      (post) => {
        if (!isTweet(post)) return false;
        if (post.repostType !== 'normal') return false;
        if (!post.originalPostId) return false;
        if (post.originalPostId !== postId) return false;
        if (post.author.handle !== currentUser.handle) return false;
        return true;
      }
    );
  };

  const findUserRepost = (postId: string) => {
    return posts.find(
      (post) =>
        isTweet(post) &&
        post.repostType === 'normal' &&
        post.originalPostId === postId &&
        post.author.handle === currentUser.handle
    );
  };

  const handleLike = async (postId: string) => {
    const token = session?.access_token;
    if (!token) {
      setPostError('You must be signed in to like posts.');
      return;
    }

    const target = posts.find((p) => p.id === postId);

    // For optimistic posts that aren't yet persisted, just update local state and skip API.
    if (target && target.id.startsWith('temp-')) {
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                stats: {
                  ...post.stats,
                  likes: post.userInteractions.liked ? post.stats.likes - 1 : post.stats.likes + 1,
                },
                userInteractions: {
                  ...post.userInteractions,
                  liked: !post.userInteractions.liked,
                },
              }
            : post
        )
      );
      return;
    }

    // Optimistic toggle for real posts
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              stats: {
                ...post.stats,
                likes: post.userInteractions.liked ? post.stats.likes - 1 : post.stats.likes + 1,
              },
              userInteractions: {
                ...post.userInteractions,
                liked: !post.userInteractions.liked,
              },
            }
          : post
      )
    );

    try {
      const res = await togglePostReaction(postId, token);
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                stats: {
                  ...post.stats,
                  likes: res.reaction_count,
                },
                userInteractions: {
                  ...post.userInteractions,
                  liked: res.reacted,
                },
              }
            : post
        )
      );
    } catch (err) {
      // On error, best effort revert the optimistic toggle
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                stats: {
                  ...post.stats,
                  likes: post.userInteractions.liked ? post.stats.likes - 1 : post.stats.likes + 1,
                },
                userInteractions: {
                  ...post.userInteractions,
                  liked: !post.userInteractions.liked,
                },
              }
            : post
        )
      );
      setPostError(getErrorMessage(err, 'Failed to like post'));
    }
  };

  const handleRepost = async (postId: string, type?: 'normal' | 'quote') => {
    const token = session?.access_token;
    if (!token) {
      setPostError('Sign in to repost.');
      return;
    }

    const originalPost = posts.find((p) => p.id === postId);
    if (!originalPost) return;

    // Undo repost (normal only): optimistic then DELETE
    if (type === 'normal' && hasUserReposted(postId)) {
      const userRepost = findUserRepost(postId);
      if (!userRepost) return;

      const prevState = posts;
      setPosts((prev) => {
        const filtered = prev.filter((p) => p.id !== userRepost.id);
        return filtered.map((post) =>
          post.id === postId
            ? {
                ...post,
                stats: {
                  ...post.stats,
                  reposts: Math.max(0, post.stats.reposts - 1),
                },
                userInteractions: {
                  ...post.userInteractions,
                  reposted: false,
                },
              }
            : post
        );
      });

      try {
        await deleteRepost(postId, token);
      } catch (err) {
        setPosts(prevState);
        setPostError(getErrorMessage(err, 'Failed to undo repost'));
      }
      return;
    }

    if (type === 'quote') {
      setQuoteRepostPostId(postId);
      setIsQuoteRepostOpen(true);
      return;
    }

    if (type === 'normal') {
      const postToRepost =
        isTweet(originalPost) && originalPost.repostType === 'quote' ? originalPost : originalPost;
      const repost = createNormalRepost({
        originalPost: postToRepost,
        currentUser: {
          id: currentUser.id,
          displayName: currentUser.displayName,
          handle: currentUser.handle,
          avatar: currentUser.avatar,
          badge: currentUser.badge,
        },
      });

      if (!repost) return;

      const postIdToIncrement = postToRepost.id;
      const prevState = posts;
      setPosts((prev) => {
        const updated = incrementRepostCount(prev, postIdToIncrement);
        const updatedWithInteraction = updated.map((post) =>
          post.id === postIdToIncrement
            ? {
                ...post,
                userInteractions: { ...post.userInteractions, reposted: true },
              }
            : post
        );
        return [repost, ...updatedWithInteraction];
      });

      try {
        const data = await createRepost(postIdToIncrement, { type: 'normal' }, token);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === repost.id ? { ...p, id: `repost-${data.id}` } : p
          )
        );
      } catch (err) {
        setPosts(prevState);
        const message = getErrorMessage(err, 'Failed to repost');
        setPostError(message.includes('409') || message.toLowerCase().includes('already') ? 'Already reposted' : message);
      }
    }
  };

  const handleComment = (postId: string) => {
    // Handle comment action - can be overridden by components
  };

  const handleDelete = async (postId: string) => {
    const token = session?.access_token;
    if (!token) {
      setPostError('You must be signed in to delete posts.');
      return;
    }

    try {
      await deletePost(postId, token);
      setPosts((prev) => {
        const filtered = prev.filter((p) => p.id !== postId);
        return filtered.filter((p) => {
          if (isTweet(p) && p.repostType && p.originalPostId) {
            return p.originalPostId !== postId;
          }
          return true;
        });
      });

      onDeleteSuccess?.();
      if (onDeleteRedirect) {
        onDeleteRedirect(postId);
      }
    } catch (err) {
      setPostError(getErrorMessage(err, 'Failed to delete post'));
    }
  };

  const handleVote = async (postId: string, optionIndex: number) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || !('poll' in post) || !post.poll || post.poll.isFinished) return;
    // One vote per user — cannot change vote once submitted
    if (post.poll.userVote !== undefined) return;

    const pollId = post.poll.pollId;
    const token = session?.access_token;

    if (pollId && token) {
      try {
        const { data } = await votePoll(pollId, optionIndex, token);
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId || !('poll' in p) || !p.poll) return p;
            return {
              ...p,
              poll: {
                ...p.poll,
                votes: data.results ?? {},
                userVote: data.option_index,
              },
            };
          })
        );
      } catch {
        setPostError('Failed to record vote');
      }
      return;
    }

    // Fallback: local-only update (e.g. optimistic post without pollId yet). Still one vote only.
    setPosts((prev) =>
      prev.map((p) => {
        if (
          p.id !== postId ||
          !('poll' in p) ||
          !p.poll ||
          p.poll.isFinished ||
          p.poll.userVote !== undefined
        )
          return p;
        const currentVotes = p.poll.votes || {};
        const newVotes = { ...currentVotes };
        newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;
        return {
          ...p,
          poll: { ...p.poll, votes: newVotes, userVote: optionIndex },
        };
      })
    );
  };

  const handleNewTweet = async (
    text: string,
    mediaFiles?: File[],
    gifUrl?: string,
    poll?: { options: string[]; duration: number }
  ) => {
    const hasContent = text.trim().length > 0;
    const hasMedia = mediaFiles && mediaFiles.length > 0;
    const hasGif = !!gifUrl;
    const hasPoll = poll && poll.options.filter((o) => o.trim()).length >= 2;

    if (!hasContent && !hasMedia && !hasGif && !hasPoll) {
      setPostError('Add some text, media, GIF, or a poll to post.');
      return;
    }

    const token = session?.access_token;
    if (!token) {
      setPostError('You must be signed in to post.');
      return;
    }

    setIsPosting(true);
    setPostError(null);

    const content = text.trim() || ' ';
    const tempId = `temp-${Date.now()}`;

    // Optimistic: show post immediately in UI
    const mediaUrls = hasMedia
      ? await Promise.all(
          mediaFiles!.map(
            (f) =>
              new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(f);
              })
          )
        )
      : undefined;

    const nowIso = new Date().toISOString();

    const optimisticPost: Post = {
      id: tempId,
      author: {
        id: currentUser.id,
        displayName: currentUser.displayName,
        handle: currentUser.handle,
        avatar: currentUser.avatar,
        badge: currentUser.badge,
      },
      content,
      createdAt: 'now',
      createdAtRaw: nowIso,
      media: mediaUrls,
      gifUrl: hasGif ? gifUrl : undefined,
      stats: { likes: 0, comments: 0, reposts: 0 },
      userInteractions: { liked: false, reposted: false },
    };

    if (hasPoll) {
      optimisticPost.poll = {
        options: poll!.options.filter((o) => o.trim()),
        duration: poll!.duration,
        createdAt: 'now',
        votes: {},
        userVote: undefined,
        isFinished: false,
      };
    }

    setPosts((prev) => [optimisticPost, ...prev]);

    try {
      const res = await createPost(
        {
          content,
          gif_url: hasGif ? gifUrl : undefined,
          poll: hasPoll ? { options: poll!.options.filter((o) => o.trim()), duration_days: poll!.duration } : undefined,
        },
        hasMedia ? mediaFiles : undefined,
        token
      );

      const newPost = mapPostResponseToPost(
        res,
        {
          id: currentUser.id,
          displayName: currentUser.displayName,
          handle: currentUser.handle,
          avatar: currentUser.avatar,
          badge: currentUser.badge,
        },
        hasPoll ? { options: poll!.options.filter((o) => o.trim()), duration: poll!.duration } : undefined
      );

      // Replace optimistic post with real one, preserving any optimistic like/repost state
      setPosts((prev) =>
        prev.map((p) =>
          p.id === tempId
            ? {
                ...newPost,
                stats: {
                  ...newPost.stats,
                  likes: p.stats.likes,
                  comments: p.stats.comments,
                  reposts: p.stats.reposts,
                },
                userInteractions: {
                  ...newPost.userInteractions,
                  liked: p.userInteractions.liked,
                  reposted: p.userInteractions.reposted,
                },
              }
            : p
        )
      );
    } catch (err) {
      // Remove optimistic post on error
      setPosts((prev) => prev.filter((p) => p.id !== tempId));
      setPostError(getErrorMessage(err, 'Failed to post'));
    } finally {
      setIsPosting(false);
    }
  };

  const handleQuoteRepostSubmit = async (text: string) => {
    const token = session?.access_token;
    if (!token || !quoteRepostPostId) {
      if (!token) setPostError('Sign in to repost.');
      setIsQuoteRepostOpen(false);
      setQuoteRepostPostId(null);
      return;
    }

    const originalPost = posts.find((p) => p.id === quoteRepostPostId);
    if (!originalPost) {
      setIsQuoteRepostOpen(false);
      setQuoteRepostPostId(null);
      return;
    }

    const repost = createQuoteRepost({
      originalPost,
      currentUser: {
        id: currentUser.id,
        displayName: currentUser.displayName,
        handle: currentUser.handle,
        avatar: currentUser.avatar,
        badge: currentUser.badge || 'Verified',
      },
      quoteText: text,
    });

    if (!repost) {
      setIsQuoteRepostOpen(false);
      setQuoteRepostPostId(null);
      return;
    }

    const originalId = quoteRepostPostId;
    const prevState = posts;
    const tempId = repost.id;

    setPosts((prev) => {
      const updated = incrementRepostCount(prev, originalId);
      const withInteraction = updated.map((p) =>
        p.id === originalId
          ? { ...p, userInteractions: { ...p.userInteractions, reposted: true } }
          : p
      );
      return [repost, ...withInteraction];
    });
    setIsQuoteRepostOpen(false);
    setQuoteRepostPostId(null);

    try {
      const data = await createRepost(
        originalId,
        { type: 'quote', quote_content: text },
        token
      );
      if (data.quote_post) {
        const mapped = mapPostResponseToPost(data.quote_post);
        setPosts((prev) =>
          prev.map((p) => (p.id === tempId ? mapped : p))
        );
      }
    } catch (err) {
      setPosts(prevState);
      setPostError(
        getErrorMessage(err, 'Failed to quote repost')
      );
    }
  };

  return {
    handleLike,
    handleRepost,
    handleComment,
    handleDelete,
    handleVote,
    handleNewTweet,
    handleQuoteRepostSubmit,
    hasUserReposted,
    isQuoteRepostOpen,
    setIsQuoteRepostOpen,
    quoteRepostPostId,
    setQuoteRepostPostId,
    isPosting,
    postError,
    clearPostError: () => setPostError(null),
  };
}
