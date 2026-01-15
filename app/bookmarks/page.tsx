'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import RightRail from '@/components/app/layout/RightRail';
import Feed from '@/components/app/feed/Feed';
import Loading from '@/components/app/common/Loading';
import ManageWatchlistModal from '@/components/app/modals/ManageWatchlistModal';
import { getBookmarkedPosts } from '@/utils/content/bookmarkUtils';
import { getBlockedUsers, filterBlockedPosts } from '@/utils/user/blockUtils';
import { Post } from '@/types';
import { usePostHandlers } from '@/hooks/post/usePostHandlers';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { usePostsData } from '@/hooks/post/usePostsData';
import { useWatchlist } from '@/hooks/features/useWatchlist';

export default function BookmarksPage() {
  const router = useRouter();
  const { currentUser, isClient } = useCurrentUser();
  const { posts, setPosts } = usePostsData();
  const { watchlist, setWatchlist } = useWatchlist();
  
  const [bookmarkedPosts, setBookmarkedPosts] = useState<Post[]>([]);
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);
  
  const { handleLike, handleRepost, handleComment, handleVote, handleDelete, hasUserReposted } =
    usePostHandlers({ posts, setPosts, currentUser });

  // Load bookmarked posts
  useEffect(() => {
    if (!isClient || !currentUser.handle) return;

    const loadBookmarkedPosts = () => {
      const blockedUsers = getBlockedUsers(currentUser.handle);
      let bookmarked = getBookmarkedPosts(currentUser.handle, posts);
      
      // Filter out blocked users' posts
      bookmarked = filterBlockedPosts(bookmarked, blockedUsers);
      
      setBookmarkedPosts(bookmarked);
    };

    loadBookmarkedPosts();

    // Listen for bookmark updates
    const handleBookmarksUpdated = () => {
      loadBookmarkedPosts();
    };

    window.addEventListener('bookmarksUpdated', handleBookmarksUpdated);
    window.addEventListener('blockedUsersUpdated', handleBookmarksUpdated);

    return () => {
      window.removeEventListener('bookmarksUpdated', handleBookmarksUpdated);
      window.removeEventListener('blockedUsersUpdated', handleBookmarksUpdated);
    };
  }, [isClient, posts, currentUser.handle]);

  if (!isClient) {
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
          <Topbar onUpgradeLabs={() => router.push('/plans')} />

          {/* Desktop Header - Desktop Only */}
          <div className="hidden md:flex items-center px-4 py-4 border-b border-white/10">
            <h1 className="text-xl font-bold text-white">Bookmarks</h1>
          </div>

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
              {bookmarkedPosts.length === 0 ? (
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
                  posts={bookmarkedPosts}
                  onNewIdeaClick={() => {}}
                  onLike={handleLike}
                  onRepost={handleRepost}
                  onComment={handleComment}
                  onVote={handleVote}
                  onDelete={handleDelete}
                  hasUserReposted={hasUserReposted}
                  currentUserHandle={currentUser.handle}
                  allPosts={posts}
                />
              )}
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

      {/* Manage Watchlist Modal */}
      <ManageWatchlistModal
        isOpen={isManageWatchlistOpen}
        onClose={() => setIsManageWatchlistOpen(false)}
        watchlist={watchlist}
        onUpdateWatchlist={setWatchlist}
      />
    </div>
  );
}

