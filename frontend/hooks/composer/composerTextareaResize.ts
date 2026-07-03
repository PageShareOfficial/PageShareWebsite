'use client';

const COMPOSER_LINE_HEIGHT = 24;
const COMPOSER_MIN_LINES = 2;
const COMPOSER_MAX_LINES = 15;

interface ResizeOptions {
  onResize?: (textarea: HTMLTextAreaElement) => void;
}

export function resizeComposerTextarea(
  textarea: HTMLTextAreaElement,
  options: ResizeOptions = {}
): void {
  textarea.style.height = 'auto';

  const minHeight = COMPOSER_LINE_HEIGHT * COMPOSER_MIN_LINES;
  const maxHeight = COMPOSER_LINE_HEIGHT * COMPOSER_MAX_LINES;
  const nextHeight = Math.min(
    Math.max(minHeight, textarea.scrollHeight),
    maxHeight
  );

  textarea.style.height = `${nextHeight}px`;
  options.onResize?.(textarea);
}
