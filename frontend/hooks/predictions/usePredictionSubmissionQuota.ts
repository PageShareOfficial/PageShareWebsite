import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getPredictionSubmissionQuota } from '@/lib/api/predictionApi';

export interface PredictionSubmissionQuota {
  used: number;
  max: number;
  remaining: number;
}

export function usePredictionSubmissionQuota() {
  const { session } = useAuth();
  const [quota, setQuota] = useState<PredictionSubmissionQuota | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = session?.access_token;
    if (!token) {
      setQuota(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const next = await getPredictionSubmissionQuota(token);
      setQuota(next);
    } catch {
      setQuota(null);
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    quota,
    isLoading,
    refresh,
    canSubmit: Boolean(quota && quota.remaining > 0),
  };
}
