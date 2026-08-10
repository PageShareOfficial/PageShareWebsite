import Image from 'next/image';
import { PLANS } from '@/components/app/plans/planData';
import type { LandingStoryStep } from '@/constants/landingStorySteps';
import type { PlanId } from '@/types/billing';

const PERSONA_HIGHLIGHT_COUNT = 8;

function getPersonaHighlights(planId: PlanId): string[] {
  const plan = PLANS.find((entry) => entry.id === planId);
  if (!plan) {
    return [];
  }
  return plan.features.slice(0, PERSONA_HIGHLIGHT_COUNT);
}

const ANALYST_LANDING_HIGHLIGHTS = getPersonaHighlights('analyst');
const INVESTOR_LANDING_HIGHLIGHTS = getPersonaHighlights('investor');

const PERSONA_STAR_CLASS = 'text-xl text-amber-400';
const PERSONA_HIGHLIGHT_TEXT_CLASS =
  'text-xl text-gray-300 leading-snug';

function PersonaHighlightList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2.5 px-1 sm:px-2">
      {items.map((item) => (
        <li
          key={item}
          className={`flex gap-2.5 text-left ${PERSONA_HIGHLIGHT_TEXT_CLASS}`}
        >
          <span className={`shrink-0 ${PERSONA_STAR_CLASS}`} aria-hidden>
            ★
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function PersonaLabel({ label }: { label: string }) {
  return (
    <div
      className="mb-3 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-center text-base sm:text-lg font-semibold text-white tracking-wide"
      aria-hidden
    >
      {label}
    </div>
  );
}

function PersonaColumn({
  label,
  imageSrc,
  imageAlt,
  highlights,
}: {
  label: string;
  imageSrc: string;
  imageAlt: string;
  highlights: string[];
}) {
  return (
    <div className="flex flex-col">
      <PersonaLabel label={label} />
      <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-black">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          className="object-contain object-center p-3 sm:p-4"
          sizes="(max-width: 640px) 100vw, 50vw"
        />
      </div>
      <PersonaHighlightList items={highlights} />
    </div>
  );
}

function StoryCardHeader({ step }: { step: LandingStoryStep }) {
  return (
    <header className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 sm:pb-5 text-center">
      <h3
        id={`how-we-work-${step.id}-title`}
        className="text-xl sm:text-2xl md:text-3xl font-semibold text-white leading-snug tracking-tight"
      >
        {step.title}
      </h3>
    </header>
  );
}

const CARD_BODY_PADDING_CLASS = 'px-4 sm:px-6 pb-6 sm:pb-8';
const CARD_BODY_PADDING_COMPACT_CLASS = 'px-4 sm:px-6 pb-3 sm:pb-4';

function DualPersonaReveal({ compactBottom }: { compactBottom?: boolean }) {
  const bodyPad = compactBottom
    ? CARD_BODY_PADDING_COMPACT_CLASS
    : CARD_BODY_PADDING_CLASS;
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-4 ${bodyPad}`}>
      <PersonaColumn
        label="Analyst/Trader"
        imageSrc="/story/Analyst_persona.png"
        imageAlt="Analyst persona"
        highlights={ANALYST_LANDING_HIGHLIGHTS}
      />
      <PersonaColumn
        label="Investor"
        imageSrc="/story/Investor_persona.png"
        imageAlt="Investor persona"
        highlights={INVESTOR_LANDING_HIGHLIGHTS}
      />
    </div>
  );
}

function StoryImageReveal({
  src,
  alt,
  compactBottom,
}: {
  src: string;
  alt: string;
  compactBottom?: boolean;
}) {
  const bodyPad = compactBottom
    ? CARD_BODY_PADDING_COMPACT_CLASS
    : CARD_BODY_PADDING_CLASS;
  return (
    <div className={bodyPad}>
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black">
        <Image
          src={src}
          alt={alt}
          fill
          className="object-contain object-center"
          sizes="(max-width: 1400px) 100vw, 1400px"
        />
      </div>
    </div>
  );
}

export function StoryCardContent({
  step,
  compactBottom = false,
}: {
  step: LandingStoryStep;
  compactBottom?: boolean;
}) {
  return (
    <>
      <StoryCardHeader step={step} />
      {step.kind === 'dual-persona' ? (
        <DualPersonaReveal compactBottom={compactBottom} />
      ) : (
        <StoryImageReveal
          src={step.imageSrc}
          alt={step.imageAlt}
          compactBottom={compactBottom}
        />
      )}
    </>
  );
}
