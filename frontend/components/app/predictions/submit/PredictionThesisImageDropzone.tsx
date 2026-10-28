'use client';

import { type RefObject, useState } from 'react';
import { Upload } from '@/constants/icons';
import { THESIS_IMAGE_ACCEPT } from '@/utils/predictions/predictionRules';

interface PredictionThesisImageDropzoneProps {
  disabled: boolean;
  thesisImageInputRef: RefObject<HTMLInputElement | null>;
  mediaPreview: string | undefined;
  mediaError: string | null;
  onImageUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onImageFiles: (files: File[]) => void;
  onRemoveImage: () => void;
  onClearMediaError: () => void;
}

/** Optional thesis chart: drop, paste, or file picker. */
export default function PredictionThesisImageDropzone({
  disabled,
  thesisImageInputRef,
  mediaPreview,
  mediaError,
  onImageUpload,
  onImageFiles,
  onRemoveImage,
  onClearMediaError,
}: PredictionThesisImageDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const pastedFiles = Array.from(event.clipboardData.items)
      .filter((item) => item.type.startsWith('image/'))
      .map((item) => item.getAsFile())
      .filter((file): file is File => file !== null);
    if (pastedFiles.length === 0) return;
    event.preventDefault();
    onImageFiles(pastedFiles);
  };

  return (
    <div className="mt-4">
      <span className="mb-2 block text-sm font-medium text-gray-300">
        Optional chart (JPG, PNG, or WEBP)
      </span>
      <input
        ref={thesisImageInputRef}
        id="thesis-images"
        type="file"
        accept={THESIS_IMAGE_ACCEPT}
        disabled={disabled}
        onChange={(event) => {
          onClearMediaError();
          onImageUpload(event);
        }}
        className="sr-only"
        tabIndex={-1}
      />
      <div
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload thesis chart image by drop or paste"
        aria-disabled={disabled}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          if (event.currentTarget.contains(event.relatedTarget as Node)) return;
          setIsDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          if (disabled) return;
          const dropped = Array.from(event.dataTransfer.files).filter((file) =>
            file.type.startsWith('image/')
          );
          onImageFiles(dropped);
        }}
        onPaste={handlePaste}
        className={`relative flex min-h-[140px] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-6 text-center outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-cyan-500/50 ${
          disabled
            ? 'cursor-not-allowed border-white/10 bg-white/2 opacity-50'
            : isDragging
              ? 'cursor-copy border-cyan-400/60 bg-cyan-500/10'
              : 'border-white/20 bg-white/3'
        }`}
      >
        {mediaPreview ? (
          <>
            <img
              src={mediaPreview}
              alt="Thesis chart preview"
              className="max-h-48 w-full rounded-md object-contain"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onRemoveImage();
              }}
              disabled={disabled}
              className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80 disabled:cursor-not-allowed"
            >
              Remove
            </button>
            <p className="mt-2 text-xs text-gray-500">
              Drop, paste, or{' '}
              <button
                type="button"
                disabled={disabled}
                onClick={() => thesisImageInputRef.current?.click()}
                className="font-medium text-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                choose file
              </button>{' '}
              to replace
            </p>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-gray-400" aria-hidden />
            <p className="text-sm text-gray-300">
              Drop an image here, paste from clipboard, or{' '}
              <button
                type="button"
                disabled={disabled}
                onClick={() => thesisImageInputRef.current?.click()}
                className="font-medium text-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                choose file
              </button>
            </p>
            <p className="mt-1 text-xs text-gray-500">One image, max 5MB</p>
          </>
        )}
      </div>
      {mediaError ? <p className="mt-2 text-xs text-amber-400">{mediaError}</p> : null}
    </div>
  );
}
