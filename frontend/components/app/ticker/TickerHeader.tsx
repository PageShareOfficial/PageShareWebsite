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
  // Extract price and change based on type
  const price = type === 'stock' 
    ? (data as any).price 
    : (data as any).currentPrice;
  
  const change = type === 'stock'
    ? (data as any).changePercent
    : (data as any).priceChangePercent24h;
  
  const changeAmount = type === 'stock'
    ? (data as any).change
    : (data as any).priceChange24h;
  
  const name = data.name;
  const ticker = type === 'stock' 
    ? (data as any).ticker 
    : (data as any).symbol.toUpperCase();
  
  // Additional info based on type
  const exchangeOrRank = type === 'stock'
    ? (data as any).exchange
    : `#${(data as any).marketCapRank}`;
  
  const sectorOrType = type === 'stock'
    ? (data as any).industry
    : 'Cryptocurrency';

  const isPos = isPositive(change);
  const changeColor = getChangeColorClass(change);
  const ChangeIcon = isPos ? TrendingUp : TrendingDown;

  // Get image from data
  const image = type === 'stock'
    ? (data as any)?.image
    : (data as any)?.image || '';

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
