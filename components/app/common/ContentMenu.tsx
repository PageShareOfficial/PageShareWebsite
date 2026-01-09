'use client';

import { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Share2, Trash2, Bookmark } from 'lucide-react';
import { toggleBookmark, isBookmarked } from '@/utils/bookmarkUtils';
import { muteUser, unmuteUser, isMuted } from '@/utils/muteUtils';
import { blockUser, unblockUser, isBlocked } from '@/utils/blockUtils';

interface ContentMenuProps {
  type: 'post' | 'comment';
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
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Check state using utilities
  const checkIsBookmarked = () => {
    if (!currentUserHandle || type !== 'post') return false;
    return isBookmarked(contentId, currentUserHandle);
  };

  const checkIsMuted = () => {
    if (!currentUserHandle) return false;
    return isMuted(currentUserHandle, authorHandle);
  };

  const checkIsBlocked = () => {
    if (!currentUserHandle) return false;
    return isBlocked(currentUserHandle, authorHandle);
  };

  const isBookmarkedValue = checkIsBookmarked();
  const isMutedValue = checkIsMuted();
  const isBlockedValue = checkIsBlocked();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(linkUrl);
    setIsOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
    setIsOpen(false);
  };

  const handleBookmark = () => {
    if (!currentUserHandle || type !== 'post') return;
    toggleBookmark(contentId, currentUserHandle);
    setIsOpen(false);
  };

  const handleMute = () => {
    if (!currentUserHandle) return;
    muteUser(currentUserHandle, authorHandle);
    setIsOpen(false);
  };

  const handleUnmute = () => {
    if (!currentUserHandle) return;
    unmuteUser(currentUserHandle, authorHandle);
    setIsOpen(false);
  };

  const handleBlock = () => {
    if (!currentUserHandle) return;
    blockUser(currentUserHandle, authorHandle);
    setIsOpen(false);
  };

  const handleUnblock = () => {
    if (!currentUserHandle) return;
    unblockUser(currentUserHandle, authorHandle);
    setIsOpen(false);
  };

  const handleReport = () => {
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
          {/* Copy Link - Always shown */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleCopyLink();
            }}
            className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm"
          >
            <Share2 className="w-4 h-4" />
            <span>Copy link</span>
          </button>

          {/* Bookmark - Only for posts */}
          {type === 'post' && currentUserHandle && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleBookmark();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
            >
              <Bookmark className={`w-4 h-4 ${isBookmarkedValue ? 'fill-current' : ''}`} />
              <span>{isBookmarkedValue ? 'Remove bookmark' : 'Bookmark'}</span>
            </button>
          )}

          {/* Delete - Only for owner */}
          {isOwner && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 text-sm border-t border-white/10"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnmute();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
                >
                  <span>Unmute @{authorHandle}</span>
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMute();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
                >
                  <span>Mute @{authorHandle}</span>
                </button>
              )}
              {isBlockedValue ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUnblock();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
                >
                  <span>Unblock @{authorHandle}</span>
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBlock();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-white text-sm border-t border-white/10"
                >
                  <span>Block @{authorHandle}</span>
                </button>
              )}
              {onReportClick && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReport();
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left text-red-400 text-sm border-t border-white/10"
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

