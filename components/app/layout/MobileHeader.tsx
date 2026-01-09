'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface MobileHeaderProps {
  title: string;
  onBack?: () => void;
}

export default function MobileHeader({ title, onBack }: MobileHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="md:hidden sticky top-0 z-50 bg-black border-b border-white/10">
      <div className="flex items-center gap-4 px-4 py-3">
        <button
          onClick={handleBack}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <h1 className="text-lg font-semibold text-white truncate flex-1">
          {title}
        </h1>
      </div>
    </div>
  );
}

