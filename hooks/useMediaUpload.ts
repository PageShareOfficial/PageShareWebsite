import { useState } from 'react';

interface UseMediaUploadResult {
  mediaFiles: File[];
  mediaPreviews: string[];
  selectedGif: string | null;
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveMedia: (index: number) => void;
  handleGifSelect: (gifUrl: string) => void;
  clearMedia: () => void;
  setMediaFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setMediaPreviews: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedGif: React.Dispatch<React.SetStateAction<string | null>>;
}

/**
 * Hook to manage media uploads (images and GIFs)
 * Handles file selection, preview generation, and media removal
 */
export function useMediaUpload(initialGif: string | null = null): UseMediaUploadResult {
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaPreviews, setMediaPreviews] = useState<string[]>([]);
  const [selectedGif, setSelectedGif] = useState<string | null>(initialGif);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    const newFiles = [...mediaFiles, ...imageFiles].slice(0, 4); // Max 4 images
    setMediaFiles(newFiles);

    // Clear GIF when images are uploaded
    if (newFiles.length > 0) {
      setSelectedGif(null);
    }

    // Create previews
    const newPreviews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === newFiles.length) {
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
  };

  return {
    mediaFiles,
    mediaPreviews,
    selectedGif,
    handleImageUpload,
    handleRemoveMedia,
    handleGifSelect,
    clearMedia,
    setMediaFiles,
    setMediaPreviews,
    setSelectedGif,
  };
}

