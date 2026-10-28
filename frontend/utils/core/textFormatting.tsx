import React from 'react';
import Link from 'next/link';
import TickerCashtagPill from '@/components/app/ticker/TickerCashtagPill';
import { profilePath, tickerPath } from '@/constants/routes';
import { parseCashtagSymbol } from '@/utils/ticker/cashtagUtils';

/** Cashtags end at space, newline, or end of string. */
const CASHTAG_PATTERN = String.raw`\$[A-Za-z0-9_]+(?=\s|$)`;
/**
 * Mentions start a word (so emails like a@b.com are skipped), match the username rules
 * (3-50 of a-z, 0-9, _) and may be followed by punctuation, e.g. "thanks @alice!".
 */
const MENTION_PATTERN = String.raw`(?<=^|\s)@[A-Za-z0-9_]{3,50}(?=$|\s|[.,!?;:)])`;

export const CONTENT_TAG_REGEX = new RegExp(
  `${CASHTAG_PATTERN}|${MENTION_PATTERN}`,
  'g'
);

/** `$btc` opens the ticker page, `@Alice` opens the profile (usernames are lowercase). */
export function contentTagHref(tag: string): string {
  const cashtagSymbol = parseCashtagSymbol(tag);
  if (cashtagSymbol) return tickerPath(cashtagSymbol);
  return profilePath(tag.slice(1).toLowerCase());
}

/** Cards open the post on click; a tag link must not trigger that as well. */
function stopCardClick(event: React.MouseEvent) {
  event.stopPropagation();
}

function renderMentionTag(
  tag: string,
  key: number,
  interactive: boolean
): React.ReactElement {
  if (!interactive) {
    return (
      <span key={key} className="font-medium text-cyan-400">
        {tag}
      </span>
    );
  }
  return (
    <Link
      key={key}
      href={contentTagHref(tag)}
      onClick={stopCardClick}
      className="font-medium text-cyan-400 hover:underline"
    >
      {tag}
    </Link>
  );
}

function renderContentTag(
  tag: string,
  key: number,
  interactive: boolean
): React.ReactElement {
  if (tag.startsWith('$')) {
    return <TickerCashtagPill key={key} tag={tag} interactive={interactive} />;
  }
  return renderMentionTag(tag, key, interactive);
}

/**
 * Highlights `$cashtags` and `@mentions` in post text.
 * @param interactive - If true, tags link to the ticker or profile page (default: true)
 */
export function highlightContentTags(
  text: string,
  interactive: boolean = true
): (string | React.ReactElement)[] {
  if (!text) return [];

  const parts: (string | React.ReactElement)[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(CONTENT_TAG_REGEX)) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(renderContentTag(match[0], match.index, interactive));
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) parts.push(text.substring(lastIndex));
  return parts;
}

/**
 * Get initials from a name (first letter of each word, up to 2 characters).
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return '';

  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}
