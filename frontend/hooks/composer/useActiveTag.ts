'use client';

import { useMemo, useState, type KeyboardEvent, type SyntheticEvent } from 'react';
import { getActiveTag, type ActiveTag } from '@/utils/composer/activeTag';

export interface ActiveTagTracking {
  activeTag: ActiveTag | null;
  /** Moves the caret programmatically, e.g. after inserting a tag. */
  setCaret: (caret: number | null) => void;
  /** Wire to the textarea's onSelect/onChange so the caret position stays current. */
  trackCaret: (event: SyntheticEvent<HTMLTextAreaElement>) => void;
  /** Hides suggestions when the textarea loses focus. */
  clearCaret: () => void;
  /** Escape closes the suggestion row for the current tag. */
  handleKeyDown: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
}

/** Tracks the textarea caret and the `$`/`@` tag it sits in, honouring Escape dismissals. */
export function useActiveTag(text: string): ActiveTagTracking {
  const [caret, setCaret] = useState<number | null>(null);
  const [dismissedTagStart, setDismissedTagStart] = useState<number | null>(null);

  const activeTag = useMemo(() => {
    const tag = caret === null ? null : getActiveTag(text, caret);
    return tag && tag.start !== dismissedTagStart ? tag : null;
  }, [text, caret, dismissedTagStart]);

  const trackCaret = (event: SyntheticEvent<HTMLTextAreaElement>) => {
    setCaret(event.currentTarget.selectionStart);
    setDismissedTagStart(null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Escape' || !activeTag) return;
    event.preventDefault();
    setDismissedTagStart(activeTag.start);
  };

  return { activeTag, setCaret, trackCaret, clearCaret: () => setCaret(null), handleKeyDown };
}
