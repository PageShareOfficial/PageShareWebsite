/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { KeyboardEvent, SyntheticEvent } from 'react';
import { useActiveTag } from './useActiveTag';

function caretEvent(selectionStart: number) {
  return { currentTarget: { selectionStart } } as SyntheticEvent<HTMLTextAreaElement>;
}

function keyEvent(key: string) {
  return { key, preventDefault: vi.fn() } as unknown as KeyboardEvent<HTMLTextAreaElement>;
}

describe('useActiveTag', () => {
  it('has no active tag until the caret is tracked', () => {
    const { result } = renderHook(() => useActiveTag('hi $bt'));
    expect(result.current.activeTag).toBeNull();
  });

  it('finds the tag around the tracked caret and clears it on blur', () => {
    const { result } = renderHook(() => useActiveTag('hi $bt'));
    act(() => result.current.trackCaret(caretEvent(6)));
    expect(result.current.activeTag).toMatchObject({ trigger: '$', query: 'bt' });

    act(() => result.current.clearCaret());
    expect(result.current.activeTag).toBeNull();
  });

  it('dismisses the current tag on Escape until the caret moves again', () => {
    const { result } = renderHook(() => useActiveTag('@ali'));
    act(() => result.current.trackCaret(caretEvent(4)));

    const escape = keyEvent('Escape');
    act(() => result.current.handleKeyDown(escape));
    expect(escape.preventDefault).toHaveBeenCalled();
    expect(result.current.activeTag).toBeNull();

    act(() => result.current.trackCaret(caretEvent(3)));
    expect(result.current.activeTag).toMatchObject({ trigger: '@', query: 'ali' });
  });

  it('ignores keys other than Escape', () => {
    const { result } = renderHook(() => useActiveTag('$eth'));
    act(() => result.current.trackCaret(caretEvent(4)));
    const enter = keyEvent('Enter');
    act(() => result.current.handleKeyDown(enter));
    expect(enter.preventDefault).not.toHaveBeenCalled();
    expect(result.current.activeTag).not.toBeNull();
  });
});
