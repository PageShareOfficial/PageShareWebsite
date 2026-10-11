import CoinbaseLogo from '@/components/app/common/CoinbaseLogo';

/** States the market data source behind prediction entry prices and verification. */
export default function CoinbaseDataBadge() {
  return (
    <div className="flex w-full max-w-md flex-wrap items-center justify-center gap-x-2.5 gap-y-1 rounded-2xl border border-[#0052FF]/50 bg-[#0052FF]/10 px-4 py-3 sm:px-5 sm:py-3.5 text-center shadow-[0_0_30px_rgba(0,82,255,0.15)]">
      <span className="text-sm sm:text-base text-gray-200">Every call priced &amp; verified on real</span>
      <span className="inline-flex items-center gap-2">
        <CoinbaseLogo className="h-6 w-6 sm:h-7 sm:w-7 shrink-0" />
        <span className="text-base sm:text-lg font-bold text-white">Coinbase</span>
        <span className="text-sm sm:text-base text-gray-200">crypto market data</span>
      </span>
    </div>
  );
}
