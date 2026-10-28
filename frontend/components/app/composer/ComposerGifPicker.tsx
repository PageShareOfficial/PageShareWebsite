'use client';

import { Grid } from '@giphy/react-components';
import { X } from '@/constants/icons';
import { getGiphyClient } from '@/utils/composer/giphyClient';

interface ComposerGifPickerProps {
  searchQuery: string;
  debouncedSearch: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onSelectGifUrl: (url: string) => void;
  showMissingKeyHelp?: boolean;
}

/** Giphy search grid for post and comment composers. */
export default function ComposerGifPicker({
  searchQuery,
  debouncedSearch,
  onSearchChange,
  onClose,
  onSelectGifUrl,
  showMissingKeyHelp = false,
}: ComposerGifPickerProps) {
  const giphyClient = getGiphyClient();

  return (
    <div className="mt-3 max-h-96 overflow-y-auto rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-white">Choose a GIF</span>
        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mb-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search for GIFs..."
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 sm:text-base"
        />
      </div>
      {!giphyClient ? (
        showMissingKeyHelp ? (
          <div className="py-8 text-center text-gray-400">
            <p className="mb-2">Giphy API key not configured</p>
            <p className="text-sm">Add NEXT_PUBLIC_GIPHY_API_KEY to your .env.local file</p>
            <p className="mt-2 text-xs">Get a free API key from https://developers.giphy.com/</p>
          </div>
        ) : null
      ) : (
        <div className="w-full">
          <Grid
            key={debouncedSearch}
            onGifClick={(gif) => onSelectGifUrl(gif.images.original.url)}
            fetchGifs={(offset) => {
              const query = debouncedSearch.trim();
              if (query) return giphyClient.search(query, { offset, limit: 10 });
              return giphyClient.trending({ offset, limit: 10 });
            }}
            width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 80, 400) : 400}
            columns={2}
            gutter={6}
            noLink={true}
            hideAttribution={true}
          />
        </div>
      )}
    </div>
  );
}
