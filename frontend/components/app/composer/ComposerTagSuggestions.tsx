'use client';

import type { MouseEvent, ReactNode } from 'react';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import TickerImage from '@/components/app/ticker/TickerImage';
import type { ComposerTagging } from '@/hooks/composer/useComposerTagging';

type ComposerTagSuggestionsProps = Readonly<{ tagging: ComposerTagging }>;

/** Keeps the textarea focused (and its caret) while a suggestion is clicked. */
function keepTextareaFocus(event: MouseEvent) {
  event.preventDefault();
}

function SuggestionCard({
  image,
  title,
  subtitle,
  onSelect,
}: Readonly<{ image: ReactNode; title: string; subtitle: string; onSelect: () => void }>) {
  return (
    <button
      type="button"
      onMouseDown={keepTextareaFocus}
      onClick={onSelect}
      className="flex shrink-0 items-center gap-2 rounded-lg border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 text-left hover:bg-white/10 transition-colors"
    >
      {image}
      <span className="min-w-0">
        <span className="block max-w-36 truncate text-sm font-semibold text-white">{title}</span>
        <span className="block max-w-36 truncate text-xs text-gray-400">{subtitle}</span>
      </span>
    </button>
  );
}

function SuggestionStatus({ children }: Readonly<{ children: ReactNode }>) {
  return <p className="mt-2 text-xs text-gray-500">{children}</p>;
}

/** Horizontal list of tickers (`$`) or accounts (`@`) matching the tag being typed. */
export default function ComposerTagSuggestions({ tagging }: ComposerTagSuggestionsProps) {
  const { activeTag, tickers, accounts, isSearching, selectTag } = tagging;
  if (!activeTag?.query) return null;

  const isTicker = activeTag.trigger === '$';
  const resultCount = isTicker ? tickers.length : accounts.length;
  if (resultCount === 0) {
    return (
      <SuggestionStatus>
        {isSearching ? 'Searching...' : `No ${isTicker ? 'tickers' : 'accounts'} found`}
      </SuggestionStatus>
    );
  }

  return (
    <div
      className="thin-scrollbar mt-2 flex gap-2 overflow-x-auto pb-1"
      role="group"
      aria-label={isTicker ? 'Ticker suggestions' : 'Account suggestions'}
    >
      {isTicker ? (
        <TickerSuggestionCards tickers={tickers} onSelect={selectTag} />
      ) : (
        <AccountSuggestionCards accounts={accounts} onSelect={selectTag} />
      )}
    </div>
  );
}

function TickerSuggestionCards({
  tickers,
  onSelect,
}: Readonly<{ tickers: ComposerTagging['tickers']; onSelect: (symbol: string) => void }>) {
  return tickers.map((ticker) => (
    <SuggestionCard
      key={`${ticker.ticker}-${ticker.name}`}
      image={<TickerImage src={ticker.image} ticker={ticker.ticker} squarePx={32} />}
      title={ticker.name}
      subtitle={`$${ticker.ticker}`}
      onSelect={() => onSelect(ticker.ticker)}
    />
  ));
}

function AccountSuggestionCards({
  accounts,
  onSelect,
}: Readonly<{ accounts: ComposerTagging['accounts']; onSelect: (handle: string) => void }>) {
  return accounts.map((account) => (
    <SuggestionCard
      key={account.id}
      image={
        <AvatarWithFallback
          src={account.avatar}
          alt={account.displayName}
          size={32}
          className="shrink-0"
        />
      }
      title={account.displayName}
      subtitle={`@${account.handle}`}
      onSelect={() => onSelect(account.handle)}
    />
  ));
}
