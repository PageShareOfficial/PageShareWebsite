import {
  STORY_STACK_OVERLAP_MAX_RATIO,
  STORY_STACK_OVERLAP_THRESHOLD_RATIO,
  STORY_STACK_SCALE_MAX,
  STORY_STACK_STICKY_TOP_VH,
  STORY_STACK_TRANSLATE_X_MAX,
  STORY_STACK_TRANSLATE_Y_MAX,
} from '@/constants/storyStack';

export type StackingCardTransform = {
  scale: number;
  translateX: number;
  translateY: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function getStickyTopPx(viewportHeight: number): number {
  return viewportHeight * STORY_STACK_STICKY_TOP_VH;
}

export function computeOverlapProgress(
  cardHeight: number,
  stickyTopPx: number,
  nextCardTop: number
): number {
  const overlapThreshold = cardHeight * STORY_STACK_OVERLAP_THRESHOLD_RATIO;
  const maxOverlap = cardHeight * STORY_STACK_OVERLAP_MAX_RATIO;

  if (nextCardTop >= stickyTopPx + overlapThreshold) {
    return 0;
  }

  const overlapAmount = stickyTopPx + overlapThreshold - nextCardTop;
  return clamp(overlapAmount / maxOverlap, 0, 1);
}

export function transformFromOverlapProgress(
  overlapProgress: number
): StackingCardTransform {
  return {
    scale: 1 - overlapProgress * STORY_STACK_SCALE_MAX,
    translateY: overlapProgress * STORY_STACK_TRANSLATE_Y_MAX,
    translateX: overlapProgress * STORY_STACK_TRANSLATE_X_MAX,
  };
}

export function computeStackingCardTransform(
  cardHeight: number,
  stickyTopPx: number,
  nextCardTop: number | null
): StackingCardTransform {
  if (nextCardTop === null) {
    return { scale: 1, translateX: 0, translateY: 0 };
  }

  const progress = computeOverlapProgress(
    cardHeight,
    stickyTopPx,
    nextCardTop
  );
  return transformFromOverlapProgress(progress);
}

export function formatStackingTransform({
  scale,
  translateX,
  translateY,
}: StackingCardTransform): string {
  return `scale(${scale}) translateY(${translateY}px) translateX(${translateX}px)`;
}

export function applyStackingTransforms(
  stickyTracks: (HTMLElement | null)[],
  transformLayers: (HTMLElement | null)[]
): void {
  const stickyTopPx = getStickyTopPx(window.innerHeight);

  stickyTracks.forEach((track, index) => {
    const layer = transformLayers[index];
    if (!track || !layer) {
      return;
    }

    const cardHeight = track.getBoundingClientRect().height;
    const nextTop =
      index < stickyTracks.length - 1
        ? stickyTracks[index + 1]?.getBoundingClientRect().top ?? null
        : null;

    const transform = computeStackingCardTransform(
      cardHeight,
      stickyTopPx,
      nextTop
    );
    layer.style.transform = formatStackingTransform(transform);
  });
}

export function clearStackingTransforms(
  transformLayers: (HTMLElement | null)[]
): void {
  transformLayers.forEach((layer) => {
    if (layer) {
      layer.style.transform = '';
    }
  });
}
