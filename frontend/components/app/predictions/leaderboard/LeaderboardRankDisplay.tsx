import { FaMedal } from 'react-icons/fa';
import {
  getMedalColor,
  getRankBadgeClass,
} from '@/utils/predictions/leaderboardStyles';

interface LeaderboardRankDisplayProps {
  rank: number;
  size?: 'default' | 'lg';
}

const MEDAL_SIZE_CLASS = {
  default: 'h-5 w-5',
  lg: 'h-8 w-8',
} as const;

const BADGE_SIZE_CLASS = {
  default: 'h-7 w-7 text-sm',
  lg: 'h-9 w-9 text-base',
} as const;

export default function LeaderboardRankDisplay({
  rank,
  size = 'default',
}: LeaderboardRankDisplayProps) {
  if (rank <= 3) {
    return (
      <FaMedal
        className={`${MEDAL_SIZE_CLASS[size]} shrink-0`}
        color={getMedalColor(rank)}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full border font-semibold ${BADGE_SIZE_CLASS[size]} ${getRankBadgeClass(
        rank
      )}`}
    >
      {rank}
    </span>
  );
}
