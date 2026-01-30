'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { logErrorToBackend } from '@/utils/error/logError';

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
    this.resetError = this.resetError.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    if (process.env.NODE_ENV === 'development') {
      this.setState({ errorInfo });
    }

    // Log to backend (POST /api/v1/errors/log) when NEXT_PUBLIC_API_URL is set
    logErrorToBackend({
      error_type: 'frontend',
      error_code: 'COMPONENT_ERROR',
      error_message: error.message || String(error),
      stack_trace: error.stack ?? undefined,
      page_url: typeof window !== 'undefined' ? window.location.pathname || window.location.href : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      severity: 'error',
      metadata: {
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
      },
    });

    try {
      Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } },
      });
    } catch {
      // ignore Sentry errors
    }
  }

  resetError() {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h1 className="text-2xl md:text-3xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-400 mb-2">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-4 text-left text-sm text-gray-500">
                <summary className="cursor-pointer mb-2">Error Details (Dev Only)</summary>
                <pre className="bg-gray-900 p-4 rounded overflow-auto text-xs">
                  {this.state.error?.stack}
                  {'\n\n'}
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="mt-6 flex gap-4 justify-center">
              <button
                onClick={this.resetError}
                className="px-6 py-3 bg-teal-500 text-white rounded-full hover:bg-teal-600 transition-colors font-medium"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.href = '/home'}
                className="px-6 py-3 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors font-medium border border-white/20"
              >
                Go to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export { ErrorBoundary };

