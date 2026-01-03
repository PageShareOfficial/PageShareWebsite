'use client';

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import PostCard from './PostCard';
import TweetComposer from './TweetComposer';
import { Post } from '@/types';
import { isTweet } from '@/data/mockData';

interface FeedProps {
  posts: Post[];
  onNewIdeaClick: () => void;
  onLike: (postId: string) => void;
  onRepost: (postId: string, type?: 'normal' | 'quote', quoteText?: string) => void;
  onComment: (postId: string) => void;
  onVote?: (postId: string, optionIndex: number) => void;
  onDelete?: (postId: string) => void;
  hasUserReposted?: (postId: string) => boolean;
  currentUserHandle?: string;
  onNewTweet?: (text: string, media?: File[], gifUrl?: string, poll?: { options: string[]; duration: number }) => void;
}

export default function Feed({
  posts,
  onNewIdeaClick,
  onLike,
  onRepost,
  onComment,
  onVote,
  onDelete,
  hasUserReposted,
  currentUserHandle,
  onNewTweet,
}: FeedProps) {
  const [isComposerModalOpen, setIsComposerModalOpen] = useState(false);

  // Mock current user - in real implementation, get from session/auth context
  const currentUser = {
    displayName: 'John Doe',
    handle: 'johndoe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=john',
  };

  const handleTweetSubmit = (text: string, media?: File[], gifUrl?: string, poll?: { options: string[]; duration: number }) => {
    if (onNewTweet) {
      onNewTweet(text, media, gifUrl, poll);
      // Close modal if open
      setIsComposerModalOpen(false);
    }
  };

  return (
    <main className="w-full bg-black">
      {/* Tweet Composer - Desktop & Tablet Only */}
      <div className="hidden md:block">
        <TweetComposer
          currentUser={currentUser}
          onSubmit={handleTweetSubmit}
        />
      </div>

      {/* Floating Post Button - Mobile Only */}
      <button
        onClick={() => setIsComposerModalOpen(true)}
        className="md:hidden fixed bottom-24 right-4 z-40 w-14 h-14 bg-white text-black rounded-full shadow-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
        aria-label="New post"
      >
        <Pencil className="w-6 h-6" />
      </button>

      {/* Tweet Composer Modal - Mobile */}
      {isComposerModalOpen && (
        <TweetComposer
          currentUser={currentUser}
          onSubmit={handleTweetSubmit}
          onClose={() => setIsComposerModalOpen(false)}
          isModal={true}
        />
      )}

      {/* Posts */}
      <div role="feed" aria-label="Post feed">
        {posts
          .filter((post) => {
            // Filter logic:
            // 1. Show your reposts (with "You reposted" indicator)
            // 2. Hide self-reposts from your feed (when you repost your own post)
            // 3. Hide other users' repost entries (we'll show original posts with repost indicators instead)
            // 4. Hide original posts that you've already reposted (you'll see your repost entry instead)
            // 5. Show all other original posts
            
            if (post.repostType === 'normal' || post.repostType === 'quote') {
              // It's a repost entry
              
              // Find the original post
              const originalPost = posts.find((p) => p.id === post.originalPostId);
              
              // Hide self-reposts from your feed (only for normal reposts)
              // Quote reposts are new tweets, so show them even if they're your own post
              if (post.repostType === 'normal' && originalPost && originalPost.author.handle === currentUserHandle) {
                return false; // Don't show self normal reposts
              }
              
              // For normal reposts: 
              // - Hide YOUR repost entry from YOUR feed (show original post instead)
              // - Show OTHER USERS' repost entries (so followers see your reposts)
              if (post.repostType === 'normal') {
                if (currentUserHandle && post.author.handle === currentUserHandle) {
                  return false; // Hide your normal repost entry from your feed, original post will be shown instead
                }
                // Show other users' normal repost entries (followers will see your reposts)
                return true;
              }
              
              // Quote reposts are treated as new tweets, so show them from all users
              // (They're not filtered like normal reposts)
              if (post.repostType === 'quote') {
                return true; // Show all quote reposts (they're new tweets)
              }
              
              return false;
            }
            
            // For original posts (non-reposts):
            // If you normal reposted it, show the original post (not your repost entry)
            // If you quote reposted it, show both the quote repost AND the original post
            if (hasUserReposted && hasUserReposted(post.id)) {
              // Check if user has a quote repost of this post (quote reposts should show both)
              const hasQuoteRepost = posts.some((p) => {
                if (!isTweet(p)) return false;
                if (p.repostType !== 'quote') return false;
                if (!p.originalPostId) return false;
                if (p.originalPostId !== post.id) return false;
                if (p.author.handle !== currentUserHandle) return false;
                return true;
              });
              
              // If user has a quote repost, show the original post (both will appear)
              if (hasQuoteRepost) {
                return true;
              }
              
              // For normal reposts: Show the original post (not your repost entry)
              // This works for both your own posts and other users' posts
              return true;
            }
            
            // Show all other original posts
            return true;
          })
          .map((post, index, filteredPosts) => {
            // For original posts, check if someone reposted them
            // Tag behavior:
            // 1. If UserB reposted UserA's post first, and you also reposted it:
            //    - In YOUR feed: Show "UserB reposted" tag (first reposter)
            //    - For YOUR followers: They see your repost entry with "John Doe reposted"
            // 2. If you reposted it and no one else did:
            //    - In YOUR feed: No tag (just green button)
            //    - For YOUR followers: They see your repost entry with "John Doe reposted"
            // 3. If someone else reposted it (and you didn't):
            //    - Show their tag
            let repostedBy = null;
            if (!post.repostType && currentUserHandle) {
              // Find all normal reposts of this post
              const allReposts = posts.filter((p) => {
                if (!isTweet(p)) return false;
                if (p.repostType !== 'normal') return false;
                if (!p.originalPostId) return false;
                if (p.originalPostId !== post.id) return false;
                return true;
              });
              
              if (allReposts.length > 0) {
                // Check if current user has reposted this
                const userReposted = allReposts.some((p) => p.author.handle === currentUserHandle);
                
                // Find the first repost that is NOT by the current user
                const firstOtherRepost = allReposts.find((p) => p.author.handle !== currentUserHandle);
                
                if (userReposted && firstOtherRepost) {
                  // You reposted it, but someone else reposted it first
                  // Show the first reposter's tag (UserB reposted)
                  repostedBy = {
                    displayName: firstOtherRepost.author.displayName,
                    handle: firstOtherRepost.author.handle,
                  };
                } else if (!userReposted && firstOtherRepost) {
                  // You didn't repost it, but someone else did
                  // Show their tag
                  repostedBy = {
                    displayName: firstOtherRepost.author.displayName,
                    handle: firstOtherRepost.author.handle,
                  };
                }
                // If you reposted it and no one else did, don't show tag (just green button)
              }
            }
            
            return (
              <div key={post.id}>
                <PostCard
                  post={post}
                  onLike={onLike}
                  onRepost={onRepost}
                  onComment={onComment}
                  onVote={onVote}
                  onDelete={onDelete}
                  hasUserReposted={hasUserReposted}
                  currentUserHandle={currentUserHandle}
                  allPosts={posts}
                  repostedBy={repostedBy}
                />
                {index < filteredPosts.length - 1 && (
                  <div className="border-b border-white/10" />
                )}
              </div>
            );
          })}
      </div>
    </main>
  );
}

