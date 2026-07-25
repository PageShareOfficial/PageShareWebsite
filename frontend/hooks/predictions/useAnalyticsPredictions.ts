'use client';

import { useCallback, useEffect, useRef, useState, type MutableRefObject } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOnlineStatus } from '@/hooks/common/useOnlineStatus';
import {
  getAnalyticsPredictionDetailForUser,
  getAnalyticsPredictionIndexForUser,
  getMyAnalyticsPredictionDetail,
  getMyAnalyticsPredictionIndex,
  type PredictionAnalyticsDetail,
  type PredictionIndexItem,
} from '@/lib/api/predictionApi';
import {
  OFFLINE_USER_MESSAGE,
  resolveFetchErrorMessage,
} from '@/utils/error/isNetworkError';
import { pulseOfflineBanner } from '@/utils/offline/pulseOfflineBanner';
import {
  readAnalyticsPredictionsCache,
  writeAnalyticsPredictionsCache,
} from '@/utils/predictions/analyticsPredictionsCache';

interface UseAnalyticsPredictionsOptions {
  selectedIdFromUrl?: string | null;
  onSelectedIdChange?: (id: string) => void;
}

interface UseAnalyticsPredictionsResult {
  indexItems: PredictionIndexItem[];
  selectedId: string | null;
  setSelectedId: (id: string) => void;
  detail: PredictionAnalyticsDetail | null;
  isIndexLoading: boolean;
  isDetailLoading: boolean;
  indexErrorMessage: string | null;
  indexErrorOffline: boolean;
  detailErrorMessage: string | null;
  detailErrorOffline: boolean;
  isShowingStaleData: boolean;
  isAuthenticating: boolean;
  retryIndex: () => void;
  retryDetail: () => void;
}

function pickSelectedId(
  items: PredictionIndexItem[],
  urlId: string | null | undefined,
  currentId: string | null
): string | null {
  if (urlId && items.some((item) => item.id === urlId)) {
    return urlId;
  }
  if (currentId && items.some((item) => item.id === currentId)) {
    return currentId;
  }
  return items[0]?.id ?? null;
}

function loadCacheSnapshot(subjectUsername: string) {
  const cached = readAnalyticsPredictionsCache(subjectUsername);
  if (!cached || cached.indexItems.length === 0) {
    return null;
  }
  return {
    indexItems: cached.indexItems,
    detailsById: cached.detailsById ?? {},
    selectedId: cached.selectedId,
  };
}

function applyOfflineCache(
  cacheScope: string,
  selectedIdFromUrl: string | null | undefined,
  detailsByIdRef: MutableRefObject<Record<string, PredictionAnalyticsDetail>>,
  setIndexItems: (items: PredictionIndexItem[]) => void,
  setSelectedIdState: React.Dispatch<React.SetStateAction<string | null>>,
  setDetail: (detail: PredictionAnalyticsDetail | null) => void,
  setIsShowingStaleData: (value: boolean) => void
): boolean {
  const cached = loadCacheSnapshot(cacheScope);
  if (!cached) {
    return false;
  }
  detailsByIdRef.current = cached.detailsById;
  setIndexItems(cached.indexItems);
  const nextId = pickSelectedId(
    cached.indexItems,
    selectedIdFromUrl,
    cached.selectedId
  );
  setSelectedIdState(nextId);
  setDetail(nextId ? cached.detailsById[nextId] ?? null : null);
  setIsShowingStaleData(true);
  return true;
}

export function useAnalyticsPredictions(
  subjectUsername?: string,
  options: UseAnalyticsPredictionsOptions = {}
): UseAnalyticsPredictionsResult {
  const { selectedIdFromUrl, onSelectedIdChange } = options;
  const { session, loading: authLoading } = useAuth();
  const isOnline = useOnlineStatus();
  const accessToken = session?.access_token;
  const trimmedUsername = subjectUsername?.trim() ?? '';
  const isOwn = !trimmedUsername;
  const cacheScope = trimmedUsername;
  const detailsByIdRef = useRef<Record<string, PredictionAnalyticsDetail>>({});

  const [indexItems, setIndexItems] = useState<PredictionIndexItem[]>([]);
  const [selectedId, setSelectedIdState] = useState<string | null>(null);
  const [detail, setDetail] = useState<PredictionAnalyticsDetail | null>(null);
  const [isIndexLoading, setIsIndexLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [indexErrorMessage, setIndexErrorMessage] = useState<string | null>(null);
  const [indexErrorOffline, setIndexErrorOffline] = useState(false);
  const [detailErrorMessage, setDetailErrorMessage] = useState<string | null>(null);
  const [detailErrorOffline, setDetailErrorOffline] = useState(false);
  const [isShowingStaleData, setIsShowingStaleData] = useState(false);
  const [indexVersion, setIndexVersion] = useState(0);
  const [detailVersion, setDetailVersion] = useState(0);
  const selectedIdFromUrlRef = useRef(selectedIdFromUrl);
  selectedIdFromUrlRef.current = selectedIdFromUrl;

  const persistCache = useCallback(
    (
      items: PredictionIndexItem[],
      nextSelectedId: string | null,
      details: Record<string, PredictionAnalyticsDetail>
    ) => {
      writeAnalyticsPredictionsCache(cacheScope, {
        indexItems: items,
        detailsById: details,
        selectedId: nextSelectedId,
      });
    },
    [cacheScope]
  );

  const setSelectedId = useCallback(
    (id: string) => {
      if (!isOnline) {
        pulseOfflineBanner();
        return;
      }
      setSelectedIdState(id);
      setDetailErrorMessage(null);
      setDetailErrorOffline(false);
      const cachedDetail = detailsByIdRef.current[id];
      if (cachedDetail) {
        setDetail(cachedDetail);
      } else {
        setDetail(null);
      }
      onSelectedIdChange?.(id);
    },
    [isOnline, onSelectedIdChange]
  );

  const retryIndex = useCallback(() => {
    if (!isOnline) {
      pulseOfflineBanner();
      return;
    }
    setIndexVersion((value) => value + 1);
  }, [isOnline]);

  const retryDetail = useCallback(() => {
    if (!isOnline) {
      pulseOfflineBanner();
      return;
    }
    setDetailVersion((value) => value + 1);
  }, [isOnline]);

  const wasOfflineRef = useRef(false);
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      return;
    }
    if (!wasOfflineRef.current) {
      return;
    }
    wasOfflineRef.current = false;
    retryIndex();
  }, [isOnline, retryIndex]);

  useEffect(() => {
    if (authLoading) {
      setIsIndexLoading(true);
      return;
    }

    if (!accessToken) {
      setIsIndexLoading(false);
      setIndexErrorMessage('Sign in to view predictions.');
      setIndexErrorOffline(false);
      return;
    }

    if (!isOnline) {
      setIsIndexLoading(false);
      setIndexErrorMessage(null);
      setIndexErrorOffline(true);
      const hasCache = applyOfflineCache(
        cacheScope,
        selectedIdFromUrl,
        detailsByIdRef,
        setIndexItems,
        setSelectedIdState,
        setDetail,
        setIsShowingStaleData
      );
      if (!hasCache) {
        setIndexErrorMessage(OFFLINE_USER_MESSAGE);
        setIndexItems([]);
        setSelectedIdState(null);
        setDetail(null);
      }
      return;
    }

    let cancelled = false;
    setIsIndexLoading(true);
    setIndexErrorMessage(null);
    setIndexErrorOffline(false);
    setIsShowingStaleData(false);
    setIndexItems([]);
    setSelectedIdState(null);
    setDetail(null);

    const loadIndex = isOwn
      ? getMyAnalyticsPredictionIndex(accessToken)
      : getAnalyticsPredictionIndexForUser(trimmedUsername, accessToken);

    loadIndex
      .then((list) => {
        if (cancelled) {
          return;
        }
        setIndexItems(list.items);
        setSelectedIdState((current) => {
          const nextId = pickSelectedId(
            list.items,
            selectedIdFromUrlRef.current,
            current
          );
          persistCache(list.items, nextId, detailsByIdRef.current);
          return nextId;
        });
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        const { message, isOffline } = resolveFetchErrorMessage(
          err,
          'Failed to load predictions',
          isOnline
        );
        if (isOffline) {
          const hasCache = applyOfflineCache(
            cacheScope,
            selectedIdFromUrl,
            detailsByIdRef,
            setIndexItems,
            setSelectedIdState,
            setDetail,
            setIsShowingStaleData
          );
          setIndexErrorMessage(hasCache ? null : message);
        } else {
          setIndexItems([]);
          setSelectedIdState(null);
          setDetail(null);
          setIndexErrorMessage(message);
        }
        setIndexErrorOffline(isOffline);
      })
      .finally(() => {
        if (!cancelled) {
          setIsIndexLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    authLoading,
    cacheScope,
    indexVersion,
    isOnline,
    isOwn,
    persistCache,
    trimmedUsername,
  ]);

  useEffect(() => {
    if (!selectedIdFromUrl || indexItems.length === 0 || isIndexLoading) {
      return;
    }
    if (indexItems.some((item) => item.id === selectedIdFromUrl)) {
      return;
    }
    const fallbackId = indexItems[0]?.id;
    if (fallbackId && isOnline) {
      onSelectedIdChange?.(fallbackId);
    }
  }, [
    indexItems,
    isIndexLoading,
    isOnline,
    onSelectedIdChange,
    selectedIdFromUrl,
  ]);

  useEffect(() => {
    if (!selectedIdFromUrl || indexItems.length === 0 || isIndexLoading) {
      return;
    }
    if (!indexItems.some((item) => item.id === selectedIdFromUrl)) {
      return;
    }
    setSelectedIdState((current) =>
      current === selectedIdFromUrl ? current : selectedIdFromUrl
    );
  }, [indexItems, isIndexLoading, selectedIdFromUrl]);

  useEffect(() => {
    if (authLoading || !accessToken || !selectedId || isIndexLoading) {
      if (!selectedId) {
        setDetail(null);
      }
      setIsDetailLoading(false);
      return;
    }

    if (!isOnline) {
      setIsDetailLoading(false);
      setDetailErrorOffline(true);
      const cachedDetail = detailsByIdRef.current[selectedId];
      if (cachedDetail) {
        setDetail(cachedDetail);
        setDetailErrorMessage(null);
        setIsShowingStaleData(true);
      } else {
        setDetail(null);
        setDetailErrorMessage(OFFLINE_USER_MESSAGE);
      }
      return;
    }

    let cancelled = false;
    const cachedDetail = detailsByIdRef.current[selectedId];
    if (cachedDetail) {
      setDetail(cachedDetail);
      setIsDetailLoading(false);
    } else {
      setDetail(null);
      setIsDetailLoading(true);
    }
    setDetailErrorMessage(null);
    setDetailErrorOffline(false);

    const loadDetail = isOwn
      ? getMyAnalyticsPredictionDetail(selectedId, accessToken)
      : getAnalyticsPredictionDetailForUser(
          trimmedUsername,
          selectedId,
          accessToken
        );

    loadDetail
      .then((response) => {
        if (cancelled) {
          return;
        }
        setDetail(response);
        setIsShowingStaleData(false);
        detailsByIdRef.current = {
          ...detailsByIdRef.current,
          [selectedId]: response,
        };
        setIndexItems((items) => {
          const nextItems = items.map((item) =>
            item.id === selectedId
              ? {
                  ...item,
                  status: response.prediction.status,
                  outcome: response.prediction.outcome ?? null,
                }
              : item
          );
          persistCache(nextItems, selectedId, detailsByIdRef.current);
          return nextItems;
        });
      })
      .catch((err) => {
        if (cancelled) {
          return;
        }
        const { message, isOffline } = resolveFetchErrorMessage(
          err,
          'Failed to load prediction details',
          isOnline
        );
        const cachedDetail = detailsByIdRef.current[selectedId];
        if (isOffline && cachedDetail) {
          setDetail(cachedDetail);
          setIsShowingStaleData(true);
          setDetailErrorMessage(null);
        } else {
          setDetail(null);
          setDetailErrorMessage(message);
        }
        setDetailErrorOffline(isOffline);
      })
      .finally(() => {
        if (!cancelled) {
          setIsDetailLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    accessToken,
    authLoading,
    detailVersion,
    isIndexLoading,
    isOnline,
    isOwn,
    persistCache,
    selectedId,
    trimmedUsername,
  ]);

  return {
    indexItems,
    selectedId,
    setSelectedId,
    detail,
    isIndexLoading,
    isDetailLoading,
    indexErrorMessage,
    indexErrorOffline,
    detailErrorMessage,
    detailErrorOffline,
    isShowingStaleData,
    isAuthenticating: authLoading,
    retryIndex,
    retryDetail,
  };
}
