'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/app/layout/Sidebar';
import Topbar from '@/components/app/layout/Topbar';
import Feed from '@/components/app/feed/Feed';
import RightRail from '@/components/app/layout/RightRail';
import ManageWatchlistModal from '@/components/app/modals/ManageWatchlistModal';
import TweetComposer from '@/components/app/composer/TweetComposer';
import { mockPosts, isTweet } from '@/data/mockData';
import { Post, WatchlistItem } from '@/types';
import { createNormalRepost, createQuoteRepost, incrementRepostCount } from '@/utils/repostHelpers';
import { createTweet } from '@/utils/tweetHelpers';

export default function HomePage() {
  const [isNewIdeaOpen, setIsNewIdeaOpen] = useState(false);
  const [isManageWatchlistOpen, setIsManageWatchlistOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [isQuoteRepostOpen, setIsQuoteRepostOpen] = useState(false);
  const [quoteRepostPostId, setQuoteRepostPostId] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  // Mock current user - in real implementation, get from session/auth context
  const currentUser = {
    id: 'current-user',
    displayName: 'John Doe',
    handle: 'johndoe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
    badge: 'Verified' as const,
  };

  // Load posts and watchlist from localStorage on client side only (after mount)
  useEffect(() => {
    setIsClient(true);
    
    // Load watchlist
    const savedWatchlist = localStorage.getItem('pageshare_watchlist');
    if (savedWatchlist) {
      try {
        const parsedWatchlist = JSON.parse(savedWatchlist);
        if (Array.isArray(parsedWatchlist)) {
          setWatchlist(parsedWatchlist);
        }
      } catch {
        // If parsing fails, keep empty watchlist
      }
    }
    
    // Load posts
    const saved = localStorage.getItem('pageshare_posts');
    if (saved) {
      try {
        const parsedPosts = JSON.parse(saved);
        
        // Check if parsedPosts is a valid array
        if (Array.isArray(parsedPosts) && parsedPosts.length > 0) {
          // Check if localStorage data has repost structure by checking if any post has repostType
          const hasRepostStructure = parsedPosts.some((p: Post) => {
            if (isTweet(p)) {
              return p.repostType !== undefined && p.originalPostId !== undefined;
            }
            return false;
          });
          
          // Check if mock repost posts exist (repost-1, repost-2, repost-3, repost-4)
          const hasMockReposts = parsedPosts.some((p: Post) => 
            p.id === 'repost-1' || p.id === 'repost-2' || p.id === 'repost-3' || p.id === 'repost-4'
          );
          
          // Check if there are any user-created posts (posts with IDs that start with 'repost-' or 'tweet-' followed by timestamp)
          const hasUserCreatedPosts = parsedPosts.some((p: Post) => {
            const id = p.id;
            // Check for dynamically created IDs (repost-timestamp-random or tweet-timestamp-random)
            return (id.startsWith('repost-') && id.includes('-') && id.split('-').length > 2) ||
                   (id.startsWith('tweet-') && id.includes('-') && id.split('-').length > 2);
          });
          
          // If there are user-created posts, always use parsedPosts (don't overwrite)
          if (hasUserCreatedPosts) {
            setPosts(parsedPosts);
          } else if (hasRepostStructure || hasMockReposts) {
            // Verify the repost posts actually have the structure
            const repostPosts = parsedPosts.filter((p: Post) => 
              p.id === 'repost-1' || p.id === 'repost-2' || p.id === 'repost-3' || p.id === 'repost-4'
            );
            const allRepostsValid = repostPosts.every((p: Post) => {
              if (isTweet(p)) {
                return p.repostType !== undefined && p.originalPostId !== undefined;
              }
              return false;
            });
            
            if (allRepostsValid && repostPosts.length > 0) {
              setPosts(parsedPosts);
            } else {
              // Repost posts exist but don't have proper structure, use fresh mockPosts
              setPosts(mockPosts);
              localStorage.setItem('pageshare_posts', JSON.stringify(mockPosts));
            }
          } else {
            // No repost structure, but might have other posts - use parsedPosts to preserve user data
            setPosts(parsedPosts);
          }
        } else {
          // Invalid array, use mockPosts
          setPosts(mockPosts);
        }
      } catch {
        // If parsing fails, keep mockPosts
        setPosts(mockPosts);
      }
    } else {
      // No localStorage data, use mockPosts
      setPosts(mockPosts);
    }
  }, []);

  // Sync userInteractions.reposted flags with actual repost entries
  // This fixes any inconsistencies where repost entries exist but flags are false
  useEffect(() => {
    if (!isClient || posts.length === 0) return;
    
    // Find all reposts by current user
    const userReposts = posts.filter((post) => {
      if (!isTweet(post)) return false;
      if (!(post.repostType === 'normal' || post.repostType === 'quote')) return false;
      if (!post.originalPostId) return false;
      if (post.author.handle !== currentUser.handle) return false;
      return true;
    });

    // Check if any original posts need flag updates
    const needsUpdate = posts.some((post) => {
      const hasRepost = userReposts.some((repost) => repost.originalPostId === post.id);
      return (hasRepost && post.userInteractions.reposted === false) ||
             (!hasRepost && post.userInteractions.reposted === true);
    });

    if (needsUpdate) {
      setPosts((prev) => {
        // Update original posts' userInteractions.reposted flags
        return prev.map((post) => {
          // Check if this post has been reposted by current user
          const hasRepost = userReposts.some((repost) => repost.originalPostId === post.id);
          
          if (hasRepost && post.userInteractions.reposted === false) {
            // Update the flag to match the actual repost entry
            return {
              ...post,
              userInteractions: {
                ...post.userInteractions,
                reposted: true,
              },
            };
          }
          
          // If no repost exists but flag is true, reset it
          if (!hasRepost && post.userInteractions.reposted === true) {
            return {
              ...post,
              userInteractions: {
                ...post.userInteractions,
                reposted: false,
              },
            };
          }
          
          return post;
        });
      });
    }
  }, [isClient, posts.length, currentUser.handle]); // Run when posts are loaded

  // Save posts to localStorage whenever they change (client side only)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('pageshare_posts', JSON.stringify(posts));
    }
  }, [posts, isClient]);

  // Save watchlist to localStorage whenever it changes (client side only)
  useEffect(() => {
    if (isClient && typeof window !== 'undefined') {
      localStorage.setItem('pageshare_watchlist', JSON.stringify(watchlist));
    }
  }, [watchlist, isClient]);

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


  // Check if current user has already reposted a post (only normal reposts, not quote reposts)
  // Quote reposts are treated as new tweets, so they don't count as "reposts" for undo functionality
  const hasUserReposted = (postId: string): boolean => {
    const result = posts.some(
      (post) => {
        if (!isTweet(post)) return false;
        if (post.repostType !== 'normal') return false; // Only check normal reposts
        if (!post.originalPostId) return false;
        if (post.originalPostId !== postId) return false;
        if (post.author.handle !== currentUser.handle) return false;
        return true;
      }
    );
    return result;
  };

  // Find existing normal repost by current user (quote reposts are treated as new tweets, not reposts)
  const findUserRepost = (postId: string) => {
    // Only find normal reposts (quote reposts are new tweets, can't be "undone" as reposts)
    return posts.find(
      (post) =>
        isTweet(post) &&
        post.repostType === 'normal' &&
        post.originalPostId === postId &&
        post.author.handle === currentUser.handle
    );
  };

  const handleNewTweet = async (
    text: string,
    mediaFiles?: File[],
    gifUrl?: string,
    poll?: { options: string[]; duration: number }
  ) => {
    // Convert media files to data URLs (for localStorage storage)
    let mediaUrls: string[] = [];
    
    if (mediaFiles && mediaFiles.length > 0) {
      // Convert File objects to data URLs
      const convertFileToDataUrl = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      try {
        // Convert all files to data URLs
        mediaUrls = await Promise.all(mediaFiles.map(convertFileToDataUrl));
      } catch (error) {
        console.error('Error converting media files:', error);
        // Continue without media if conversion fails
      }
    }

    // Create new tweet
    const newTweet = createTweet({
      content: text,
      author: currentUser,
      mediaUrls: mediaUrls.length > 0 ? mediaUrls : undefined,
      gifUrl,
      poll,
    });

    // Add new tweet to the beginning of the posts array
    setPosts((prev) => [newTweet, ...prev]);
  };

  const handleRepost = (postId: string, type?: 'normal' | 'quote') => {
    const originalPost = posts.find((p) => p.id === postId);
    if (!originalPost) {
      return;
    }

    // Twitter/LinkedIn allow self-reposts (though uncommon)
    // We'll allow it but it will only appear in the reposter's own feed
    // (due to feed filtering that shows reposts only from current user)

    // Check if user already reposted (for undo) - works for both normal and quote reposts
    // For normal reposts, undo immediately. For quote reposts, we check if they already have a quote repost
    if (type === 'normal' && hasUserReposted(postId)) {
      // Undo normal repost - remove the repost and decrement count
      const userRepost = findUserRepost(postId);
      if (userRepost) {
        setPosts((prev) => {
          const filtered = prev.filter((p) => p.id !== userRepost.id);
          return filtered.map((post) =>
        post.id === postId
          ? {
              ...post,
              stats: {
                ...post.stats,
                    reposts: Math.max(0, post.stats.reposts - 1),
              },
              userInteractions: {
                ...post.userInteractions,
                    reposted: false, // Reset the reposted flag when undoing
              },
            }
          : post
          );
        });
      }
      return;
    }
    
    // Quote reposts are treated as new tweets, not reposts
    // They can be created multiple times and deleted, but can't be "undone" as reposts
    // No undo logic needed for quote reposts - they're just new tweets with embedded content
    if (type === 'quote') {
      setQuoteRepostPostId(postId);
      setIsQuoteRepostOpen(true);
    } else if (type === 'normal') {
      // If the post being reposted is itself a quote repost, repost the quote repost itself
      // Otherwise, repost the original post
      const postToRepost = isTweet(originalPost) && originalPost.repostType === 'quote' 
        ? originalPost 
        : originalPost;
      
      const repost = createNormalRepost({
        originalPost: postToRepost,
        currentUser: {
          id: currentUser.id,
          displayName: currentUser.displayName,
          handle: currentUser.handle,
          avatar: currentUser.avatar,
          badge: currentUser.badge,
        },
      });

      if (repost) {
        setPosts((prev) => {
          // Increment repost count on the post being reposted (postToRepost.id, not the original it quotes)
          // If reposting a quote repost, increment the quote repost's count
          // If reposting a regular post, increment that post's count
          const postIdToIncrement = postToRepost.id;
          const updated = incrementRepostCount(prev, postIdToIncrement);
          // Also update the post's userInteractions.reposted flag
          const updatedWithInteraction = updated.map((post) =>
        post.id === postIdToIncrement
          ? {
              ...post,
                  userInteractions: {
                    ...post.userInteractions,
                    reposted: true,
                  },
                }
              : post
          );
          return [repost, ...updatedWithInteraction];
        });
      }
    }
  };

  const handleQuoteRepostSubmit = (text: string) => {
    if (!quoteRepostPostId) return;

    const originalPost = posts.find((p) => p.id === quoteRepostPostId);
    if (!originalPost) return;

    const repost = createQuoteRepost({
      originalPost,
      currentUser: {
        id: 'current-user',
        displayName: currentUser.displayName,
        handle: currentUser.handle,
        avatar: currentUser.avatar,
        badge: 'Verified',
      },
      quoteText: text,
    });

    if (repost) {
      // Quote reposts increase the repost count but don't set the reposted flag
      // (so the repost button stays uncolored - quote reposts are new tweets, not reposts)
      const updatedWithCount = incrementRepostCount(posts, quoteRepostPostId);
      setPosts([repost, ...updatedWithCount]);
    }

    setIsQuoteRepostOpen(false);
    setQuoteRepostPostId(null);
  };

  const handleComment = (postId: string) => {
    // Handle comment action
  };

  const handleDelete = (postId: string) => {
    setPosts((prev) => {
      const filtered = prev.filter((p) => p.id !== postId);
      // Also remove any reposts that reference this post
      const filteredReposts = filtered.filter((p) => {
        if (isTweet(p) && p.repostType && p.originalPostId) {
          return p.originalPostId !== postId;
        }
        return true;
      });
      return filteredReposts;
    });
  };

  const handleVote = (postId: string, optionIndex: number) => {
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id === postId && 'poll' in post && post.poll && !post.poll.isFinished) {
          const currentVotes = post.poll.votes || {};
          const newVotes = { ...currentVotes };
          const currentVote = post.poll.userVote;
          
          // If user already voted, remove their previous vote
          if (currentVote !== undefined && currentVote !== optionIndex) {
            newVotes[currentVote] = Math.max(0, (newVotes[currentVote] || 0) - 1);
          }
          
          // Add new vote
          newVotes[optionIndex] = (newVotes[optionIndex] || 0) + 1;
          
          return {
            ...post,
            poll: {
              ...post.poll,
              votes: newVotes,
              userVote: optionIndex,
            },
          };
        }
        return post;
      })
    );
  };

  return (
    <div className="min-h-screen bg-black">
      <div className="flex justify-center">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 max-w-[600px]">
          {/* Top Bar - Mobile Only */}
          <Topbar onUpgradeLabs={() => window.location.href = '/plans'} />

          {/* Content */}
          <div className="flex-1 flex pb-16 md:pb-0">
            {/* Center Feed */}
             <div className="w-full border-l border-r border-white/10 px-2 py-6 lg:px-4">
              <Feed
                posts={posts}
                onNewIdeaClick={() => setIsNewIdeaOpen(true)}
                onLike={handleLike}
                onRepost={handleRepost}
                onComment={handleComment}
                onVote={handleVote}
                onDelete={handleDelete}
                hasUserReposted={hasUserReposted}
                currentUserHandle={currentUser.handle}
                onNewTweet={handleNewTweet}
              />
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
    </div>
  );
}

