'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Post, Comment } from '@/types';
import { parseCashtags } from '@/utils/textFormatting';
import PostHeader from '@/components/app/post/PostHeader';
import PostMedia from '@/components/app/post/PostMedia';
import PostActions from '@/components/app/post/PostActions';
import PollComponent from '@/components/app/post/PollComponent';
import { isTweet } from '@/data/mockData';

interface ReplyCardProps {
  originalPost: Post;
  reply: Comment;
  onCommentLike?: (commentId: string) => void;
  currentUserHandle?: string;
  allPosts?: Post[];
  onLike?: (postId: string) => void;
  onRepost?: (postId: string, type?: 'normal' | 'quote') => void;
  onComment?: (postId: string) => void;
  onVote?: (postId: string, optionIndex: number) => void;
  hasUserReposted?: (postId: string) => boolean;
}

export default function ReplyCard({
  originalPost,
  reply,
  onCommentLike,
  currentUserHandle,
  allPosts = [],
  onLike,
  onRepost,
  onComment,
  onVote,
  hasUserReposted,
}: ReplyCardProps) {
  const router = useRouter();

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
              <Image
                src={originalPost.author.avatar}
                alt={originalPost.author.displayName}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full cursor-pointer hover:opacity-80 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/${originalPost.author.handle}`);
                }}
              />
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
                showMenu={false}
                menuRef={{ current: null }}
                onMenuToggle={() => {}}
                onMenuClose={() => {}}
                onProfileClick={(e, handle) => {
                  e.stopPropagation();
                  router.push(`/${handle}`);
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
                        <Image
                          src={quotedPost.author.avatar}
                          alt={quotedPost.author.displayName}
                          width={20}
                          height={20}
                          className="w-5 h-5 rounded-full"
                        />
                        <span className="font-semibold text-white text-sm">{quotedPost.author.displayName}</span>
                        <span className="text-xs text-gray-400">@{quotedPost.author.handle}</span>
                        {quotedPost.author.badge && (
                          <span className="px-1 py-0.5 text-[9px] font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                            {quotedPost.author.badge}
                          </span>
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
          <Image
            src={reply.author.avatar}
            alt={reply.author.displayName}
            width={40}
            height={40}
            className="w-10 h-10 rounded-full flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/${reply.author.handle}`);
            }}
          />
          
          {/* Reply content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-white text-sm">
                {reply.author.displayName}
              </span>
              <span className="text-gray-400 text-sm">@{reply.author.handle}</span>
              {reply.author.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                  {reply.author.badge}
                </span>
              )}
              <span className="text-gray-500 text-sm">·</span>
              <span className="text-gray-400 text-sm">{reply.createdAt}</span>
            </div>
            <p className="text-white text-[15px] leading-relaxed whitespace-pre-wrap break-words mb-3">
              {parseCashtags(reply.content)}
            </p>
            
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
    </div>
  );
}

