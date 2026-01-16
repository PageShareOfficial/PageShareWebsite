'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

interface DesktopHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

/**
 * Reusable desktop header component with back button
 * Used on profile pages, ticker pages, etc.
 */
export default function DesktopHeader({ title, subtitle, onBack }: DesktopHeaderProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <div className="hidden md:block sticky top-0 z-20 bg-black/80 backdrop-blur-sm border-l border-r border-white/10 border-b border-white/10">
      <div className="px-4 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">{title}</h1>
            {subtitle && (
              <p className="text-gray-400 text-sm">{subtitle}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
