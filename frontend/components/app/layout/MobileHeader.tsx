'use client';

import { forwardRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { ReactNode } from 'react';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
  rightContent?: ReactNode;
}

const MobileHeader = forwardRef<HTMLDivElement, MobileHeaderProps>(function MobileHeader(
  { title, onBack, rightContent },
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
      className="md:hidden sticky top-0 z-50 bg-black border-b border-white/10"
    >
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white truncate flex-1">{title}</h1>
        {rightContent ? <div className="flex-shrink-0">{rightContent}</div> : null}
      </div>
    </div>
  );
});

export default MobileHeader;

