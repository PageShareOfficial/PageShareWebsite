import { describe, expect, it } from 'vitest';
import { insertEmojiAtCursor } from './insertEmojiAtCursor';

describe('insertEmojiAtCursor', () => {
  it('inserts at the caret when the selection is empty', () => {
    expect(insertEmojiAtCursor('hello', '🔥', 5, 5)).toEqual({
      nextText: 'hello🔥',
      nextCaret: 7,
    });
  });

  it('replaces the selected range', () => {
    expect(insertEmojiAtCursor('hello', '👋', 0, 5)).toEqual({
      nextText: '👋',
      nextCaret: 2,
    });
  });

  it('leaves text unchanged when the emoji is empty', () => {
    expect(insertEmojiAtCursor('hi', '', 1, 1)).toEqual({
      nextText: 'hi',
      nextCaret: 1,
    });
  });
});
