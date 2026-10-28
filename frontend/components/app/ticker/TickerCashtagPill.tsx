'use client';

import Link from 'next/link';
import TickerImage from '@/components/app/ticker/TickerImage';
import { tickerPath } from '@/constants/routes';
import { formatCashtagLabel, parseCashtagSymbol } from '@/utils/ticker/cashtagUtils';
import { getTickerIconUrl } from '@/utils/ticker/logoUtils';

interface TickerCashtagPillProps {
  /** Raw cashtag including `$`, e.g. `$btc`. */
  tag: string;
  interactive?: boolean;
}

function CashtagPillFace({ symbol, label }: { symbol: string; label: string }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-white/20 bg-white/10 py-0.5 pl-0.5 pr-2 align-middle">
      <TickerImage
        src={getTickerIconUrl(symbol)}
        ticker={symbol}
        squarePx={16}
        inline
        className="!rounded-full border-0 bg-black/40"
      />
      <span className="text-sm font-semibold text-cyan-400">{label}</span>
    </span>
  );
}

/** Inline logo + `$TICKER` pill used inside post and comment text. */
export default function TickerCashtagPill({
  tag,
  interactive = true,
}: TickerCashtagPillProps) {
  const symbol = parseCashtagSymbol(tag);
  if (!symbol) return null;

  const label = formatCashtagLabel(symbol);
  const face = <CashtagPillFace symbol={symbol} label={label} />;

  if (!interactive) return face;

  return (
    <Link
      href={tickerPath(symbol)}
      onClick={(event) => event.stopPropagation()}
      aria-label={label}
      className="inline-flex max-w-full align-middle hover:opacity-90"
    >
      {face}
    </Link>
  );
}
