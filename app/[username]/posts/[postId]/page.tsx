'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Heart } from 'lucide-react';
import Image from 'next/image';
import Sidebar from '@/components/app/layout/Sidebar';
import RightRail from '@/components/app/layout/RightRail';
import PostCard from '@/components/app/post/PostCard';
import PostMedia from '@/components/app/post/PostMedia';
import PollComponent from '@/components/app/post/PollComponent';
import TweetComposer from '@/components/app/composer/TweetComposer';
import CommentComposer from '@/components/app/composer/CommentComposer';
import Loading from '@/components/app/common/Loading';
import ImageViewerModal from '@/components/app/modals/ImageViewerModal';
import ReportModal from '@/components/app/modals/ReportModal';
import ContentMenu from '@/components/app/common/ContentMenu';
import { mockPosts, isTweet, mockComments } from '@/data/mockData';
import { Post, Comment, WatchlistItem } from '@/types';
import { parseCashtags } from '@/utils/textFormatting';
import { savePostsToStorage, saveToStorage } from '@/utils/storageUtils';
import { filterReportedComments } from '@/utils/reportUtils';
import { usePostHandlers } from '@/hooks/usePostHandlers';
import { useReportModal } from '@/hooks/useReportModal';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePostsData } from '@/hooks/usePostsData';
import { useWatchlist } from '@/hooks/useWatchlist';
import { usePostSync } from '@/hooks/usePostSync';
import { useContentFilters } from '@/hooks/useContentFilters';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const postId = params.postId as string;
  
  const [comments, setComments] = useState<Comment[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  
  // Use new hooks
  const { currentUser, isClient } = useCurrentUser();
  const { posts, setPosts, postsLoaded } = usePostsData({ 
    validateReposts: true, 
    postId 
  });
  const { watchlist, setWatchlist } = useWatchlist();
  const { filterComments } = useContentFilters({ 
    currentUserHandle: currentUser.handle, 
    isClient 
  });

  const {
    handleLike,
    handleRepost,
    handleComment,
    handleDelete,
    handleVote,
    hasUserReposted,
    isQuoteRepostOpen,
    setIsQuoteRepostOpen,
    quoteRepostPostId,
    setQuoteRepostPostId,
    handleQuoteRepostSubmit,
  } = usePostHandlers({ 
    posts, 
    setPosts, 
    currentUser,
    onDeleteRedirect: (deletedPostId: string) => {
      if (deletedPostId === postId) {
        router.push('/home');
      }
    }
  });

  const {
    reportModalOpen,
    reportContentType,
    reportContentId,
    reportPostId,
    reportUserHandle,
    reportUserDisplayName,
    handleReportClick,
    handleReportSubmitted,
  } = useReportModal();

  // Sync posts to localStorage and repost flags
  usePostSync({ posts, setPosts, currentUserHandle: currentUser.handle, isClient });

  // Save comments to localStorage whenever they change (client side only)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined' && postId) {
      // Save all comments (both user-created and mock comments that haven't been deleted)
      // Filter out deleted comments by checking if they still exist in the comments array
      const commentsToSave = comments.filter(c => c.postId === postId);
      
      // Only save user-created comments (those with IDs starting with 'comment-')
      // Mock comments are loaded from mockData, so we don't need to save them
      const userCreatedComments = commentsToSave.filter(c => c.id.startsWith('comment-'));
      
      // Always save if there are user-created comments
      // Don't remove the localStorage entry here - let explicit deletion handle that
      // This prevents race conditions where comments are saved but state hasn't updated yet
      if (userCreatedComments.length > 0) {
        localStorage.setItem(`pageshare_comments_${postId}`, JSON.stringify(userCreatedComments));
      }
    }
  }, [comments, isClient, postId]);

  // Save watchlist to localStorage whenever it changes (client side only)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      saveToStorage('pageshare_watchlist', watchlist);
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
        <Loading />
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
              <CommentComposer
                postId={postId}
                currentUser={currentUser}
                posts={posts}
                setPosts={setPosts}
                setComments={setComments}
              />

              {/* Comments Section */}
              <div>
                {(() => {
                  // Filter out blocked and reported comments
                  let filteredComments = filterComments(comments);
                  if (currentUser.handle) {
                    filteredComments = filterReportedComments(filteredComments, currentUser.handle);
                  }
                  return filteredComments;
                })().length > 0 ? (
                  (() => {
                    // Filter out blocked and reported comments
                    let filteredComments = filterComments(comments);
                    if (currentUser.handle) {
                      filteredComments = filterReportedComments(filteredComments, currentUser.handle);
                    }
                    return filteredComments;
                  })().map((comment) => (
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
                            <ContentMenu
                              type="comment"
                              authorHandle={comment.author.handle}
                              authorDisplayName={comment.author.displayName}
                              currentUserHandle={currentUser.handle}
                              linkUrl={`${window.location.origin}/${username}/posts/${postId}#comment-${comment.id}`}
                              contentId={comment.id}
                              onDelete={() => {
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
                                // Comments will be saved to localStorage automatically via useEffect
                              }}
                              onReportClick={(contentType, contentId, userHandle, userDisplayName, commentPostId) => {
                                handleReportClick(contentType, contentId, userHandle, userDisplayName, commentPostId);
                              }}
                            />
                          </div>
                          {comment.content && (
                            <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap break-words mb-2">
                              {parseCashtags(comment.content)}
                            </p>
                          )}
                          
                          {/* Comment Media */}
                          {comment.media && comment.media.length > 0 && (
                            <div className="mb-3">
                              <PostMedia
                                media={comment.media}
                                onImageClick={(urls, index) => {
                                  setSelectedImageUrls(urls);
                                  setSelectedImageIndex(index);
                                }}
                                className="rounded-xl"
                              />
                            </div>
                          )}
                          
                          {/* Comment GIF */}
                          {comment.gifUrl && (
                            <div className="mb-3 rounded-xl overflow-hidden">
                              <img
                                src={comment.gifUrl}
                                alt="GIF"
                                className="w-full rounded-xl"
                                loading="lazy"
                              />
                            </div>
                          )}
                          
                          {/* Comment Poll */}
                          {comment.poll && (
                            <div className="mb-3">
                              <PollComponent
                                poll={comment.poll}
                                postId={comment.id}
                                onVote={(commentId, optionIndex) => {
                                  // Handle comment poll vote
                                  setComments((prev) =>
                                    prev.map((c) => {
                                      if (c.id === commentId && c.poll) {
                                        const currentVotes = c.poll.votes || {};
                                        const newVotes = { ...currentVotes };
                                        const currentVote = c.poll.userVote;
                                        
                                        if (currentVote !== undefined && currentVote !== optionIndex) {
                                          newVotes[currentVote] = Math.max(0, (newVotes[currentVote] || 0) - 1);
                                        }
                                        
                                        newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;
                                        
                                        return {
                                          ...c,
                                          poll: {
                                            ...c.poll!,
                                            votes: newVotes,
                                            userVote: optionIndex,
                                          },
                                        };
                                      }
                                      return c;
                                    })
                                  );
                                  
                                  // Save to localStorage
                                  const savedComments = localStorage.getItem(`pageshare_comments_${postId}`);
                                  if (savedComments) {
                                    try {
                                      const comments: Comment[] = JSON.parse(savedComments);
                                      const updatedComments = comments.map((c) => {
                                        if (c.id === commentId && c.poll) {
                                          const currentVotes = c.poll.votes || {};
                                          const newVotes = { ...currentVotes };
                                          const currentVote = c.poll.userVote;
                                          
                                          if (currentVote !== undefined && currentVote !== optionIndex) {
                                            newVotes[currentVote] = Math.max(0, (newVotes[currentVote] || 0) - 1);
                                          }
                                          
                                          newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;
                                          
                                          return {
                                            ...c,
                                            poll: {
                                              ...c.poll,
                                              votes: newVotes,
                                              userVote: optionIndex,
                                            },
                                          };
                                        }
                                        return c;
                                      });
                                      localStorage.setItem(`pageshare_comments_${postId}`, JSON.stringify(updatedComments));
                                    } catch (error) {
                                      console.error('Error saving comment vote:', error);
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                          
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

      {/* Image Viewer Modal for Comments */}
      {selectedImageIndex !== null && selectedImageUrls.length > 0 && (
        <ImageViewerModal
          imageUrls={selectedImageUrls}
          selectedIndex={selectedImageIndex}
          onClose={() => {
            setSelectedImageIndex(null);
            setSelectedImageUrls([]);
          }}
          onPrevious={() => {
            setSelectedImageIndex((prev) => 
              prev !== null ? (prev > 0 ? prev - 1 : selectedImageUrls.length - 1) : null
            );
          }}
          onNext={() => {
            setSelectedImageIndex((prev) => 
              prev !== null ? (prev < selectedImageUrls.length - 1 ? prev + 1 : 0) : null
            );
          }}
        />
      )}

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => handleReportSubmitted()}
        contentType={reportContentType}
        contentId={reportContentId}
        postId={reportPostId}
        reportedUserHandle={reportUserHandle}
        reportedUserDisplayName={reportUserDisplayName}
        currentUserHandle={currentUser.handle}
        onReport={handleReportSubmitted}
      />
    </div>
  );
}

