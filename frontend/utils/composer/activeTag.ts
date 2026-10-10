export type TagTrigger = '$' | '@';

export interface ActiveTag {
  trigger: TagTrigger;
  /** Text typed after the trigger, e.g. "bt" for "$bt". */
  query: string;
  /** Index of the trigger character in the text. */
  start: number;
  /** Index just past the end of the tag word. */
  end: number;
}

const TAG_WORD_CHAR = /[A-Za-z0-9_]/;

function isTagTrigger(char: string | undefined): char is TagTrigger {
  return char === '$' || char === '@';
}

function findWordEnd(text: string, from: number): number {
  let end = from;
  while (end < text.length && TAG_WORD_CHAR.test(text[end])) end++;
  return end;
}

/**
 * The `$ticker` or `@username` word the caret is currently inside, if any.
 * A trigger only counts at the start of the text or after whitespace, so emails and prices
 * like "a@b.com" or "5$" are ignored.
 */
export function getActiveTag(text: string, caret: number): ActiveTag | null {
  if (caret < 0 || caret > text.length) return null;

  let start = caret;
  while (start > 0 && TAG_WORD_CHAR.test(text[start - 1])) start--;

  const triggerIndex = start - 1;
  const trigger = text[triggerIndex];
  if (!isTagTrigger(trigger)) return null;
  if (triggerIndex > 0 && !/\s/.test(text[triggerIndex - 1])) return null;

  const end = findWordEnd(text, caret);
  return { trigger, query: text.slice(start, end), start: triggerIndex, end };
}

/** Replaces the active tag with the chosen value plus a trailing space; returns the new caret. */
export function insertTag(
  text: string,
  tag: ActiveTag,
  value: string
): { text: string; caret: number } {
  const inserted = `${tag.trigger}${value} `;
  const after = text.slice(tag.end).replace(/^ /, '');
  return {
    text: text.slice(0, tag.start) + inserted + after,
    caret: tag.start + inserted.length,
  };
}
