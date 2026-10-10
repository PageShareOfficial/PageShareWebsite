import { describe, expect, it } from 'vitest';
import { getActiveTag, insertTag } from './activeTag';

describe('getActiveTag', () => {
  it('finds a cashtag at the caret', () => {
    expect(getActiveTag('buying $bt', 10)).toEqual({
      trigger: '$',
      query: 'bt',
      start: 7,
      end: 10,
    });
  });

  it('finds a mention at the start of the text', () => {
    expect(getActiveTag('@ali', 4)).toEqual({ trigger: '@', query: 'ali', start: 0, end: 4 });
  });

  it('returns an empty query right after the trigger', () => {
    expect(getActiveTag('hi @', 4)).toEqual({ trigger: '@', query: '', start: 3, end: 4 });
  });

  it('includes the rest of the word when the caret is mid-word', () => {
    expect(getActiveTag('$btc now', 2)).toEqual({ trigger: '$', query: 'btc', start: 0, end: 4 });
  });

  it.each([
    ['plain words', 'hello world', 5],
    ['an email address', 'mail a@b.com', 8],
    ['a price', 'costs 5$', 8],
    ['a finished tag', '$btc ', 5],
    ['a caret out of range', '$btc', 9],
  ])('ignores %s', (_label, text, caret) => {
    expect(getActiveTag(text, caret)).toBeNull();
  });
});

describe('insertTag', () => {
  it('replaces the partial tag and adds a space', () => {
    const tag = getActiveTag('buy $bt today', 7)!;
    expect(insertTag('buy $bt today', tag, 'BTC')).toEqual({ text: 'buy $BTC today', caret: 9 });
  });

  it('appends a space at the end of the text', () => {
    const tag = getActiveTag('hey @al', 7)!;
    expect(insertTag('hey @al', tag, 'alice')).toEqual({ text: 'hey @alice ', caret: 11 });
  });
});
