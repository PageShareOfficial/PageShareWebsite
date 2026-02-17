'use client';

import { TickerDetailData, TickerType } from '@/types/ticker';
import { formatCurrency } from '@/utils/ticker/tickerUtils';
import { formatDate } from '@/utils/core/dateUtils';

interface TickerPriceStatsProps {
  data: TickerDetailData;
  type: TickerType;
}

/**
 * Price statistics component
 * Displays price ranges and statistics
 */
export default function TickerPriceStats({ data }: TickerPriceStatsProps) {
  const cryptoData = data as import('@/types/ticker').CryptoDetailData;

    const stats = [
      {
        label: 'All-Time High',
        value: formatCurrency(cryptoData.ath),
        subValue: cryptoData.athDate ? formatDate(cryptoData.athDate) || 'N/A' : null,
      },
      {
        label: 'All-Time Low',
        value: formatCurrency(cryptoData.atl),
        subValue: cryptoData.atlDate ? formatDate(cryptoData.atlDate) || 'N/A' : null,
      },
      {
        label: '24h Range',
        value: cryptoData.low24h && cryptoData.high24h
          ? `${formatCurrency(cryptoData.low24h)} - ${formatCurrency(cryptoData.high24h)}`
          : 'N/A',
      },
      {
        label: 'Market Cap Rank',
        value: cryptoData.marketCapRank ? `#${cryptoData.marketCapRank}` : 'N/A',
      },
    ];

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-6">
      <h2 className="text-lg font-semibold text-white mb-4">Price Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="min-w-0 overflow-hidden">
            <div className="text-xs text-gray-400 mb-1 truncate">{stat.label}</div>
            <div className="text-sm md:text-base text-white font-medium break-words overflow-wrap-anywhere leading-tight">
              {stat.value}
            </div>
            {stat.subValue && (
              <div className="text-xs text-gray-500 mt-1 truncate">{stat.subValue}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
