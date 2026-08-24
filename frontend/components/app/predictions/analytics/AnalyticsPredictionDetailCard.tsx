'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  CalendarClock,
  Lock,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import Skeleton from '@/components/app/common/Skeleton';
import ImageWithFallback from '@/components/app/common/ImageWithFallback';
import TickerImage from '@/components/app/ticker/TickerImage';
import { useCashtagImages } from '@/hooks/composer/useCashtagImages';
import AnalyticsPredictionSetupMap from '@/components/app/predictions/analytics/AnalyticsPredictionSetupMap';
import PredictionOnChainProof from '@/components/app/predictions/analytics/PredictionOnChainProof';
import type { PredictionAnalyticsDetail } from '@/lib/api/predictionApi';
import { computeRiskReward } from '@/utils/predictions/predictionRules';
import { formatDateTime } from '@/utils/core/dateUtils';
import { formatSignedPercent } from '@/utils/predictions/analyticsFormat';
import { shouldShowOnChainProof } from '@/utils/predictions/polygonExplorer';

interface AnalyticsPredictionDetailCardProps {
  detail: PredictionAnalyticsDetail | null;
  isLoading: boolean;
  showSettleOnViewHint?: boolean;
}

interface PredictionAssetHeadingProps {
  asset: string;
  assetName?: string | null;
  imageSrc?: string;
}

function PredictionAssetHeading({
  asset,
  assetName,
  imageSrc,
}: PredictionAssetHeadingProps) {
  const textRef = useRef<HTMLDivElement>(null);
  const [iconSizePx, setIconSizePx] = useState<number | null>(null);

  useEffect(() => {
    const element = textRef.current;
    if (!element) return;

    const syncIconSize = () => {
      const height = element.getBoundingClientRect().height;
      if (height > 0) {
        setIconSizePx(Math.round(height));
      }
    };

    syncIconSize();
    const observer = new ResizeObserver(syncIconSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, [asset, assetName]);

  return (
    <div className="mt-3 flex items-start gap-3">
      <TickerImage
        src={imageSrc}
        ticker={asset}
        squarePx={iconSizePx ?? undefined}
        size={iconSizePx == null ? 'md' : 'sm'}
        showShimmer
        className="rounded-xl"
      />
      <div ref={textRef} className="min-w-0">
        <h3 className="text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
          {asset}
        </h3>
        {assetName ? (
          <p className="mt-1 text-sm leading-snug text-gray-400">{assetName}</p>
        ) : null}
      </div>
    </div>
  );
}

function outcomeMeta(outcome: string | null | undefined, isActive: boolean) {
  if (isActive) {
    return {
      label: 'Live',
      headerGlow: 'from-amber-500/20 via-amber-500/5 to-transparent',
      badge: 'bg-amber-500/20 text-amber-200 ring-amber-400/30',
    };
  }
  if (outcome === 'win') {
    return {
      label: 'Win',
      headerGlow: 'from-emerald-500/25 via-emerald-500/5 to-transparent',
      badge: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/30',
    };
  }
  if (outcome === 'loss') {
    return {
      label: 'Loss',
      headerGlow: 'from-red-500/25 via-red-500/5 to-transparent',
      badge: 'bg-red-500/20 text-red-200 ring-red-400/30',
    };
  }
  if (outcome === 'expired') {
    return {
      label: 'Expired',
      headerGlow: 'from-gray-500/20 via-gray-500/5 to-transparent',
      badge: 'bg-gray-500/25 text-gray-200 ring-gray-400/25',
    };
  }
  return {
    label: 'Pending',
    headerGlow: 'from-violet-500/15 via-transparent to-transparent',
    badge: 'bg-white/10 text-gray-200 ring-white/15',
  };
}

function MetricTile({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent?: 'positive' | 'negative' | 'neutral';
}) {
  const valueClass =
    accent === 'positive'
      ? 'text-emerald-300'
      : accent === 'negative'
        ? 'text-red-300'
        : 'text-white';

  return (
    <div className="rounded-xl border border-white/10 bg-black/25 p-3">
      <div className="flex items-center gap-1.5 text-gray-500">{icon}</div>
      <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-0.5 text-lg font-semibold tabular-nums ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function PredictionTimeline({
  steps,
}: {
  steps: { label: string; value: string }[];
}) {
  const count = steps.length;
  if (count === 0) {
    return null;
  }

  const lineInsetPercent = 100 / (2 * count);

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4">
      <div
        className="relative grid gap-x-2 gap-y-4 sm:gap-x-3"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {count > 1 ? (
          <div
            className="pointer-events-none absolute top-3 hidden h-px bg-white/10 sm:block"
            style={{
              left: `${lineInsetPercent}%`,
              right: `${lineInsetPercent}%`,
            }}
            aria-hidden
          />
        ) : null}
        {steps.map((step) => (
          <div key={step.label} className="relative z-[1] min-w-0">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-[#141414] text-[10px] font-bold text-gray-400 ring-4 ring-[#141414]">
              •
            </span>
            <p className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              {step.label}
            </p>
            <p className="mt-0.5 break-words text-xs tabular-nums leading-snug text-gray-300">
              {step.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AnalyticsPredictionDetailCard({
  detail,
  isLoading,
  showSettleOnViewHint = false,
}: AnalyticsPredictionDetailCardProps) {
  const assetSymbols = detail?.prediction.asset
    ? [detail.prediction.asset]
    : [];
  const imageByTicker = useCashtagImages(assetSymbols);

  if (isLoading && !detail) {
    return (
      <div
        className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
        aria-busy="true"
      >
        <Skeleton variant="rectangular" width="100%" height={140} rounded="rounded-none" />
        <div className="space-y-3 p-4 sm:p-5">
          <Skeleton variant="rectangular" width="100%" height={88} rounded="rounded-xl" />
          <div className="grid grid-cols-3 gap-2">
            <Skeleton variant="rectangular" width="100%" height={72} rounded="rounded-xl" />
            <Skeleton variant="rectangular" width="100%" height={72} rounded="rounded-xl" />
            <Skeleton variant="rectangular" width="100%" height={72} rounded="rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!detail) {
    return null;
  }

  const { number, prediction: p } = detail;
  const rr = computeRiskReward(p.entry_price, p.target_price, p.stop_loss);
  const rrText = Number.isNaN(rr) ? '—' : `${rr.toFixed(2)}R`;
  const isActive = p.status === 'active' && !p.outcome;
  const meta = outcomeMeta(p.outcome, isActive);
  const isLong = p.position === 'long';
  const PositionIcon = isLong ? TrendingUp : TrendingDown;
  const positionTone = isLong
    ? 'text-emerald-300 bg-emerald-500/15 ring-emerald-400/25'
    : 'text-red-300 bg-red-500/15 ring-red-400/25';

  const returnAccent =
    p.return_pct == null
      ? undefined
      : p.return_pct >= 0
        ? 'positive'
        : 'negative';

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-[0_24px_80px_-40px_rgba(0,0,0,0.9)]">
      <header
        className={`relative border-b border-white/10 bg-gradient-to-br ${meta.headerGlow} px-4 pb-5 pt-4 sm:px-6 sm:pt-5`}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 ring-1 ring-white/10">
                Call #{number}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase ring-1 ${positionTone}`}
              >
                <PositionIcon className="h-3.5 w-3.5" aria-hidden />
                {p.position}
              </span>
            </div>
            <PredictionAssetHeading
              asset={p.asset}
              assetName={p.asset_name}
              imageSrc={imageByTicker[p.asset.toUpperCase()]}
            />
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ring-1 ${meta.badge}`}
          >
            {meta.label}
          </span>
        </div>

        {p.return_pct != null && !isActive ? (
          <p
            className={`mt-4 text-3xl font-bold tabular-nums sm:text-4xl ${
              returnAccent === 'positive' ? 'text-emerald-300' : 'text-red-300'
            }`}
          >
            {formatSignedPercent(p.return_pct * 100)}
            <span className="ml-2 text-sm font-medium text-gray-500">realized</span>
          </p>
        ) : null}
      </header>

      <div className="space-y-5 px-4 py-5 sm:px-6">
        {isActive && showSettleOnViewHint ? (
          <p className="flex gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100/95">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            Locked call — read-only. Past expiry, opening this card evaluates just
            this prediction.
          </p>
        ) : isActive ? (
          <p className="flex gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 text-xs leading-relaxed text-gray-400">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Locked call — outcome updates when the analyst settles it.
          </p>
        ) : null}

        <AnalyticsPredictionSetupMap
          position={p.position}
          entry={p.entry_price}
          target={p.target_price}
          stop={p.stop_loss}
          hitPrice={p.hit_price}
        />

        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <MetricTile
            icon={<Target className="h-3.5 w-3.5" aria-hidden />}
            label="Setup RR"
            value={rrText}
          />
          <MetricTile
            icon={<Sparkles className="h-3.5 w-3.5" aria-hidden />}
            label="Confidence"
            value={`${Math.round(p.confidence * 100)}%`}
          />
          <MetricTile
            icon={<CalendarClock className="h-3.5 w-3.5" aria-hidden />}
            label={p.return_pct != null ? 'Return' : 'Status'}
            value={
              p.return_pct != null
                ? formatSignedPercent(p.return_pct * 100)
                : isActive
                  ? 'Active'
                  : meta.label
            }
            accent={returnAccent}
          />
        </div>

        <PredictionTimeline
          steps={[
            { label: 'Submitted', value: formatDateTime(p.start_time) },
            { label: 'Expires', value: formatDateTime(p.expiry_at) },
            {
              label: 'Hit At',
              value: p.hit_at ? formatDateTime(p.hit_at) : '—',
            },
            {
              label: 'Resolved',
              value: p.resolved_at ? formatDateTime(p.resolved_at) : '—',
            },
          ]}
        />

        {shouldShowOnChainProof(p) && p.content_hash ? (
          <PredictionOnChainProof
            contentHash={p.content_hash}
            chainTxHash={p.chain_tx_hash}
            chainId={p.chain_id}
            explorerUrl={p.explorer_url}
          />
        ) : null}

        <div
          className={`flex flex-col gap-4 ${
            p.thesis_image_url ? 'lg:flex-row lg:items-stretch' : ''
          }`}
        >
          <blockquote className="relative min-w-0 flex-1 rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-transparent px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Thesis
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-200">
              {p.thesis}
            </p>
          </blockquote>

          {p.thesis_image_url ? (
            <div className="flex min-w-0 flex-1 flex-col">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                Chart snapshot
              </p>
              <div className="relative min-h-[220px] flex-1 overflow-hidden rounded-xl border border-white/10 bg-black/30">
                <ImageWithFallback
                  src={p.thesis_image_url}
                  alt="Thesis chart"
                  fit="contain"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  fallback={
                    <div className="flex h-full min-h-[220px] items-center justify-center px-4 text-center text-sm text-gray-500">
                      Chart could not be loaded
                    </div>
                  }
                  className="h-full min-h-[220px] w-full"
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
