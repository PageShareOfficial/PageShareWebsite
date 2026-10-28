'use client';

import type { ReactNode } from 'react';
import dynamic from 'next/dynamic';
import ComposerTagSuggestions from '@/components/app/composer/ComposerTagSuggestions';
import ComposerSelectedMedia from '@/components/app/composer/ComposerSelectedMedia';
import ComposerPollEditor from '@/components/app/composer/ComposerPollEditor';
import ComposerGifPicker from '@/components/app/composer/ComposerGifPicker';
import ComposerPremiumLimitBanner from '@/components/app/composer/ComposerPremiumLimitBanner';
import type { ComposerCore } from '@/hooks/composer/useComposerCore';

const EmojiPicker = dynamic(() => import('emoji-picker-react'), { ssr: false });

interface ComposerSharedExtrasProps {
  core: ComposerCore;
  showDesktopEmoji: boolean;
  showGifMissingKeyHelp?: boolean;
  selectedMediaClassName?: string;
  emojiPickerAlign?: 'left' | 'responsive';
  footer?: ReactNode;
}

/** Shared composer extras under the textarea (tags, media, poll, gif, emoji). */
export default function ComposerSharedExtras({
  core,
  showDesktopEmoji,
  showGifMissingKeyHelp = false,
  selectedMediaClassName = 'h-24 w-full rounded-xl object-cover',
  emojiPickerAlign = 'left',
  footer,
}: ComposerSharedExtrasProps) {
  const { media, poll, giphy, emoji, tagging, exceedsFreeLimit, openPremium } = core;

  return (
    <>
      <ComposerTagSuggestions tagging={tagging} />
      <ComposerPremiumLimitBanner visible={exceedsFreeLimit} onUpgrade={openPremium} />

      <ComposerSelectedMedia
        mediaPreviews={media.mediaPreviews}
        selectedGif={media.selectedGif}
        onRemoveMedia={media.handleRemoveMedia}
        onClearGif={() => media.setSelectedGif(null)}
        imageClassName={selectedMediaClassName}
      />

      {poll.showPoll ? (
        <ComposerPollEditor
          pollOptions={poll.pollOptions}
          pollDuration={poll.pollDuration}
          onClose={poll.resetPoll}
          onAddOption={poll.addPollOption}
          onRemoveOption={poll.removePollOption}
          onUpdateOption={poll.updatePollOption}
          onDurationChange={poll.setPollDuration}
        />
      ) : null}

      {core.showGifPicker ? (
        <ComposerGifPicker
          searchQuery={giphy.gifSearchQuery}
          debouncedSearch={giphy.debouncedGifSearch}
          onSearchChange={giphy.setGifSearchQuery}
          onClose={() => {
            core.setShowGifPicker(false);
            giphy.setGifSearchQuery('');
          }}
          onSelectGifUrl={(url) => {
            media.handleGifSelect(url);
            core.setShowGifPicker(false);
          }}
          showMissingKeyHelp={showGifMissingKeyHelp}
        />
      ) : null}

      {showDesktopEmoji && emoji.showEmojiPicker ? (
        <div className="relative mt-3" ref={emoji.emojiPickerRef}>
          <div
            className={`absolute z-20 ${
              emojiPickerAlign === 'responsive'
                ? 'left-0 sm:left-auto sm:right-0'
                : 'left-0'
            }`}
          >
            <div className="overflow-hidden rounded-xl border border-white/10 bg-black shadow-xl">
              <EmojiPicker onEmojiClick={core.handleEmojiClick} width={350} height={400} />
            </div>
          </div>
        </div>
      ) : null}

      {footer}
    </>
  );
}
