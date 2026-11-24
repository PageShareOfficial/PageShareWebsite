'use client';

import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '@/hooks/common/usePrefersReducedMotion';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
const ROLL_MS = 900;
const COLUMN_STAGGER_MS = 70;

interface DigitRollerProps {
  digit: number;
  columnIndex: number;
  prefersReducedMotion: boolean;
}

function DigitRoller({ digit, columnIndex, prefersReducedMotion }: DigitRollerProps) {
  const safeDigit = Math.min(9, Math.max(0, digit));
  const [shownDigit, setShownDigit] = useState(
    prefersReducedMotion ? safeDigit : 0
  );
  const isInitialRollRef = useRef(true);

  useEffect(() => {
    if (prefersReducedMotion) {
      setShownDigit(safeDigit);
      return undefined;
    }

    const stagger = isInitialRollRef.current
      ? columnIndex * COLUMN_STAGGER_MS
      : 0;
    isInitialRollRef.current = false;
    const timer = window.setTimeout(() => setShownDigit(safeDigit), stagger);
    return () => window.clearTimeout(timer);
  }, [safeDigit, columnIndex, prefersReducedMotion]);

  return (
    <span
      className="relative inline-block overflow-hidden align-bottom"
      style={{ height: '1em', width: '0.62em' }}
      aria-hidden
    >
      <span
        className="flex flex-col items-center transition-transform ease-out motion-reduce:transition-none"
        style={{
          transform: `translateY(-${shownDigit}em)`,
          transitionDuration: prefersReducedMotion ? '0ms' : `${ROLL_MS}ms`,
        }}
      >
        {DIGITS.map((value) => (
          <span
            key={value}
            className="flex h-[1em] w-full items-center justify-center leading-none"
          >
            {value}
          </span>
        ))}
      </span>
    </span>
  );
}

interface RollingNumberProps {
  value: number;
  className?: string;
}

export default function RollingNumber({ value, className = '' }: RollingNumberProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const formatted = Math.max(0, Math.round(value)).toLocaleString('en-US');
  const pieces = formatted.split('');
  let digitColumn = 0;

  return (
    <span
      className={`inline-flex items-baseline justify-center tabular-nums ${className}`.trim()}
      aria-label={formatted}
    >
      {pieces.map((char, index) => {
        if (!/\d/.test(char)) {
          return (
            <span key={`sep-${index}-${char}`} className="inline-block px-px">
              {char}
            </span>
          );
        }
        const columnIndex = digitColumn;
        digitColumn += 1;
        return (
          <DigitRoller
            key={`digit-col-${columnIndex}`}
            digit={Number(char)}
            columnIndex={columnIndex}
            prefersReducedMotion={prefersReducedMotion}
          />
        );
      })}
    </span>
  );
}
