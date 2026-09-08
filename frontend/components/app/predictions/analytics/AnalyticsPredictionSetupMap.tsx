'use client';

import { useCallback, useMemo, useState } from 'react';

interface AnalyticsPredictionSetupMapProps {
  position: 'long' | 'short';
  entry: number;
  target: number;
  stop: number;
  hitPrice?: number | null;
}

type MarkerTone = 'stop' | 'entry' | 'target' | 'hit';

interface SetupMarker {
  id: string;
  leftPct: number;
  label: string;
  price: number;
  tone: MarkerTone;
}

function formatCompactUsd(value: number): string {
  if (!Number.isFinite(value)) {
    return '—';
  }
  if (value >= 1) {
    return `$${value.toLocaleString('en-US', { maximumFractionDigits: 4 })}`;
  }
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 8 })}`;
}

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function pricePercent(price: number, min: number, span: number): number {
  if (span <= 0) {
    return 50;
  }
  return clampPercent(((price - min) / span) * 100);
}

function toneBadgeClass(tone: MarkerTone): string {
  if (tone === 'stop') {
    return 'border-red-400/50 bg-red-500/15 text-red-200';
  }
  if (tone === 'target') {
    return 'border-emerald-400/50 bg-emerald-500/15 text-emerald-200';
  }
  if (tone === 'hit') {
    return 'border-amber-400/50 bg-amber-500/15 text-amber-200';
  }
  return 'border-sky-400/50 bg-sky-500/15 text-sky-200';
}

function toneTickClass(tone: MarkerTone): string {
  if (tone === 'stop') {
    return 'bg-red-400';
  }
  if (tone === 'target') {
    return 'bg-emerald-400';
  }
  if (tone === 'hit') {
    return 'bg-amber-400';
  }
  return 'bg-sky-400';
}

function toneActiveRing(tone: MarkerTone): string {
  if (tone === 'stop') {
    return 'ring-red-400/70';
  }
  if (tone === 'target') {
    return 'ring-emerald-400/70';
  }
  if (tone === 'hit') {
    return 'ring-amber-400/70';
  }
  return 'ring-sky-400/70';
}

interface SetupLegendChipProps {
  marker: SetupMarker;
  isActive: boolean;
  isDimmed: boolean;
  onActivate: (id: string) => void;
  onDeactivate: () => void;
}

function SetupLegendChip({
  marker,
  isActive,
  isDimmed,
  onActivate,
  onDeactivate,
}: SetupLegendChipProps) {
  const { id, label, price, tone } = marker;
  const priceText = formatCompactUsd(price);

  return (
    <button
      type="button"
      className={`flex min-w-0 flex-1 flex-col rounded-lg border px-2.5 py-2 text-left transition-all duration-150 outline-none sm:min-w-[7rem] sm:flex-none ${
        isActive
          ? `z-10 scale-[1.02] opacity-100 ring-2 ${toneActiveRing(tone)} ${toneBadgeClass(tone)}`
          : isDimmed
            ? 'border-white/5 bg-white/[0.02] opacity-40'
            : `border-white/10 bg-black/20 opacity-100 hover:border-white/20 ${toneBadgeClass(tone)}`
      }`}
      aria-label={`${label}, ${priceText}`}
      aria-pressed={isActive}
      onMouseEnter={() => onActivate(id)}
      onFocus={() => onActivate(id)}
      onBlur={onDeactivate}
      onClick={() => (isActive ? onDeactivate() : onActivate(id))}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide opacity-90">
        {label}
      </span>
      <span className="mt-1 truncate text-sm font-semibold tabular-nums text-white">
        {priceText}
      </span>
    </button>
  );
}

export default function AnalyticsPredictionSetupMap({
  position,
  entry,
  target,
  stop,
  hitPrice,
}: AnalyticsPredictionSetupMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const onActivate = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const onDeactivate = useCallback(() => {
    setActiveId(null);
  }, []);

  const { entryPct, targetPct, stopPct, hitPct, trackGradient } = useMemo(() => {
    const prices = [entry, target, stop];
    if (hitPrice != null && Number.isFinite(hitPrice)) {
      prices.push(hitPrice);
    }
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.08 || max * 0.02 || 0.0001;
    const rangeMin = min - padding;
    const rangeMax = max + padding;
    const span = rangeMax - rangeMin;

    const gradient =
      position === 'long'
        ? 'from-red-500/30 via-sky-500/20 to-emerald-500/35'
        : 'from-emerald-500/30 via-sky-500/20 to-red-500/35';

    return {
      entryPct: pricePercent(entry, rangeMin, span),
      targetPct: pricePercent(target, rangeMin, span),
      stopPct: pricePercent(stop, rangeMin, span),
      hitPct:
        hitPrice != null && Number.isFinite(hitPrice)
          ? pricePercent(hitPrice, rangeMin, span)
          : null,
      trackGradient: gradient,
    };
  }, [entry, target, stop, hitPrice, position]);

  const markers: SetupMarker[] = useMemo(() => {
    const list: SetupMarker[] = [
      {
        id: 'stop',
        leftPct: stopPct,
        label: 'Stop loss',
        price: stop,
        tone: 'stop',
      },
      { id: 'entry', leftPct: entryPct, label: 'Entry', price: entry, tone: 'entry' },
      {
        id: 'target',
        leftPct: targetPct,
        label: 'Target',
        price: target,
        tone: 'target',
      },
    ];
    if (hitPct != null && hitPrice != null && Number.isFinite(hitPrice)) {
      list.push({
        id: 'hit',
        leftPct: hitPct,
        label: 'Hit',
        price: hitPrice,
        tone: 'hit',
      });
    }
    return list;
  }, [stopPct, entryPct, targetPct, hitPct, stop, entry, target, hitPrice]);

  return (
    <section onMouseLeave={onDeactivate}>
      <h4 className="mb-4 text-xs font-medium uppercase tracking-wide text-gray-500">
        Trade setup
      </h4>

      <div className="relative px-0.5 pt-1 pb-1">
        <div
          className={`relative h-3.5 rounded-full bg-gradient-to-r ${trackGradient} ring-1 ring-white/10`}
          aria-hidden
        >
          {markers.map((marker) => {
            const isActive = activeId === marker.id;
            const isDimmed = activeId != null && activeId !== marker.id;
            return (
              <span
                key={`tick-${marker.id}`}
                className={`absolute top-1/2 h-4 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full transition-all duration-150 ${toneTickClass(marker.tone)} ${
                  isActive
                    ? 'z-20 scale-125 shadow-[0_0_12px_currentColor] opacity-100'
                    : isDimmed
                      ? 'opacity-25'
                      : 'opacity-90'
                }`}
                style={{ left: `${marker.leftPct}%` }}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {markers.map((marker) => (
          <SetupLegendChip
            key={marker.id}
            marker={marker}
            isActive={activeId === marker.id}
            isDimmed={activeId != null && activeId !== marker.id}
            onActivate={onActivate}
            onDeactivate={onDeactivate}
          />
        ))}
      </div>
    </section>
  );
}
