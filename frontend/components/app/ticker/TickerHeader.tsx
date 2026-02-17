'use client';

import { TickerDetailData, TickerType } from '@/types/ticker';
import { formatCurrency, formatPercentage, getChangeColorClass, isPositive } from '@/utils/ticker/tickerUtils';
import { TrendingUp, TrendingDown } from 'lucide-react';
import TickerTypeBadge from '@/components/app/common/TickerTypeBadge';
import TickerImage from '@/components/app/ticker/TickerImage';

interface TickerHeaderProps {
  data: TickerDetailData;
  type: TickerType;
}

/**
 * Ticker header component
 * Displays ticker name, symbol, price, and change prominently
 */
export default function TickerHeader({ data, type }: TickerHeaderProps) {
  const d = data as { currentPrice: number; priceChangePercent24h: number; priceChange24h: number; name: string; symbol: string; marketCapRank: number; image?: string };
  const price = d.currentPrice;
  const change = d.priceChangePercent24h;
  const changeAmount = d.priceChange24h;
  const name = d.name;
  const ticker = d.symbol?.toUpperCase() ?? '';
  const exchangeOrRank = d.marketCapRank != null ? `#${d.marketCapRank}` : '';
  const sectorOrType = 'Cryptocurrency';
  const isPos = isPositive(change);
  const changeColor = getChangeColorClass(change);
  const ChangeIcon = isPos ? TrendingUp : TrendingDown;
  const image = d.image ?? '';
  void type;

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Image, Name and Ticker */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            {/* Ticker Image */}
            <TickerImage
              src={image}
              ticker={ticker}
              size="md"
              showShimmer={true}
            />
            <h1 className="text-2xl md:text-3xl font-bold text-white truncate">
              {name}
            </h1>
            <TickerTypeBadge type={type} size="md" className="flex-shrink-0" />
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span className="font-semibold text-white text-lg">
              ${ticker}
            </span>
            {exchangeOrRank && (
              <span className="hidden md:inline">
                {exchangeOrRank}
              </span>
            )}
            {sectorOrType && (
              <span className="hidden md:inline">
                {sectorOrType}
              </span>
            )}
          </div>
        </div>

        {/* Right: Price and Change */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-3xl md:text-4xl font-bold text-white">
            {formatCurrency(price)}
          </div>
          
          <div className={`flex items-center gap-2 font-semibold ${changeColor}`}>
            <ChangeIcon className="w-5 h-5" />
            <span className="text-lg">
              {formatPercentage(change)}
            </span>
            {changeAmount !== null && changeAmount !== undefined && (
              <span className="text-sm text-gray-400">
                ({isPos ? '+' : ''}{formatCurrency(changeAmount)})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
