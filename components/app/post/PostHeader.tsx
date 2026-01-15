'use client';

import { Repeat2 } from 'lucide-react';
import { Post } from '@/types';
import { isTweet } from '@/data/mockData';
import ContentMenu from '@/components/app/common/ContentMenu';
import UserBadge from '@/components/app/common/UserBadge';

interface PostHeaderProps {
  post: Post;
  originalPost?: Post;
  currentUserHandle?: string;
  repostedBy?: { displayName: string; handle: string } | null; // Who reposted this (for original posts)
  onDelete?: (postId: string) => void;
  onProfileClick?: (e: React.MouseEvent, handle: string) => void;
  onReportClick?: (contentType: 'post' | 'comment', contentId: string, userHandle: string, userDisplayName: string, postId?: string) => void;
}

export default function PostHeader({
  post,
  originalPost,
  currentUserHandle,
  repostedBy,
  onDelete,
  onProfileClick,
  onReportClick,
}: PostHeaderProps) {
  return (
    <>
      {/* Repost indicator - For normal reposts (when viewing your own repost) */}
      {isTweet(post) && post.repostType === 'normal' && originalPost && (
        <div className="flex items-center space-x-1 mb-1 text-gray-500 text-xs">
          <Repeat2 className="w-3 h-3" />
          <span>
            {currentUserHandle && post.author.handle === currentUserHandle 
              ? 'You reposted' 
              : `${post.author.displayName} reposted`}
          </span>
        </div>
      )}
      
      {/* Repost indicator - For original posts that were reposted by others */}
      {!post.repostType && repostedBy && (
        <div className="flex items-center space-x-1 mb-1 text-gray-500 text-xs">
          <Repeat2 className="w-3 h-3" />
          <span>{repostedBy.displayName} reposted</span>
        </div>
      )}
      
        <div className="flex items-center justify-between mb-1 w-full">
        <div className="flex items-center space-x-2">
          {isTweet(post) && post.repostType === 'normal' && originalPost ? (
            <>
              <span 
                className="font-semibold text-white cursor-pointer hover:underline"
                onClick={(e) => onProfileClick && onProfileClick(e, originalPost.author.handle)}
              >
                {originalPost.author.displayName}
              </span>
              <span className="text-sm text-gray-400">@{originalPost.author.handle}</span>
              {originalPost.author.badge && (
                <UserBadge badge={originalPost.author.badge} size="md" />
              )}
            </>
          ) : (
            <>
              <span 
                className="font-semibold text-white cursor-pointer hover:underline"
                onClick={(e) => onProfileClick && onProfileClick(e, post.author.handle)}
              >
                {post.author.displayName}
              </span>
              <span className="text-sm text-gray-400">@{post.author.handle}</span>
              {post.author.badge && (
                <UserBadge badge={post.author.badge} size="md" />
              )}
            </>
          )}
          <span className="text-sm text-gray-500">· {post.createdAt}</span>
        </div>
        
        {/* 3-dot Menu Button */}
        <ContentMenu
          type="post"
          authorHandle={post.author.handle}
          authorDisplayName={post.author.displayName}
          currentUserHandle={currentUserHandle}
          linkUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/${post.author.handle}/posts/${post.id}`}
          contentId={post.id}
          onDelete={onDelete ? () => onDelete(post.id) : undefined}
          onReportClick={onReportClick}
        />
      </div>
    </>
  );
}

