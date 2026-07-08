import { FaMedal } from 'react-icons/fa';
import {
  getMedalColor,
  getRankBadgeClass,
} from '@/utils/predictions/leaderboardStyles';

interface LeaderboardRankDisplayProps {
  rank: number;
}

export default function LeaderboardRankDisplay({ rank }: LeaderboardRankDisplayProps) {
  if (rank <= 3) {
    return (
      <FaMedal
        className="h-5 w-5 shrink-0"
        color={getMedalColor(rank)}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${getRankBadgeClass(
        rank
      )}`}
    >
      {rank}
    </span>
  );
}
