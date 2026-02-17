'use client';

import { useRouter } from 'next/navigation';
import { Post } from '@/types';
import { useState, useEffect } from 'react';
import { isTweet } from '@/utils/content/postUtils';
import { parseCashtags } from '@/utils/core/textFormatting';
import { navigateToProfile } from '@/utils/core/navigationUtils';
import PostHeader from './PostHeader';
import PostActions from './PostActions';
import PostMedia from './PostMedia';
import PollComponent from './PollComponent';
import ImageViewerModal from '../modals/ImageViewerModal';
import UserBadge from '../common/UserBadge';
import AvatarWithFallback from '../common/AvatarWithFallback';

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
  onReportClick?: (contentType: 'post' | 'comment', contentId: string, userHandle: string, userDisplayName: string, postId?: string) => void;
  /** When true, hide actions and menu (e.g. for unauthenticated viewers of shared post link) */
  readOnly?: boolean;
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
  onReportClick,
  readOnly = false,
}: PostCardProps) {
  const router = useRouter();
  
  // Helper function to get original post by ID (use embedded quotedPost from API when present, else find in allPosts)
  const getOriginalPost = (): Post | undefined => {
    if (isTweet(post) && post.repostType && post.originalPostId) {
      if (post.quotedPost) return post.quotedPost;
      return allPosts.find(p => p.id === post.originalPostId);
    }
    return undefined;
  };
  
  // Get original post for reposts
  const originalPost = getOriginalPost();
  
  // Navigate to user profile
  const handleProfileClick = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    navigateToProfile(handle, router);
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

  
  // Check if current user has reposted this post (for button color persistence)
  // Use API reposted flag first (survives refresh); fallback to hasUserReposted (wrapper in list) or "this card is my repost"
  const getPostIdToCheck = () => {
    if (isTweet(post) && post.repostType === 'normal' && post.originalPostId) {
      return post.originalPostId;
    }
    return post.id;
  };

  const postIdToCheck = getPostIdToCheck();
  const isReposted =
    Boolean(post.userInteractions?.reposted) ||
    (hasUserReposted ? hasUserReposted(postIdToCheck) : false) ||
    Boolean(
      currentUserHandle &&
        isTweet(post) &&
        post.repostType === 'normal' &&
        post.author.handle === currentUserHandle
    );

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
      router.push(`/${username}/posts/${originalPost.id}`);
    } else {
      const username = post.author.handle;
      router.push(`/${username}/posts/${post.id}`);
    }
  };

  // Render content based on post type
  const renderContent = () => {
    if (isTweet(post)) {
      return (
        <>
          {/* Quote repost: show when repostType is 'quote' OR we have originalPostId (profile list from API) */}
          {(post.repostType === 'quote' || (post.originalPostId && post.repostType !== 'normal')) ? (
            <>
              {/* User's quote comment – always show (text, media, gif from the quote post) */}
              <p className="text-white text-[15px] leading-relaxed mb-3 whitespace-pre-wrap break-words">
                {parseCashtags(typeof post.content === 'string' ? post.content : '')}
              </p>
              {post.media && post.media.length > 0 && (
                <PostMedia
                  media={post.media}
                  onImageClick={handleImageClick}
                  className="mb-3"
                />
              )}
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
              {/* Original Tweet Card (when we have the original in allPosts) */}
              {originalPost ? (
                <div 
                  className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={(e) => handleQuotedPostClick(e, originalPost)}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <div
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProfileClick(e, originalPost.author.handle);
                      }}
                    >
                      <AvatarWithFallback
                        src={originalPost.author.avatar}
                        alt={originalPost.author.displayName}
                        size={20}
                        className="w-5 h-5"
                      />
                    </div>
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
                      <UserBadge badge={originalPost.author.badge} size="sm" />
                    )}
                    <span className="text-xs text-gray-500">· {originalPost.createdAt}</span>
                  </div>
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
              ) : post.originalPostId ? (
                <p className="text-sm text-gray-500 italic">Quoted post</p>
              ) : null}
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
    router.push(`/${username}/posts/${post.id}`);
  };

  return (
    <>
      <article 
        className={`py-3 ${isDetailPage ? '' : 'px-4 hover:bg-white/5 transition-colors cursor-pointer'}`}
        onClick={handlePostClick}
      >
        <div className="flex items-start space-x-3">
          <div
            className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              const authorHandle = (isTweet(post) && post.repostType === 'normal' && originalPost) 
                ? originalPost.author.handle 
                : post.author.handle;
              handleProfileClick(e, authorHandle);
            }}
          >
            <AvatarWithFallback
              src={post.author.avatar}
              alt={post.author.displayName}
              size={40}
            />
          </div>
          <div className="flex-1 min-w-0">
            <PostHeader
              post={post}
              originalPost={originalPost}
              currentUserHandle={currentUserHandle}
              repostedBy={repostedBy}
              onDelete={onDelete}
              onProfileClick={handleProfileClick}
              onReportClick={onReportClick}
              readOnly={readOnly}
            />

            {/* Content */}
            {renderContent()}

            {/* Action Icons - hidden when readOnly */}
            {!readOnly && (
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
            )}
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
