'use client';

import React, { forwardRef } from 'react';

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
}

/**
 * Basic text input with label and optional helper/error text.
 * Uses forwardRef so react-hook-form's register() can attach its ref.
 */
const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, className = '', ...props }, ref) => {
    const borderClass = error ? 'border-red-500' : 'border-white/10';
    const focusRing = error ? 'focus:ring-red-500' : 'focus:ring-teal-500';

    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label className="text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 bg-white/5 border ${borderClass} rounded-xl text-white placeholder-gray-500 focus:outline-none ${focusRing} focus:border-transparent transition-all ${className}`}
          {...props}
        />
      {error ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : helperText ? (
        <p className="text-sm text-gray-400">{helperText}</p>
      ) : null}
    </div>
  );
});

FormInput.displayName = 'FormInput';

export default FormInput;
