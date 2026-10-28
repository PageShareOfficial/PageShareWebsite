import { useCallback, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { insertEmojiAtCursor } from '@/utils/composer/insertEmojiAtCursor';

interface UseComposerEmojiInsertArgs {
  text: string;
  setText: Dispatch<SetStateAction<string>>;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  onAfterInsert?: () => void;
}

/**
 * Insert an emoji into a controlled composer textarea at the current caret.
 */
export function useComposerEmojiInsert({
  text,
  setText,
  textareaRef,
  onAfterInsert,
}: UseComposerEmojiInsertArgs) {
  return useCallback(
    (emojiData: { emoji?: string }) => {
      const emoji = emojiData.emoji ?? '';
      if (!emoji) {
        onAfterInsert?.();
        return;
      }
      const textarea = textareaRef.current;
      const start = textarea ? textarea.selectionStart : text.length;
      const end = textarea ? textarea.selectionEnd : text.length;
      const { nextText, nextCaret } = insertEmojiAtCursor(text, emoji, start, end);
      setText(nextText);
      onAfterInsert?.();
      if (!textarea) return;
      requestAnimationFrame(() => {
        textareaRef.current?.setSelectionRange(nextCaret, nextCaret);
        textareaRef.current?.focus();
      });
    },
    [text, setText, textareaRef, onAfterInsert]
  );
}
