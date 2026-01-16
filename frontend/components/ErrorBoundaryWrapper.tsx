'use client';

import { ErrorBoundary } from './ErrorBoundary';

interface ErrorBoundaryWrapperProps {
  children: React.ReactNode;
}

/**
 * Client component wrapper for ErrorBoundary
 * Required because ErrorBoundary must be a client component,
 * but layout.tsx is a server component
 */
export default function ErrorBoundaryWrapper({ children }: ErrorBoundaryWrapperProps) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
