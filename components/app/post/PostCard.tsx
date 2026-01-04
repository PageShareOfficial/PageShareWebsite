'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Post } from '@/types';
import { useState, useEffect, useRef } from 'react';
import { isTweet } from '@/data/mockData';
import { parseCashtags } from '@/utils/textFormatting';
import PostHeader from './PostHeader';
import PostActions from './PostActions';
import PostMedia from './PostMedia';
import PollComponent from './PollComponent';
import ImageViewerModal from '../modals/ImageViewerModal';

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onRepost: (postId: string, type?: 'normal' | 'quote', quoteText?: string) => void;
  onComment: (postId: string) => void;
  onVote?: (postId: string, optionIndex: number) => void;
  onDelete?: (postId: string) => void;
  hasUserReposted?: (postId: string) => boolean;
  currentUserHandle?: string;
  allPosts?: Post[]; // All posts array to look up original post by ID
  isDetailPage?: boolean; // If true, disable click navigation and hover effects
  repostedBy?: { displayName: string; handle: string } | null; // Who reposted this (for original posts)
}

export default function PostCard({
  post,
  onLike,
  onRepost,
  onComment,
  onVote,
  onDelete,
  hasUserReposted,
  currentUserHandle,
  allPosts = [],
  isDetailPage = false,
  repostedBy = null,
}: PostCardProps) {
  const router = useRouter();
  
  // Helper function to get original post by ID
  const getOriginalPost = (): Post | undefined => {
    if (isTweet(post) && post.repostType && post.originalPostId) {
      return allPosts.find(p => p.id === post.originalPostId);
    }
    return undefined;
  };
  
  // Get original post for reposts
  const originalPost = getOriginalPost();
  
  // Navigate to user profile
  const handleProfileClick = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    router.push(`/${handle}`);
  };
  
  // Navigate to quoted post detail page
  const handleQuotedPostClick = (e: React.MouseEvent, originalPost: Post) => {
    e.stopPropagation();
    router.push(`/${originalPost.author.handle}/posts/${originalPost.id}`);
  };
  
  // For normal reposts, check if original post is liked
  const getInitialLikedState = () => {
    if (isTweet(post) && post.repostType === 'normal' && originalPost) {
      return originalPost.userInteractions.liked;
    }
    return post.userInteractions.liked;
  };

  const [isLiked, setIsLiked] = useState(getInitialLikedState());
  const [showPostMenu, setShowPostMenu] = useState(false);
  const postMenuRef = useRef<HTMLDivElement>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);
  
  // Sync like state when post prop changes (e.g., after liking on homepage)
  useEffect(() => {
    if (isTweet(post) && post.repostType === 'normal' && originalPost) {
      setIsLiked(originalPost.userInteractions.liked);
    } else {
      setIsLiked(post.userInteractions.liked);
    }
  }, [post.userInteractions.liked, originalPost?.userInteractions.liked]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (postMenuRef.current && !postMenuRef.current.contains(event.target as Node)) {
        setShowPostMenu(false);
      }
    };

    if (showPostMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPostMenu]);
  
  // Check if current user has reposted this post (for button color persistence)
  // Note: Only normal reposts count, quote reposts are treated as new tweets
  const getPostIdToCheck = () => {
    if (isTweet(post) && post.repostType === 'normal' && post.originalPostId) {
      return post.originalPostId;
    }
    return post.id;
  };
  
  const postIdToCheck = getPostIdToCheck();
  // Check if this post has been normal reposted by the current user
  // For quote reposts, we check if the quote repost itself has been normal reposted
  // For normal reposts, we check if the original post has been normal reposted
  // For regular posts, we check if the post itself has been normal reposted
  const isReposted = hasUserReposted ? hasUserReposted(postIdToCheck) : false;

  const handleLike = () => {
    setIsLiked(!isLiked);
    // For normal reposts, like the original post, not the repost entry
    const postIdToLike = (isTweet(post) && post.repostType === 'normal' && originalPost)
      ? originalPost.id
      : post.id;
    onLike(postIdToLike);
  };

  const handleNormalRepost = () => {
    // For quote reposts, repost the quote repost itself (not the original it quotes)
    // For normal reposts, repost the original post
    // For regular posts, repost the post itself
    const postIdToRepost = (isTweet(post) && post.repostType === 'normal' && post.originalPostId)
      ? post.originalPostId  // Normal repost: repost the original
      : post.id;  // Quote repost or regular post: repost itself
    onRepost(postIdToRepost, 'normal');
  };

  const handleQuoteRepost = () => {
    // For quote reposts, quote repost the quote repost itself (not the original it quotes)
    // For normal reposts, quote repost the original post
    // For regular posts, quote repost the post itself
    const postIdToRepost = (isTweet(post) && post.repostType === 'normal' && post.originalPostId)
      ? post.originalPostId  // Normal repost: quote repost the original
      : post.id;  // Quote repost or regular post: quote repost itself
    onRepost(postIdToRepost, 'quote');
  };

  const handleImageClick = (urls: string[], index: number) => {
    setSelectedImageUrls(urls);
    setSelectedImageIndex(index);
  };

  const handleCloseImageViewer = () => {
    setSelectedImageIndex(null);
    setSelectedImageUrls([]);
  };

  const handlePreviousImage = () => {
    setSelectedImageIndex((prev) => 
      prev !== null ? (prev > 0 ? prev - 1 : selectedImageUrls.length - 1) : null
    );
  };

  const handleNextImage = () => {
    setSelectedImageIndex((prev) => 
      prev !== null ? (prev < selectedImageUrls.length - 1 ? prev + 1 : 0) : null
    );
  };

  const handleCommentClick = () => {
    // For normal reposts, navigate to original post's comment page
    if (isTweet(post) && post.repostType === 'normal' && originalPost) {
      const username = originalPost.author.handle;
      window.location.href = `/${username}/posts/${originalPost.id}`;
    } else {
      const username = post.author.handle;
      window.location.href = `/${username}/posts/${post.id}`;
    }
  };

  // Render content based on post type
  const renderContent = () => {
    if (isTweet(post)) {
      return (
        <>
          {/* Quote Repost */}
          {post.repostType === 'quote' && originalPost ? (
            <>
              {/* User's quote comment */}
              <p className="text-white text-[15px] leading-relaxed mb-3 whitespace-pre-wrap break-words">
                {parseCashtags(post.content)}
              </p>
              
              {/* Original Tweet Card */}
              {originalPost && (
                <div 
                  className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={(e) => handleQuotedPostClick(e, originalPost)}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Image
                      src={originalPost.author.avatar}
                      alt={originalPost.author.displayName}
                      width={20}
                      height={20}
                      className="w-5 h-5 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick(e, originalPost.author.handle);
                      }}
                    />
                    <span 
                      className="font-semibold text-white text-sm cursor-pointer hover:underline"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick(e, originalPost.author.handle);
                      }}
                    >
                      {originalPost.author.displayName}
                    </span>
                    <span className="text-xs text-gray-400">@{originalPost.author.handle}</span>
                    {originalPost.author.badge && (
                      <span className="px-1 py-0.5 text-[9px] font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                        {originalPost.author.badge}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">· {originalPost.createdAt}</span>
                  </div>
                  {/* Render original post content */}
                  {originalPost && isTweet(originalPost) && (
                    <>
                      <p className="text-white text-sm leading-relaxed mb-2 whitespace-pre-wrap break-words">
                        {parseCashtags(originalPost.content)}
                      </p>
                      <PostMedia
                        media={originalPost.media || []}
                        onImageClick={handleImageClick}
                        className="mt-2"
                      />
                      {originalPost.gifUrl && (
                        <div className="mt-2 rounded-lg overflow-hidden">
                          <img
                            src={originalPost.gifUrl}
                            alt="GIF"
                            className="w-full rounded-lg"
                            loading="lazy"
                          />
                        </div>
                      )}
                      {originalPost.poll && (
                        <PollComponent
                          poll={originalPost.poll}
                          postId={originalPost.id}
                          onVote={onVote}
                        />
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              {/* Normal Tweet or Normal Repost Content */}
              {post.repostType === 'normal' && originalPost && isTweet(originalPost) ? (
                // Normal repost - show original post content
                <>
                  <p className="text-white text-[15px] leading-relaxed mb-3 whitespace-pre-wrap break-words">
                    {parseCashtags(originalPost.content)}
                  </p>
                  
                  <PostMedia
                    media={originalPost.media || []}
                    onImageClick={handleImageClick}
                    className="mb-3"
                  />
                  
                  {originalPost.gifUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden">
                      <img
                        src={originalPost.gifUrl}
                        alt="GIF"
                        className="w-full rounded-xl"
                        loading="lazy"
                      />
                    </div>
                  )}
                  
                  {originalPost.poll && (
                    <PollComponent
                      poll={originalPost.poll}
                      postId={originalPost.id}
                      onVote={onVote}
                    />
                  )}
                </>
              ) : (
                // Normal tweet - show regular content
                <>
                  <p className="text-white text-[15px] leading-relaxed mb-3 whitespace-pre-wrap break-words">
                    {parseCashtags(post.content)}
                  </p>

                  <PostMedia
                    media={post.media || []}
                    onImageClick={handleImageClick}
                    className="mb-3"
                  />

                  {post.gifUrl && (
                    <div className="mb-3 rounded-xl overflow-hidden">
                      <img
                        src={post.gifUrl}
                        alt="GIF"
                        className="w-full rounded-xl"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {post.poll && (
                    <PollComponent
                      poll={post.poll}
                      postId={post.id}
                      onVote={onVote}
                    />
                  )}
                </>
              )}
            </>
          )}
        </>
      );
    }
    return null;
  };

  const handlePostClick = (e: React.MouseEvent) => {
    if (isDetailPage) return;
    
    const target = e.target as HTMLElement;
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('svg') ||
      target.closest('img')
    ) {
      return;
    }
    const username = post.author.handle;
    window.location.href = `/${username}/posts/${post.id}`;
  };

  return (
    <>
      <article 
        className={`py-3 ${isDetailPage ? '' : 'px-4 hover:bg-white/5 transition-colors cursor-pointer'}`}
        onClick={handlePostClick}
      >
        <div className="flex items-start space-x-3">
          <Image
            src={post.author.avatar}
            alt={post.author.displayName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              const authorHandle = (isTweet(post) && post.repostType === 'normal' && originalPost) 
                ? originalPost.author.handle 
                : post.author.handle;
              handleProfileClick(e, authorHandle);
            }}
          />
          <div className="flex-1 min-w-0">
            <PostHeader
              post={post}
              originalPost={originalPost}
              currentUserHandle={currentUserHandle}
              showMenu={showPostMenu}
              menuRef={postMenuRef}
              onMenuToggle={() => setShowPostMenu(!showPostMenu)}
              onMenuClose={() => setShowPostMenu(false)}
              repostedBy={repostedBy}
              onDelete={onDelete}
              onProfileClick={handleProfileClick}
            />

            {/* Content */}
            {renderContent()}

            {/* Action Icons */}
            <PostActions
              post={post}
              originalPost={originalPost}
              isLiked={isLiked}
              isReposted={isReposted}
              onLike={handleLike}
              onComment={handleCommentClick}
              onNormalRepost={handleNormalRepost}
              onQuoteRepost={handleQuoteRepost}
              canUndoRepost={isReposted}
            />
          </div>
        </div>
      </article>
      
      {/* Image Viewer Modal */}
      {selectedImageIndex !== null && selectedImageUrls.length > 0 && (
        <ImageViewerModal
          imageUrls={selectedImageUrls}
          selectedIndex={selectedImageIndex}
          onClose={handleCloseImageViewer}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
        />
      )}
    </>
  );
}
