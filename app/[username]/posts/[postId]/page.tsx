'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart, MoreHorizontal, Share2, Trash2 } from 'lucide-react';
import Image from 'next/image';
import { HiOutlinePhotograph, HiOutlineEmojiHappy, HiX } from 'react-icons/hi';
import { RiFileGifLine, RiBarChartLine } from 'react-icons/ri';
import dynamic from 'next/dynamic';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { Grid } from '@giphy/react-components';
import Sidebar from '@/components/app/Sidebar';
import RightRail from '@/components/app/RightRail';
import PostCard from '@/components/app/PostCard';
import TweetComposer from '@/components/app/TweetComposer';
import { mockPosts, isTweet, mockComments } from '@/data/mockData';
import { Post, Comment, WatchlistItem } from '@/types';
import { createNormalRepost, createQuoteRepost, incrementRepostCount } from '@/utils/repostHelpers';
import { parseCashtags } from '@/utils/textFormatting';

// Dynamically import emoji picker to avoid SSR issues
const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

// Initialize Giphy
const getGiphyClient = () => {
  const apiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY || '';
  if (!apiKey) return null;
  return new GiphyFetch(apiKey);
};

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const postId = params.postId as string;
  
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [comments, setComments] = useState<Comment[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isQuoteRepostOpen, setIsQuoteRepostOpen] = useState(false);
  const [quoteRepostPostId, setQuoteRepostPostId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [showCommentComposer, setShowCommentComposer] = useState(false);
  const [openCommentMenuId, setOpenCommentMenuId] = useState<string | null>(null);
  const commentMenuRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  
  // Comment composer state
  const [commentText, setCommentText] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [pollDuration, setPollDuration] = useState(1);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [debouncedGifSearch, setDebouncedGifSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const maxLength = 280;
  
  // Mock current user - in real implementation, get from session/auth context
  const currentUser = {
    id: 'current-user',
    displayName: 'John Doe',
    handle: 'johndoe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    badge: 'Verified' as const,
  };

  // Load posts from localStorage on client side only (after mount)
  useEffect(() => {
    setIsClient(true);
    const saved = localStorage.getItem('pageshare_posts');
    if (saved) {
      try {
        const parsedPosts = JSON.parse(saved);
        const hasRepostStructure = parsedPosts.some((p: Post) => {
          if (isTweet(p)) {
            return p.repostType !== undefined && p.originalPostId !== undefined;
          }
          return false;
        });
        
        // Check if the post we're looking for exists in parsedPosts
        const postExists = parsedPosts.some((p: Post) => p.id === postId);
        
        // If post exists in localStorage, use parsedPosts immediately
        if (postExists) {
          setPosts(parsedPosts);
          setPostsLoaded(true);
          return;
        }
        
        const hasMockReposts = parsedPosts.some((p: Post) => 
          p.id === 'repost-1' || p.id === 'repost-2' || p.id === 'repost-3' || p.id === 'repost-4'
        );
        
        if (hasRepostStructure || hasMockReposts) {
          const repostPosts = parsedPosts.filter((p: Post) => 
            p.id === 'repost-1' || p.id === 'repost-2' || p.id === 'repost-3' || p.id === 'repost-4'
          );
          const allRepostsValid = repostPosts.every((p: Post) => {
            if (isTweet(p)) {
              return p.repostType !== undefined && p.originalPostId !== undefined;
            }
            return false;
          });
          
          if (allRepostsValid && repostPosts.length > 0) {
            setPosts(parsedPosts);
          } else {
            setPosts(mockPosts);
            localStorage.setItem('pageshare_posts', JSON.stringify(mockPosts));
          }
        } else {
          setPosts(mockPosts);
          localStorage.setItem('pageshare_posts', JSON.stringify(mockPosts));
        }
      } catch {
        setPosts(mockPosts);
      }
    } else {
      setPosts(mockPosts);
    }
    
    // Mark posts as loaded
    setPostsLoaded(true);
  }, [postId]);

  // Load watchlist
  useEffect(() => {
    const savedWatchlist = localStorage.getItem('pageshare_watchlist');
    if (savedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        if (Array.isArray(parsedWatchlist)) {
          setWatchlist(parsedWatchlist);
        } else {
          setWatchlist([]);
        }
      } catch {
        // If parsing fails, keep empty watchlist
        setWatchlist([]);
      }
    } else {
      setWatchlist([]);
    }
  }, []);

  // Save posts to localStorage whenever they change (client side only)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('pageshare_posts', JSON.stringify(posts));
    }
  }, [posts, isClient]);

  // Save comments to localStorage whenever they change (client side only)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined' && postId) {
      // Save all comments (both user-created and mock comments that haven't been deleted)
      // Filter out deleted comments by checking if they still exist in the comments array
      const commentsToSave = comments.filter(c => c.postId === postId);
      if (commentsToSave.length > 0) {
        // Only save user-created comments (those with IDs starting with 'comment-')
        // Mock comments are loaded from mockData, so we don't need to save them
        const userCreatedComments = commentsToSave.filter(c => c.id.startsWith('comment-'));
        if (userCreatedComments.length > 0) {
          localStorage.setItem(`pageshare_comments_${postId}`, JSON.stringify(userCreatedComments));
        } else {
          // If no user-created comments, remove the localStorage entry
          localStorage.removeItem(`pageshare_comments_${postId}`);
        }
      } else {
        // If no comments, remove the localStorage entry
        localStorage.removeItem(`pageshare_comments_${postId}`);
      }
    }
  }, [comments, isClient, postId]);

  // Save watchlist to localStorage whenever it changes (client side only)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('pageshare_watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist, isClient]);

  // Find the post by ID - recalculates when posts change
  const post = posts.find((p) => p.id === postId);

  // Load comments for this post
  useEffect(() => {
    if (postId && isClient && post) {
      // Load from localStorage first (user-created comments)
      const saved = localStorage.getItem(`pageshare_comments_${postId}`);
      let userComments: Comment[] = [];
      if (saved) {
        try {
          userComments = JSON.parse(saved);
        } catch {
          userComments = [];
        }
      }
      
      // Load deleted comment IDs (to filter out deleted mock comments)
      const deletedCommentsKey = `pageshare_deleted_comments_${postId}`;
      const deletedCommentsStr = localStorage.getItem(deletedCommentsKey);
      let deletedCommentIds: string[] = [];
      if (deletedCommentsStr) {
        try {
          deletedCommentIds = JSON.parse(deletedCommentsStr);
        } catch {
          deletedCommentIds = [];
        }
      }
      
      // Combine mock comments and user-created comments, filtering out deleted ones
      const mockPostComments = mockComments
        .filter((c: Comment) => c.postId === postId)
        .filter((c: Comment) => !deletedCommentIds.includes(c.id));
      setComments([...userComments, ...mockPostComments]);
    }
  }, [postId, isClient, post]);

  // If post not found after posts are loaded, redirect to home
  // Only redirect if we've loaded posts from localStorage and the post still isn't found
  useEffect(() => {
    if (isClient && postsLoaded && posts.length > 0) {
      // Give more time for posts to be fully processed and state to update
      const timer = setTimeout(() => {
        // Double-check if post exists in the current posts array
        const foundPost = posts.find((p) => p.id === postId);
        if (!foundPost) {
          // Only redirect if post is truly not found after all checks
          router.push('/home');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isClient, postsLoaded, router, posts, postId]);

  // Debounce GIF search - MUST be before any early returns
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedGifSearch(gifSearchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [gifSearchQuery]);

  // Format date and time from createdAt - client-side only to avoid hydration errors
  const [formattedDateTime, setFormattedDateTime] = useState<string>('');
  
  useEffect(() => {
    if (post) {
      // For mock data, createdAt is like "2h", "5h", "1d"
      // In real implementation, this would be a timestamp
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
      const timeStr = now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
      setFormattedDateTime(`${dateStr} at ${timeStr}`);
    }
  }, [post]);

  // Show loading state while posts are being loaded
  if (!postsLoaded || !isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Don't show "Post not found" immediately - let the redirect handle it
  // This prevents flickering between "Post not found" and redirect
  if (!post && postsLoaded) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading post...</div>
      </div>
    );
  }

  if (!post) {
    return null; // Let redirect handle it
  }

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

  // Check if current user has already reposted a post (only normal reposts, not quote reposts)
  // Quote reposts are treated as new tweets, so they don't count as "reposts" for button coloring
  const hasUserReposted = (postId: string): boolean => {
    const result = posts.some(
      (post) => {
        if (!isTweet(post)) return false;
        if (post.repostType !== 'normal') return false; // Only check normal reposts
        if (!post.originalPostId) return false;
        if (post.originalPostId !== postId) return false;
        if (post.author.handle !== currentUser.handle) return false;
        return true;
      }
    );
    return result;
  };

  // Find existing normal repost by current user (quote reposts are treated as new tweets, not reposts)
  const findUserRepost = (postId: string) => {
    // Only find normal reposts (quote reposts are new tweets, can't be "undone" as reposts)
    return posts.find(
      (post) =>
        isTweet(post) &&
        post.repostType === 'normal' &&
        post.originalPostId === postId &&
        post.author.handle === currentUser.handle
    );
  };

  const handleRepost = (postId: string, type?: 'normal' | 'quote') => {
    const originalPost = posts.find((p) => p.id === postId);
    if (!originalPost) {
      return;
    }

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
      // If the post being reposted is itself a quote repost, repost the quote repost itself
      // Otherwise, repost the original post
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
          // Increment repost count on the post being reposted (postToRepost.id, not the original it quotes)
          // If reposting a quote repost, increment the quote repost's count
          // If reposting a regular post, increment that post's count
          const postIdToIncrement = postToRepost.id;
          const updated = incrementRepostCount(prev, postIdToIncrement);
          // Also update the post's userInteractions.reposted flag
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

  const handleDelete = (postId: string) => {
    setPosts((prev) => {
      const filtered = prev.filter((p) => p.id !== postId);
      // Also remove any reposts that reference this post
      const filteredReposts = filtered.filter((p) => {
        if (isTweet(p) && p.repostType && p.originalPostId) {
          return p.originalPostId !== postId;
        }
        return true;
      });
      return filteredReposts;
    });
    // If deleting the current post, redirect to home
    if (postId === post?.id) {
      router.push('/home');
    }
  };

  const handleQuoteRepostSubmit = (text: string) => {
    if (!quoteRepostPostId) return;

    const originalPost = posts.find((p) => p.id === quoteRepostPostId);
    if (!originalPost) return;

    const repost = createQuoteRepost({
      originalPost,
      currentUser: {
        id: 'current-user',
        displayName: currentUser.displayName,
        handle: currentUser.handle,
        avatar: currentUser.avatar,
        badge: 'Verified',
      },
      quoteText: text,
    });

    if (repost) {
      const updatedPosts = [repost, ...incrementRepostCount(posts, quoteRepostPostId)];
      setPosts(updatedPosts);
    }

    setIsQuoteRepostOpen(false);
    setQuoteRepostPostId(null);
  };

  const handleComment = (postId: string) => {
    // Show comment composer
    setShowCommentComposer(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const newFiles = [...mediaFiles, ...imageFiles].slice(0, 4); // Max 4 images
    setMediaFiles(newFiles);

    // Create previews
    const newPreviews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === newFiles.length) {
          setMediaPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const handleGifSelect = (gif: any) => {
    setSelectedGif(gif.images.original.url);
    setShowGifPicker(false);
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const handleEmojiClick = (emojiData: any) => {
    setCommentText((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions([...pollOptions, '']);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, i) => i !== index));
    }
  };

  const updatePollOption = (index: number, value: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = value;
    setPollOptions(newOptions);
  };

  const remainingChars = maxLength - commentText.length;
  const isOverLimit = commentText.length > maxLength;
  const charPercentage = (commentText.length / maxLength) * 100;

  const handleCommentSubmit = (text: string, media?: File[], gifUrl?: string, poll?: { options: string[]; duration: number }) => {
    if (text.length > maxLength) {
      // Redirect to plans page
      window.location.href = '/plans';
      return;
    }
    
    if (!text.trim() && !media?.length && !gifUrl && !poll) {
      return; // Don't submit empty comments
    }

    // Create new comment
    const newComment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      postId: postId,
      author: {
        id: currentUser.id,
        displayName: currentUser.displayName,
        handle: currentUser.handle,
        avatar: currentUser.avatar,
        badge: currentUser.badge,
      },
      content: text.trim() || (poll ? 'Poll' : gifUrl ? 'GIF' : 'Media'),
      createdAt: 'now',
      likes: 0,
      userLiked: false,
    };

    // Add comment to comments list
    setComments((prev) => [newComment, ...prev]);

    // Update post comment count
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              stats: {
                ...p.stats,
                comments: p.stats.comments + 1,
              },
            }
          : p
      )
    );

    // Reset composer
    setCommentText('');
    setMediaFiles([]);
    setMediaPreviews([]);
    setSelectedGif(null);
    setShowPoll(false);
    setPollOptions(['', '']);
    setPollDuration(1);
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

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          {/* Top Bar - Mobile Only - Hidden on post detail page */}

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            {/* Center Feed */}
            <div className="w-full border-l border-r border-white/10">
              {/* Header with Back Arrow and Title */}
              <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/10">
                <div className="flex items-center px-4 h-14">
                  <button
                    onClick={() => router.back()}
                    className="mr-4 p-2 hover:bg-white/10 rounded-full transition-colors"
                    aria-label="Go back"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <h1 className="text-xl font-bold text-white">Post</h1>
                </div>
              </div>

              {/* Post Detail */}
              <div className="border-b border-white/10">
                <div className="px-4">
                  <PostCard
                    post={post}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onComment={handleComment}
                    onVote={handleVote}
                    onDelete={handleDelete}
                    hasUserReposted={hasUserReposted}
                    currentUserHandle={currentUser.handle}
                    allPosts={posts}
                    isDetailPage={true}
                  />
                </div>
                
                {/* Date and Time - Below post content */}
                <div className="px-4 py-3 border-t border-white/10">
                  <div className="text-sm text-gray-400">
                    {formattedDateTime || 'Loading...'}
                  </div>
                </div>
              </div>

              {/* Comment Composer */}
              <div className="border-b border-white/10 px-4 py-3">
                <div className="flex items-start space-x-3">
                  <Image
                    src={currentUser.avatar}
                    alt={currentUser.displayName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 relative">
                    <div className="relative">
                      <textarea
                        ref={(textarea) => {
                          if (textarea) {
                            // Auto-resize on mount and when value changes
                            textarea.style.height = 'auto';
                            const scrollHeight = textarea.scrollHeight;
                            const lineHeight = 24;
                            const minHeight = lineHeight * 2; // 2 lines minimum
                            const maxHeight = lineHeight * 15; // 15 lines maximum
                            const newHeight = Math.min(Math.max(minHeight, scrollHeight), maxHeight);
                            textarea.style.height = `${newHeight}px`;
                          }
                        }}
                        value={commentText}
                        onChange={(e) => {
                          const newValue = e.target.value;
                          setCommentText(newValue);
                          
                          // Auto-resize textarea based on content
                          e.target.style.height = 'auto';
                          const scrollHeight = e.target.scrollHeight;
                          const lineHeight = 24;
                          const minHeight = lineHeight * 2; // Start with 2 lines
                          const maxHeight = lineHeight * 15; // Max 15 lines
                          const newHeight = Math.min(Math.max(minHeight, scrollHeight), maxHeight);
                          e.target.style.height = `${newHeight}px`;
                        }}
                        placeholder={isOverLimit ? "Upgrade to Premium to post longer content" : (showPoll ? "Ask a question..." : "Add a comment...")}
                        className={`w-full bg-transparent text-white placeholder-gray-500 text-[15px] resize-none focus:outline-none overflow-hidden ${
                          isOverLimit ? 'placeholder-red-400' : ''
                        }`}
                        style={{ 
                          height: '48px', // Start with 2 lines
                          minHeight: '48px',
                          maxHeight: '360px', // Max 15 lines
                          paddingBottom: isOverLimit ? '40px' : '0' // Add padding for mobile upgrade button
                        }}
                        rows={2}
                      />
                      {/* Upgrade to Premium overlay message when over limit - Mobile only (inside textarea area) */}
                      {isOverLimit && (
                        <div className="absolute bottom-1 left-0 right-0 flex items-center justify-center pointer-events-none md:hidden" style={{ paddingBottom: '8px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              window.location.href = '/plans';
                            }}
                            className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-semibold hover:bg-blue-600 transition-colors pointer-events-auto shadow-lg"
                          >
                            Upgrade to Premium
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Upgrade to Premium message when over limit - Desktop/Tablet (below textarea) */}
                    {isOverLimit && (
                      <div className="hidden md:flex items-center justify-center mt-2 pointer-events-none">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.location.href = '/plans';
                          }}
                          className="px-3 py-1.5 bg-blue-500 text-white rounded-full text-xs font-semibold hover:bg-blue-600 transition-colors pointer-events-auto shadow-lg"
                        >
                          Upgrade to Premium
                        </button>
                      </div>
                    )}
                    
                    {/* Media Previews */}
                    {(mediaPreviews.length > 0 || selectedGif) && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {mediaPreviews.map((preview, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={preview}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-24 object-cover rounded-xl"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() => handleRemoveMedia(index)}
                              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                            >
                              <HiX className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        ))}
                        {selectedGif && (
                          <div className="relative group">
                            <img
                              src={selectedGif}
                              alt="Selected GIF"
                              className="w-full h-24 object-cover rounded-xl"
                              loading="lazy"
                            />
                            <button
                              type="button"
                              onClick={() => setSelectedGif(null)}
                              className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                            >
                              <HiX className="w-3 h-3 text-white" />
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Poll Options */}
                    {showPoll && (
                      <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-white">Add poll</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowPoll(false);
                              setPollOptions(['', '']);
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2 mb-3">
                          {pollOptions.map((option, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => updatePollOption(index, e.target.value)}
                                placeholder={`Choice ${index + 1}`}
                                className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                                maxLength={25}
                              />
                              {pollOptions.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removePollOption(index)}
                                  className="p-2 text-gray-400 hover:text-white"
                                >
                                  <HiX className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        {pollOptions.length < 4 && (
                          <button
                            type="button"
                            onClick={addPollOption}
                            className="text-sm text-cyan-400 hover:text-cyan-300"
                          >
                            Add option
                          </button>
                        )}
                        <div className="mt-3">
                          <label className="text-sm text-gray-400 mb-2 block">Poll duration</label>
                          <select
                            value={pollDuration}
                            onChange={(e) => setPollDuration(Number(e.target.value))}
                            className="px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 appearance-none cursor-pointer pr-10"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                              backgroundRepeat: 'no-repeat',
                              backgroundPosition: 'right 0.75rem center',
                            }}
                          >
                            <option value={1}>1 day</option>
                            <option value={3}>3 days</option>
                            <option value={7}>7 days</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* GIF Picker */}
                    {showGifPicker && (
                      <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/10 max-h-96 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-white">Choose a GIF</span>
                          <button
                            type="button"
                            onClick={() => {
                              setShowGifPicker(false);
                              setGifSearchQuery('');
                            }}
                            className="text-gray-400 hover:text-white"
                          >
                            <HiX className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="mb-3">
                          <input
                            type="text"
                            value={gifSearchQuery}
                            onChange={(e) => setGifSearchQuery(e.target.value)}
                            placeholder="Search for GIFs..."
                            className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
                          />
                        </div>
                        {(() => {
                          const giphyClient = getGiphyClient();
                          if (!giphyClient) return null;
                          return (
                            <div className="w-full">
                              <Grid
                                key={debouncedGifSearch}
                                onGifClick={handleGifSelect}
                                fetchGifs={(offset) => {
                                  const searchQuery = debouncedGifSearch.trim();
                                  if (searchQuery) {
                                    return giphyClient.search(searchQuery, { offset, limit: 10 });
                                  }
                                  return giphyClient.trending({ offset, limit: 10 });
                                }}
                                width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 80, 400) : 400}
                                columns={2}
                                gutter={6}
                                noLink={true}
                                hideAttribution={true}
                              />
                            </div>
                          );
                        })()}
                      </div>
                    )}

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                      <div className="mt-3 relative" ref={emojiPickerRef}>
                        <div className="absolute z-20 left-0">
                          <div className="bg-black border border-white/10 rounded-xl overflow-hidden shadow-xl">
                            <EmojiPicker
                              onEmojiClick={handleEmojiClick}
                              width={350}
                              height={400}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-1 sm:space-x-2 flex-wrap flex-1 min-w-0">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageUpload}
                          accept="image/*"
                          multiple
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            fileInputRef.current?.click();
                            setShowGifPicker(false);
                            setShowPoll(false);
                            setSelectedGif(null);
                          }}
                          className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={showPoll || !!selectedGif}
                          aria-label="Upload image"
                        >
                          <HiOutlinePhotograph className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowGifPicker(!showGifPicker);
                            setShowEmojiPicker(false);
                            setShowPoll(false);
                            setMediaFiles([]);
                            setMediaPreviews([]);
                          }}
                          className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={showPoll || mediaPreviews.length > 0}
                          aria-label="Add GIF"
                        >
                          <RiFileGifLine className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEmojiPicker(!showEmojiPicker);
                            setShowGifPicker(false);
                          }}
                          className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors"
                          aria-label="Add emoji"
                        >
                          <HiOutlineEmojiHappy className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowPoll(!showPoll);
                            setShowGifPicker(false);
                            setMediaFiles([]);
                            setMediaPreviews([]);
                            setSelectedGif(null);
                          }}
                          className="p-1.5 text-cyan-400 hover:bg-cyan-400/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={mediaPreviews.length > 0 || !!selectedGif}
                          aria-label="Add poll"
                        >
                          <RiBarChartLine className="w-5 h-5" />
                        </button>
                      </div>
                      
                      <div className="flex flex-row items-center justify-end gap-2 flex-shrink-0">
                        {/* Character Counter - Always show circle, show number only when 30 or less characters remaining */}
                        {commentText.length > 0 && (
                          <div className="relative w-8 h-8 flex-shrink-0">
                            <svg className="transform -rotate-90 w-8 h-8" viewBox="0 0 36 36">
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                className="text-white/10"
                              />
                              <circle
                                cx="18"
                                cy="18"
                                r="15"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 15}`}
                                strokeDashoffset={`${2 * Math.PI * 15 * (1 - Math.min(charPercentage, 100) / 100)}`}
                                className={`transition-all ${
                                  isOverLimit
                                    ? 'text-red-400'
                                    : remainingChars <= 10
                                    ? 'text-red-400'
                                    : remainingChars <= 20
                                    ? 'text-yellow-400'
                                    : remainingChars <= 30
                                    ? 'text-cyan-400'
                                    : 'text-white/20'
                                }`}
                                strokeLinecap="round"
                              />
                            </svg>
                            {/* Show number only when 30 or less characters remaining */}
                            {remainingChars <= 30 && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span
                                  className={`text-[10px] font-semibold leading-none ${
                                    isOverLimit
                                      ? 'text-red-400'
                                      : remainingChars <= 10
                                      ? 'text-red-400'
                                      : remainingChars <= 20
                                      ? 'text-yellow-400'
                                      : 'text-cyan-400'
                                  }`}
                                >
                                  {remainingChars}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                        
                        <button
                          onClick={() => {
                            const poll = showPoll && pollOptions.filter(opt => opt.trim()).length >= 2
                              ? { options: pollOptions.filter(opt => opt.trim()), duration: pollDuration }
                              : undefined;
                            handleCommentSubmit(commentText, mediaFiles, selectedGif || undefined, poll);
                          }}
                          disabled={commentText.trim().length === 0 || isOverLimit || (!commentText.trim() && mediaPreviews.length === 0 && !selectedGif && !showPoll)}
                          className="px-4 py-1.5 bg-white text-black rounded-full font-semibold hover:bg-gray-200 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <div>
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="border-b border-white/10 px-4 py-3 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-start space-x-3">
                        <Image
                          src={comment.author.avatar}
                          alt={comment.author.displayName}
                          width={40}
                          height={40}
                          className="w-10 h-10 rounded-full flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1 w-full">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-white text-sm">
                                {comment.author.displayName}
                              </span>
                              <span className="text-xs text-gray-400">
                                @{comment.author.handle}
                              </span>
                              {comment.author.badge && (
                                <span className="px-1 py-0.5 text-[9px] font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                                  {comment.author.badge}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">· {comment.createdAt}</span>
                            </div>
                            
                            {/* 3-dot Menu Button for Comments */}
                            <div className="relative" ref={(el) => { commentMenuRefs.current[comment.id] = el; }}>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenCommentMenuId(openCommentMenuId === comment.id ? null : comment.id);
                                }}
                                className="p-1.5 hover:bg-cyan-400/10 rounded-full transition-colors text-gray-400 hover:text-cyan-400"
                                aria-label="More options"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
                              
                              {/* Dropdown Menu */}
                              {openCommentMenuId === comment.id && (
                                <div className="absolute right-0 top-full mt-2 bg-black border border-white/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[200px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigator.clipboard.writeText(`${window.location.origin}/${username}/posts/${postId}#comment-${comment.id}`);
                                      setOpenCommentMenuId(null);
                                    }}
                                    className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm"
                                  >
                                    <Share2 className="w-4 h-4" />
                                    <span>Copy link</span>
                                  </button>
                                  {currentUser.handle === comment.author.handle && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        // Remove comment from state
                                        setComments((prev) => prev.filter((c) => c.id !== comment.id));
                                        
                                        // If it's a mock comment (not starting with 'comment-'), track it as deleted
                                        if (!comment.id.startsWith('comment-')) {
                                          const deletedCommentsKey = `pageshare_deleted_comments_${postId}`;
                                          const deletedCommentsStr = localStorage.getItem(deletedCommentsKey);
                                          let deletedCommentIds: string[] = [];
                                          if (deletedCommentsStr) {
                                            try {
                                              deletedCommentIds = JSON.parse(deletedCommentsStr);
                                            } catch {
                                              deletedCommentIds = [];
                                            }
                                          }
                                          if (!deletedCommentIds.includes(comment.id)) {
                                            deletedCommentIds.push(comment.id);
                                            localStorage.setItem(deletedCommentsKey, JSON.stringify(deletedCommentIds));
                                          }
                                        }
                                        
                                        // Update post comment count
                                        setPosts((prev) =>
                                          prev.map((p) =>
                                            p.id === postId
                                              ? {
                                                  ...p,
                                                  stats: {
                                                    ...p.stats,
                                                    comments: Math.max(0, p.stats.comments - 1),
                                                  },
                                                }
                                              : p
                                          )
                                        );
                                        setOpenCommentMenuId(null);
                                        // Comments will be saved to localStorage automatically via useEffect
                                      }}
                                      className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 text-sm border-t border-white/10"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                      <span>Delete</span>
                                    </button>
                                  )}
                                  {currentUser.handle !== comment.author.handle && (
                                    <>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // TODO: Implement mute
                                          setOpenCommentMenuId(null);
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
                                      >
                                        <span>Mute @{comment.author.handle}</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // TODO: Implement block
                                          setOpenCommentMenuId(null);
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
                                      >
                                        <span>Block @{comment.author.handle}</span>
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          // TODO: Implement report
                                          setOpenCommentMenuId(null);
                                        }}
                                        className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 text-sm border-t border-white/10"
                                      >
                                        <span>Report comment</span>
                                      </button>
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                            {parseCashtags(comment.content)}
                          </p>
                          <div className="flex items-center space-x-6 mt-3 text-gray-400">
                            <button
                              onClick={() => {
                                setComments((prev) =>
                                  prev.map((c) =>
                                    c.id === comment.id
                                      ? {
                                          ...c,
                                          likes: c.userLiked ? c.likes - 1 : c.likes + 1,
                                          userLiked: !c.userLiked,
                                        }
                                      : c
                                  )
                                );
                              }}
                              className="flex items-center space-x-1 hover:text-red-500 transition-colors"
                            >
                              <Heart
                                className={`w-4 h-4 ${comment.userLiked ? 'fill-red-500 text-red-500' : ''}`}
                              />
                              <span className="text-xs">{comment.likes || ''}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-white text-sm text-gray-400 px-4 py-8 text-center">
                    No comments yet. Be the first to comment!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={() => {}}
            onUpgradeLabs={() => window.location.href = '/plans'}
            onUpdateWatchlist={setWatchlist}
          />
        </div>
      </div>

      {/* Quote Repost Modal */}
      {isQuoteRepostOpen && quoteRepostPostId && (
        <TweetComposer
          currentUser={currentUser}
          onSubmit={(text) => handleQuoteRepostSubmit(text)}
          onClose={() => {
            setIsQuoteRepostOpen(false);
            setQuoteRepostPostId(null);
          }}
          isModal={true}
          originalPostId={quoteRepostPostId}
          allPosts={posts}
        />
      )}
    </div>
  );
}

