'use client';

import { X } from 'lucide-react';

interface ImageViewerModalProps {
  imageUrls: string[];
  selectedIndex: number | null;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
}

export default function ImageViewerModal({
  imageUrls,
  selectedIndex,
  onClose,
  onPrevious,
  onNext,
}: ImageViewerModalProps) {
  if (selectedIndex === null || imageUrls.length === 0) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-6 h-6 text-white" />
      </button>
      
      {/* Navigation Buttons */}
      {imageUrls.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrevious();
            }}
            className="absolute left-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
            aria-label="Previous image"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="absolute right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors z-10"
            aria-label="Next image"
          >
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}
      
      {/* Image Container */}
      <div 
        className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={imageUrls[selectedIndex]}
          alt={`Image ${selectedIndex + 1}`}
          className="max-w-full max-h-[90vh] object-contain"
        />
      </div>
      
      {/* Image Counter */}
      {imageUrls.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1.5 bg-black/50 rounded-full text-white text-sm">
          {selectedIndex + 1} / {imageUrls.length}
        </div>
      )}
    </div>
  );
}

