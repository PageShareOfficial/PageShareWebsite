import { useState } from 'react';

/** Match backend: max 4 images, 5MB each, JPEG/PNG/WebP */
export const MAX_MEDIA_FILES = 4;
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_MEDIA_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MEDIA_LIMITS_HINT = 'Up to 4 images, 5MB each (JPEG, PNG, WebP)';

interface UseMediaUploadResult {
  mediaFiles: File[];
  mediaPreviews: string[];
  selectedGif: string | null;
  mediaError: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveMedia: (index: number) => void;
  handleGifSelect: (gifUrl: string) => void;
  clearMedia: () => void;
  clearMediaError: () => void;
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setMediaPreviews: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedGif: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Hook to manage media uploads (images and GIFs)
 * Handles file selection, preview generation, and media removal.
 * Validates: max 4 files, 5MB each, JPEG/PNG/WebP only.
 */
export function useMediaUpload(initialGif: string | null = null): UseMediaUploadResult {
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(initialGif);
  const [mediaError, setMediaError] = useState<string | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;

    setMediaError(null);
    const valid: File[] = [];
    const errors: string[] = [];
    for (const file of files) {
      if (!ALLOWED_MEDIA_TYPES.includes(file.type)) {
        errors.push(`${file.name}: use JPEG, PNG or WebP`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        errors.push(`${file.name}: max 5MB`);
        continue;
      }
      valid.push(file);
    }

    const combined = [...mediaFiles, ...valid];
    const imageFiles = combined.slice(0, MAX_MEDIA_FILES);
    const limitExceeded = combined.length > imageFiles.length;

    if (errors.length > 0 || limitExceeded) {
      if (limitExceeded && errors.length === 0) {
        setMediaError('You can upload up to 4 images per post.');
      } else if (limitExceeded && errors.length > 0) {
        setMediaError('Some files skipped. Max 4 images per post, 5MB each, JPEG/PNG/WebP only.');
      } else {
        setMediaError(errors.length === 1 ? errors[0] : 'Some files skipped. Max 5MB each, JPEG/PNG/WebP only.');
      }
    }

    setMediaFiles(imageFiles);

    if (imageFiles.length > 0) {
      setSelectedGif(null);
    }

    const newPreviews: string[] = [];
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === imageFiles.length) {
          setMediaPreviews(newPreviews);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveMedia = (index: number) => {
    const newFiles = mediaFiles.filter((_, i) => i !== index);
    const newPreviews = mediaPreviews.filter((_, i) => i !== index);
    setMediaFiles(newFiles);
    setMediaPreviews(newPreviews);
  };

  const handleGifSelect = (gifUrl: string) => {
    setSelectedGif(gifUrl);
    // Clear images when GIF is selected
    setMediaFiles([]);
    setMediaPreviews([]);
  };

  const clearMedia = () => {
    setMediaFiles([]);
    setMediaPreviews([]);
    setSelectedGif(null);
    setMediaError(null);
  };

  return {
    mediaFiles,
    mediaPreviews,
    selectedGif,
    mediaError,
    handleImageUpload,
    handleRemoveMedia,
    handleGifSelect,
    clearMedia,
    clearMediaError: () => setMediaError(null),
    setMediaFiles,
    setMediaPreviews,
    setSelectedGif,
  };
}

