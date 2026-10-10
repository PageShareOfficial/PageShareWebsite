import Image from 'next/image';
import { TrendingDown, TrendingUp } from '@/constants/icons';
import { formatCryptoPrice, formatPercentage } from '@/utils/ticker/tickerUtils';
import type { TopCrypto } from '@/utils/api/topCryptosApi';

type CryptoTickerBarProps = Readonly<{ cryptos: readonly TopCrypto[] }>;

function CryptoTickerItem({ crypto }: Readonly<{ crypto: TopCrypto }>) {
  const isUp = crypto.change24hPercent >= 0;
  const DirectionIcon = isUp ? TrendingUp : TrendingDown;
  return (
    <li className="flex shrink-0 items-center gap-2 px-5 text-sm">
      <Image src={crypto.imageUrl} alt="" width={20} height={20} className="h-5 w-5 rounded-full" />
      <span className="font-medium text-white">{crypto.name}</span>
      <span className="text-gray-500">{crypto.symbol}</span>
      <span className="text-gray-300">{formatCryptoPrice(crypto.priceUsd)}</span>
      <span
        className={`flex items-center gap-1 font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}
      >
        <DirectionIcon className="h-4 w-4" aria-hidden="true" />
        {formatPercentage(crypto.change24hPercent)}
      </span>
    </li>
  );
}

function CryptoTickerList({
  cryptos,
  hidden,
}: CryptoTickerBarProps & Readonly<{ hidden?: boolean }>) {
  return (
    <ul
      className={`flex shrink-0 items-center ${hidden ? 'motion-reduce:hidden' : ''}`}
      aria-hidden={hidden || undefined}
    >
      {cryptos.map((crypto) => (
        <CryptoTickerItem key={crypto.id} crypto={crypto} />
      ))}
    </ul>
  );
}

/** Auto-scrolling strip of top cryptos with 24h direction; renders nothing without data. */
export default function CryptoTickerBar({ cryptos }: CryptoTickerBarProps) {
  if (cryptos.length === 0) return null;
  return (
    <section
      aria-label="Top 10 cryptocurrencies, 24 hour change"
      className="relative z-10 overflow-x-auto border-b border-white/10 bg-black/90 py-2.5 scrollbar-hidden motion-safe:overflow-hidden"
    >
      {/* Two identical lists so the -50% translate loops seamlessly. */}
      <div className="flex w-max motion-safe:animate-ticker-marquee hover:[animation-play-state:paused]">
        <CryptoTickerList cryptos={cryptos} />
        <CryptoTickerList cryptos={cryptos} hidden />
      </div>
    </section>
  );
}
