import { useState } from 'react';
import { Post } from '@/types';
import { isTweet } from '@/data/mockData';
import { createNormalRepost, createQuoteRepost, incrementRepostCount } from '@/utils/content/repostHelpers';
import { createTweet } from '@/utils/content/tweetHelpers';
import { User } from '@/types';

interface UsePostHandlersProps {
  posts: Post[];
  setPosts: React.Dispatch<React.SetStateAction<Post[]>>;
  currentUser: User;
  onDeleteRedirect?: (postId: string) => void;
}

export function usePostHandlers({ posts, setPosts, currentUser, onDeleteRedirect }: UsePostHandlersProps) {
  const [isQuoteRepostOpen, setIsQuoteRepostOpen] = useState(false);
  const [quoteRepostPostId, setQuoteRepostPostId] = useState<string | null>(null);

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

  const handleLike = (postId: string) => {
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
  };

  const handleRepost = (postId: string, type?: 'normal' | 'quote') => {
    const originalPost = posts.find((p) => p.id === postId);
    if (!originalPost) return;

    // Check if user already reposted (for undo)
    if (type === 'normal' && hasUserReposted(postId)) {
      const userRepost = findUserRepost(postId);
      if (userRepost) {
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
      }
      return;
    }

    if (type === 'quote') {
      setQuoteRepostPostId(postId);
      setIsQuoteRepostOpen(true);
    } else if (type === 'normal') {
      const postToRepost = isTweet(originalPost) && originalPost.repostType === 'quote' 
        ? originalPost 
        : originalPost;
      
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

      if (repost) {
        setPosts((prev) => {
          const postIdToIncrement = postToRepost.id;
          const updated = incrementRepostCount(prev, postIdToIncrement);
          const updatedWithInteraction = updated.map((post) =>
            post.id === postIdToIncrement
              ? {
                  ...post,
                  userInteractions: {
                    ...post.userInteractions,
                    reposted: true,
                  },
                }
              : post
          );
          return [repost, ...updatedWithInteraction];
        });
      }
    }
  };

  const handleComment = (postId: string) => {
    // Handle comment action - can be overridden by components
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => {
      const filtered = prev.filter((p) => p.id !== postId);
      return filtered.filter((p) => {
        if (isTweet(p) && p.repostType && p.originalPostId) {
          return p.originalPostId !== postId;
        }
        return true;
      });
    });
    
    // Call redirect callback if provided
    if (onDeleteRedirect) {
      onDeleteRedirect(postId);
    }
  };

  const handleVote = (postId: string, optionIndex: number) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId && 'poll' in post && post.poll && !post.poll.isFinished) {
          const currentVotes = post.poll.votes || {};
          const newVotes = { ...currentVotes };
          const currentVote = post.poll.userVote;
          
          if (currentVote !== undefined && currentVote !== optionIndex) {
            newVotes[currentVote] = Math.max(0, (newVotes[currentVote] || 0) - 1);
          }
          
          newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;
          
          return {
            ...post,
            poll: {
              ...post.poll,
              votes: newVotes,
              userVote: optionIndex,
            },
          };
        }
        return post;
      })
    );
  };

  const handleNewTweet = async (
    text: string,
    mediaFiles?: File[],
    gifUrl?: string,
    poll?: { options: string[]; duration: number }
  ) => {
    let mediaUrls: string[] = [];
    
    if (mediaFiles && mediaFiles.length > 0) {
      const convertFileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      try {
        mediaUrls = await Promise.all(mediaFiles.map(convertFileToDataUrl));
      } catch (error) {
        console.error('Error converting media files:', error);
      }
    }

    const newTweet = createTweet({
      content: text,
      author: currentUser,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      gifUrl,
      poll,
    });

    setPosts((prev) => [newTweet, ...prev]);
  };

  const handleQuoteRepostSubmit = (text: string) => {
    if (!quoteRepostPostId) return;

    const originalPost = posts.find((p) => p.id === quoteRepostPostId);
    if (!originalPost) return;

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

    if (repost) {
      const updatedWithCount = incrementRepostCount(posts, quoteRepostPostId);
      setPosts([repost, ...updatedWithCount]);
    }

    setIsQuoteRepostOpen(false);
    setQuoteRepostPostId(null);
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
  };
}

