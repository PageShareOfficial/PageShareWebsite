'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import TickerImage from '@/components/app/ticker/TickerImage';
import { useCashtagImages } from '@/hooks/composer/useCashtagImages';
import { extractCashtags } from '@/utils/core/textFormatting';

interface DetectedCashtagsRowProps {
  text: string;
}

function cashtagToSymbol(tag: string): string {
  return tag.slice(1).toUpperCase();
}

export default function DetectedCashtagsRow({ text }: DetectedCashtagsRowProps) {
  const cashtags = useMemo(() => extractCashtags(text), [text]);
  const symbols = useMemo(() => cashtags.map(cashtagToSymbol), [cashtags]);
  const imageByTicker = useCashtagImages(symbols);

  if (cashtags.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <span className="text-xs text-gray-500 shrink-0">Tickers:</span>
      {symbols.map((symbol) => (
        <Link
          key={symbol}
          href={`/ticker/${symbol}`}
          className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 pl-1 pr-2.5 py-1 hover:bg-white/10 transition-colors"
        >
          <TickerImage
            src={imageByTicker[symbol]}
            ticker={symbol}
            size="sm"
            className="!w-6 !h-6 !rounded-md !border-0"
          />
          <span className="text-xs font-semibold text-white">{symbol}</span>
        </Link>
      ))}
    </div>
  );
}
