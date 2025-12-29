'use client';

import { useState } from 'react';
import Sidebar from '@/components/app/Sidebar';
import Topbar from '@/components/app/Topbar';
import Feed from '@/components/app/Feed';
import RightRail from '@/components/app/RightRail';
import NewIdeaModal from '@/components/app/NewIdeaModal';
import ManageWatchlistModal from '@/components/app/ManageWatchlistModal';
import { mockPosts, mockWatchlist, mockNarratives } from '@/data/mockData';
import { Post } from '@/types';

export default function HomePage() {
  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>(mockPosts);

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

  const handleBookmark = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              stats: {
                ...post.stats,
                bookmarks: post.userInteractions.bookmarked
                  ? post.stats.bookmarks - 1
                  : post.stats.bookmarks + 1,
              },
              userInteractions: {
                ...post.userInteractions,
                bookmarked: !post.userInteractions.bookmarked,
              },
            }
          : post
      )
    );
  };

  const handleRepost = (postId: string) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              stats: {
                ...post.stats,
                reposts: post.stats.reposts + 1,
              },
            }
          : post
      )
    );
  };

  const handleComment = (postId: string) => {
    // Handle comment action
    console.log('Comment on post:', postId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top Bar */}
          <Topbar onNewIdeaClick={() => setIsNewIdeaOpen(true)} />

          {/* Content */}
          <div className="flex-1 flex">
            {/* Center Feed */}
            <div className="flex-1 px-4 py-6 lg:px-8">
              <Feed
                posts={posts}
                onNewIdeaClick={() => setIsNewIdeaOpen(true)}
                onLike={handleLike}
                onBookmark={handleBookmark}
                onRepost={handleRepost}
                onComment={handleComment}
              />
            </div>

            {/* Right Sidebar */}
            <div className="hidden lg:block px-6 py-6">
              <RightRail
                watchlist={mockWatchlist}
                narratives={mockNarratives}
                onManageWatchlist={() => setIsManageWatchlistOpen(true)}
                onUpgradeLabs={() => console.log('Upgrade Labs')}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NewIdeaModal isOpen={isNewIdeaOpen} onClose={() => setIsNewIdeaOpen(false)} />
      <ManageWatchlistModal
        isOpen={isManageWatchlistOpen}
        onClose={() => setIsManageWatchlistOpen(false)}
      />
    </div>
  );
}

