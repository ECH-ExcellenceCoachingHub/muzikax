'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class LoadingErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Loading error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-gray-800/50 border border-gray-700 rounded-2xl p-8 text-center backdrop-blur-sm">
            {/* Error Icon */}
            <div className="w-20 h-20 mx-auto mb-6 bg-red-500/10 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            {/* Error Title */}
            <h2 className="text-2xl font-bold mb-3 text-text-primary">
              Loading Failed
            </h2>

            {/* Error Message */}
            <p className="text-gray-400 mb-6">
              {this.state.error?.message || 'Something went wrong while loading the application'}
            </p>

            {/* Helpful Suggestions */}
            <div className="bg-gray-900/50 rounded-lg p-4 mb-6 text-left">
              <p className="text-gray-300 font-semibold text-sm mb-2">Try these steps:</p>
              <ul className="space-y-2 text-gray-400 text-xs">
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Check your internet connection
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Clear your browser cache and cookies
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Disable browser extensions temporarily
                </li>
                <li className="flex items-start">
                  <span className="text-primary mr-2">•</span>
                  Try using a different browser
                </li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full bg-gradient-to-r from-primary to-primary-light text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300 shadow-lg"
              >
                Reload Page
              </button>
              
              <button
                onClick={() => window.history.back()}
                className="w-full bg-gray-700/50 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all duration-300"
              >
                Go Back
              </button>
            </div>

            {/* Technical Details (Optional) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-6 text-left">
                <summary className="text-gray-500 text-xs cursor-pointer hover:text-gray-400">
                  Technical Details
                </summary>
                <pre className="mt-2 p-3 bg-gray-900 rounded text-xs text-red-400 overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default LoadingErrorBoundary;
