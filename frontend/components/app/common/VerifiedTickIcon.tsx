'use client';

import { GoVerified } from 'react-icons/go';
import {
  VERIFIED_TICK_COLORS,
  type VerifiedTickVariant,
} from '@/constants/verifiedTick';

export type { VerifiedTickVariant };
export { VERIFIED_TICK_COLORS };

interface VerifiedTickIconProps {
  variant: VerifiedTickVariant;
  size?: number;
  color?: string;
  className?: string;
  title?: string;
}

export default function VerifiedTickIcon({
  variant,
  size = 16,
  color,
  className = '',
  title,
}: VerifiedTickIconProps) {
  return (
    <GoVerified
      size={size}
      className={`inline-block shrink-0 ${className}`.trim()}
      color={color ?? VERIFIED_TICK_COLORS[variant]}
      aria-hidden={!title}
      title={title}
    />
  );
}
