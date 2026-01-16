'use client';

import { useState, useRef } from 'react';
import { Repeat2, PencilLine } from 'lucide-react';
import { useClickOutside } from '@/hooks/common/useClickOutside';

interface RepostButtonProps {
  isReposted: boolean;
  repostCount: number;
  onNormalRepost: () => void;
  onQuoteRepost: () => void;
  canUndoRepost?: boolean;
}

export default function RepostButton({
  isReposted,
  repostCount,
  onNormalRepost,
  onQuoteRepost,
  canUndoRepost = false,
}: RepostButtonProps) {
  // Debug logging removed for cleaner console
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useClickOutside({
    ref: menuRef,
    handler: () => setShowMenu(false),
    enabled: showMenu,
  });

  const handleNormalRepost = () => {
    setShowMenu(false);
    onNormalRepost();
  };

  const handleQuoteRepost = () => {
    setShowMenu(false);
    onQuoteRepost();
  };

  return (
    <div className="relative flex-1 flex items-center justify-center" ref={menuRef}>
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setShowMenu((prev) => !prev);
        }}
        className="flex items-center justify-center space-x-2 hover:text-green-400 transition-colors group w-full cursor-pointer"
        aria-label="Repost"
        title={canUndoRepost ? 'Undo repost' : isReposted ? 'Reposted' : 'Repost'}
        type="button"
        style={{ pointerEvents: 'auto', zIndex: 10 }}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isReposted
              ? 'bg-green-400/20 group-hover:bg-green-400/30'
              : 'group-hover:bg-green-400/10'
          }`}
        >
          <Repeat2 className={`w-5 h-5 ${isReposted ? 'text-green-400' : ''}`} />
        </div>
        <span className="text-sm">{repostCount}</span>
      </button>

      {showMenu && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-auto min-w-fit bg-black border border-white/10 rounded-xl shadow-lg overflow-hidden z-50">
          {canUndoRepost ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNormalRepost();
              }}
              className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
              type="button"
            >
              <Repeat2 className="w-5 h-5 text-gray-300" />
              <span className="text-white text-sm">Undo repost</span>
            </button>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleNormalRepost();
                }}
                className="w-full flex items-center space-x-3 px-4 py-2.5 hover:bg-white/5 transition-colors text-left"
                type="button"
              >
                <Repeat2 className="w-5 h-5 text-gray-300" />
                <span className="text-white text-sm">Repost</span>
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleQuoteRepost();
                }}
                className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-t border-white/10"
                type="button"
              >
                <PencilLine className="w-5 h-5 text-gray-300" />
                <span className="text-white text-sm">Quote</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

