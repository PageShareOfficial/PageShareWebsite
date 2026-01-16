'use client';

import { useState, useMemo } from 'react';
import { ChartDataPoint } from '@/types/ticker';
import { TickerType } from '@/types/ticker';
import { formatCurrency } from '@/utils/ticker/tickerUtils';
import { aggregateChartData, TimeRange } from '@/utils/ticker/chartDataUtils';

interface TickerPriceChartProps {
  ticker: string;
  tickerType: TickerType;
  data: ChartDataPoint[];
  isLoading: boolean;
  error: string | null;
  timeRange: TimeRange;
  onTimeRangeChange: (range: TimeRange) => void;
}

const TIME_RANGES: Array<{ value: TimeRange; label: string }> = [
  { value: '1d', label: '1D' },
  { value: '5d', label: '5D' },
  { value: '30d', label: '30D' },
  { value: '90d', label: '90D' },
  { value: '180d', label: '180D' },
  { value: '1y', label: '1Y' },
  { value: 'all', label: 'ALL' },
];

/**
 * Simple SVG line chart component
 * Displays price history with time range selector
 */
export default function TickerPriceChart({
  ticker,
  tickerType,
  data,
  isLoading,
  error,
  timeRange,
  onTimeRangeChange,
}: TickerPriceChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; price: number; date: string } | null>(null);

  // Aggregate data based on time range interval
  const aggregatedData = useMemo(() => {
    if (data.length === 0) return [];
    return aggregateChartData(data, timeRange);
  }, [data, timeRange]);

  // Calculate chart dimensions
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };

  // Get price range for scaling (from aggregated data)
  const prices = aggregatedData.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1; // Avoid division by zero

  // Get date range (from aggregated data)
  const dates = aggregatedData.map((d) => new Date(d.date).getTime());
  const minDate = Math.min(...dates);
  const maxDate = Math.max(...dates);
  const dateRange = maxDate - minDate || 1;

  // Convert aggregated data points to SVG coordinates
  const points = aggregatedData.map((point, index) => {
    const x = padding.left + ((new Date(point.date).getTime() - minDate) / dateRange) * (chartWidth - padding.left - padding.right);
    const y = padding.top + (chartHeight - padding.top - padding.bottom) - ((point.price - minPrice) / priceRange) * (chartHeight - padding.top - padding.bottom);
    return { x, y, ...point };
  });

  // Create path for line (only if more than one point)
  // If only one point, we'll render a circle instead
  const hasMultiplePoints = points.length > 1;
  const pathData = hasMultiplePoints
    ? `M ${points[0].x} ${points[0].y} ${points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')}`
    : '';

  // Determine line color based on price trend (from aggregated data)
  // Use high value for change calculations instead of low/close price
  const firstPrice = aggregatedData[0]?.high || aggregatedData[0]?.price || 0;
  const lastPrice = aggregatedData[aggregatedData.length - 1]?.high || aggregatedData[aggregatedData.length - 1]?.price || 0;
  const isPositive = lastPrice >= firstPrice;
  const lineColor = isPositive ? '#34d399' : '#f87171'; // green-400 : red-400

  if (error) {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-6">
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center">
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (isLoading || aggregatedData.length === 0) {
    return (
      <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-6">
        <div className="h-64 w-full rounded bg-white/5 skeleton-shimmer" />
      </div>
    );
  }

  return (
    <div className="p-6 bg-white/5 border border-white/10 rounded-xl mb-6">
      {/* Time Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-white">Price Chart</h2>
          {/* Change display below heading */}
          {aggregatedData.length > 0 && (
            <div className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}
              {(((lastPrice - firstPrice) / firstPrice) * 100).toFixed(2)}%
            </div>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {TIME_RANGES.map((range) => (
            <button
              key={range.value}
              onClick={() => onTimeRangeChange(range.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors flex-shrink-0 ${
                timeRange === range.value
                  ? 'bg-white text-black font-medium'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative w-full">
        <svg
          width="100%"
          height={chartHeight}
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          preserveAspectRatio="xMidYMid meet"
          className="overflow-visible"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + (chartHeight - padding.top - padding.bottom) * (1 - ratio);
            const price = minPrice + priceRange * ratio;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={chartWidth - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.1)"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="rgba(255, 255, 255, 0.5)"
                  fontSize="12"
                  textAnchor="end"
                >
                  {formatCurrency(price)}
                </text>
              </g>
            );
          })}

          {/* Price line (only if multiple points) */}
          {hasMultiplePoints && (
            <path
              d={pathData}
              fill="none"
              stroke={lineColor}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Dots at each data point - rendered after line so they appear on top */}
          {points.map((point, index) => {
            // Skip if this point is currently hovered (hover indicator will show it)
            if (hoveredPoint && Math.abs(hoveredPoint.x - point.x) < 0.1) {
              return null;
            }
            
            // Always show first and last points with larger dots
            const isFirstOrLast = index === 0 || index === points.length - 1;
            
            return (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r={isFirstOrLast ? "4" : "3"}
                fill={lineColor}
                stroke="white"
                strokeWidth={isFirstOrLast ? "2" : "1.5"}
              />
            );
          })}

          {/* Single point (circle) if only one data point - larger for visibility */}
          {!hasMultiplePoints && points.length === 1 && (
            <circle
              cx={points[0].x}
              cy={points[0].y}
              r="4"
              fill={lineColor}
              stroke="white"
              strokeWidth="2"
            />
          )}

          {/* Hover indicator */}
          {hoveredPoint && (
            <>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={chartHeight - padding.bottom}
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4"
                fill={lineColor}
                stroke="white"
                strokeWidth="2"
              />
            </>
          )}

          {/* Interactive area for hover */}
          {points.map((point, index) => (
            <rect
              key={index}
              x={point.x - 10}
              y={padding.top}
              width="20"
              height={chartHeight - padding.top - padding.bottom}
              fill="transparent"
              onMouseEnter={() => setHoveredPoint({ x: point.x, y: point.y, price: point.price, date: point.date })}
              style={{ cursor: 'pointer' }}
            />
          ))}
        </svg>

        {/* Hover tooltip */}
        {hoveredPoint && (
          <div
            className="absolute bg-black/90 border border-white/20 rounded-lg px-3 py-2 pointer-events-none z-10"
            style={{
              left: `${(hoveredPoint.x / chartWidth) * 100}%`,
              top: `${(hoveredPoint.y / chartHeight) * 100}%`,
              transform: 'translate(-50%, -100%)',
              marginTop: '-10px',
            }}
          >
            <div className="text-white text-sm font-medium">
              {formatCurrency(hoveredPoint.price)}
            </div>
            <div className="text-gray-400 text-xs">
              {timeRange === '1d' 
                ? new Date(hoveredPoint.date).toLocaleString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  })
                : new Date(hoveredPoint.date).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
