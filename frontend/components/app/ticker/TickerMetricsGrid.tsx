'use client';

import { useState } from 'react';
import { TickerDetailData, TickerType } from '@/types/ticker';
import { formatLargeNumber, formatPercentage, formatRatio, formatCurrency, formatSupply, formatVolume } from '@/utils/ticker/tickerUtils';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TickerMetricsGridProps {
  data: TickerDetailData;
  type: TickerType;
}

/**
 * Comprehensive metrics grid component
 * Displays financial/market metrics organized in sections
 */
export default function TickerMetricsGrid({ data, type }: TickerMetricsGridProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['valuation']));

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  if (type === 'stock') {
    const stockData = data as any;

    const sections = [
      {
        id: 'valuation',
        title: 'Valuation Metrics',
        metrics: [
          { label: 'Market Cap', value: formatLargeNumber(stockData.marketCap) },
          { label: 'Price-to-Sales (P/S)', value: formatRatio(stockData.priceToSales) },
          { label: 'Price-to-Book (P/B)', value: formatRatio(stockData.priceToBook) },
          { label: 'PEG Ratio', value: formatRatio(stockData.pegRatio) },
          { label: 'EV/Revenue', value: formatRatio(stockData.evToRevenue) },
          { label: 'EV/EBITDA', value: formatRatio(stockData.evToEbitda) },
        ],
      },
      {
        id: 'profitability',
        title: 'Profitability Metrics',
        metrics: [
          { label: 'Profit Margin', value: formatPercentage(stockData.profitMargin) },
          { label: 'Operating Margin', value: formatPercentage(stockData.operatingMargin) },
          { label: 'Return on Assets (ROA)', value: formatPercentage(stockData.roa) },
          { label: 'Return on Equity (ROE)', value: formatPercentage(stockData.roe) },
          { label: 'Earnings Per Share (EPS)', value: formatCurrency(stockData.eps) },
        ],
      },
      {
        id: 'growth',
        title: 'Growth Metrics',
        metrics: [
          { label: 'Revenue Growth (YOY)', value: formatPercentage(stockData.revenueGrowth) },
          { label: 'Earnings Growth (YOY)', value: formatPercentage(stockData.earningsGrowth) },
          { label: 'Quarterly Revenue Growth', value: formatPercentage(stockData.quarterlyRevenueGrowth) },
          { label: 'Quarterly Earnings Growth', value: formatPercentage(stockData.quarterlyEarningsGrowth) },
        ],
      },
      {
        id: 'other',
        title: 'Other Metrics',
        metrics: [
          { label: 'Book Value', value: formatCurrency(stockData.bookValue) },
          { label: 'Shares Outstanding', value: formatLargeNumber(stockData.sharesOutstanding) },
          { label: 'Analyst Target Price', value: formatCurrency(stockData.analystTargetPrice) },
          { label: '50-Day Moving Average', value: formatCurrency(stockData.day50MA) },
          { label: '200-Day Moving Average', value: formatCurrency(stockData.day200MA) },
        ],
      },
    ];

    return (
      <div className="space-y-4 mb-6">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <div key={section.id} className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.metrics.map((metric, index) => (
                    <div key={index} className="min-w-0 overflow-hidden">
                      <div className="text-xs text-gray-400 mb-1 truncate">{metric.label}</div>
                      <div className="text-sm md:text-base text-white font-medium break-words overflow-wrap-anywhere leading-tight">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  } else {
    const cryptoData = data as any;

    const sections = [
      {
        id: 'price',
        title: 'Price Metrics',
        metrics: [
          { label: 'Current Price', value: formatCurrency(cryptoData.currentPrice) },
          { label: 'All-Time High', value: formatCurrency(cryptoData.ath) },
          { label: 'All-Time High Date', value: cryptoData.athDate ? new Date(cryptoData.athDate).toLocaleDateString() : 'N/A' },
          { label: 'All-Time Low', value: formatCurrency(cryptoData.atl) },
          { label: 'All-Time Low Date', value: cryptoData.atlDate ? new Date(cryptoData.atlDate).toLocaleDateString() : 'N/A' },
          { label: '24h High', value: formatCurrency(cryptoData.high24h) },
          { label: '24h Low', value: formatCurrency(cryptoData.low24h) },
        ],
      },
      {
        id: 'changes',
        title: 'Change Metrics',
        metrics: [
          { label: '24h Change', value: formatPercentage(cryptoData.priceChangePercent24h) },
          { label: '5d Change', value: formatPercentage(cryptoData.priceChangePercent5d) },
          { label: '30d Change', value: formatPercentage(cryptoData.priceChangePercent30d) },
          { label: '1y Change', value: formatPercentage(cryptoData.priceChangePercent1y) },
          { label: 'Market Cap Change (24h)', value: formatPercentage(cryptoData.marketCapChangePercent24h) },
        ],
      },
      {
        id: 'supply',
        title: 'Supply Metrics',
        metrics: [
          { label: 'Circulating Supply', value: formatSupply(cryptoData.circulatingSupply) },
          { label: 'Total Supply', value: cryptoData.totalSupply ? formatSupply(cryptoData.totalSupply) : 'N/A' },
          { label: 'Max Supply', value: cryptoData.maxSupply ? formatSupply(cryptoData.maxSupply) : 'Unlimited' },
          { label: 'Fully Diluted Valuation', value: formatLargeNumber(cryptoData.fullyDilutedValuation) },
        ],
      },
      {
        id: 'volume',
        title: 'Volume & Market Cap',
        metrics: [
          { label: '24h Trading Volume', value: formatVolume(cryptoData.totalVolume) },
          { label: 'Market Cap', value: formatLargeNumber(cryptoData.marketCap) },
          { label: 'Market Cap Rank', value: cryptoData.marketCapRank ? `#${cryptoData.marketCapRank}` : 'N/A' },
        ],
      },
    ];

    return (
      <div className="space-y-4 mb-6">
        {sections.map((section) => {
          const isExpanded = expandedSections.has(section.id);
          return (
            <div key={section.id} className="p-6 bg-white/5 border border-white/10 rounded-xl">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full flex items-center justify-between mb-4"
              >
                <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {section.metrics.map((metric, index) => (
                    <div key={index} className="min-w-0 overflow-hidden">
                      <div className="text-xs text-gray-400 mb-1 truncate">{metric.label}</div>
                      <div className="text-sm md:text-base text-white font-medium break-words overflow-wrap-anywhere leading-tight">
                        {metric.value}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }
}
