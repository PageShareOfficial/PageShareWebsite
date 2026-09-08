import type { LandingStoryStep } from '@/constants/landingStorySteps';
import {
  getStoryStackStickyTopCss,
  getStoryStackZIndex,
  STORY_STACK_CARD_GAP_CLASS,
} from '@/constants/storyStack';
import type { StackingCardsScrollRefs } from '@/hooks/landing/useStackingCardsScroll';
import { StoryCardContent } from '@/components/landing/howWeWork/StoryCardContent';

const STACKED_CARD_SURFACE_CLASS =
  'w-full origin-center overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-[0_12px_48px_rgba(0,0,0,0.55)] transition-transform duration-300 ease-[cubic-bezier(0,0.49,0.58,0.1)] will-change-transform';

const REDUCED_MOTION_CARD_CLASS =
  'w-full overflow-hidden rounded-2xl border border-white/10 bg-neutral-950';

type StoryStackCardProps = {
  step: LandingStoryStep;
  index: number;
  isLast: boolean;
  useStackLayout: boolean;
} & StackingCardsScrollRefs;

export function StoryStackCard({
  step,
  index,
  isLast,
  useStackLayout,
  setStickyTrackRef,
  setTransformLayerRef,
}: StoryStackCardProps) {
  if (!useStackLayout) {
    return (
      <li
        className="list-none"
        aria-labelledby={`how-we-work-${step.id}-title`}
      >
        <article className={REDUCED_MOTION_CARD_CLASS}>
          <StoryCardContent step={step} compactBottom={isLast} />
        </article>
      </li>
    );
  }

  const gapClass = index > 0 ? STORY_STACK_CARD_GAP_CLASS : '';

  return (
    <li
      ref={setStickyTrackRef(index)}
      className={`sticky list-none w-full ${gapClass}`}
      style={{
        top: getStoryStackStickyTopCss(),
        zIndex: getStoryStackZIndex(index),
      }}
      aria-labelledby={`how-we-work-${step.id}-title`}
    >
      <article
        ref={setTransformLayerRef(index)}
        className={STACKED_CARD_SURFACE_CLASS}
      >
        <StoryCardContent step={step} compactBottom={isLast} />
      </article>
    </li>
  );
}
