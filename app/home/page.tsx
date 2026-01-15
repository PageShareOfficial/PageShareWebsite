'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import Feed from '@/components/app/feed/Feed';
import RightRail from '@/components/app/layout/RightRail';
import ManageWatchlistModal from '@/components/app/modals/ManageWatchlistModal';
import TweetComposer from '@/components/app/composer/TweetComposer';
import ReportModal from '@/components/app/modals/ReportModal';
import { usePostHandlers } from '@/hooks/post/usePostHandlers';
import { useReportModal } from '@/hooks/features/useReportModal';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { usePostsData } from '@/hooks/post/usePostsData';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import { useContentFilters } from '@/hooks/features/useContentFilters';
import { usePostSync } from '@/hooks/post/usePostSync';

export default function HomePage() {
  const router = useRouter();
  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);

  // Use new hooks
  const { currentUser, isClient } = useCurrentUser();
  const { posts, setPosts } = usePostsData({ validateReposts: true });
  const { watchlist, setWatchlist } = useWatchlist();
  const { filterPosts } = useContentFilters({ 
    currentUserHandle: currentUser.handle, 
    isClient 
  });
  
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

  // Sync posts to localStorage and repost flags
  usePostSync({ posts, setPosts, currentUserHandle: currentUser.handle, isClient });

  // Filter posts to exclude muted/blocked users' posts
  const filteredPosts = filterPosts(posts);


  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          {/* Top Bar - Mobile Only */}
          <Topbar onUpgradeLabs={() => router.push('/plans')} />

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            {/* Center Feed */}
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
              />
            </div>
          </div>
            </div>

            {/* Right Sidebar */}
        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
              <RightRail
            watchlist={watchlist}
                onManageWatchlist={() => setIsManageWatchlistOpen(true)}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
              />
        </div>
      </div>

      {/* Modals */}
      <ManageWatchlistModal
        isOpen={isManageWatchlistOpen}
        onClose={() => setIsManageWatchlistOpen(false)}
        watchlist={watchlist}
        onUpdateWatchlist={setWatchlist}
      />
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
        currentUserHandle={currentUser.handle}
        onReport={handleReportSubmitted}
      />
    </div>
  );
}

