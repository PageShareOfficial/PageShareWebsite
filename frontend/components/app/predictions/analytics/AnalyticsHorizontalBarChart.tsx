'use client';
import AnalyticsChartCard from '@/components/app/predictions/analytics/AnalyticsChartCard';

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsHorizontalBarChartProps {
  items: BarChartItem[];
  title?: string;
  maxValue?: number;
  emptyMessage?: string;
  className?: string;
  /** Max height for the bar list; enables vertical scroll when content overflows. */
  scrollMaxHeightClass?: string;
}

export default function AnalyticsHorizontalBarChart({
  items,
  title,
  maxValue,
  emptyMessage = 'No data yet',
  className = '',
  scrollMaxHeightClass,
}: AnalyticsHorizontalBarChartProps) {
  const peak = maxValue ?? Math.max(...items.map((i) => i.value), 1);

  const emptyBody = (
    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-white/10 bg-black/20 text-xs text-gray-500">
      {emptyMessage}
    </div>
  );

  const barList = (
    <div className="space-y-3" role="img" aria-label="Bar chart">
      {items.map((item) => {
        const widthPct = Math.max(4, (item.value / peak) * 100);
        return (
          <div key={item.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-medium text-gray-300">{item.label}</span>
              <span className="tabular-nums text-gray-400">{item.value}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${widthPct}%`,
                  backgroundColor: item.color ?? 'rgb(52 211 153 / 0.85)',
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );

  const chartBody =
    items.length === 0 || peak <= 0 ? (
      emptyBody
    ) : scrollMaxHeightClass ? (
      <div
        className={`${scrollMaxHeightClass} overflow-y-auto overscroll-y-contain pr-1`}
      >
        {barList}
      </div>
    ) : (
      barList
    );

  if (!title) {
    return <div className={className}>{chartBody}</div>;
  }

  return (
    <AnalyticsChartCard title={title} className={className}>
      {chartBody}
    </AnalyticsChartCard>
  );
}
