/**
 * @vitest-environment jsdom
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ComposerTagSuggestions from './ComposerTagSuggestions';
import type { ComposerTagging } from '@/hooks/composer/useComposerTagging';
import type { ActiveTag } from '@/utils/composer/activeTag';

function buildTagging(activeTag: ActiveTag | null, overrides: Partial<ComposerTagging> = {}) {
  return {
    activeTag,
    tickers: [],
    accounts: [],
    isSearching: false,
    setCaret: vi.fn(),
    trackCaret: vi.fn(),
    clearCaret: vi.fn(),
    handleKeyDown: vi.fn(),
    selectTag: vi.fn(),
    ...overrides,
  } satisfies ComposerTagging;
}

const tickerTag: ActiveTag = { trigger: '$', query: 'bt', start: 0, end: 3 };
const mentionTag: ActiveTag = { trigger: '@', query: 'al', start: 0, end: 3 };

describe('ComposerTagSuggestions', () => {
  afterEach(cleanup);

  it('renders nothing without a tag being typed', () => {
    const { container } = render(<ComposerTagSuggestions tagging={buildTagging(null)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists every matching ticker with its full name and symbol, and selects instead of linking', () => {
    const tagging = buildTagging(tickerTag, {
      tickers: [
        { ticker: 'BTC', name: 'Bitcoin', type: 'crypto' },
        { ticker: 'BTT', name: 'BitTorrent', type: 'crypto' },
      ],
    });
    render(<ComposerTagSuggestions tagging={tagging} />);

    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
    expect(screen.getByText('$BTT')).toBeInTheDocument();
    expect(screen.queryByRole('link')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('BitTorrent'));
    expect(tagging.selectTag).toHaveBeenCalledWith('BTT');
  });

  it('lists accounts with display name and username', () => {
    const tagging = buildTagging(mentionTag, {
      accounts: [{ id: '1', displayName: 'Alice', handle: 'alice', avatar: '' }],
    });
    render(<ComposerTagSuggestions tagging={tagging} />);

    expect(screen.getByText('@alice')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Alice'));
    expect(tagging.selectTag).toHaveBeenCalledWith('alice');
  });

  it('shows searching and empty states', () => {
    const { rerender } = render(
      <ComposerTagSuggestions tagging={buildTagging(mentionTag, { isSearching: true })} />
    );
    expect(screen.getByText('Searching...')).toBeInTheDocument();

    rerender(<ComposerTagSuggestions tagging={buildTagging(tickerTag)} />);
    expect(screen.getByText('No tickers found')).toBeInTheDocument();
  });
});
