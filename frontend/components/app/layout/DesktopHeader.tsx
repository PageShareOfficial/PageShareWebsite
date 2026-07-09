'use client';

import { forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface DesktopHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  withSideBorders?: boolean;
  rightContent?: ReactNode;
}

/**
 * Reusable desktop header component with back button
 * Used on profile pages, ticker pages, etc.
 */
const DesktopHeader = forwardRef<HTMLDivElement, DesktopHeaderProps>(function DesktopHeader(
  { title, subtitle, onBack, withSideBorders = true, rightContent },
  ref,
) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div
      ref={ref}
      className={`hidden md:block sticky top-0 z-20 bg-black/80 backdrop-blur-sm border-b border-white/10 ${
        withSideBorders ? 'border-l border-r border-white/10' : ''
      }`}
    >
      <div className="px-4 py-4">
        <div className="flex flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-white/10 rounded-full transition-colors flex-shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-white truncate whitespace-nowrap">{title}</h1>
              {subtitle && (
                <p className="text-gray-400 text-sm truncate">{subtitle}</p>
              )}
            </div>
          </div>
          {rightContent ? <div className="flex-shrink-0 whitespace-nowrap">{rightContent}</div> : null}
        </div>
      </div>
    </div>
  );
});

export default DesktopHeader;
