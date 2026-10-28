'use client';

import { useCallback, useRef, useState } from 'react';
import { useMediaUpload } from '@/hooks/composer/useMediaUpload';
import { usePollBuilder } from '@/hooks/composer/usePollBuilder';
import { useEmojiPicker } from '@/hooks/composer/useEmojiPicker';
import { useCharacterCounter } from '@/hooks/composer/useCharacterCounter';
import { useGiphySearch } from '@/hooks/composer/useGiphySearch';
import { useComposerEmojiInsert } from '@/hooks/composer/useComposerEmojiInsert';
import { useComposerTagging } from '@/hooks/composer/useComposerTagging';
import { resizeComposerTextarea } from '@/hooks/composer/composerTextareaResize';
import {
  FREE_CONTENT_MAX_LENGTH,
  PREMIUM_CONTENT_MAX_LENGTH,
} from '@/constants/contentLimits';
import { useSubscription } from '@/hooks/billing/useSubscription';
import { usePremiumOverlay } from '@/contexts/PremiumOverlayContext';

interface UseComposerCoreOptions {
  initialText?: string;
  initialSelectedGif?: string | null;
  initialShowPoll?: boolean;
  initialPollOptions?: string[];
  initialPollDuration?: number;
}

/**
 * Shared post/comment composer state: text, media, poll, gif, emoji, limits.
 */
export function useComposerCore(options: UseComposerCoreOptions = {}) {
  const {
    initialText = '',
    initialSelectedGif = null,
    initialShowPoll = false,
    initialPollOptions = ['', ''],
    initialPollDuration = 1,
  } = options;

  const { openPremium } = usePremiumOverlay();
  const { isPremium } = useSubscription();
  const [text, setText] = useState(initialText);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxLength = isPremium ? PREMIUM_CONTENT_MAX_LENGTH : FREE_CONTENT_MAX_LENGTH;
  const exceedsFreeLimit = !isPremium && text.length > FREE_CONTENT_MAX_LENGTH;

  const tagging = useComposerTagging({ text, setText, textareaRef });
  const media = useMediaUpload(initialSelectedGif);
  const poll = usePollBuilder(initialShowPoll, initialPollOptions, initialPollDuration);
  const emoji = useEmojiPicker();
  const giphy = useGiphySearch();
  const counter = useCharacterCounter({ maxLength, text });

  const closeEmojiPicker = useCallback(
    () => emoji.setShowEmojiPicker(false),
    [emoji.setShowEmojiPicker]
  );
  const handleEmojiClick = useComposerEmojiInsert({
    text,
    setText,
    textareaRef,
    onAfterInsert: closeEmojiPicker,
  });

  const hasValidPoll = Boolean(poll.getPollData());
  const isContentEmpty =
    text.trim().length === 0 &&
    media.mediaFiles.length === 0 &&
    !media.selectedGif &&
    !hasValidPoll;

  const resetComposer = () => {
    setText('');
    media.clearMedia();
    poll.resetPoll();
    setShowGifPicker(false);
    giphy.setGifSearchQuery('');
  };

  const assignTextareaRef = (textarea: HTMLTextAreaElement | null) => {
    if (!textarea) return;
    (textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>).current = textarea;
    resizeComposerTextarea(textarea);
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(event.target.value);
    resizeComposerTextarea(event.target);
    tagging.trackCaret(event);
  };

  const closePanelsExcept = (keep: 'gif' | 'emoji' | 'poll' | null) => {
    setShowGifPicker(keep === 'gif' ? !showGifPicker : false);
    emoji.setShowEmojiPicker(keep === 'emoji' ? !emoji.showEmojiPicker : false);
    if (keep === 'poll') {
      poll.setShowPoll(!poll.showPoll);
    } else {
      poll.setShowPoll(false);
    }
  };

  const mediaToolbar = {
    fileInputRef,
    onImageChange: media.handleImageUpload,
    onImageClick: () => {
      closePanelsExcept(null);
      media.clearMediaError();
      fileInputRef.current?.click();
    },
    onGifClick: () => closePanelsExcept('gif'),
    onEmojiClick: () => closePanelsExcept('emoji'),
    onPollClick: () => closePanelsExcept('poll'),
    imageDisabled: media.mediaFiles.length >= 4 || media.selectedGif !== null,
    gifDisabled: media.mediaFiles.length > 0 || media.selectedGif !== null,
    pollDisabled: media.mediaFiles.length > 0 || media.selectedGif !== null,
  };

  return {
    text,
    setText,
    showGifPicker,
    setShowGifPicker,
    fileInputRef,
    textareaRef,
    exceedsFreeLimit,
    openPremium,
    isPremium,
    tagging,
    media,
    poll,
    emoji,
    giphy,
    counter,
    handleEmojiClick,
    hasValidPoll,
    isContentEmpty,
    resetComposer,
    assignTextareaRef,
    handleTextChange,
    mediaToolbar,
  };
}

export type ComposerCore = ReturnType<typeof useComposerCore>;
