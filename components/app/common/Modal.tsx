'use client';

import { X } from 'lucide-react';
import { ReactNode } from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  showCloseButton?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | 'full';
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  closeOnOverlayClick?: boolean;
  zIndex?: number;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  full: 'max-w-full',
};

/**
 * Reusable Modal wrapper component
 * Provides consistent overlay, container, and close button behavior
 */
export default function Modal({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  maxWidth = 'md',
  className = '',
  overlayClassName = '',
  contentClassName = '',
  closeOnOverlayClick = true,
  zIndex = 50,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center ${overlayClassName || 'bg-black/80 backdrop-blur-sm'} p-4`}
      style={{ zIndex }}
      onClick={closeOnOverlayClick ? onClose : undefined}
    >
      <div
        className={`bg-black border border-white/10 rounded-xl w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] overflow-y-auto shadow-xl ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with title and close button */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 sticky top-0 bg-black z-10">
            {title && <h2 className="text-xl font-bold text-white">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors ml-auto"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}
