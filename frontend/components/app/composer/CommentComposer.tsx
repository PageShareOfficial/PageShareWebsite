'use client';

import { useState } from 'react';
import { User } from '@/types';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import ComposerCharacterCounter from '@/components/app/composer/ComposerCharacterCounter';
import ComposerMediaToolbar from '@/components/app/composer/ComposerMediaToolbar';
import ComposerSharedExtras from '@/components/app/composer/ComposerSharedExtras';
import { useComposerCore } from '@/hooks/composer/useComposerCore';
import { getErrorMessage } from '@/utils/error/getErrorMessage';

interface CommentComposerProps {
  currentUser: User;
  onSubmit: (
    text: string,
    media?: File[],
    gifUrl?: string,
    poll?: { options: string[]; duration: number },
    previewUrls?: string[]
  ) => Promise<void> | void;
}

export default function CommentComposer({
  currentUser,
  onSubmit,
}: CommentComposerProps) {
  const core = useComposerCore();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleCommentSubmit = async () => {
    setSubmitError(null);
    if (core.text.trim() && core.exceedsFreeLimit) {
      core.openPremium();
      return;
    }

    const poll = core.poll.getPollData() ?? undefined;
    const trimmed = core.text.trim();
    const previewUrls = [...core.media.mediaPreviews];
    if (core.isContentEmpty) return;

    try {
      await onSubmit(
        trimmed,
        core.media.mediaFiles.length > 0 ? core.media.mediaFiles : undefined,
        core.media.selectedGif || undefined,
        poll,
        previewUrls
      );
      core.resetComposer();
    } catch (error) {
      const message = getErrorMessage(error, 'Failed to submit comment');
      console.error('Failed to submit comment:', message);
      setSubmitError(message);
    }
  };

  const submitDisabled = core.counter.isOverLimit || core.isContentEmpty;
  const placeholder = core.exceedsFreeLimit
    ? 'Upgrade to Premium to post longer content'
    : core.poll.showPoll
      ? 'Ask a question...'
      : 'Add a comment...';

  return (
    <div className="border-b border-white/10 px-4 py-3">
      <div className="flex items-start space-x-3">
        <AvatarWithFallback
          src={currentUser.avatar}
          alt={currentUser.displayName}
          size={40}
          className="shrink-0"
        />
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={core.assignTextareaRef}
            value={core.text}
            onChange={core.handleTextChange}
            onSelect={core.tagging.trackCaret}
            onBlur={core.tagging.clearCaret}
            onKeyDown={core.tagging.handleKeyDown}
            placeholder={placeholder}
            className={`thin-scrollbar thin-scrollbar-gutter w-full resize-none overflow-x-hidden overflow-y-auto bg-transparent pr-3 text-[15px] text-white placeholder-gray-500 focus:outline-hidden ${
              core.exceedsFreeLimit ? 'placeholder-red-400' : ''
            }`}
            style={{ height: '48px', minHeight: '48px', maxHeight: '360px' }}
            rows={2}
          />
          <ComposerSharedExtras core={core} showDesktopEmoji />
          <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
            <ComposerMediaToolbar
              {...core.mediaToolbar}
              buttonClassName="rounded-full p-1.5 text-cyan-400 transition-colors hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-50"
              iconClassName="h-5 w-5"
            />
            <div className="flex shrink-0 flex-row items-center justify-end gap-2">
              <ComposerCharacterCounter
                textLength={core.text.length}
                remainingChars={core.counter.remainingChars}
                charPercentage={core.counter.charPercentage}
                isOverLimit={core.counter.isOverLimit}
              />
              <button
                type="button"
                onClick={() => void handleCommentSubmit()}
                disabled={submitDisabled}
                className="shrink-0 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Reply
              </button>
            </div>
          </div>
          {submitError ? (
            <p className="mt-2 text-xs text-red-400" title={submitError}>
              {submitError}
            </p>
          ) : null}
          {core.media.mediaError ? (
            <p className="mt-2 text-xs text-amber-400" title={core.media.mediaError}>
              {core.media.mediaError}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
