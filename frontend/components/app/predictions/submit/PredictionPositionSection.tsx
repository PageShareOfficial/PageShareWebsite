'use client';

import PredictionFormSection from '@/components/app/predictions/submit/PredictionFormSection';

interface PredictionPositionSectionProps {
  position: 'long' | 'short';
  disabled: boolean;
  title?: string;
  onChange: (position: 'long' | 'short') => void;
}

/** Step 2: long / short position toggle. */
export default function PredictionPositionSection({
  position,
  disabled,
  title,
  onChange,
}: PredictionPositionSectionProps) {
  return (
    <PredictionFormSection step={2} title="Position">
      <div className={`grid grid-cols-2 gap-3 ${disabled ? 'opacity-60' : ''}`}>
        {(['long', 'short'] as const).map((option) => {
          const active = position === option;
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              title={title}
              onClick={() => onChange(option)}
              className={`rounded-lg border-2 px-3 py-3 text-sm font-semibold uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                active
                  ? 'border-sky-400/70 bg-sky-500/10 text-sky-200'
                  : 'border-white/10 bg-transparent text-gray-400 hover:border-sky-500/30 hover:bg-sky-500/5 hover:text-sky-100'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </PredictionFormSection>
  );
}
