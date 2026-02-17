'use client';

import { useState } from 'react';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import RightRail from '@/components/app/layout/RightRail';
import Feed from '@/components/app/feed/Feed';
import Loading from '@/components/app/common/Loading';
import { usePostHandlers } from '@/hooks/post/usePostHandlers';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import { useContentFilters } from '@/hooks/features/useContentFilters';

export default function BookmarksPage() {
  const { currentUser, isClient } = useCurrentUser();
  const { bookmarkedPosts, loading: bookmarksLoading, error: bookmarksError, refetch } = useBookmarks();
  const { watchlist, setWatchlist, loading: watchlistLoading, openManageModal } = useWatchlist();
  const { filterPosts } = useContentFilters({ currentUserHandle: currentUser.handle, isClient });

  const { handleLike, handleRepost, handleComment, handleVote, handleDelete, hasUserReposted } =
    usePostHandlers({ posts: bookmarkedPosts, setPosts: () => {}, currentUser, onDeleteSuccess: refetch });

  const filteredPosts = filterPosts(bookmarkedPosts);

  if (!isClient) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (bookmarksLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          {/* Top Bar - Mobile Only */}
          <Topbar onUpgradeLabs={() => window.location.assign('/plans')} />

          {/* Desktop Header - Desktop Only */}
          <div className="hidden md:flex items-center px-4 py-4 border-b border-white/10">
            <h1 className="text-xl font-bold text-white">Bookmarks</h1>
          </div>

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
              {bookmarksError ? (
                <div className="text-center py-16">
                  <p className="text-red-400 mb-4">{bookmarksError}</p>
                  <button
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="mb-4">
                    <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                        />
                      </svg>
                    </div>
                  </div>
                  <p className="text-lg text-gray-300 mb-2">No bookmarks yet</p>
                  <p className="text-sm text-gray-400">
                    When you bookmark posts, they'll show up here
                  </p>
                </div>
              ) : (
                <Feed
                  posts={filteredPosts}
                  onNewIdeaClick={() => {}}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  onComment={handleComment}
                  onVote={handleVote}
                  onDelete={handleDelete}
                  hasUserReposted={hasUserReposted}
                  currentUserHandle={currentUser.handle}
                  allPosts={filteredPosts}
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={openManageModal}
            onUpgradeLabs={() => window.location.assign('/plans')}
            onUpdateWatchlist={setWatchlist}
            isLoading={watchlistLoading}
          />
        </div>
      </div>

    </div>
  );
}

