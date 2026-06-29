'use client';

import VerifiedTickIcon from '@/components/app/common/VerifiedTickIcon';
import { VERIFIED_TICK_COLORS } from '@/constants/verifiedTick';
import type { PlanTheme } from './planData';

interface PlanTickRibbonProps {
  theme: PlanTheme;
}

const RIBBON_HEIGHT = 140;
const RIBBON_WIDTH = 60;
const RIBBON_NOTCH_START = 100;
const RIBBON_DISPLAY_WIDTH_PX = 33;
const RIBBON_DISPLAY_HEIGHT_PX = Math.round(
  RIBBON_DISPLAY_WIDTH_PX * (RIBBON_HEIGHT / RIBBON_WIDTH)
);
const TICK_ICON_SIZE_PX = Math.round(RIBBON_DISPLAY_WIDTH_PX * 0.82);
const TICK_CENTER_Y_PERCENT = (RIBBON_NOTCH_START / 1.25 / RIBBON_HEIGHT) * 100;

export default function PlanTickRibbon({ theme }: PlanTickRibbonProps) {
  const color = VERIFIED_TICK_COLORS[theme];

  return (
    <div
      className="absolute top-0 left-5 z-10 pointer-events-none"
      style={{
        width: RIBBON_DISPLAY_WIDTH_PX,
        height: RIBBON_DISPLAY_HEIGHT_PX,
      }}
      aria-hidden
    >
      <svg
        viewBox={`0 0 ${RIBBON_WIDTH} ${RIBBON_HEIGHT}`}
        fill="none"
        className="w-full h-full drop-shadow-[0_4px_14px_rgba(0,0,0,0.45)]"
        preserveAspectRatio="none"
      >
        <path
          d={`M0 0 H${RIBBON_WIDTH} V${RIBBON_NOTCH_START} L${RIBBON_WIDTH / 2} ${RIBBON_HEIGHT} L0 ${RIBBON_NOTCH_START} V0 Z`}
          fill={color}
        />
      </svg>

      <div
        className="absolute left-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
        style={{ top: `${TICK_CENTER_Y_PERCENT}%` }}
      >
        <VerifiedTickIcon
          variant={theme}
          color="#ffffff"
          size={TICK_ICON_SIZE_PX}
          className="drop-shadow-sm"
        />
      </div>
    </div>
  );
}
