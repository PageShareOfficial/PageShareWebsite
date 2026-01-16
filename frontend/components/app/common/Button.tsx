'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function PrimaryButton({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-100 transition-colors font-medium ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
