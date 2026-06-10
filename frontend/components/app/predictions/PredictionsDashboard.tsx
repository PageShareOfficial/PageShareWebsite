'use client';

import { useRouter } from 'next/navigation';
import { ChevronUp, Target, TrendingUp } from 'lucide-react';
import { FaMedal } from 'react-icons/fa';
import { MdLeaderboard } from 'react-icons/md';
import AvatarWithFallback from '@/components/app/common/AvatarWithFallback';
import { navigateToProfile } from '@/utils/core/navigationUtils';

export type LeaderboardEntry = {
  rank: number;
  displayName: string;
  handle: string;
  score: number;
  winRatePercent: number;
  predictionsCount: number;
  verifiedCount: number;
  avatar: string;
};

const SAMPLE_LEADERBOARD: LeaderboardEntry[] = [
  {
    rank: 1,
    displayName: 'Maya Chen',
    handle: 'mayacrypto',
    score: 972,
    winRatePercent: 78,
    predictionsCount: 142,
    verifiedCount: 111,
    avatar: '',
  },
  {
    rank: 2,
    displayName: 'Alex Rivera',
    handle: 'ariv_defi',
    score: 914,
    winRatePercent: 72,
    predictionsCount: 98,
    verifiedCount: 71,
    avatar: '',
  },
  {
    rank: 3,
    displayName: 'Jordan Okonkwo',
    handle: 'jokonkwo',
    score: 889,
    winRatePercent: 69,
    predictionsCount: 201,
    verifiedCount: 138,
    avatar: '',
  },
  {
    rank: 4,
    displayName: 'Samir Patel',
    handle: 'samir_onchain',
    score: 841,
    winRatePercent: 65,
    predictionsCount: 88,
    verifiedCount: 57,
    avatar: '',
  },
  {
    rank: 5,
    displayName: 'Elena Voss',
    handle: 'evoss_trades',
    score: 805,
    winRatePercent: 64,
    predictionsCount: 124,
    verifiedCount: 79,
    avatar: '',
  },
  {
    rank: 6,
    displayName: 'Chris Park',
    handle: 'cpark_btc',
    score: 762,
    winRatePercent: 61,
    predictionsCount: 55,
    verifiedCount: 34,
    avatar: '',
  },
];

const SAMPLE_YOUR_SCORE = {
  rank: 24,
  winRatePercent: 52,
  totalPredictions: 41,
};

export default function PredictionsDashboard() {
  const router = useRouter();

  const getPodiumRowClass = (rank: number): string => {
    if (rank === 1) {
      return 'border-amber-400';
    }
    if (rank === 2) {
      return 'border-slate-300';
    }
    if (rank === 3) {
      return 'border-orange-400';
    }
    return 'border-white/10 hover:border-white/15';
  };

  const getRankBadgeClass = (rank: number): string => {
    if (rank === 1) {
      return 'border-amber-300/70 text-amber-200 bg-amber-400/10';
    }
    if (rank === 2) {
      return 'border-slate-200/60 text-slate-100 bg-slate-300/10';
    }
    if (rank === 3) {
      return 'border-orange-300/60 text-orange-200 bg-orange-400/10';
    }
    return 'border-white/15 text-gray-200 bg-white/5';
  };

  const getMedalClass = (rank: number): string => {
    if (rank === 1) return 'text-amber-400';
    if (rank === 2) return 'text-slate-300';
    return 'text-orange-400';
  };

  return (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm leading-relaxed">
        Track prediction performance, see how you rank, and discover top analysts. Full submission and
        verification flow is coming next.
      </p>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="rounded-xl border border-white/10 bg-gradient-to-br from-amber-500/10 to-transparent p-4">
          <div className="flex items-center gap-2 text-amber-400/90 text-xs font-medium uppercase tracking-wide">
            <FaMedal className="w-3.5 h-3.5" />
            Rank
          </div>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">
            #{SAMPLE_YOUR_SCORE.rank}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-emerald-400/90 text-xs font-medium uppercase tracking-wide">
            <TrendingUp className="w-3.5 h-3.5" />
            Win rate
          </div>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">
            {SAMPLE_YOUR_SCORE.winRatePercent}%
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 text-sky-400/90 text-xs font-medium uppercase tracking-wide">
            <Target className="w-3.5 h-3.5" />
            Total predictions
          </div>
          <p className="text-2xl font-bold text-white mt-1 tabular-nums">{SAMPLE_YOUR_SCORE.totalPredictions}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MdLeaderboard className="w-5 h-5 text-amber-400/90" />
          Leaderboard
        </h2>
      </div>

      <div className="rounded-xl border border-white/10 overflow-hidden">
        <div className="lg:hidden px-3 py-3 space-y-2.5">
          {SAMPLE_LEADERBOARD.map((row) => (
            <div
              key={`mobile-${row.handle}`}
              className={`rounded-xl bg-black/65 border-2 px-3 py-3 ${getPodiumRowClass(row.rank)}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="pt-0.5">
                    {row.rank <= 3 ? (
                      <FaMedal className={`w-5 h-5 ${getMedalClass(row.rank)}`} />
                    ) : (
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${getRankBadgeClass(
                          row.rank
                        )}`}
                      >
                        {row.rank}
                      </span>
                    )}
                  </div>
                  <AvatarWithFallback
                    src={row.avatar}
                    alt={row.displayName}
                    size={34}
                    className="flex-shrink-0"
                  />
                  <button
                    type="button"
                    onClick={() => navigateToProfile(row.handle, router)}
                    className="min-w-0 text-left group"
                    title={`View @${row.handle} profile`}
                  >
                    <div className="text-white font-medium truncate transition-colors group-hover:text-cyan-300">
                      {row.displayName}
                    </div>
                    <div className="text-gray-500 text-xs truncate transition-colors group-hover:text-cyan-400">
                      @{row.handle}
                    </div>
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-[11px] uppercase tracking-wide text-gray-500">Accuracy</div>
                  <div className="text-emerald-400 font-semibold tabular-nums">{row.winRatePercent}%</div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
                  <div className="text-gray-500">Predictions</div>
                  <div className="text-gray-200 font-medium tabular-nums">{row.predictionsCount}</div>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
                  <div className="text-gray-500">Correct</div>
                  <div className="text-gray-200 font-medium tabular-nums">{row.verifiedCount}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="hidden lg:block overflow-x-auto px-2 py-2">
          <table className="w-full text-left text-sm border-separate border-spacing-y-2">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.04] text-gray-400 text-xs uppercase tracking-wide">
                <th className="px-3 py-3 font-medium w-12">Rank</th>
                <th className="px-3 py-3 font-medium min-w-[160px]">Trader</th>
                <th className="px-3 py-3 font-medium text-right hidden sm:table-cell tabular-nums">
                  Predictions
                </th>
                <th className="px-3 py-3 font-medium text-right hidden md:table-cell tabular-nums">
                  Correct
                </th>
                <th className="px-3 py-3 font-medium text-right hidden lg:table-cell tabular-nums">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody>
              {SAMPLE_LEADERBOARD.map((row) => (
                <tr
                  key={row.handle}
                  className="transition-all"
                >
                  <td
                    className={`px-3 py-3 pl-4 tabular-nums font-medium rounded-l-xl bg-black/65 border-y-2 border-l-2 ${getPodiumRowClass(
                      row.rank
                    )}`}
                  >
                    {row.rank <= 3 ? (
                      <FaMedal className={`w-5 h-5 ${getMedalClass(row.rank)}`} />
                    ) : (
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${getRankBadgeClass(
                          row.rank
                        )}`}
                      >
                        {row.rank}
                      </span>
                    )}
                  </td>
                  <td
                    className={`px-3 py-3 bg-black/65 border-y-2 ${getPodiumRowClass(row.rank)}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AvatarWithFallback
                        src={row.avatar}
                        alt={row.displayName}
                        size={36}
                        className="flex-shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => navigateToProfile(row.handle, router)}
                        className="min-w-0 text-left group"
                        title={`View @${row.handle} profile`}
                      >
                        <div className="text-white font-medium truncate transition-colors group-hover:text-cyan-300">
                          {row.displayName}
                        </div>
                        <div className="text-gray-500 text-xs truncate transition-colors group-hover:text-cyan-400">
                          @{row.handle}
                        </div>
                      </button>
                    </div>
                  </td>
                  <td
                    className={`px-3 py-3 text-right text-gray-300 hidden sm:table-cell tabular-nums bg-black/65 border-y-2 ${getPodiumRowClass(
                      row.rank
                    )}`}
                  >
                    {row.predictionsCount}
                  </td>
                  <td
                    className={`px-3 py-3 text-right text-gray-400 hidden md:table-cell tabular-nums bg-black/65 border-y-2 ${getPodiumRowClass(
                      row.rank
                    )}`}
                  >
                    {row.verifiedCount}
                  </td>
                  <td
                    className={`px-3 py-3 pr-4 text-right text-emerald-400/90 hidden lg:table-cell tabular-nums rounded-r-xl bg-black/65 border-y-2 border-r-2 ${getPodiumRowClass(
                      row.rank
                    )}`}
                  >
                    {row.winRatePercent}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2.5 border-t border-white/10 bg-white/[0.02] text-xs text-gray-500 flex items-center gap-1">
          <ChevronUp className="w-3.5 h-3.5" />
          Rankings are generated by our proprietary scoring model.
        </div>
      </div>
    </div>
  );
}
