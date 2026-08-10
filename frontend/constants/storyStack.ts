/** Shared sticky offset for every card (stacking-cards pattern: top 10vh). */
export const STORY_STACK_STICKY_TOP_VH = 0.1;

export const STORY_STACK_OVERLAP_THRESHOLD_RATIO = 0.8;
export const STORY_STACK_OVERLAP_MAX_RATIO = 0.85;

export const STORY_STACK_SCALE_MAX = 0.15;
export const STORY_STACK_TRANSLATE_Y_MAX = 20;
export const STORY_STACK_TRANSLATE_X_MAX = -10;

export const STORY_STACK_CARD_GAP_CLASS = 'mt-[70vh] md:mt-[30rem]';
export const STORY_STACK_CONTAINER_END_CLASS = 'mb-[10rem]';

export function getStoryStackZIndex(index: number): number {
  return index + 1;
}

export function getStoryStackStickyTopCss(): string {
  return `${STORY_STACK_STICKY_TOP_VH * 100}vh`;
}
