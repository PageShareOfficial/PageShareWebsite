'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { notFound } from 'next/navigation';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import MobileHeader from '@/components/app/layout/MobileHeader';
import DesktopHeader from '@/components/app/layout/DesktopHeader';
import RightRail from '@/components/app/layout/RightRail';
import ProfileHeader, { ProfileHeaderSkeleton } from '@/components/app/profile/ProfileHeader';
import Loading from '@/components/app/common/Loading';
import ProfileTabs from '@/components/app/profile/ProfileTabs';
import ProfileReplies from '@/components/app/profile/ProfileReplies';
import { Post, Comment } from '@/types';
import { calculateUserStats, ProfileUser } from '@/utils/user/profileUtils';
import { usePostHandlers } from '@/hooks/post/usePostHandlers';
import { useReportModal } from '@/hooks/features/useReportModal';
const Feed = dynamic(() => import('@/components/app/feed/Feed'), { ssr: false, loading: () => <Loading /> });
const TweetComposer = dynamic(() => import('@/components/app/composer/TweetComposer'), { ssr: false });
const EditProfileModal = dynamic(() => import('@/components/app/modals/EditProfileModal'), { ssr: false });
const ReportModal = dynamic(() => import('@/components/app/modals/ReportModal'), { ssr: false });
import { useContentFilters } from '@/hooks/features/useContentFilters';
import { useCurrentUser } from '@/hooks/user/useCurrentUser';
import { usePostsData } from '@/hooks/post/usePostsData';
import { useWatchlist } from '@/hooks/features/useWatchlist';
import { isReservedRoute } from '@/utils/core/routeUtils';
import { getBaseUrl } from '@/lib/api/client';
import {
  getProfileByUsername,
  followUserApi,
  unfollowUserApi,
  listUserReplies,
  listUserLikes,
  type ProfileByUsernameResponse,
  type UserReplyItem,
  type PollInReplyResponse,
} from '@/lib/api/userApi';
import { toggleCommentReaction, deleteComment } from '@/lib/api/commentApi';
import { useAuth } from '@/contexts/AuthContext';
import { mapPostResponseToPost, votePoll } from '@/lib/api/postApi';
import LoadingState from '@/components/app/common/LoadingState';
import { formatRelativeTime } from '@/utils/core/dateUtils';

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
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [backendProfile, setBackendProfile] = useState<ProfileByUsernameResponse | null>(null);
  const [profileNotFound, setProfileNotFound] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const repliesFetchedForIdRef = useRef<string | null>(null);
  const likesFetchedForIdRef = useRef<string | null>(null);
  const { currentUser, isClient, refreshUser } = useCurrentUser();
  const { session } = useAuth();
  const apiUrl = getBaseUrl();
  const { filterPosts } = useContentFilters({ 
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

  // Fetch replies only once per profile when Replies tab is active; keep data when switching tabs
  useEffect(() => {
    if (activeTab !== 'replies' || !backendProfile?.id) return;
    if (repliesFetchedForIdRef.current === backendProfile.id) return;
    let cancelled = false;
    repliesFetchedForIdRef.current = backendProfile.id;
    setRepliesLoading(true);
    listUserReplies(backendProfile.id, session?.access_token ?? null, { page: 1, per_page: 50 })
      .then((res) => {
        if (!cancelled) setUserReplies(res.data);
      })
      .catch(() => {
        if (!cancelled) {
          setUserReplies([]);
          repliesFetchedForIdRef.current = null;
        }
      })
      .finally(() => {
        if (!cancelled) setRepliesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, backendProfile?.id, session?.access_token]);

  // Fetch likes only once per profile when Likes tab is active; keep data when switching tabs
  useEffect(() => {
    if (activeTab !== 'likes' || !backendProfile?.id) return;
    if (likesFetchedForIdRef.current === backendProfile.id) return;
    let cancelled = false;
    likesFetchedForIdRef.current = backendProfile.id;
    setLikesLoading(true);
    listUserLikes(backendProfile.id, session?.access_token ?? null, { page: 1, per_page: 50 })
      .then((res) => {
        if (!cancelled) {
          const mapped = res.data.map((p) => mapPostResponseToPost(p));
          setUserLikes(mapped);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUserLikes([]);
          likesFetchedForIdRef.current = null;
        }
      })
      .finally(() => {
        if (!cancelled) setLikesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTab, backendProfile?.id, session?.access_token]);
  

  // Memoize route validation to avoid recalculating on every render
  // Check if this is a reserved route - if so, redirect (O(1) lookup with Set)
  const isReserved = useMemo(() => {
    return username ? isReservedRoute(username) : false;
  }, [username]);
  
  // Handle reserved routes - redirect to the correct static route
  useEffect(() => {
    if (!username || !isReserved) return;
    router.replace(`/${username.toLowerCase()}`);
  }, [username, router, isReserved]);

  // Backend is the only source of truth: 404 when backend returns 404 or when API is not configured
  if (username && !isReserved) {
    if (!apiUrl) notFound();
    if (profileNotFound) notFound();
  }

  const isOwnProfile = backendProfile ? currentUser.handle === backendProfile.username : currentUser.handle === username.toLowerCase();

  // Fetch profile by username from backend. Runs on every mount/navigation to this page
  // (no client cache), so opening /[username] always triggers one GET /users/by-username/{username}.
  useEffect(() => {
    if (!apiUrl || !username || isReserved) return;
    let cancelled = false;
    getProfileByUsername(username, session?.access_token ?? null)
      .then((data) => {
        if (cancelled) return;
        if (data === null) setProfileNotFound(true);
        else setBackendProfile(data);
      })
      .catch(() => {
        if (!cancelled) setProfileNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [apiUrl, username, isReserved, session?.access_token]);

  // Header profile from backend only
  const headerProfile: ProfileUser | null = backendProfile
    ? {
        id: backendProfile.id,
        displayName: backendProfile.display_name,
        handle: backendProfile.username,
        avatar: backendProfile.profile_picture_url ?? '',
        badge: backendProfile.badge === 'Verified' ? 'Verified' : backendProfile.badge === 'Public' ? 'Public' : undefined,
        joinedDate: backendProfile.created_at,
        followers: backendProfile.follower_count,
        following: backendProfile.following_count,
        bio: backendProfile.bio ?? '',
        interests: backendProfile.interests ?? [],
      }
    : null;


  // Use custom hooks for data and handlers. On profile, load this user's posts (or null until profile loaded).
  const { posts, setPosts, loading: postsLoading } = usePostsData({
    userId: backendProfile ? backendProfile.id : null,
  });
  const { watchlist, setWatchlist, loading: watchlistLoading, openManageModal } = useWatchlist();
  const [userReplies, setUserReplies] = useState<UserReplyItem[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [userLikes, setUserLikes] = useState<Post[]>([]);
  const [likesLoading, setLikesLoading] = useState(false);

  // When profile changes (e.g. navigate to another user), clear tab caches so we fetch fresh for the new profile
  useEffect(() => {
    repliesFetchedForIdRef.current = null;
    likesFetchedForIdRef.current = null;
    setUserReplies([]);
    setUserLikes([]);
  }, [backendProfile?.id]);

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

  // Handle comment likes (backend is source of truth)
  const handleCommentLike = async (commentId: string) => {
    if (!session?.access_token) return;
    const reply = userReplies.find((r) => r.comment.id === commentId);
    if (!reply) return;
    const prevLiked = reply.comment.user_liked;
    const prevLikes = reply.comment.likes;
    setUserReplies((prev: UserReplyItem[]) =>
      prev.map((r) =>
        r.comment.id === commentId
          ? {
              ...r,
              comment: {
                ...r.comment,
                user_liked: !prevLiked,
                likes: prevLiked ? prevLikes - 1 : prevLikes + 1,
              },
            }
          : r
      )
    );
    try {
      const res = await toggleCommentReaction(commentId, session.access_token);
      setUserReplies((prev: UserReplyItem[]) =>
        prev.map((r) =>
          r.comment.id === commentId
            ? { ...r, comment: { ...r.comment, user_liked: res.reacted, likes: res.reaction_count } }
            : r
        )
      );
    } catch {
      setUserReplies((prev: UserReplyItem[]) =>
        prev.map((r) =>
          r.comment.id === commentId
            ? { ...r, comment: { ...r.comment, user_liked: prevLiked, likes: prevLikes } }
            : r
        )
      );
    }
  };

  // Handle comment poll votes (backend is source of truth)
  const handleCommentPollVote = async (commentId: string, optionIndex: number) => {
    if (!session?.access_token) return;
    const reply = userReplies.find((r) => r.comment.id === commentId);
    if (!reply?.comment.poll?.poll_id) return;
    const pollId = reply.comment.poll.poll_id;
    try {
      const { data } = await votePoll(pollId, optionIndex, session.access_token);
      setUserReplies((prev: UserReplyItem[]) =>
        prev.map((r) => {
          if (r.comment.id !== commentId || !r.comment.poll) return r;
          return {
            ...r,
            comment: {
              ...r.comment,
              poll: {
                ...r.comment.poll,
                results: data.results ?? {},
                user_vote: data.option_index,
              },
            },
          };
        })
      );
    } catch {
      // Optionally show error
    }
  };

  // Handle comment deletion (backend is source of truth)
  const handleCommentDelete = async (commentId: string, postId: string) => {
    if (!session?.access_token) return;
    setUserReplies((prev: UserReplyItem[]) => prev.filter((r) => r.comment.id !== commentId));
    try {
      await deleteComment(commentId, session.access_token);
      setPosts((prev: Post[]) =>
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
    } catch {
      if (backendProfile?.id) {
        listUserReplies(backendProfile.id, session.access_token, { page: 1, per_page: 50 })
          .then((res) => setUserReplies(res.data))
          .catch(() => {});
      }
    }
  };

  // Posts tab: backend already returns this user's posts only (originals + quote reposts + normal reposts)
  const getFilteredPosts = () => {
    if (activeTab !== 'posts') return [];
    return posts; // No author filter – list was fetched by user_id
  };
  const filteredPosts = filterPosts(getFilteredPosts());

  // Map backend poll (post/comment) to frontend poll shape
  const mapReplyPoll = (p: PollInReplyResponse | null | undefined) => {
    if (!p || !p.options?.length) return undefined;
    return {
      pollId: p.poll_id,
      options: p.options,
      duration: 1,
      createdAt: '',
      votes: (p.results as Record<number, number>) ?? {},
      userVote: p.user_vote ?? undefined,
      isFinished: p.is_finished,
      expiresAt: p.expires_at,
    };
  };

  // Map API replies to Comment (with media, gif, poll) and full Post (with media, gif, poll, quotedPost) for ProfileReplies
  const replyComments: Comment[] = userReplies.map((item) => ({
    id: item.comment.id,
    postId: item.comment.post_id,
    author: {
      id: item.comment.author.id,
      displayName: item.comment.author.display_name,
      handle: item.comment.author.username,
      avatar: item.comment.author.profile_picture_url ?? '',
      badge: item.comment.author.badge === 'Verified' ? 'Verified' : item.comment.author.badge === 'Public' ? 'Public' : undefined,
    },
    content: item.comment.content,
    createdAt: formatRelativeTime(new Date(item.comment.created_at)),
    likes: item.comment.likes,
    userLiked: item.comment.user_liked,
    media: item.comment.media_urls ?? undefined,
    gifUrl: item.comment.gif_url ?? undefined,
    poll: mapReplyPoll(item.comment.poll ?? null),
  }));
  const repliesPostsForContext: Post[] = userReplies.map((item) => {
    const p = item.post;
    const author: Post['author'] = {
      id: p.author.id ?? '',
      displayName: p.author.display_name,
      handle: p.author.username,
      avatar: p.author.profile_picture_url ?? '',
      badge: p.author.badge === 'Verified' ? 'Verified' : p.author.badge === 'Public' ? 'Public' : undefined,
    };
    const post: Post = {
      id: p.id,
      author,
      content: p.content ?? '',
      createdAt: p.created_at ? formatRelativeTime(new Date(p.created_at)) : '',
      media: p.media_urls && p.media_urls.length > 0 ? p.media_urls : undefined,
      gifUrl: p.gif_url ?? undefined,
      stats: { likes: 0, comments: 0, reposts: 0 },
      userInteractions: { liked: false, reposted: false },
    };
    if (p.repost_type === 'quote' || p.repost_type === 'normal') {
      post.repostType = p.repost_type as 'normal' | 'quote';
    }
    if (p.original_post_id) post.originalPostId = p.original_post_id;
    if (p.original_post) {
      const op = p.original_post;
      post.quotedPost = {
        id: op.id,
        author: {
          id: op.author.id,
          displayName: op.author.display_name,
          handle: op.author.username,
          avatar: op.author.profile_picture_url ?? '',
          badge: (op.author.badge === 'Verified' || op.author.badge === 'Public') ? op.author.badge : undefined,
        },
        content: op.content,
        createdAt: op.created_at ? formatRelativeTime(new Date(op.created_at)) : '',
        media: op.media_urls && op.media_urls.length > 0 ? op.media_urls : undefined,
        gifUrl: op.gif_url ?? undefined,
        stats: { likes: 0, comments: 0, reposts: 0 },
        userInteractions: { liked: false, reposted: false },
      } as Post;
    }
    if (p.poll) post.poll = mapReplyPoll(p.poll);
    return post;
  });

  // Replies tab: only comments/replies by this user (no quote reposts — show only where user has replied)
  type ReplyTabItem =
    | { type: 'comment'; comment: Comment; post: Post; sortAt: string }
    | { type: 'quote'; post: Post; sortAt: string };
  const replyTabItems: ReplyTabItem[] = userReplies
    .map((_, i) => ({
      type: 'comment' as const,
      comment: replyComments[i],
      post: repliesPostsForContext[i],
      sortAt: userReplies[i].comment.created_at,
    }))
    .sort((a, b) => new Date(b.sortAt).getTime() - new Date(a.sortAt).getTime());

  // Calculate stats
  const stats = username ? calculateUserStats(username, posts) : { posts: 0, replies: 0, likes: 0 };

  // Handle follow/unfollow via backend (optimistic update)
  const handleFollow = async () => {
    if (!backendProfile || isOwnProfile || !session?.access_token) return;
    const prevFollowing = backendProfile.is_following;
    const prevCount = backendProfile.follower_count;

    // Optimistic update
    setBackendProfile((prev) =>
      prev
        ? {
            ...prev,
            is_following: !prevFollowing,
            follower_count: prevFollowing
              ? Math.max(0, prevCount - 1)
              : prevCount + 1,
          }
        : null
    );
    setFollowLoading(true);
    try {
      if (prevFollowing) {
        const res = await unfollowUserApi(backendProfile.id, session.access_token);
        const count = res.data?.follower_count ?? Math.max(0, prevCount - 1);
        setBackendProfile((prev) =>
          prev ? { ...prev, is_following: false, follower_count: count } : null
        );
      } else {
        const res = await followUserApi(backendProfile.id, session.access_token);
        const count = res.data?.follower_count ?? prevCount + 1;
        setBackendProfile((prev) =>
          prev ? { ...prev, is_following: true, follower_count: count } : null
        );
      }
    } catch {
      // Revert on failure
      setBackendProfile((prev) =>
        prev ? { ...prev, is_following: prevFollowing, follower_count: prevCount } : null
      );
    } finally {
      setFollowLoading(false);
    }
  };


  // After edit profile (saved by modal via API), refetch profile to update header
  const handleProfileSave = async () => {
    if (!username || isReserved) return;
    const data = await getProfileByUsername(username, session?.access_token ?? null);
    if (data) setBackendProfile(data);
  };

  // If this is a reserved route, don't render profile page
  if (isReserved) {
    return null; // Will be handled by redirect in useEffect
  }

  const profileLoading = apiUrl && username && !isReserved && !backendProfile && !profileNotFound;

  if (!username) return null;

  // Only show full-page "User not found" when backend returned 404
  if (profileNotFound) {
    return (
      <div className="min-h-screen bg-black">
        <div className="flex justify-center">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
            <Topbar onUpgradeLabs={() => router.push('/plans')} />
            <div className="flex-1 flex pb-16 md:pb-0">
              <div className="w-full border-l border-r border-white/10 px-4 py-12 text-center">
                <h1 className="text-2xl font-bold text-white mb-2">User not found</h1>
                <p className="text-gray-400">The user @{username} doesn&apos;t exist.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full layout: show header skeleton + feed skeletons while loading, or real content when ready
  const showHeaderSkeleton = profileLoading;
  const titleDisplay = profileLoading ? 'Loading...' : (headerProfile?.displayName ?? username);
  const subtitleDisplay = profileLoading ? '' : (headerProfile ? `@${headerProfile.handle}` : '');

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          <MobileHeader title={titleDisplay} />
          <div className="hidden md:block">
            <Topbar onUpgradeLabs={() => router.push('/plans')} />
          </div>
          <DesktopHeader title={titleDisplay} subtitle={subtitleDisplay} />

          <div className="flex-1 flex pb-16 md:pb-0">
            <div className="w-full border-l border-r border-white/10">
              {/* Profile Header: skeleton while loading, real header when ready */}
              {showHeaderSkeleton ? (
                <ProfileHeaderSkeleton />
              ) : headerProfile ? (
                <ProfileHeader
                  profileUser={headerProfile}
                  isOwnProfile={isOwnProfile}
                  stats={stats}
                  onEditProfile={() => setIsEditProfileOpen(true)}
                  onFollow={handleFollow}
                  isFollowing={backendProfile?.is_following ?? false}
                  followLoading={followLoading}
                />
              ) : null}

              <div className="border-b border-white/10" />

              <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />

              <div className="px-2 py-6 lg:px-4">
                {showHeaderSkeleton || !isClient ? (
                  <LoadingState text="Loading..." />
                ) : !headerProfile ? (
                  <LoadingState text="Loading..." />
                ) : activeTab === 'posts' ? (
                  postsLoading ? (
                    <LoadingState text="Loading posts..." />
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
                      showAllReposts={true}
                      onReportClick={handleReportClick}
                      postsLoading={postsLoading}
                    />
                  )
                ) : activeTab === 'replies' ? (
                  repliesLoading ? (
                    <LoadingState text="Loading replies..." />
                  ) : (
                    <ProfileReplies
                      items={replyTabItems.map(({ sortAt, ...rest }) => rest)}
                      allPosts={posts}
                      onLike={handleLike}
                      onRepost={handleRepost}
                      onComment={handleComment}
                      onVote={handleVote}
                      hasUserReposted={hasUserReposted}
                      currentUserHandle={currentUser.handle}
                      onCommentLike={handleCommentLike}
                      onCommentPollVote={handleCommentPollVote}
                      onCommentDelete={handleCommentDelete}
                      onReportClick={handleReportClick}
                    />
                  )
                ) : likesLoading ? (
                  <LoadingState text="Loading likes..." />
                ) : (
                  <Feed
                    posts={userLikes}
                    onNewIdeaClick={() => {}}
                    onLike={handleLike}
                    onRepost={handleRepost}
                    onComment={handleComment}
                    onVote={handleVote}
                    onDelete={undefined}
                    hasUserReposted={hasUserReposted}
                    currentUserHandle={currentUser.handle}
                    allPosts={userLikes}
                    showAllReposts={false}
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
            onManageWatchlist={openManageModal}
            onUpgradeLabs={() => router.push('/plans')}
            onUpdateWatchlist={setWatchlist}
            isLoading={watchlistLoading}
          />
        </div>
      </div>

      {/* Modals */}
      {headerProfile && isOwnProfile && (
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          profileUser={headerProfile}
          onSave={handleProfileSave}
          accessToken={session?.access_token ?? null}
          refreshUser={refreshUser}
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
