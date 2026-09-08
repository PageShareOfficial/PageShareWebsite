'use client';
import AnalyticsChartCard, {
  ANALYTICS_CHART_BORDER_CLASS,
} from '@/components/app/predictions/analytics/AnalyticsChartCard';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

interface AnalyticsScaledMetricBarProps {
  title: string;
  rowLabel: string;
  value: number;
  scaleMin: number;
  scaleMax?: number;
  /** When true, bar is 100% fill; only scaleMin shown (no upper bound). */
  fullBar?: boolean;
  formatScaleLabel?: (value: number) => string;
  formatValue?: (value: number) => string;
  barColor?: string;
}

function defaultFormat(value: number): string {
  return String(value);
}

export default function AnalyticsScaledMetricBar({
  title,
  rowLabel,
  value,
  scaleMin,
  scaleMax,
  fullBar = false,
  formatScaleLabel = defaultFormat,
  formatValue = defaultFormat,
  barColor = 'rgb(52 211 153 / 0.85)',
}: AnalyticsScaledMetricBarProps) {
  let fillPct = 100;
  if (!fullBar) {
    if (scaleMax == null) {
      fillPct = 0;
    } else {
      const range = scaleMax - scaleMin;
      const normalized =
        range > 0 ? (clamp(value, scaleMin, scaleMax) - scaleMin) / range : 0;
      fillPct = Math.max(normalized > 0 ? 4 : 0, normalized * 100);
    }
  }

  return (
    <AnalyticsChartCard title={title}>
      <div role="img" aria-label={`${title}: ${formatValue(value)}`}>
        <div className="mb-1 flex justify-between text-xs">
          <span className="font-medium text-gray-300">{rowLabel}</span>
          <span className="tabular-nums text-gray-400">
            {formatValue(value)}
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${fillPct}%`,
              backgroundColor: barColor,
            }}
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] tabular-nums text-gray-500">
          <span>{formatScaleLabel(scaleMin)}</span>
          {!fullBar && scaleMax != null ? (
            <span>{formatScaleLabel(scaleMax)}</span>
          ) : (
            <span aria-hidden />
          )}
        </div>
      </div>
    </AnalyticsChartCard>
  );
}

export function AnalyticsScaledMetricBarSkeleton({
  titleWidth = 100,
}: {
  titleWidth?: number;
}) {
  return (
    <div className={ANALYTICS_CHART_BORDER_CLASS} aria-hidden>
      <div
        className="mb-3 h-3 rounded bg-white/10"
        style={{ width: titleWidth }}
      />
      <div className="mb-1 flex justify-between">
        <div className="h-3 w-24 rounded bg-white/10" />
        <div className="h-3 w-10 rounded bg-white/10" />
      </div>
      <div className="h-3 rounded-full bg-white/10" />
      <div className="mt-1 flex justify-between">
        <div className="h-2.5 w-6 rounded bg-white/10" />
        <div className="h-2.5 w-6 rounded bg-white/10" />
      </div>
    </div>
  );
}
