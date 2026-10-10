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

/** Destructive actions. Colors live here because overriding PrimaryButton's bg via className is unreliable. */
export function DangerButton({ children, className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 bg-red-600 text-white rounded-lg enabled:hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
