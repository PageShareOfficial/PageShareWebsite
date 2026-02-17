'use client';

import { useState, useRef } from 'react';
import { MoreHorizontal, Trash2, Bookmark, Link2 } from 'lucide-react';
import { useBookmarks } from '@/contexts/BookmarkContext';
import { useContentFiltersContext } from '@/contexts/ContentFiltersContext';
import { useClickOutside } from '@/hooks/common/useClickOutside';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import { copyToClipboard } from '@/utils/core/clipboardUtils';

interface ContentMenuProps {
  type: 'post' | 'comment';
  authorId: string;
  authorHandle: string;
  authorDisplayName?: string;
  currentUserHandle?: string;
  linkUrl: string;
  contentId: string; // postId or commentId
  postId?: string; // For comments, the ID of the post the comment belongs to
  onDelete?: () => void;
  onReportClick?: (contentType: 'post' | 'comment', contentId: string, userHandle: string, userDisplayName: string, postId?: string) => void;
  className?: string;
}

export default function ContentMenu({
  type,
  authorId,
  authorHandle,
  authorDisplayName,
  currentUserHandle,
  linkUrl,
  contentId,
  postId,
  onDelete,
  onReportClick,
  className = '',
}: ContentMenuProps) {
  const { isBookmarked, addBookmark, removeBookmark } = useBookmarks();
  const {
    isMutedById,
    isBlockedById,
    mute,
    unmute,
    block,
    unblock,
  } = useContentFiltersContext();
  const isOnline = useOnlineStatus();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isBookmarkedValue = type === 'post' && currentUserHandle ? isBookmarked(contentId) : false;
  const isMutedValue = isMutedById(authorId);
  const isBlockedValue = isBlockedById(authorId);

  // Close menu when clicking outside
  useClickOutside({
    ref: menuRef,
    handler: () => setIsOpen(false),
    enabled: isOpen,
  });

  const handleCopyLink = async () => {
    await copyToClipboard(linkUrl);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (!isOnline) return;
    if (onDelete) {
      onDelete();
    }
    setIsOpen(false);
  };

  const handleBookmark = async () => {
    if (!currentUserHandle || type !== 'post' || !isOnline) return;
    setIsOpen(false);
    if (isBookmarkedValue) {
      await removeBookmark(contentId);
    } else {
      await addBookmark(contentId);
    }
  };

  const handleMute = async () => {
    if (!currentUserHandle || !isOnline) return;
    await mute({
      id: authorId,
      username: authorHandle,
      displayName: authorDisplayName ?? authorHandle,
    });
    setIsOpen(false);
  };

  const handleUnmute = async () => {
    if (!currentUserHandle || !isOnline) return;
    await unmute(authorId);
    setIsOpen(false);
  };

  const handleBlock = async () => {
    if (!currentUserHandle || !isOnline) return;
    await block({
      id: authorId,
      username: authorHandle,
      displayName: authorDisplayName ?? authorHandle,
    });
    setIsOpen(false);
  };

  const handleUnblock = async () => {
    if (!currentUserHandle || !isOnline) return;
    await unblock(authorId);
    setIsOpen(false);
  };

  const handleReport = () => {
    if (!isOnline) return;
    if (onReportClick && authorDisplayName) {
      onReportClick(type, contentId, authorHandle, authorDisplayName, postId);
    }
    setIsOpen(false);
  };

  const isOwner = currentUserHandle && authorHandle === currentUserHandle;

  return (
    <div className={`relative ${className}`} ref={menuRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-1.5 hover:bg-cyan-400/10 rounded-full transition-colors text-gray-400 hover:text-cyan-400"
        aria-label="More options"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 bg-black border border-white/10 rounded-xl shadow-lg overflow-hidden z-50 min-w-[200px]">
          {/* Copy Link - Always shown (works offline) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm"
          >
            <Link2 className="w-4 h-4" />
            <span>Copy link</span>
          </button>

          {/* Bookmark - Only for posts */}
          {type === 'post' && currentUserHandle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark();
              }}
              disabled={!isOnline}
              title={!isOnline ? 'Connect to the internet to continue' : undefined}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarkedValue ? 'fill-current' : ''}`} />
              <span>{isBookmarkedValue ? 'Remove bookmark' : 'Bookmark'}</span>
            </button>
          )}

          {/* Delete - Only for owner */}
          {isOwner && onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              disabled={!isOnline}
              title={!isOnline ? 'Connect to the internet to continue' : undefined}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 text-sm border-t border-white/10 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          )}

          {/* Mute, Block, Report - Only for non-owner */}
          {!isOwner && currentUserHandle && (
            <>
              {isMutedValue ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnmute();
                  }}
                  disabled={!isOnline}
                  title={!isOnline ? 'Connect to the internet to continue' : undefined}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                >
                  <span>Unmute @{authorHandle}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMute();
                  }}
                  disabled={!isOnline}
                  title={!isOnline ? 'Connect to the internet to continue' : undefined}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                >
                  <span>Mute @{authorHandle}</span>
                </button>
              )}
              {isBlockedValue ? (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnblock();
                  }}
                  disabled={!isOnline}
                  title={!isOnline ? 'Connect to the internet to continue' : undefined}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                >
                  <span>Unblock @{authorHandle}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBlock();
                  }}
                  disabled={!isOnline}
                  title={!isOnline ? 'Connect to the internet to continue' : undefined}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                >
                  <span>Block @{authorHandle}</span>
                </button>
              )}
              {onReportClick && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReport();
                  }}
                  disabled={!isOnline}
                  title={!isOnline ? 'Connect to the internet to continue' : undefined}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 text-sm border-t border-white/10 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed"
                >
                  <span>Report {type}</span>
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

