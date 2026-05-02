'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Topbar from '@/components/app/layout/Topbar';
import Feed from '@/components/app/feed/Feed';
import { usePostHandlers } from '@/hooks/post/usePostHandlers';
import { useReportModal } from '@/hooks/features/useReportModal';
const TweetComposer = dynamic(() => import('@/components/app/composer/TweetComposer'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/app/modals/ReportModal'), { ssr: false });
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { usePostsData } from '@/hooks/post/usePostsData';
import { useContentFilters } from '@/hooks/features/useContentFilters';
import { useReportedContent } from '@/hooks/features/useReportedContent';
import Loading from '@/components/app/common/Loading';

function needsOnboarding(username: string): boolean {
  return username.startsWith('user_');
}

export default function HomePage() {
  const router = useRouter();
  const { backendUser, loading } = useAuth();
  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);

  // All hooks must run unconditionally (before any early return) to satisfy Rules of Hooks
  const { currentUser, isClient } = useCurrentUser();
  const { posts, setPosts, loading: postsLoading, error: postsError, refetch: refetchPosts } = usePostsData();
  const { filterPosts } = useContentFilters({
    currentUserHandle: currentUser.handle,
    isClient,
  });
  const { filterReportedPosts } = useReportedContent();
  const {
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
    clearPostError,
  } = usePostHandlers({ posts, setPosts, currentUser });
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

  const filteredPosts = filterReportedPosts(filterPosts(posts), currentUser.handle);

  // Redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (loading) return;
    if (backendUser && needsOnboarding(backendUser.username)) {
      router.replace('/onboarding');
    }
  }, [loading, backendUser, router]);

  // Show loading while: checking auth, fetching backend user, or user needs onboarding
  // (Avoids briefly showing home then redirecting when backendUser loads with user_xxx)
  if (loading || !backendUser || needsOnboarding(backendUser.username)) {
    return (
      <>
        <div className="flex flex-1 items-center justify-center min-h-[50vh]">
          <Loading />
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar onUpgradeLabs={() => router.push('/plans')} />
      <div className="flex-1 flex pb-16 md:pb-0">
        <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
              <Feed
                posts={filteredPosts}
                onNewIdeaClick={() => setIsNewIdeaOpen(true)}
                onLike={handleLike}
                onRepost={handleRepost}
                onComment={handleComment}
                onVote={handleVote}
                onDelete={handleDelete}
                hasUserReposted={hasUserReposted}
                currentUserHandle={currentUser.handle}
                onNewTweet={handleNewTweet}
                onReportClick={handleReportClick}
                postsLoading={postsLoading}
                postsError={postsError}
                onRefresh={refetchPosts}
                isPosting={isPosting}
                postError={postError}
                onClearPostError={clearPostError}
              />
        </div>
      </div>

      {/* Modals */}
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

      {/* Report Modal */}
      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => handleReportSubmitted()}
        contentType={reportContentType}
        contentId={reportContentId}
        postId={reportPostId}
        reportedUserHandle={reportUserHandle}
        reportedUserDisplayName={reportUserDisplayName}
        reportedUserId={undefined}
        currentUserHandle={currentUser.handle}
        onReport={handleReportSubmitted}
      />
    </>
  );
}

