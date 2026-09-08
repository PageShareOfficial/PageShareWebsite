'use client';

import { useRef } from 'react';
import ScrollChevronButton from '@/components/app/predictions/saved-analysts/ScrollChevronButton';
import type { PredictionIndexItem } from '@/lib/api/predictionApi';

interface AnalyticsPredictionNumberStripProps {
  items: PredictionIndexItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function stripStatus(item: PredictionIndexItem): {
  label: string;
  ring: string;
  dot: string;
} {
  if (item.outcome === 'win') {
    return {
      label: 'Win',
      ring: 'ring-emerald-400/50',
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
    };
  }
  if (item.outcome === 'loss') {
    return {
      label: 'Loss',
      ring: 'ring-red-400/50',
      dot: 'bg-red-400 shadow-[0_0_8px_rgba(248,113,113,0.5)]',
    };
  }
  if (item.outcome === 'expired') {
    return {
      label: 'Expired',
      ring: 'ring-gray-400/40',
      dot: 'bg-gray-400',
    };
  }
  return {
    label: 'Live',
    ring: 'ring-amber-400/45',
    dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.45)]',
  };
}

interface PredictionCallChipProps {
  item: PredictionIndexItem;
  isLatest: boolean;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function PredictionCallChip({
  item,
  isLatest,
  isSelected,
  onSelect,
}: PredictionCallChipProps) {
  const status = stripStatus(item);
  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={`group relative flex h-[8.25rem] w-[6.75rem] shrink-0 flex-col items-center overflow-visible rounded-2xl border px-2.5 pb-2.5 pt-2 text-center transition-all duration-200 ${
        isSelected
          ? `border-white/25 bg-gradient-to-b from-white/15 to-white/[0.06] text-white shadow-lg ring-2 ${status.ring}`
          : 'border-white/10 bg-black/25 text-gray-300 hover:border-white/20 hover:bg-white/[0.06]'
      }`}
    >
      <span
        className={`mb-1 inline-flex min-h-[1.125rem] items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
          isLatest
            ? 'bg-sky-500 text-white'
            : 'invisible pointer-events-none select-none'
        }`}
        aria-hidden={!isLatest}
      >
        Latest
      </span>
      <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-gray-500">
        Call
      </span>
      <span className="mt-0.5 text-2xl font-bold tabular-nums leading-tight">
        {item.number}
      </span>
      <span className="mt-2 flex w-full items-center justify-center gap-1.5 text-xs font-medium text-gray-400">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`}
          aria-hidden
        />
        <span className="truncate">{item.asset}</span>
      </span>
      <span
        className={`mt-1 whitespace-nowrap text-[10px] font-semibold uppercase tracking-wide ${
          isSelected ? 'text-gray-300' : 'text-gray-600 group-hover:text-gray-500'
        }`}
      >
        {status.label}
      </span>
    </button>
  );
}

export default function AnalyticsPredictionNumberStrip({
  items,
  selectedId,
  onSelect,
}: AnalyticsPredictionNumberStripProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollBy = (direction: 'left' | 'right') => {
    const container = scrollRef.current;
    if (!container) {
      return;
    }
    const step = Math.max(container.clientWidth * 0.6, 120);
    container.scrollBy({
      left: direction === 'left' ? -step : step,
      behavior: 'smooth',
    });
  };

  return (
    <div className="flex items-center gap-2 overflow-visible">
      <ScrollChevronButton
        direction="left"
        disabled={items.length <= 1}
        onClick={() => scrollBy('left')}
      />
      <div
        ref={scrollRef}
        className="scrollbar-hidden min-w-0 flex-1 overflow-x-auto overscroll-x-contain scroll-smooth"
      >
        <div className="flex w-max gap-2 py-3 pl-1 pr-3 sm:gap-3">
          {items.map((item, index) => (
            <PredictionCallChip
              key={item.id}
              item={item}
              isLatest={index === 0}
              isSelected={item.id === selectedId}
              onSelect={onSelect}
            />
          ))}
        </div>
      </div>
      <ScrollChevronButton
        direction="right"
        disabled={items.length <= 1}
        onClick={() => scrollBy('right')}
      />
    </div>
  );
}
