'use client';

import { Check } from 'lucide-react';

interface PollOption {
  options: string[];
  duration: number;
  createdAt: string;
  votes?: { [optionIndex: number]: number };
  userVote?: number;
  isFinished: boolean;
  expiresAt?: string;
}

interface PollComponentProps {
  poll: PollOption;
  postId: string;
  onVote?: (postId: string, optionIndex: number) => void;
}

export default function PollComponent({ poll, postId, onVote }: PollComponentProps) {
  const calculateVoteStats = (index: number) => {
    const votes = poll.votes || {};
    const voteValues = Object.values(votes) as number[];
    const totalVotes = voteValues.reduce((a: number, b: number) => a + b, 0);
    const optionVotes = votes[index] || 0;
    const percentage = totalVotes > 0 ? (optionVotes / totalVotes) * 100 : 0;
    return { totalVotes, optionVotes, percentage };
  };

  if (poll.isFinished) {
    // Finished Poll - Show results only
    return (
      <div className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10">
        <div className="space-y-2">
          <div className="text-xs text-gray-400 mb-2">Poll ended</div>
          {poll.options.map((option, index) => {
            const { optionVotes, percentage } = calculateVoteStats(index);
            const isUserVote = poll.userVote === index;
            
            return (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-white">{option}</span>
                    {isUserVote && (
                      <span className="text-xs text-cyan-400 font-medium">Your vote</span>
                    )}
                  </div>
                  <span className="text-xs text-gray-400">{percentage.toFixed(0)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      isUserVote ? 'bg-cyan-400' : 'bg-cyan-400/60'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-1 block">{optionVotes} votes</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Active Poll - Show voting buttons and results
  const hasVoted = poll.userVote !== undefined;

  return (
    <div className="mb-3 p-3 bg-white/5 rounded-xl border border-white/10">
      <div className="space-y-2">
        {poll.options.map((option, index) => {
          const { optionVotes, percentage } = calculateVoteStats(index);
          const isUserVote = poll.userVote === index;

          return (
            <button
              key={index}
              onClick={() => {
                if (onVote && !hasVoted) {
                  onVote(postId, index);
                }
              }}
              disabled={hasVoted}
              className={`w-full p-2 rounded-lg border transition-colors relative overflow-hidden
                ${hasVoted ? 'cursor-default' : 'hover:bg-white/10'}
                ${isUserVote ? 'border-cyan-400' : 'border-white/10'}
              `}
            >
              {hasVoted && (
                <div
                  className={`absolute inset-0 h-full rounded-lg ${
                    isUserVote ? 'bg-cyan-400/20' : 'bg-white/5'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              )}
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{option}</span>
                  {isUserVote && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
                {hasVoted && (
                  <span className="text-sm text-gray-300">{percentage.toFixed(0)}%</span>
                )}
              </div>
            </button>
          );
        })}
        <p className="text-xs text-gray-400 mt-2">
          {poll.expiresAt
            ? (() => {
                const end = new Date(poll.expiresAt).getTime();
                const now = Date.now();
                if (now >= end) return 'Poll ended';
                const daysLeft = Math.ceil((end - now) / 86400000);
                return `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`;
              })()
            : `${poll.duration} day${poll.duration > 1 ? 's' : ''} left`}
        </p>
      </div>
    </div>
  );
}

