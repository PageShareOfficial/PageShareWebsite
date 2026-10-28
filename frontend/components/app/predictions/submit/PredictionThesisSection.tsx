'use client';

import { type RefObject } from 'react';
import type { FieldError, UseFormRegister } from 'react-hook-form';
import PredictionFormSection from '@/components/app/predictions/submit/PredictionFormSection';
import PredictionThesisImageDropzone from '@/components/app/predictions/submit/PredictionThesisImageDropzone';
import { MAX_THESIS_LENGTH } from '@/utils/predictions/predictionRules';
import type { PredictionFormValues } from '@/utils/predictions/predictionFormSchema';

interface PredictionThesisSectionProps {
  register: UseFormRegister<PredictionFormValues>;
  thesisError?: FieldError;
  thesisLength: number;
  formFieldsDisabled: boolean;
  thesisImageInputRef: RefObject<HTMLInputElement | null>;
  mediaPreview: string | undefined;
  mediaError: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageFiles: (files: File[]) => void;
  onRemoveImage: () => void;
  onClearMediaError: () => void;
}

/** Step 6: thesis text and optional chart image. */
export default function PredictionThesisSection({
  register,
  thesisError,
  thesisLength,
  formFieldsDisabled,
  thesisImageInputRef,
  mediaPreview,
  mediaError,
  onImageUpload,
  onImageFiles,
  onRemoveImage,
  onClearMediaError,
}: PredictionThesisSectionProps) {
  return (
    <PredictionFormSection step={6} title="Thesis / Analysis">
      <textarea
        id="thesis"
        rows={4}
        maxLength={MAX_THESIS_LENGTH}
        disabled={formFieldsDisabled}
        aria-invalid={Boolean(thesisError)}
        {...register('thesis')}
        placeholder="Write your analysis here..."
        className={`min-h-[100px] w-full resize-y rounded-lg border bg-white/5 px-3 py-2 text-white placeholder-gray-500 disabled:cursor-not-allowed disabled:opacity-50 ${
          thesisError ? 'border-red-500/60' : 'border-white/10'
        }`}
      />
      <div className="mt-1 flex items-start justify-between gap-3">
        {thesisError ? (
          <p className="text-xs text-red-400">{thesisError.message}</p>
        ) : (
          <span />
        )}
        <p className="shrink-0 text-xs text-gray-500">
          {thesisLength} / {MAX_THESIS_LENGTH}
        </p>
      </div>
      <PredictionThesisImageDropzone
        disabled={formFieldsDisabled}
        thesisImageInputRef={thesisImageInputRef}
        mediaPreview={mediaPreview}
        mediaError={mediaError}
        onImageUpload={onImageUpload}
        onImageFiles={onImageFiles}
        onRemoveImage={onRemoveImage}
        onClearMediaError={onClearMediaError}
      />
    </PredictionFormSection>
  );
}
