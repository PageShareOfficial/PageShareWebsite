'use client';

import { type RefObject } from 'react';
import { Search, LoaderCircle } from '@/constants/icons';
import { type SearchSuggestion } from '@/utils/api/stockApi';
import ImageWithFallback from '@/components/app/common/ImageWithFallback';
import { getInitials } from '@/utils/core/textFormatting';
import Skeleton from '@/components/app/common/Skeleton';
import PredictionFormSection from '@/components/app/predictions/submit/PredictionFormSection';

interface TickerSearchView {
  query: string;
  setQuery: (query: string) => void;
  suggestions: SearchSuggestion[];
  isSearching: boolean;
  showSuggestions: boolean;
  setShowSuggestions: (show: boolean) => void;
  setSelectedIndex: (index: number) => void;
}

interface PredictionAssetSearchSectionProps {
  tickerSearch: TickerSearchView;
  inputRef: RefObject<HTMLInputElement | null>;
  suggestionsRef: RefObject<HTMLDivElement | null>;
  inputRowClass: string;
  assetSearchDisabled: boolean;
  assetSearchDisabledTitle?: string;
  isFetchingTicker: boolean;
  selectedTicker: string | null;
  selectedName: string;
  selectedTickerImage: string;
  tickerError: string;
  onQueryChangeClearError: () => void;
  onKeyDown: (event: React.KeyboardEvent) => void;
  onClearKeyboardSelection: () => void;
  onSelectSuggestion: (suggestion: SearchSuggestion) => void;
}

/** Step 1: asset search, suggestions, and selected-asset chip. */
export default function PredictionAssetSearchSection({
  tickerSearch,
  inputRef,
  suggestionsRef,
  inputRowClass,
  assetSearchDisabled,
  assetSearchDisabledTitle,
  isFetchingTicker,
  selectedTicker,
  selectedName,
  selectedTickerImage,
  tickerError,
  onQueryChangeClearError,
  onKeyDown,
  onClearKeyboardSelection,
  onSelectSuggestion,
}: PredictionAssetSearchSectionProps) {
  return (
    <PredictionFormSection step={1} title="Select Asset">
      <div className="relative">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
          <div className="relative h-11 min-w-0 sm:w-1/2 sm:flex-none">
            <Search className="pointer-events-none absolute top-0 bottom-0 left-3 z-1 my-auto h-4 w-4 text-gray-400" />
            <input
              ref={inputRef}
              id="prediction-asset"
              type="text"
              value={tickerSearch.query}
              onChange={(event) => {
                tickerSearch.setQuery(event.target.value);
                tickerSearch.setSelectedIndex(-1);
                onClearKeyboardSelection();
                onQueryChangeClearError();
              }}
              onKeyDown={onKeyDown}
              onFocus={() => {
                if (assetSearchDisabled) return;
                if (tickerSearch.suggestions.length > 0) {
                  tickerSearch.setShowSuggestions(true);
                }
              }}
              placeholder="BTC, ETH, SOL..."
              disabled={assetSearchDisabled}
              title={assetSearchDisabledTitle}
              className={inputRowClass}
            />
            {isFetchingTicker ? (
              <LoaderCircle className="absolute top-0 right-3 bottom-0 my-auto h-4 w-4 animate-spin text-gray-400" />
            ) : null}
          </div>
          {isFetchingTicker ? (
            <div className="flex h-11 min-w-0 items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-0 sm:w-1/2 sm:flex-none">
              <Skeleton variant="rectangular" width={40} height={40} rounded="rounded-lg" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton variant="text" width="70%" height={14} />
                <Skeleton variant="text" width="40%" height={12} />
              </div>
            </div>
          ) : selectedTicker ? (
            <div className="flex h-11 min-w-0 items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-0 sm:w-1/2 sm:flex-none">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/10">
                <ImageWithFallback
                  src={selectedTickerImage}
                  alt={selectedName || selectedTicker}
                  className="h-full w-full"
                  fallback={
                    <div className="flex h-full w-full items-center justify-center text-xs font-semibold text-white">
                      {getInitials(selectedName || selectedTicker)}
                    </div>
                  }
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{selectedName}</p>
                <p className="truncate text-xs text-gray-400">{selectedTicker}</p>
              </div>
            </div>
          ) : null}
        </div>

        {!assetSearchDisabled &&
        tickerSearch.showSuggestions &&
        (tickerSearch.suggestions.length > 0 || tickerSearch.isSearching) ? (
          <div
            ref={suggestionsRef}
            className="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-white/10 bg-black shadow-lg sm:w-1/2"
          >
            {tickerSearch.isSearching && tickerSearch.suggestions.length === 0 ? (
              <>
                {Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={`sk-${index}`}
                    className={`px-4 py-3 ${index > 0 ? 'border-t border-white/5' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton
                        variant="rectangular"
                        width={40}
                        height={40}
                        rounded="rounded-lg"
                      />
                      <Skeleton variant="text" width={120} height={16} />
                    </div>
                  </div>
                ))}
              </>
            ) : null}
            {tickerSearch.suggestions.map((suggestion, index) => (
              <button
                key={`${suggestion.ticker}-${index}`}
                type="button"
                disabled={assetSearchDisabled}
                onClick={() => onSelectSuggestion(suggestion)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/10 ${
                  index > 0 ? 'border-t border-white/5' : ''
                }`}
              >
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-white/5">
                  <ImageWithFallback
                    src={suggestion.image}
                    alt={suggestion.name}
                    className="h-full w-full"
                    fallback={
                      <div className="flex h-full w-full items-center justify-center bg-white/10 text-xs font-semibold text-white">
                        {getInitials(suggestion.name)}
                      </div>
                    }
                  />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-white">{suggestion.ticker}</div>
                  <div className="truncate text-xs text-gray-500">{suggestion.name}</div>
                </div>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {tickerError ? <p className="mt-2 text-sm text-red-400">{tickerError}</p> : null}
    </PredictionFormSection>
  );
}
