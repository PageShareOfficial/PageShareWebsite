import { useCallback, useLayoutEffect, useRef } from 'react';
import {
  applyStackingTransforms,
  clearStackingTransforms,
} from '@/utils/landing/stackingCardTransform';

export type StackingCardsScrollRefs = {
  setStickyTrackRef: (index: number) => (element: HTMLElement | null) => void;
  setTransformLayerRef: (index: number) => (element: HTMLElement | null) => void;
};

export function useStackingCardsScroll(
  enabled: boolean,
  itemCount: number
): StackingCardsScrollRefs {
  const stickyTrackRefs = useRef<(HTMLElement | null)[]>([]);
  const transformLayerRefs = useRef<(HTMLElement | null)[]>([]);

  const setStickyTrackRef = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      stickyTrackRefs.current[index] = element;
    },
    []
  );

  const setTransformLayerRef = useCallback(
    (index: number) => (element: HTMLElement | null) => {
      transformLayerRefs.current[index] = element;
    },
    []
  );

  useLayoutEffect(() => {
    if (!enabled || itemCount === 0) {
      return undefined;
    }

    let frameId = 0;

    const scheduleUpdate = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(() => {
        applyStackingTransforms(
          stickyTrackRefs.current.slice(0, itemCount),
          transformLayerRefs.current.slice(0, itemCount)
        );
      });
    };

    scheduleUpdate();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', scheduleUpdate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('scroll', scheduleUpdate);
      window.removeEventListener('resize', scheduleUpdate);
      clearStackingTransforms(transformLayerRefs.current);
    };
  }, [enabled, itemCount]);

  return { setStickyTrackRef, setTransformLayerRef };
}
