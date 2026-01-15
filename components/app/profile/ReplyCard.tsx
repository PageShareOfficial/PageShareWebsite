'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import { Post, Comment } from '@/types';
import { parseCashtags } from '@/utils/core/textFormatting';
import { navigateToProfile } from '@/utils/core/navigationUtils';
import PostHeader from '@/components/app/post/PostHeader';
import PostMedia from '@/components/app/post/PostMedia';
import PostActions from '@/components/app/post/PostActions';
import PollComponent from '@/components/app/post/PollComponent';
import ImageViewerModal from '@/components/app/modals/ImageViewerModal';
import ContentMenu from '@/components/app/common/ContentMenu';
import UserBadge from '@/components/app/common/UserBadge';
import { isTweet } from '@/data/mockData';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';

interface ReplyCardProps {
  originalPost: Post;
  reply: Comment;
  onCommentLike?: (commentId: string) => void;
  onCommentPollVote?: (commentId: string, optionIndex: number) => void;
  onCommentDelete?: (commentId: string, postId: string) => void;
  currentUserHandle?: string;
  allPosts?: Post[];
  onLike?: (postId: string) => void;
  onRepost?: (postId: string, type?: 'normal' | 'quote') => void;
  onComment?: (postId: string) => void;
  onVote?: (postId: string, optionIndex: number) => void;
  hasUserReposted?: (postId: string) => boolean;
  onReportClick?: (contentType: 'post' | 'comment', contentId: string, userHandle: string, userDisplayName: string) => void;
}

export default function ReplyCard({
  originalPost,
  reply,
  onCommentLike,
  onCommentPollVote,
  onCommentDelete,
  currentUserHandle,
  allPosts = [],
  onLike,
  onRepost,
  onComment,
  onVote,
  hasUserReposted,
  onReportClick,
}: ReplyCardProps) {
  const router = useRouter();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [selectedImageUrls, setSelectedImageUrls] = useState<string[]>([]);


  const handleClick = () => {
    const username = originalPost.author.handle;
    router.push(`/${username}/posts/${originalPost.id}`);
  };

  const handleCommentLikeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onCommentLike) {
      onCommentLike(reply.id);
    }
  };

  // Get original post for reposts
  const getOriginalPost = (): Post | undefined => {
    if (isTweet(originalPost) && originalPost.repostType && originalPost.originalPostId) {
      return allPosts.find(p => p.id === originalPost.originalPostId);
    }
    return undefined;
  };

  const quotedPost = getOriginalPost();

  return (
    <div className="border-b border-white/10 px-4 relative">
      {/* Connecting line - spans from original avatar to reply avatar */}
      <div 
        className="absolute left-[30px] top-[52px] bottom-[120px] w-0.5 bg-white/20 z-0"
      ></div>
      
      {/* Original Post - separate article */}
      <article
        onClick={handleClick}
        className="hover:bg-white/5 transition-colors cursor-pointer relative z-10"
      >
        <div className="flex items-start space-x-3">
          {/* Left column - Original post avatar */}
          <div className="flex flex-col items-center flex-shrink-0 w-10">
            {/* Original post avatar */}
            <div className="pt-3 flex-shrink-0">
              <div
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToProfile(originalPost.author.handle, router);
                }}
              >
                <AvatarWithFallback
                  src={originalPost.author.avatar}
                  alt={originalPost.author.displayName}
                  size={40}
                />
              </div>
            </div>
          </div>

          {/* Right column - Content */}
          <div className="flex-1 min-w-0">
            {/* Original Post Content */}
            <div className="pt-3 pb-2">
            <div className="flex-1 min-w-0">
              <PostHeader
                post={originalPost}
                originalPost={quotedPost}
                currentUserHandle={currentUserHandle}
                onProfileClick={(e, handle) => {
                  e.stopPropagation();
                  navigateToProfile(handle, router);
                }}
              />

                {/* Original Post Content */}
                {isTweet(originalPost) && (
                  <div className="mt-2">
                {originalPost.repostType === 'quote' && quotedPost ? (
                  <>
                    <p className="text-white text-[15px] leading-relaxed mb-3 whitespace-pre-wrap break-words">
                      {parseCashtags(originalPost.content)}
                    </p>
                    {/* Quoted post card */}
                    <div className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="flex items-center space-x-2 mb-2">
                        <AvatarWithFallback
                          src={quotedPost.author.avatar}
                          alt={quotedPost.author.displayName}
                          size={20}
                          className="w-5 h-5"
                        />
                        <span className="font-semibold text-white text-sm">{quotedPost.author.displayName}</span>
                        <span className="text-xs text-gray-400">@{quotedPost.author.handle}</span>
                        {quotedPost.author.badge && (
                          <UserBadge badge={quotedPost.author.badge} size="sm" />
                        )}
                        <span className="text-xs text-gray-500">· {quotedPost.createdAt}</span>
                      </div>
                      {isTweet(quotedPost) && (
                        <>
                          <p className="text-white text-sm leading-relaxed mb-2 whitespace-pre-wrap break-words">
                            {parseCashtags(quotedPost.content)}
                          </p>
                          <PostMedia
                            media={quotedPost.media || []}
                            onImageClick={() => {}}
                            className="mt-2"
                          />
                          {quotedPost.gifUrl && (
                            <div className="mt-2 rounded-lg overflow-hidden">
                              <img
                                src={quotedPost.gifUrl}
                                alt="GIF"
                                className="w-full rounded-lg"
                                loading="lazy"
                              />
                            </div>
                          )}
                          {quotedPost.poll && (
                            <PollComponent
                              poll={quotedPost.poll}
                              postId={quotedPost.id}
                              onVote={() => {}}
                            />
                          )}
                        </>
                      )}
                    </div>
                  </>
                ) : originalPost.repostType === 'normal' && quotedPost ? (
                  <>
                    <p className="text-white text-[15px] leading-relaxed mb-3 whitespace-pre-wrap break-words">
                      {parseCashtags(quotedPost.content)}
                    </p>
                    <PostMedia
                      media={quotedPost.media || []}
                      onImageClick={() => {}}
                      className="mb-3"
                    />
                    {quotedPost.gifUrl && (
                      <div className="mb-3 rounded-xl overflow-hidden">
                        <img
                          src={quotedPost.gifUrl}
                          alt="GIF"
                          className="w-full rounded-xl"
                          loading="lazy"
                        />
                      </div>
                    )}
                    {quotedPost.poll && (
                      <PollComponent
                        poll={quotedPost.poll}
                        postId={quotedPost.id}
                        onVote={() => {}}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-white text-[15px] leading-relaxed mb-3 whitespace-pre-wrap break-words">
                      {parseCashtags(originalPost.content)}
                    </p>
                    <PostMedia
                      media={originalPost.media || []}
                      onImageClick={() => {}}
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
                        onVote={() => {}}
                      />
                    )}
                  </>
                )}
              </div>
            )}

                {/* Original Post Engagement Stats */}
                {isTweet(originalPost) && (
                  <PostActions
                    post={originalPost}
                    originalPost={quotedPost}
                    isLiked={originalPost.userInteractions.liked}
                    isReposted={hasUserReposted ? hasUserReposted(originalPost.id) : false}
                    onLike={() => {
                      if (onLike) {
                        const postIdToLike = (originalPost.repostType === 'normal' && quotedPost)
                          ? quotedPost.id
                          : originalPost.id;
                        onLike(postIdToLike);
                      }
                    }}
                    onComment={() => {
                      if (onComment) {
                        onComment(originalPost.id);
                      }
                    }}
                    onNormalRepost={() => {
                      if (onRepost) {
                        const postIdToRepost = (originalPost.repostType === 'normal' && originalPost.originalPostId)
                          ? originalPost.originalPostId
                          : originalPost.id;
                        onRepost(postIdToRepost, 'normal');
                      }
                    }}
                    onQuoteRepost={() => {
                      if (onRepost) {
                        const postIdToRepost = (originalPost.repostType === 'normal' && originalPost.originalPostId)
                          ? originalPost.originalPostId
                          : originalPost.id;
                        onRepost(postIdToRepost, 'quote');
                      }
                    }}
                    canUndoRepost={hasUserReposted ? hasUserReposted(originalPost.id) : false}
                  />
                )}
          </div>
        </div>
      </div>
        </div>
      </article>

      {/* Reply/Comment - separate article */}
      <article
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        className="hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-start space-x-3 py-3">
          {/* Reply avatar */}
          <div
            className="flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              navigateToProfile(reply.author.handle, router);
            }}
          >
            <AvatarWithFallback
              src={reply.author.avatar}
              alt={reply.author.displayName}
              size={40}
            />
          </div>
          
          {/* Reply content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white text-sm">
                  {reply.author.displayName}
                </span>
                <span className="text-gray-400 text-sm">@{reply.author.handle}</span>
                {reply.author.badge && (
                  <UserBadge badge={reply.author.badge} size="md" />
                )}
                <span className="text-gray-500 text-sm">·</span>
                <span className="text-gray-400 text-sm">{reply.createdAt}</span>
              </div>
              
              {/* 3-dot Menu Button for Reply */}
              <ContentMenu
                type="comment"
                authorHandle={reply.author.handle}
                authorDisplayName={reply.author.displayName}
                currentUserHandle={currentUserHandle}
                linkUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/${originalPost.author.handle}/posts/${originalPost.id}#comment-${reply.id}`}
                contentId={reply.id}
                postId={originalPost.id}
                onDelete={onCommentDelete && currentUserHandle === reply.author.handle ? () => onCommentDelete(reply.id, reply.postId) : undefined}
                onReportClick={onReportClick}
              />
            </div>
            {reply.content && (
              <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap break-words mb-2">
                {parseCashtags(reply.content)}
              </p>
            )}
            
            {/* Reply Media */}
            {reply.media && reply.media.length > 0 && (
              <div className="mb-3">
                <PostMedia
                  media={reply.media}
                  onImageClick={(urls, index) => {
                    setSelectedImageUrls(urls);
                    setSelectedImageIndex(index);
                  }}
                  className="rounded-xl"
                />
              </div>
            )}
            
            {/* Reply GIF */}
            {reply.gifUrl && (
              <div className="mb-3 rounded-xl overflow-hidden">
                <img
                  src={reply.gifUrl}
                  alt="GIF"
                  className="w-full rounded-xl"
                  loading="lazy"
                />
              </div>
            )}
            
            {/* Reply Poll */}
            {reply.poll && (
              <div className="mb-3">
                <PollComponent
                  poll={reply.poll}
                  postId={reply.id}
                  onVote={(commentId, optionIndex) => {
                    if (onCommentPollVote) {
                      onCommentPollVote(commentId, optionIndex);
                    }
                  }}
                />
              </div>
            )}
            
            {/* Comment Like Button */}
            {onCommentLike && (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleCommentLikeClick}
                  className={`p-1.5 rounded-full transition-colors flex items-center gap-1 ${
                    reply.userLiked
                      ? 'text-red-500 hover:text-red-400'
                      : 'text-gray-400 hover:text-red-500 hover:bg-red-500/10'
                  }`}
                  aria-label="Like comment"
                >
                  <Heart className={`w-4 h-4 ${reply.userLiked ? 'fill-current' : ''}`} />
                  {reply.likes > 0 && (
                    <span className={`text-xs ${reply.userLiked ? 'text-red-500' : 'text-gray-400'}`}>
                      {reply.likes}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </article>

      {/* Image Viewer Modal for Reply */}
      {selectedImageIndex !== null && selectedImageUrls.length > 0 && (
        <ImageViewerModal
          imageUrls={selectedImageUrls}
          selectedIndex={selectedImageIndex}
          onClose={() => {
            setSelectedImageIndex(null);
            setSelectedImageUrls([]);
          }}
          onPrevious={() => {
            setSelectedImageIndex((prev) => 
              prev !== null ? (prev > 0 ? prev - 1 : selectedImageUrls.length - 1) : null
            );
          }}
          onNext={() => {
            setSelectedImageIndex((prev) => 
              prev !== null ? (prev < selectedImageUrls.length - 1 ? prev + 1 : 0) : null
            );
          }}
        />
      )}
    </div>
  );
}

