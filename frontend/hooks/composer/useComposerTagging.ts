'use client';

import type { RefObject } from 'react';
import { insertTag } from '@/utils/composer/activeTag';
import { useActiveTag, type ActiveTagTracking } from './useActiveTag';
import { useTagSuggestions, type TagSuggestions } from './useTagSuggestions';

interface UseComposerTaggingOptions {
  text: string;
  setText: (text: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export interface ComposerTagging extends ActiveTagTracking, TagSuggestions {
  /** Replaces the tag being typed with `$SYMBOL` / `@username`. */
  selectTag: (value: string) => void;
}

/** `$` ticker and `@` account tagging for a controlled composer textarea. */
export function useComposerTagging({
  text,
  setText,
  textareaRef,
}: UseComposerTaggingOptions): ComposerTagging {
  const tracking = useActiveTag(text);
  const suggestions = useTagSuggestions(tracking.activeTag);
  const { activeTag, setCaret } = tracking;

  const selectTag = (value: string) => {
    if (!activeTag) return;
    const next = insertTag(text, activeTag, value);
    setText(next.text);
    setCaret(next.caret);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
      textareaRef.current?.setSelectionRange(next.caret, next.caret);
    });
  };

  return { ...tracking, ...suggestions, selectTag };
}
