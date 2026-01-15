'use client';

import { TickerDetailData, TickerType } from '@/types/ticker';
import { formatLargeNumber, formatPercentage, formatRatio, formatSupply, formatVolume } from '@/utils/ticker/tickerUtils';

interface TickerKeyMetricsProps {
  data: TickerDetailData;
  type: TickerType;
}

/**
 * Key metrics component
 * Displays important metrics in a card grid layout
 */
export default function TickerKeyMetrics({ data, type }: TickerKeyMetricsProps) {
  if (type === 'stock') {
    const stockData = data as any;
    
    const metrics = [
      {
        label: 'Market Cap',
        value: formatLargeNumber(stockData.marketCap),
      },
      {
        label: 'P/E Ratio',
        value: formatRatio(stockData.peRatio),
      },
      {
        label: 'Dividend Yield',
        value: formatPercentage(stockData.dividendYield),
      },
      {
        label: '52W High',
        value: formatLargeNumber(stockData.week52High),
      },
      {
        label: '52W Low',
        value: formatLargeNumber(stockData.week52Low),
      },
      {
        label: 'Beta',
        value: formatRatio(stockData.beta),
      },
      {
        label: 'Volume',
        value: formatVolume(stockData.volume),
      },
      {
        label: 'EPS',
        value: formatRatio(stockData.eps),
      },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl min-w-0 overflow-hidden"
          >
            <div className="text-xs text-gray-400 mb-1 truncate">{metric.label}</div>
            <div className="text-sm md:text-base lg:text-lg font-semibold text-white break-words overflow-wrap-anywhere leading-tight">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    );
  } else {
    const cryptoData = data as any;
    
    const metrics = [
      {
        label: 'Market Cap',
        value: formatLargeNumber(cryptoData.marketCap),
      },
      {
        label: '24h Volume',
        value: formatVolume(cryptoData.totalVolume),
      },
      {
        label: 'Circulating Supply',
        value: formatSupply(cryptoData.circulatingSupply),
      },
      {
        label: 'Total Supply',
        value: cryptoData.totalSupply ? formatSupply(cryptoData.totalSupply) : 'N/A',
      },
      {
        label: 'Max Supply',
        value: cryptoData.maxSupply ? formatSupply(cryptoData.maxSupply) : 'Unlimited',
      },
      {
        label: 'Market Cap Rank',
        value: cryptoData.marketCapRank ? `#${cryptoData.marketCapRank}` : 'N/A',
      },
      {
        label: '24h High',
        value: formatLargeNumber(cryptoData.high24h),
      },
      {
        label: '24h Low',
        value: formatLargeNumber(cryptoData.low24h),
      },
    ];

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div
            key={index}
            className="p-3 md:p-4 bg-white/5 border border-white/10 rounded-xl min-w-0 overflow-hidden"
          >
            <div className="text-xs text-gray-400 mb-1 truncate">{metric.label}</div>
            <div className="text-sm md:text-base lg:text-lg font-semibold text-white break-words overflow-wrap-anywhere leading-tight">
              {metric.value}
            </div>
          </div>
        ))}
      </div>
    );
  }
}
