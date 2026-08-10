'use client';

import { LANDING_STORY_STEPS } from '@/constants/landingStorySteps';
import { STORY_STACK_CONTAINER_END_CLASS } from '@/constants/storyStack';
import { StoryStackCard } from '@/components/landing/howWeWork/StoryStackCard';
import { useMinMdViewport } from '@/hooks/common/useMinMdViewport';
import { usePrefersReducedMotion } from '@/hooks/common/usePrefersReducedMotion';
import { useStackingCardsScroll } from '@/hooks/landing/useStackingCardsScroll';

export default function HowWeWorkSection() {
  const reducedMotion = usePrefersReducedMotion();
  const isMdUp = useMinMdViewport();
  const useStackLayout = isMdUp && !reducedMotion;
  const stepCount = LANDING_STORY_STEPS.length;
  const stackRefs = useStackingCardsScroll(useStackLayout, stepCount);

  return (
    <section
      id="how-we-work"
      className="relative pt-16 pb-8 sm:pt-20 sm:pb-10 md:pt-24 md:pb-12 overflow-visible"
      aria-labelledby="how-we-work-heading"
    >
      <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 lg:px-12 overflow-visible">
        <header className="text-center mb-10 sm:mb-14 max-w-2xl mx-auto">
          <p className="text-sm sm:text-base tracking-[0.2em] uppercase text-gray-400 mb-3">
            How we work
          </p>
          <h2
            id="how-we-work-heading"
            className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight"
          >
            From call to{' '}
            <span className="text-cyan-400">verified track record</span>
          </h2>
        </header>

        <div
          className={`relative w-full overflow-visible ${
            useStackLayout ? STORY_STACK_CONTAINER_END_CLASS : ''
          }`}
        >
          <ol
            className={`relative m-0 list-none p-0 overflow-visible ${
              useStackLayout ? '' : 'space-y-10'
            } motion-reduce:space-y-10`}
          >
            {LANDING_STORY_STEPS.map((storyStep, index) => (
              <StoryStackCard
                key={storyStep.id}
                step={storyStep}
                index={index}
                isLast={index === stepCount - 1}
                useStackLayout={useStackLayout}
                {...stackRefs}
              />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
