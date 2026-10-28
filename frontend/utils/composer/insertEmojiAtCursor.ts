/**
 * Insert an emoji into controlled composer text at the current selection.
 */
export function insertEmojiAtCursor(
  text: string,
  emoji: string,
  selectionStart: number,
  selectionEnd: number
): { nextText: string; nextCaret: number } {
  if (!emoji) {
    return { nextText: text, nextCaret: selectionStart };
  }
  const start = Math.max(0, Math.min(selectionStart, text.length));
  const end = Math.max(start, Math.min(selectionEnd, text.length));
  return {
    nextText: `${text.slice(0, start)}${emoji}${text.slice(end)}`,
    nextCaret: start + emoji.length,
  };
}
