'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import MobileHeader from '@/components/app/layout/MobileHeader';
import RightRail from '@/components/app/layout/RightRail';
import Feed from '@/components/app/feed/Feed';
import TweetComposer from '@/components/app/composer/TweetComposer';
import ManageWatchlistModal from '@/components/app/modals/ManageWatchlistModal';
import ProfileHeader from '@/components/app/profile/ProfileHeader';
import ProfileTabs from '@/components/app/profile/ProfileTabs';
import ProfileReplies from '@/components/app/profile/ProfileReplies';
import { isTweet } from '@/data/mockData';
import { Post, Comment } from '@/types';
import { getUserByUsername, calculateUserStats, ProfileUser } from '@/utils/profileUtils';
import { useProfileData } from '@/hooks/useProfileData';
import { useProfileHandlers } from '@/hooks/useProfileHandlers';

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const username = (params?.username as string) || '';
  
  // Get initial tab from URL or default to 'posts'
  const getInitialTab = (): 'posts' | 'replies' | 'likes' => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'replies' || tabParam === 'likes' || tabParam === 'posts') {
      return tabParam;
    }
    return 'posts';
  };
  
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'likes'>(getInitialTab);
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);
  
  // Update URL when tab changes
  const handleTabChange = (tab: 'posts' | 'replies' | 'likes') => {
    setActiveTab(tab);
    const newUrl = `/${username}${tab !== 'posts' ? `?tab=${tab}` : ''}`;
    router.replace(newUrl, { scroll: false });
  };
  
  // Sync tab with URL on mount and when searchParams change
  useEffect(() => {
    const tabParam = searchParams?.get('tab');
    if (tabParam === 'replies' || tabParam === 'likes' || tabParam === 'posts') {
      setActiveTab(tabParam);
    } else if (!tabParam) {
      setActiveTab('posts');
    }
  }, [searchParams]);
  
  // Mock current user - in real implementation, get from session/auth context
  const currentUser = {
    id: 'current-user',
    displayName: 'John Doe',
    handle: 'johndoe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    badge: 'Verified' as const,
  };

  // Reserved routes that should not be treated as usernames
  const reservedRoutes = ['discover', 'plans', 'home', 'labs', 'watchlist', 'profile'];
  
  // Redirect if username is a reserved route or invalid
  useEffect(() => {
    if (!username) return;
    
    const normalizedUsername = username.toLowerCase();
    
    // Redirect reserved routes immediately
    if (reservedRoutes.includes(normalizedUsername)) {
      if (normalizedUsername === 'profile') {
        router.replace(`/${currentUser.handle}`);
      } else if (normalizedUsername === 'discover') {
        router.replace('/home'); // Redirect to home if discover doesn't exist
      } else if (normalizedUsername === 'plans') {
        router.replace('/home'); // Redirect to home if plans doesn't exist
      } else {
        router.replace(`/${normalizedUsername}`);
      }
    }
  }, [username, router, currentUser.handle, reservedRoutes]);

  // Check if this is a reserved route - if so, don't process as profile
  const isReservedRoute = username && reservedRoutes.includes(username.toLowerCase());
  
  // Get profile user data (only if not a reserved route)
  const profileUser = username && !isReservedRoute ? getUserByUsername(username) : null;
  const isOwnProfile = currentUser.handle === username;

  // Use custom hooks for data and handlers
  const { posts, setPosts, watchlist, setWatchlist, allComments, setAllComments } = useProfileData();
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
  } = useProfileHandlers({ posts, setPosts, currentUser });

  // Handle comment likes
  const handleCommentLike = (commentId: string) => {
    // Update comment like status in localStorage
    const userComments = allComments.filter((c) => c.author.handle === username);
    const comment = userComments.find((c) => c.id === commentId);
    if (!comment) return;

    const postId = comment.postId;
    const savedComments = localStorage.getItem(`pageshare_comments_${postId}`);
    let comments: Comment[] = [];
    
    if (savedComments) {
      try {
        comments = JSON.parse(savedComments);
      } catch {
        comments = [];
      }
    }

    const updatedComments = comments.map((c: Comment) => {
      if (c.id === commentId) {
        return {
          ...c,
          likes: c.userLiked ? c.likes - 1 : c.likes + 1,
          userLiked: !c.userLiked,
        };
      }
      return c;
    });

    localStorage.setItem(`pageshare_comments_${postId}`, JSON.stringify(updatedComments));
    
    // Update allComments state
    setAllComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return {
            ...c,
            likes: c.userLiked ? c.likes - 1 : c.likes + 1,
            userLiked: !c.userLiked,
          };
        }
        return c;
      })
    );
  };

  // Get user's comments (replies) - from both mockComments and localStorage
  const userComments = allComments.filter((comment) => comment.author.handle === username);

  // Filter posts based on active tab
  const getFilteredPosts = () => {
    if (activeTab === 'posts') {
      // Show posts written by user OR quote reposts by user OR normal reposts by user
      return posts.filter((post) => {
        if (isTweet(post)) {
          // Show all posts where the author is the profile user
          // This includes: original posts, quote reposts, and normal reposts
          return post.author.handle === username;
        }
        return false;
      });
    } else if (activeTab === 'replies') {
      // For replies tab, we'll return empty array and handle rendering separately
      // since we need to show original post + comment structure
      return [];
    } else if (activeTab === 'likes') {
      // Show posts that this profile user has liked
      // For own profile, check userInteractions.liked from the loaded posts
      // For other users, we'd need to fetch from backend
      return posts.filter((post) => {
        if (isTweet(post)) {
          if (isOwnProfile) {
            // For own profile, check if user has liked the post
            // Include all posts the user has liked (including their own posts and quote reposts)
            // Exclude only normal reposts (they're just shares, not content)
            // Quote reposts are treated as new tweets, so include them
            return post.userInteractions.liked && post.repostType !== 'normal';
          }
          // For other users, we don't have their like data
          // In production, fetch from backend: GET /api/users/{username}/likes
          return false;
        }
        return false;
      });
    }
    return [];
  };

  const filteredPosts = getFilteredPosts();

  // Calculate stats
  const stats = username ? calculateUserStats(username, posts) : { posts: 0, replies: 0, likes: 0 };

  // If this is a reserved route, don't render profile page
  if (isReservedRoute) {
    return null; // Will be handled by redirect in useEffect
  }

  // If user not found or username not loaded yet, show error state
  if (!username || !profileUser) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex justify-center">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
            <Topbar onUpgradeLabs={() => window.location.href = '/plans'} />
            <div className="flex-1 flex pb-16 md:pb-0">
              <div className="w-full border-l border-r border-white/10 px-4 py-12 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">User not found</h1>
                <p className="text-gray-400">The user @{username} doesn't exist.</p>
              </div>
            </div>
          </div>
        </div>
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
          {/* Mobile Header - Mobile Only */}
          <MobileHeader title={profileUser.displayName} />
          
          {/* Top Bar - Desktop Only */}
          <div className="hidden md:block">
            <Topbar onUpgradeLabs={() => window.location.href = '/plans'} />
          </div>

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10">
              {/* Profile Header */}
              <ProfileHeader
                profileUser={profileUser}
                isOwnProfile={isOwnProfile}
                stats={stats}
                onEditProfile={() => {
                  // TODO: Implement edit profile functionality
                  console.log('Edit profile clicked');
                }}
                onFollow={() => {
                  // TODO: Implement follow functionality
                  console.log('Follow clicked');
                }}
              />

              {/* Divider */}
              <div className="border-b border-white/10"></div>

              {/* Tabs - Posts, Replies, Likes */}
              <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />

              {/* User Posts Feed */}
              <div className="px-2 py-6 lg:px-4">
                {activeTab === 'replies' ? (
                  <ProfileReplies
                    comments={userComments}
                    posts={posts}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onComment={handleComment}
                    onVote={handleVote}
                    hasUserReposted={hasUserReposted}
                    currentUserHandle={currentUser.handle}
                    onCommentLike={handleCommentLike}
                  />
                ) : (
                  <Feed
                    posts={filteredPosts}
                    onNewIdeaClick={() => {}}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onComment={handleComment}
                    onVote={handleVote}
                    onDelete={isOwnProfile ? handleDelete : undefined}
                    hasUserReposted={hasUserReposted}
                    currentUserHandle={currentUser.handle}
                    allPosts={posts}
                    showAllReposts={activeTab === 'posts'}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block w-[350px] flex-shrink-0 pl-4">
          <RightRail
            watchlist={watchlist}
            onManageWatchlist={() => setIsManageWatchlistOpen(true)}
            onUpgradeLabs={() => window.location.href = '/plans'}
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
          onSubmit={handleQuoteRepostSubmit}
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
