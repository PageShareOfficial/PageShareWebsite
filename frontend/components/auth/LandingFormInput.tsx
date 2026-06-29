'use client';

import React, { forwardRef, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface LandingFormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon: React.ReactNode;
  showPasswordToggle?: boolean;
}

const LandingFormInput = forwardRef<HTMLInputElement, LandingFormInputProps>(
  ({ label, error, icon, showPasswordToggle, className = '', type, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-gray-300">{label}</label>
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500">
            {icon}
          </span>
          <input
            ref={ref}
            type={inputType}
            className={`w-full pl-10 pr-10 py-3 bg-white/5 border ${
              error ? 'border-red-500' : 'border-white/10'
            } rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition-all ${className}`}
            {...props}
          />
          {isPassword && showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          )}
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  },
);

LandingFormInput.displayName = 'LandingFormInput';

export default LandingFormInput;
