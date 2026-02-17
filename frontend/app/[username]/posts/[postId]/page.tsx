'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import UnauthPostView from '@/components/app/layout/UnauthPostView';
import AuthenticatedPostDetail from '@/components/app/layout/AuthenticatedPostDetail';
import Loading from '@/components/app/common/Loading';
import ErrorState from '@/components/app/common/ErrorState';
import { useReportedContent } from '@/hooks/features/useReportedContent';
import { usePostHandlers } from '@/hooks/post/usePostHandlers';
import { useReportModal } from '@/hooks/features/useReportModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { usePostsData } from '@/hooks/post/usePostsData';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import { useContentFilters } from '@/hooks/features/useContentFilters';
import { useCommentsData } from '@/hooks/post/useCommentsData';
import { getPostById, mapPostResponseToPost } from '@/lib/api/postApi';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
import type { Post } from '@/types';

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;
  const postId = params.postId as string;
  
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  
  const { session, loading: authLoading } = useAuth();
  const isUnauth = !authLoading && !session?.access_token;

  // Single-post fetch for unauthenticated viewers (shared link)
  const [singlePost, setSinglePost] = useState<Post | null>(null);
  const [singlePostLoading, setSinglePostLoading] = useState(false);
  const [singlePostError, setSinglePostError] = useState<string | null>(null);

  useEffect(() => {
    if (!isUnauth || !postId) return;
    let cancelled = false;
    setSinglePostLoading(true);
    setSinglePostError(null);
    getPostById(postId, null)
      .then((res) => {
        if (cancelled) return;
        setSinglePost(mapPostResponseToPost(res));
      })
      .catch((err) => {
        if (cancelled) return;
        setSinglePostError(getErrorMessage(err, 'Failed to load post'));
      })
      .finally(() => {
        if (!cancelled) setSinglePostLoading(false);
      });
    return () => { cancelled = true; };
  }, [isUnauth, postId]);

  // Use new hooks (only needed when authenticated)
  const { currentUser, isClient } = useCurrentUser();
  const { posts, setPosts, postsLoaded } = usePostsData();
  const { watchlist, setWatchlist, loading: watchlistLoading, openManageModal } = useWatchlist();
  const { filterComments } = useContentFilters({ 
    currentUserHandle: currentUser.handle, 
    isClient 
  });
  const { filterReportedComments } = useReportedContent();

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

  // Find the post by ID - recalculates when posts change
  const post = posts.find((p) => p.id === postId);

  const {
    comments,
    setComments,
    loading: commentsLoading,
    error: commentsError,
    loadMore: loadMoreComments,
    hasMore: commentsHasMore,
    isLoadingMore: commentsLoadingMore,
    handleAddComment,
    handleDeleteComment,
    handleToggleLikeComment,
    handleVoteOnCommentPoll,
  } = useCommentsData({ postId, currentUser });

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

  // ----- Unauthenticated: single-post view (shared link), middle column only, read-only -----
  if (isUnauth) {
    if (authLoading || singlePostLoading) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <Loading />
        </div>
      );
    }
    if (singlePostError) {
      return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
          <ErrorState message={singlePostError} />
          <Link
            href="/"
            className="mt-4 text-[#1d9bf0] hover:underline"
          >
            Back to home
          </Link>
        </div>
      );
    }
    if (singlePost) {
      return <UnauthPostView post={singlePost} />;
    }
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  // ----- Authenticated: full app layout -----
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
    <AuthenticatedPostDetail
      post={post}
      posts={posts}
      setPosts={setPosts}
      postId={postId}
      username={username}
      currentUser={currentUser}
      handleLike={handleLike}
      handleRepost={handleRepost}
      handleComment={handleComment}
      handleVote={handleVote}
      handleDelete={handleDelete}
      hasUserReposted={hasUserReposted}
      isQuoteRepostOpen={isQuoteRepostOpen}
      setIsQuoteRepostOpen={setIsQuoteRepostOpen}
      quoteRepostPostId={quoteRepostPostId}
      setQuoteRepostPostId={setQuoteRepostPostId}
      handleQuoteRepostSubmit={handleQuoteRepostSubmit}
      comments={comments}
      commentsLoading={commentsLoading}
      commentsError={commentsError}
      filterComments={filterComments}
      filterReportedComments={filterReportedComments}
      handleAddComment={handleAddComment}
      handleDeleteComment={handleDeleteComment}
      handleToggleLikeComment={handleToggleLikeComment}
      handleVoteOnCommentPoll={handleVoteOnCommentPoll}
      reportModalOpen={reportModalOpen}
      reportContentType={reportContentType}
      reportContentId={reportContentId}
      reportPostId={reportPostId}
      reportUserHandle={reportUserHandle}
      reportUserDisplayName={reportUserDisplayName}
      handleReportClick={handleReportClick}
      handleReportSubmitted={handleReportSubmitted}
      watchlist={watchlist}
      openManageModal={openManageModal}
      setWatchlist={setWatchlist}
      watchlistLoading={watchlistLoading}
      selectedImageIndex={selectedImageIndex}
      setSelectedImageIndex={setSelectedImageIndex}
      selectedImageUrls={selectedImageUrls}
      setSelectedImageUrls={setSelectedImageUrls}
    />
  );
}

