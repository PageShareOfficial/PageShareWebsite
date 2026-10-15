import CoinbaseLogo from '@/components/app/common/CoinbaseLogo';

/**
 * Names the market data source behind entry prices and settlement. PageShare's promise leads;
 * Coinbase is credited as the source, never the headline.
 */
export default function CoinbaseDataBadge() {
  return (
    <div className="inline-flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 sm:px-4">
      <span className="text-xs sm:text-sm font-medium text-gray-200">
        Every call verified on live prices
      </span>
      <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-400">
        <span aria-hidden className="text-gray-600">
          ·
        </span>
        via
        <CoinbaseLogo className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
        <span className="font-medium text-gray-300">Coinbase</span>
      </span>
    </div>
  );
}
