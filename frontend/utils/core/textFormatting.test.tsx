/**
 * @vitest-environment jsdom
 */
import { isValidElement, type ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { contentTagHref, highlightContentTags } from './textFormatting';

function tagLabels(text: string): string[] {
  return highlightContentTags(text)
    .filter((part): part is ReactElement => isValidElement(part))
    .map((part) => {
      const props = part.props as { tag?: string; children?: string };
      if (typeof props.tag === 'string') return `$${props.tag.slice(1).toUpperCase()}`;
      if (typeof props.children === 'string') return props.children;
      return '';
    })
    .filter(Boolean);
}

describe('highlightContentTags', () => {
  it('highlights cashtags and mentions together', () => {
    expect(tagLabels('Long $BTC with @alice today')).toEqual(['$BTC', '@alice']);
  });

  it('keeps the surrounding text in order', () => {
    const parts = highlightContentTags('hi @bob_1!');
    expect(parts[0]).toBe('hi ');
    expect(parts[2]).toBe('!');
  });

  it('allows punctuation after a mention', () => {
    expect(tagLabels('thanks @alice, and @carol.')).toEqual(['@alice', '@carol']);
  });

  it.each([
    ['an email address', 'mail me at bob@example.com'],
    ['a too-short handle', 'hey @al'],
    ['a lone @', 'meet @ noon'],
  ])('does not highlight %s', (_label, text) => {
    expect(tagLabels(text)).toEqual([]);
  });

  it('returns the text unchanged when there are no tags', () => {
    expect(highlightContentTags('just words')).toEqual(['just words']);
  });
});

describe('contentTagHref', () => {
  it('links cashtags to the ticker page and mentions to the profile', () => {
    expect(contentTagHref('$btc')).toBe('/ticker/BTC');
    expect(contentTagHref('@Alice_1')).toBe('/alice_1');
  });
});

describe('content tag links', () => {
  afterEach(cleanup);

  it('renders ticker pills and mentions that do not trigger the card click', () => {
    const onCardClick = vi.fn();
    render(<p onClick={onCardClick}>{highlightContentTags('Long $BTC with @alice')}</p>);

    expect(screen.getByRole('link', { name: '$BTC' })).toHaveAttribute('href', '/ticker/BTC');
    expect(screen.getByText('$BTC')).toBeInTheDocument();
    const mention = screen.getByRole('link', { name: '@alice' });
    expect(mention).toHaveAttribute('href', '/alice');

    fireEvent.click(mention);
    expect(onCardClick).not.toHaveBeenCalled();
  });

  it('renders plain ticker pills when not interactive', () => {
    render(<p>{highlightContentTags('Long $BTC', false)}</p>);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('$BTC')).toBeInTheDocument();
  });
});
