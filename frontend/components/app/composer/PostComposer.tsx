'use client';

import { useEffect, useState } from 'react';
import { Post } from '@/types';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import ComposerCharacterCounter from '@/components/app/composer/ComposerCharacterCounter';
import ComposerMediaToolbar from '@/components/app/composer/ComposerMediaToolbar';
import ComposerQuoteOriginalPost from '@/components/app/composer/ComposerQuoteOriginalPost';
import ComposerSharedExtras from '@/components/app/composer/ComposerSharedExtras';
import ComposerModalShell from '@/components/app/composer/ComposerModalShell';
import { useComposerCore } from '@/hooks/composer/useComposerCore';
import { useMinSmViewport } from '@/hooks/common/useMinSmViewport';
import {
  clearPostComposerDraft,
  loadPostComposerDraft,
  markPostComposerNavigation,
  savePostComposerDraft,
} from '@/utils/composer/postComposerDraftStorage';

interface PostComposerProps {
  currentUser: {
    displayName: string;
    handle: string;
    avatar: string;
  };
  onSubmit: (
    text: string,
    media?: File[],
    gifUrl?: string,
    poll?: { options: string[]; duration: number }
  ) => void;
  onClose?: () => void;
  isModal?: boolean;
  originalPostId?: string;
  allPosts?: Post[];
  isPosting?: boolean;
}

export default function PostComposer({
  currentUser,
  onSubmit,
  onClose,
  isModal = false,
  originalPostId,
  allPosts = [],
  isPosting = false,
}: PostComposerProps) {
  const isSmUp = useMinSmViewport();
  const originalPost = originalPostId
    ? allPosts.find((post) => post.id === originalPostId)
    : undefined;
  const [savedState] = useState(() => loadPostComposerDraft());
  const core = useComposerCore({
    initialText: savedState?.postText || '',
    initialSelectedGif: savedState?.selectedGif || null,
    initialShowPoll: savedState?.showPoll || false,
    initialPollOptions: savedState?.pollOptions || ['', ''],
    initialPollDuration: savedState?.pollDuration || 1,
  });

  useEffect(() => {
    markPostComposerNavigation();
  }, []);

  useEffect(() => {
    savePostComposerDraft({
      postText: core.text,
      selectedGif: core.media.selectedGif,
      showPoll: core.poll.showPoll,
      pollOptions: core.poll.pollOptions,
      pollDuration: core.poll.pollDuration,
    });
  }, [
    core.text,
    core.media.selectedGif,
    core.poll.showPoll,
    core.poll.pollOptions,
    core.poll.pollDuration,
  ]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (isPosting || core.isContentEmpty) return;
    if (core.text.trim() && core.exceedsFreeLimit) {
      core.openPremium();
      return;
    }
    onSubmit(
      core.text,
      core.media.mediaFiles.length > 0 ? core.media.mediaFiles : undefined,
      core.media.selectedGif || undefined,
      core.poll.getPollData() || undefined
    );
    core.resetComposer();
    clearPostComposerDraft();
    onClose?.();
  };

  const submitDisabled =
    isPosting ||
    core.isContentEmpty ||
    (core.text.length > 0 && core.counter.isOverLimit);

  const placeholder = core.exceedsFreeLimit
    ? 'Upgrade to Premium to post longer content'
    : core.poll.showPoll
      ? 'Ask a question...'
      : originalPost
        ? 'Add a comment...'
        : "What's happening?";

  const formBody = (
    <form onSubmit={handleSubmit}>
      <div className="flex space-x-2 sm:space-x-3 md:space-x-3 lg:space-x-4">
        <div className="shrink-0">
          <AvatarWithFallback
            src={currentUser.avatar}
            alt={currentUser.displayName}
            size={40}
            className="h-8 w-8 md:h-10 md:w-10"
          />
        </div>
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={core.assignTextareaRef}
            value={core.text}
            onChange={core.handleTextChange}
            onSelect={core.tagging.trackCaret}
            onBlur={core.tagging.clearCaret}
            onKeyDown={core.tagging.handleKeyDown}
            placeholder={placeholder}
            className={`thin-scrollbar thin-scrollbar-gutter w-full resize-none overflow-x-hidden overflow-y-auto bg-transparent pr-3 text-base text-white placeholder-gray-500 focus:outline-hidden md:text-lg lg:text-xl ${
              core.exceedsFreeLimit ? 'placeholder-red-400' : ''
            }`}
            style={{
              height: '48px',
              minHeight: '48px',
              maxHeight: '360px',
              caretColor: 'white',
            }}
            rows={2}
            autoFocus={isModal}
          />
          <ComposerSharedExtras
            core={core}
            showDesktopEmoji={!isModal || isSmUp}
            showGifMissingKeyHelp
            selectedMediaClassName="h-24 w-full rounded-xl object-cover sm:h-32"
            emojiPickerAlign="responsive"
            footer={
              originalPost ? (
                <ComposerQuoteOriginalPost originalPost={originalPost} />
              ) : null
            }
          />
          <div className="mt-4 flex flex-row items-center justify-between gap-3 border-t border-white/10 pt-4">
            <ComposerMediaToolbar {...core.mediaToolbar} />
            <div className="flex shrink-0 flex-row items-center justify-end gap-2 md:gap-3">
              <ComposerCharacterCounter
                textLength={core.text.length}
                remainingChars={core.counter.remainingChars}
                charPercentage={core.counter.charPercentage}
                isOverLimit={core.counter.isOverLimit}
                sizeClassName="h-8 w-8 md:h-10 md:w-10"
              />
              <button
                type="submit"
                disabled={submitDisabled}
                className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50 md:px-4 md:py-2 md:text-base"
              >
                {isPosting ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
          {core.media.mediaError ? (
            <p className="mt-2 text-xs text-amber-400" title={core.media.mediaError}>
              {core.media.mediaError}
            </p>
          ) : null}
        </div>
      </div>
    </form>
  );

  if (isModal) {
    return (
      <ComposerModalShell
        onClose={onClose}
        showMobileEmoji={core.emoji.showEmojiPicker && !isSmUp}
        onCloseMobileEmoji={() => core.emoji.setShowEmojiPicker(false)}
        onEmojiClick={core.handleEmojiClick}
      >
        {formBody}
      </ComposerModalShell>
    );
  }

  return <div className="mb-0 border-b border-white/10 pb-4">{formBody}</div>;
}
