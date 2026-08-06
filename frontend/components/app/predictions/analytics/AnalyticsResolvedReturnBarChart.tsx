'use client';

import AnalyticsChartCard from '@/components/app/predictions/analytics/AnalyticsChartCard';
import { ANALYTICS_OUTCOME_BAR_FILL } from '@/utils/predictions/analyticsChartData';
import { formatSignedPercentAxis } from '@/utils/predictions/analyticsFormat';

export interface ResolvedReturnBarPoint {
  index: number;
  outcome: 'win' | 'loss' | 'expired';
  return_percent: number;
  asset: string;
}

interface AnalyticsResolvedReturnBarChartProps {
  bars: ResolvedReturnBarPoint[];
  title?: string;
  heightClass?: string;
  className?: string;
}

function valueToY(
  value: number,
  minY: number,
  maxY: number,
  chartH: number,
  paddingY: number
): number {
  const range = maxY - minY || 1;
  return paddingY + chartH - ((value - minY) / range) * chartH;
}

function formatAxisPercent(value: number): string {
  return formatSignedPercentAxis(value);
}

function buildYTicks(axisMin: number, axisMax: number): number[] {
  const ticks = new Set<number>([0, axisMin, axisMax]);
  return Array.from(ticks).sort((a, b) => a - b);
}

const MIN_BAR_SLOT_PX = 28;
const BASE_CHART_WIDTH = 400;

export default function AnalyticsResolvedReturnBarChart({
  bars,
  title,
  heightClass = 'h-44 sm:h-52',
  className = '',
}: AnalyticsResolvedReturnBarChartProps) {
  const height = 160;
  const paddingLeft = 36;
  const paddingRight = 8;
  const paddingTop = 10;
  const paddingBottom = 22;

  if (bars.length === 0) {
    return (
      <AnalyticsChartCard title={title} className={className}>
        <div
          className={`flex ${heightClass} flex-col items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 px-4 text-center text-xs text-gray-500`}
        >
          <p>No resolved predictions in the last 30 days.</p>
        </div>
      </AnalyticsChartCard>
    );
  }

  const values = bars.map((bar) => bar.return_percent);
  const minY = Math.min(0, ...values);
  const maxY = Math.max(0, ...values);
  const paddingRange =
    maxY === minY ? 1 : Math.max(Math.abs(maxY), Math.abs(minY)) * 0.08;
  const yMin = minY === maxY && minY === 0 ? -1 : minY - paddingRange;
  const yMax = minY === maxY && minY === 0 ? 1 : maxY + paddingRange;

  const plotMinWidth = bars.length * MIN_BAR_SLOT_PX;
  const width = Math.max(
    BASE_CHART_WIDTH,
    paddingLeft + paddingRight + plotMinWidth
  );
  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  const zeroY = valueToY(0, yMin, yMax, chartH, paddingTop);
  const barSlot = chartW / bars.length;
  const barWidth = Math.min(28, Math.max(6, barSlot * 0.65));
  const yTicks = buildYTicks(yMin, yMax);

  const showEveryIndexLabel = bars.length <= 12;
  const indexLabelStep = showEveryIndexLabel
    ? 1
    : Math.ceil(bars.length / 8);

  const needsHorizontalScroll = width > BASE_CHART_WIDTH;

  return (
    <AnalyticsChartCard title={title} className={className}>
      <div className="-mx-1 overflow-x-auto overscroll-x-contain px-1 pb-0.5">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="xMidYMid meet"
          className={`${heightClass} ${
            needsHorizontalScroll ? 'max-w-none shrink-0' : 'w-full'
          }`}
          style={
            needsHorizontalScroll
              ? { width: `${width}px`, height: 'auto' }
              : undefined
          }
          role="img"
          aria-label="Return by resolved prediction"
        >
        {yTicks.map((tick) => {
          const y = valueToY(tick, yMin, yMax, chartH, paddingTop);
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="white"
                strokeOpacity={tick === 0 ? 0.12 : 0.06}
                strokeWidth={1}
                strokeDasharray={tick === 0 ? '4 4' : undefined}
              />
              <text
                x={paddingLeft - 6}
                y={y + 3.5}
                textAnchor="end"
                fill="rgb(156 163 175)"
                fontSize={9}
                fontFamily="system-ui, sans-serif"
              >
                {formatAxisPercent(tick)}
              </text>
            </g>
          );
        })}

        {bars.map((bar) => {
          const centerX = paddingLeft + (bar.index - 0.5) * barSlot;
          const valueY = valueToY(
            bar.return_percent,
            yMin,
            yMax,
            chartH,
            paddingTop
          );
          const barTop = Math.min(valueY, zeroY);
          const barHeight = Math.max(Math.abs(valueY - zeroY), 1);
          const fill = ANALYTICS_OUTCOME_BAR_FILL[bar.outcome];
          const title = `#${bar.index} ${bar.asset}: ${formatAxisPercent(bar.return_percent)} (${bar.outcome})`;

          return (
            <g key={bar.index}>
              <title>{title}</title>
              <rect
                x={centerX - barWidth / 2}
                y={barTop}
                width={barWidth}
                height={barHeight}
                rx={2}
                fill={fill}
                fillOpacity={bar.outcome === 'expired' ? 0.55 : 0.9}
              />
              {(bar.index === 1 ||
                bar.index === bars.length ||
                bar.index % indexLabelStep === 0) && (
                <text
                  x={centerX}
                  y={height - 6}
                  textAnchor="middle"
                  fill="rgb(107 114 128)"
                  fontSize={9}
                  fontFamily="system-ui, sans-serif"
                >
                  {bar.index}
                </text>
              )}
            </g>
          );
        })}

        <text
          x={paddingLeft + chartW / 2}
          y={height - 1}
          textAnchor="middle"
          fill="rgb(107 114 128)"
          fontSize={8}
          fontFamily="system-ui, sans-serif"
        >
          Resolved prediction
        </text>
        </svg>
      </div>
    </AnalyticsChartCard>
  );
}
