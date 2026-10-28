'use client';

import { Controller, type Control } from 'react-hook-form';
import PredictionFormSection from '@/components/app/predictions/submit/PredictionFormSection';
import { MAX_CONFIDENCE, MIN_CONFIDENCE } from '@/utils/predictions/predictionRules';
import type { PredictionFormValues } from '@/utils/predictions/predictionFormSchema';

interface PredictionConfidenceSectionProps {
  control: Control<PredictionFormValues>;
  formFieldsDisabled: boolean;
}

/** Step 5: confidence range slider. */
export default function PredictionConfidenceSection({
  control,
  formFieldsDisabled,
}: PredictionConfidenceSectionProps) {
  return (
    <PredictionFormSection step={5} title="Confidence">
      <div className={formFieldsDisabled ? 'opacity-60' : ''}>
        <Controller
          name="confidence"
          control={control}
          render={({ field }) => (
            <div className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-500">{MIN_CONFIDENCE}</span>
                <input
                  id="confidence"
                  type="range"
                  min={MIN_CONFIDENCE}
                  max={MAX_CONFIDENCE}
                  step={0.05}
                  value={field.value}
                  disabled={formFieldsDisabled}
                  onChange={(event) => field.onChange(parseFloat(event.target.value))}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                  className="flex-1 accent-cyan-500"
                />
                <span className="text-xs text-gray-500">{MAX_CONFIDENCE}</span>
                <span className="w-12 rounded-sm border border-white/10 bg-white/5 px-2 py-1 text-center text-white tabular-nums">
                  {(typeof field.value === 'number' ? field.value : MIN_CONFIDENCE).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        />
      </div>
    </PredictionFormSection>
  );
}
