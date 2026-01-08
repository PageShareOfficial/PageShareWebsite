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
import EditProfileModal from '@/components/app/modals/EditProfileModal';
import ProfileHeader from '@/components/app/profile/ProfileHeader';
import ProfileTabs from '@/components/app/profile/ProfileTabs';
import ProfileReplies from '@/components/app/profile/ProfileReplies';
import { isTweet } from '@/data/mockData';
import { Post, Comment } from '@/types';
import { getUserByUsername, calculateUserStats, ProfileUser } from '@/utils/profileUtils';
import { usePostHandlers } from '@/hooks/usePostHandlers';
import { useReportModal } from '@/hooks/useReportModal';
import { getFollowerCount, getFollowingCount, isFollowing, followUser, unfollowUser, initializeMockFollows } from '@/utils/followUtils';
import { filterReportedComments } from '@/utils/reportUtils';
import ReportModal from '@/components/app/modals/ReportModal';
import { useContentFilters } from '@/hooks/useContentFilters';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { usePostsData } from '@/hooks/usePostsData';
import { useWatchlist } from '@/hooks/useWatchlist';
import { useComments } from '@/hooks/useComments';

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
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isUserFollowing, setIsUserFollowing] = useState(false);
  const [currentProfileUser, setCurrentProfileUser] = useState<ProfileUser | null>(null);

  // Use new hooks
  const { currentUser, isClient } = useCurrentUser();
  const { filterPosts, filterComments } = useContentFilters({ 
    currentUserHandle: currentUser.handle, 
    isClient 
  });
  
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
  

  // Reserved routes that should not be treated as usernames
  const reservedRoutes = ['discover', 'plans', 'home', 'labs', 'watchlist', 'profile', 'followers', 'followings','bookmarks'];
  
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
  const baseProfileUser = username && !isReservedRoute ? getUserByUsername(username) : null;
  const isOwnProfile = currentUser.handle === username;

  // Load saved profile from localStorage if it exists
  useEffect(() => {
    if (!username || isReservedRoute || !baseProfileUser) return;

    const profileKey = `pageshare_profile_${username.toLowerCase()}`;
    const savedProfile = localStorage.getItem(profileKey);
    
    if (savedProfile) {
      try {
        const saved = JSON.parse(savedProfile);
        setCurrentProfileUser({
          ...baseProfileUser,
          ...saved,
        });
      } catch {
        setCurrentProfileUser(baseProfileUser);
      }
    } else {
      setCurrentProfileUser(baseProfileUser);
    }
  }, [username, isReservedRoute, baseProfileUser]);

  const profileUser = currentProfileUser || baseProfileUser;

  // Initialize mock follows on mount
  useEffect(() => {
    initializeMockFollows();
  }, []);

  // Load follower/following counts and follow status
  useEffect(() => {
    if (!username || isReservedRoute) return;
    
    const followers = getFollowerCount(username);
    const following = getFollowingCount(username);
    const followingStatus = isFollowing(currentUser.handle, username);
    
    setFollowerCount(followers);
    setFollowingCount(following);
    setIsUserFollowing(followingStatus);
  }, [username, currentUser.handle, isReservedRoute]);


  // Use custom hooks for data and handlers
  const { posts, setPosts } = usePostsData();
  const { watchlist, setWatchlist } = useWatchlist();
  const { allComments, setAllComments } = useComments({ posts });
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

  // Handle comment poll votes
  const handleCommentPollVote = (commentId: string, optionIndex: number) => {
    // Find the comment to get its postId
    const comment = allComments.find((c) => c.id === commentId);
    if (!comment || !comment.poll) return;

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

    // Update comment poll vote
    const updatedComments = comments.map((c: Comment) => {
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
    
    // Update allComments state
    setAllComments((prev) =>
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
              ...c.poll,
              votes: newVotes,
              userVote: optionIndex,
            },
          };
        }
        return c;
      })
    );
  };

  // Handle comment deletion
  const handleCommentDelete = (commentId: string, postId: string) => {
    // Remove comment from localStorage
    const savedComments = localStorage.getItem(`pageshare_comments_${postId}`);
    if (savedComments) {
      try {
        const comments: Comment[] = JSON.parse(savedComments);
        const updatedComments = comments.filter((c) => c.id !== commentId);
        
        if (updatedComments.length > 0) {
          localStorage.setItem(`pageshare_comments_${postId}`, JSON.stringify(updatedComments));
        } else {
          localStorage.removeItem(`pageshare_comments_${postId}`);
        }
      } catch {
        // If parsing fails, just remove the entry
        localStorage.removeItem(`pageshare_comments_${postId}`);
      }
    }
    
    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('commentsUpdated'));
    
    // Update allComments state
    setAllComments((prev) => prev.filter((c) => c.id !== commentId));
    
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
  };

  // Get user's comments (replies) - from both mockComments and localStorage
  // Filter comments: first by author, then by blocked/reported
  let userComments = allComments.filter((comment) => comment.author.handle === username);
  
  // Filter out blocked and reported comments if current user is viewing
  if (currentUser.handle) {
    userComments = filterComments(userComments);
    userComments = filterReportedComments(userComments, currentUser.handle);
  }

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

  // Filter posts to exclude blocked users' posts
  const filteredPosts = filterPosts(getFilteredPosts());

  // Calculate stats
  const stats = username ? calculateUserStats(username, posts) : { posts: 0, replies: 0, likes: 0 };

  // Handle follow/unfollow
  const handleFollow = () => {
    if (!username || isOwnProfile) return;
    
    if (isUserFollowing) {
      unfollowUser(currentUser.handle, username);
      setFollowerCount((prev) => Math.max(0, prev - 1));
    } else {
      followUser(currentUser.handle, username);
      setFollowerCount((prev) => prev + 1);
    }
    
    setIsUserFollowing(!isUserFollowing);
  };


  // Handle profile save
  const handleProfileSave = (updatedProfile: Partial<ProfileUser>) => {
    if (!profileUser) return;
    
    const newProfile = {
      ...profileUser,
      ...updatedProfile,
    };
    
    setCurrentProfileUser(newProfile);
    
    // Update posts to reflect new avatar/displayName
    if (updatedProfile.avatar || updatedProfile.displayName) {
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.author.handle === username) {
            return {
              ...post,
              author: {
                ...post.author,
                avatar: updatedProfile.avatar || post.author.avatar,
                displayName: updatedProfile.displayName || post.author.displayName,
              },
            };
          }
          return post;
        })
      );

      // Update all comments/replies to reflect new avatar/displayName
      // Get all post IDs
      const allPostIds = new Set<string>();
      posts.forEach((post) => {
        allPostIds.add(post.id);
      });

      // Update comments in localStorage for each post
      allPostIds.forEach((postId) => {
        const savedComments = localStorage.getItem(`pageshare_comments_${postId}`);
        if (savedComments) {
          try {
            const comments: Comment[] = JSON.parse(savedComments);
            const updatedComments = comments.map((comment) => {
              if (comment.author.handle === username) {
                return {
                  ...comment,
                  author: {
                    ...comment.author,
                    avatar: updatedProfile.avatar || comment.author.avatar,
                    displayName: updatedProfile.displayName || comment.author.displayName,
                  },
                };
              }
              return comment;
            });
            localStorage.setItem(`pageshare_comments_${postId}`, JSON.stringify(updatedComments));
          } catch {
            // Skip invalid comments
          }
        }
      });

      // Update allComments state
      setAllComments((prev) =>
        prev.map((comment) => {
          if (comment.author.handle === username) {
            return {
              ...comment,
              author: {
                ...comment.author,
                avatar: updatedProfile.avatar || comment.author.avatar,
                displayName: updatedProfile.displayName || comment.author.displayName,
              },
            };
          }
          return comment;
        })
      );

      // Dispatch events to notify other components
      window.dispatchEvent(new Event('commentsUpdated'));
      window.dispatchEvent(new Event('profileUpdated'));
    }
  };

  // Create profile user with updated counts
  const profileUserWithCounts = profileUser ? {
    ...profileUser,
    followers: followerCount || profileUser.followers,
    following: followingCount || profileUser.following,
  } : null;

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
              {profileUserWithCounts && (
                <ProfileHeader
                  profileUser={profileUserWithCounts}
                  isOwnProfile={isOwnProfile}
                  stats={stats}
                  isFollowing={isUserFollowing}
                  onEditProfile={() => setIsEditProfileOpen(true)}
                  onFollow={handleFollow}
                />
              )}

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
                    onCommentPollVote={handleCommentPollVote}
                    onCommentDelete={handleCommentDelete}
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
                    onReportClick={handleReportClick}
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
      {profileUserWithCounts && isOwnProfile && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profileUser={profileUserWithCounts}
          onSave={handleProfileSave}
        />
      )}
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
