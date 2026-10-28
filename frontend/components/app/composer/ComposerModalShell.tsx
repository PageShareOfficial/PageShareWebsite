'use client';

import dynamic from 'next/dynamic';
import { X } from '@/constants/icons';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ComposerModalShellProps {
  children: React.ReactNode;
  onClose?: () => void;
  showMobileEmoji: boolean;
  onCloseMobileEmoji: () => void;
  onEmojiClick: (emojiData: { emoji?: string }) => void;
}

/** Modal chrome + optional mobile emoji sheet for PostComposer. */
export default function ComposerModalShell({
  children,
  onClose,
  showMobileEmoji,
  onCloseMobileEmoji,
  onEmojiClick,
}: ComposerModalShellProps) {
  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-80 pt-2 sm:pt-4"
        onClick={onClose}
      >
        <div
          className="mx-2 max-h-[95vh] w-full max-w-[600px] overflow-y-auto rounded-xl border border-white/10 bg-black sm:mx-4 sm:max-h-[85vh]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-black p-3 sm:p-4">
            <button
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="p-2 sm:p-4">{children}</div>
        </div>
      </div>
      {showMobileEmoji ? (
        <div
          className="fixed inset-0 z-60 flex items-end justify-center bg-black bg-opacity-80"
          onClick={onCloseMobileEmoji}
        >
          <div
            className="w-full max-w-md rounded-t-xl border-t border-white/10 bg-black"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 p-4">
              <span className="font-medium text-white">Choose an emoji</span>
              <button onClick={onCloseMobileEmoji} className="text-gray-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={400} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
