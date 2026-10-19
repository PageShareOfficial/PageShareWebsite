'use client';

import { useEffect, useState } from 'react';
import { useSaleStrip } from '@/hooks/billing/useActiveSale';
import { usePrefersReducedMotion } from '@/hooks/common/usePrefersReducedMotion';
import type { SaleStripFace } from '@/lib/api/billingApi';
import { saleFaceClock } from '@/utils/billing/saleCountdown';

const FACE_HOLD_MS = 5000;

interface VisibleFace {
  face: SaleStripFace;
  clock: string;
}

function useNowMs(enabled: boolean): number {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) return undefined;
    const timerId = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timerId);
  }, [enabled]);

  return nowMs;
}

function useFaceIndex(length: number, reducedMotion: boolean): number {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reducedMotion || length < 2) return undefined;
    const timerId = window.setInterval(() => {
      setIndex((current) => (current + 1) % length);
    }, FACE_HOLD_MS);
    return () => window.clearInterval(timerId);
  }, [length, reducedMotion]);

  if (length === 0) return 0;
  return index % length;
}

function visibleFaces(faces: readonly SaleStripFace[], nowMs: number): VisibleFace[] {
  return faces.flatMap((face) => {
    const clock = saleFaceClock(face.startsAt, face.endsAt, nowMs);
    return clock ? [{ face, clock }] : [];
  });
}

function faceSummary({ face }: VisibleFace): string {
  return `${face.headline}. ${face.offer}. Code ${face.code}. ${face.percentOff}% off.`;
}

function SaleFaceLine({ face, clock }: VisibleFace) {
  return (
    <p className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center text-xs font-medium text-white sm:text-sm">
      <span className="font-semibold text-cyan-300">{face.headline}</span>
      <span className="text-cyan-400/50" aria-hidden>
        ·
      </span>
      <span>{face.offer}</span>
      <span className="text-cyan-400/50" aria-hidden>
        ·
      </span>
      <span className="rounded-full border border-cyan-400/40 bg-cyan-400/15 px-2 py-0.5 text-[0.7rem] font-semibold tracking-wide text-cyan-100 sm:text-xs">
        {face.code}
      </span>
      <span className="text-cyan-400/50" aria-hidden>
        ·
      </span>
      <span className="font-semibold">{face.percentOff}% off</span>
      <span className="text-cyan-400/50" aria-hidden>
        ·
      </span>
      <span className="tabular-nums text-cyan-200">{clock}</span>
    </p>
  );
}

interface SaleStripProps {
  /** Skip the fade. The premium overlay is already on screen. */
  immediate?: boolean;
}

/** Theme-colored sale bar. Two faces trade places until the last phase. */
export default function SaleStrip({ immediate = false }: SaleStripProps) {
  const faces = useSaleStrip();
  const nowMs = useNowMs(faces.length > 0);
  const shown = visibleFaces(faces, nowMs);
  const reducedMotion = usePrefersReducedMotion();
  const index = useFaceIndex(shown.length, reducedMotion);

  if (shown.length === 0) return null;
  const active = reducedMotion ? shown : [shown[index]];
  const faceClassName = immediate ? undefined : 'animate-fade-in';

  return (
    <section
      aria-label="Holiday sale"
      className="relative z-10 border-y border-cyan-400/35 bg-black"
    >
      <div className="bg-linear-to-r from-teal-500/15 via-cyan-400/20 to-teal-500/15">
        <p className="sr-only">{shown.map(faceSummary).join(' ')}</p>
        {active.map((item) => (
          <div key={item.face.code} className={faceClassName} aria-hidden>
            <SaleFaceLine face={item.face} clock={item.clock} />
          </div>
        ))}
      </div>
    </section>
  );
}
