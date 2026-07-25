'use client';

export interface BarChartItem {
  label: string;
  value: number;
  color?: string;
}

interface AnalyticsHorizontalBarChartProps {
  items: BarChartItem[];
  maxValue?: number;
  emptyMessage?: string;
  className?: string;
}

export default function AnalyticsHorizontalBarChart({
  items,
  maxValue,
  emptyMessage = 'No data yet',
  className = '',
}: AnalyticsHorizontalBarChartProps) {
  const peak = maxValue ?? Math.max(...items.map((i) => i.value), 1);

  if (items.length === 0 || peak <= 0) {
    return (
      <div
        className={`flex h-32 items-center justify-center rounded-xl border border-dashed border-white/10 text-xs text-gray-500 ${className}`}
      >
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`} role="img" aria-label="Bar chart">
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
}
