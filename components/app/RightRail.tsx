'use client';

import { Settings } from 'lucide-react';
import { WatchlistItem, Narrative } from '@/types';

interface RightRailProps {
  watchlist: WatchlistItem[];
  narratives: Narrative[];
  onManageWatchlist: () => void;
  onUpgradeLabs: () => void;
}

export default function RightRail({
  watchlist,
  narratives,
  onManageWatchlist,
  onUpgradeLabs,
}: RightRailProps) {
  return (
    <aside className="hidden lg:block w-80 space-y-6 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      {/* Watchlist Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Watchlist</h2>
          <button
            onClick={onManageWatchlist}
            className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Manage watchlist"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          {watchlist.map((item) => (
            <div key={item.ticker} className="flex items-center justify-between">
              <div>
                <div className="font-medium text-gray-900">{item.ticker}</div>
                <div className="text-xs text-gray-500">{item.name}</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-gray-900">${item.price.toFixed(2)}</div>
                <div
                  className={`text-xs font-medium ${
                    item.change >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {item.change >= 0 ? '+' : ''}
                  {item.change.toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Narratives Card */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Narratives</h2>
        </div>
        <div className="space-y-4 mb-4">
          {narratives.map((narrative) => (
            <div key={narrative.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-900">{narrative.title}</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {narrative.score}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {narrative.relatedTickers.map((ticker) => (
                  <span
                    key={ticker}
                    className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded border border-gray-200"
                  >
                    {ticker}
                  </span>
                ))}
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all"
                  style={{ width: `${narrative.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200">
          Open Narrative Tracker
        </button>
      </div>

      {/* Labs Pro Card */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Labs Pro</h2>
        <p className="text-sm text-gray-600 mb-4">
          Premium AI tools, deeper filters, and credibility analytics.
        </p>
        <button
          onClick={onUpgradeLabs}
          className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          Upgrade
        </button>
      </div>
    </aside>
  );
}

