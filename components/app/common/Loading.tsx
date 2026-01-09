'use client';

import Image from 'next/image';

interface LoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

export default function Loading({ text = 'Loading...', size = 'md' }: LoadingProps) {
  const logoSize = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const textSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative">
        <Image
          src="/pageshare_final.png"
          alt="PageShare Logo"
          width={64}
          height={64}
          className={`${logoSize[size]} rounded animate-pulse`}
          priority
        />
        {/* Spinning overlay for loading effect */}
        <div className="absolute inset-0 border-2 border-white/20 border-t-white/60 rounded-full animate-spin"></div>
      </div>
      <p className={`text-gray-400 ${textSize[size]} font-medium`}>{text}</p>
    </div>
  );
}

