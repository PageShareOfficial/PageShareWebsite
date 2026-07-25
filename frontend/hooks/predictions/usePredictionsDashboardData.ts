'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import {
  getMyPredictionAnalyticsSummary,
  getPredictionLeaderboard,
  LEADERBOARD_PAGE_SIZE,
} from '@/lib/api/predictionApi';
import type { AnalystScoreSummary, LeaderboardEntry } from '@/types/predictions';
import { getErrorMessage } from '@/utils/error/getErrorMessage';
import {
  mapAnalystScoreSummary,
  mapLeaderboardEntry,
} from '@/utils/predictions/mapPredictionsDashboard';

interface UsePredictionsDashboardDataResult {
  leaderboard: LeaderboardEntry[];
  analystScore: AnalystScoreSummary | null;
  isLeaderboardLoading: boolean;
  isLeaderboardLoadingMore: boolean;
  isAnalystScoreLoading: boolean;
  leaderboardError: string | null;
  analystScoreError: string | null;
  hasMoreLeaderboard: boolean;
  loadMoreLeaderboard: () => Promise<void>;
  retryLeaderboard: () => void;
  retryAnalystScore: () => void;
}

export function usePredictionsDashboardData(options: {
  loadAnalystScore: boolean;
}): UsePredictionsDashboardDataResult {
  const { session } = useAuth();
  const isOnline = useOnlineStatus();
  const accessToken = session?.access_token;

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leaderboardPage, setLeaderboardPage] = useState(1);
  const [hasMoreLeaderboard, setHasMoreLeaderboard] = useState(false);
  const [analystScore, setAnalystScore] = useState<AnalystScoreSummary | null>(
    null
  );
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);
  const [isLeaderboardLoadingMore, setIsLeaderboardLoadingMore] = useState(false);
  const [isAnalystScoreLoading, setIsAnalystScoreLoading] = useState(
    options.loadAnalystScore
  );
  const [leaderboardError, setLeaderboardError] = useState<string | null>(null);
  const [analystScoreError, setAnalystScoreError] = useState<string | null>(null);
  const [leaderboardKey, setLeaderboardKey] = useState(0);
  const [analystScoreKey, setAnalystScoreKey] = useState(0);

  const fetchLeaderboardPage = useCallback(
    async (pageToLoad: number, append: boolean) => {
      if (append) {
        setIsLeaderboardLoadingMore(true);
      } else {
        setIsLeaderboardLoading(true);
        setLeaderboardError(null);
      }

      try {
        const response = await getPredictionLeaderboard(accessToken, {
          page: pageToLoad,
          per_page: LEADERBOARD_PAGE_SIZE,
        });
        const mapped = response.data.map(mapLeaderboardEntry);
        setLeaderboard((prev) => (append ? [...prev, ...mapped] : mapped));
        setLeaderboardPage(pageToLoad);
        setHasMoreLeaderboard(response.pagination.has_next);
      } catch (err: unknown) {
        if (!append) {
          setLeaderboard([]);
        }
        setLeaderboardError(
          getErrorMessage(err, 'Could not load the leaderboard.')
        );
      } finally {
        setIsLeaderboardLoading(false);
        setIsLeaderboardLoadingMore(false);
      }
    },
    [accessToken]
  );

  const loadMoreLeaderboard = useCallback(async () => {
    if (
      isLeaderboardLoading ||
      isLeaderboardLoadingMore ||
      !hasMoreLeaderboard ||
      !isOnline
    ) {
      return;
    }
    await fetchLeaderboardPage(leaderboardPage + 1, true);
  }, [
    fetchLeaderboardPage,
    hasMoreLeaderboard,
    isLeaderboardLoading,
    isLeaderboardLoadingMore,
    isOnline,
    leaderboardPage,
  ]);

  const retryLeaderboard = useCallback(() => {
    if (!isOnline) {
      return;
    }
    setLeaderboardKey((key) => key + 1);
  }, [isOnline]);

  const retryAnalystScore = useCallback(() => {
    if (!isOnline || !accessToken) {
      return;
    }
    setAnalystScoreError(null);
    setAnalystScoreKey((key) => key + 1);
  }, [accessToken, isOnline]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (cancelled) {
        return;
      }
      await fetchLeaderboardPage(1, false);
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, fetchLeaderboardPage, leaderboardKey]);

  useEffect(() => {
    if (!options.loadAnalystScore) {
      setAnalystScore(null);
      setAnalystScoreError(null);
      setIsAnalystScoreLoading(false);
      return;
    }
    if (!accessToken) {
      setIsAnalystScoreLoading(false);
      return;
    }

    let cancelled = false;
    setIsAnalystScoreLoading(true);
    setAnalystScoreError(null);

    getMyPredictionAnalyticsSummary(accessToken)
      .then((summary) => {
        if (cancelled) {
          return;
        }
        setAnalystScore(mapAnalystScoreSummary(summary));
      })
      .catch((err: unknown) => {
        if (cancelled) {
          return;
        }
        setAnalystScore(null);
        setAnalystScoreError(getErrorMessage(err, 'Could not load your stats.'));
      })
      .finally(() => {
        if (!cancelled) {
          setIsAnalystScoreLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [accessToken, analystScoreKey, options.loadAnalystScore]);

  return {
    leaderboard,
    analystScore,
    isLeaderboardLoading,
    isLeaderboardLoadingMore,
    isAnalystScoreLoading,
    leaderboardError,
    analystScoreError,
    hasMoreLeaderboard,
    loadMoreLeaderboard,
    retryLeaderboard,
    retryAnalystScore,
  };
}
