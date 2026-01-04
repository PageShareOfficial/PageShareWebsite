'use client';

import Image from 'next/image';
import { MoreHorizontal, Repeat2 } from 'lucide-react';
import { Post } from '@/types';
import { isTweet } from '@/data/mockData';
import PostMenu from './PostMenu';

interface PostHeaderProps {
  post: Post;
  originalPost?: Post;
  currentUserHandle?: string;
  showMenu: boolean;
  menuRef: React.RefObject<HTMLDivElement>;
  onMenuToggle: () => void;
  onMenuClose: () => void;
  repostedBy?: { displayName: string; handle: string } | null; // Who reposted this (for original posts)
  onDelete?: (postId: string) => void;
  onProfileClick?: (e: React.MouseEvent, handle: string) => void;
}

export default function PostHeader({
  post,
  originalPost,
  currentUserHandle,
  showMenu,
  menuRef,
  onMenuToggle,
  onMenuClose,
  repostedBy,
  onDelete,
  onProfileClick,
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
            // For normal reposts, show original author's info
            <>
              <span 
                className="font-semibold text-white cursor-pointer hover:underline"
                onClick={(e) => onProfileClick && onProfileClick(e, originalPost.author.handle)}
              >
                {originalPost.author.displayName}
              </span>
              <span className="text-sm text-gray-400">@{originalPost.author.handle}</span>
              {originalPost.author.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                  {originalPost.author.badge}
                </span>
              )}
            </>
          ) : (
            // For normal posts or quote reposts, show current author's info
            <>
              <span 
                className="font-semibold text-white cursor-pointer hover:underline"
                onClick={(e) => onProfileClick && onProfileClick(e, post.author.handle)}
              >
                {post.author.displayName}
              </span>
              <span className="text-sm text-gray-400">@{post.author.handle}</span>
              {post.author.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-400 rounded border border-blue-500/30">
                  {post.author.badge}
                </span>
              )}
            </>
          )}
          <span className="text-sm text-gray-500">· {post.createdAt}</span>
        </div>
        
        {/* 3-dot Menu Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMenuToggle();
            }}
            className="p-1.5 hover:bg-cyan-400/10 rounded-full transition-colors text-gray-400 hover:text-cyan-400"
            aria-label="More options"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {/* Dropdown Menu */}
          {showMenu && (
            <PostMenu
              post={post}
              currentUserHandle={currentUserHandle}
              onClose={onMenuClose}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
    </>
  );
}

