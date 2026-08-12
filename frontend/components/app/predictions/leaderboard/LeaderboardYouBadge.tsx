import { getOwnYouBadgeStyle } from '@/utils/predictions/leaderboardStyles';

interface LeaderboardYouBadgeProps {
  rank: number;
}

/** Sits above the row; bottom edge flush on the 2px top border. */
export default function LeaderboardYouBadge({ rank }: LeaderboardYouBadgeProps) {
  return (
    <span
      style={getOwnYouBadgeStyle(rank)}
      className="pointer-events-none absolute left-3 top-0 z-20 -translate-y-[calc(100%-2px)] rounded-t px-2 py-[0.1rem] text-[13px] font-bold uppercase leading-none tracking-wide"
    >
      You
    </span>
  );
}
