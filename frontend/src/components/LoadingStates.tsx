'use client';

import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
  message?: string;
  show?: boolean;
  timeout?: number; // Timeout in milliseconds
  onTimeout?: () => void; // Callback when timeout occurs
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ 
  message = 'Loading...', 
  show = true,
  timeout,
  onTimeout,
}) => {
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (!show || !timeout) return;

    setTimedOut(false);
    const timer = setTimeout(() => {
      setTimedOut(true);
      if (onTimeout) onTimeout();
    }, timeout);

    return () => clearTimeout(timer);
  }, [show, timeout, onTimeout]);

  if (!show) return null;

  // Show timeout message
  if (timedOut) {
    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="text-center max-w-md p-6">
          <svg
            className="w-16 h-16 text-yellow-400 mx-auto mb-4"
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
          <p className="text-white text-lg font-medium mb-4">
            This is taking longer than expected
          </p>
          <p className="text-gray-400 text-sm mb-6">
            The server might be busy. Would you like to wait or try again?
          </p>
          <div className="space-y-3">
            <button
              onClick={() => setTimedOut(false)}
              className="w-full bg-gradient-to-r from-primary to-primary-light text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-all duration-300"
            >
              Keep Waiting
            </button>
            <button
              onClick={onTimeout}
              className="w-full bg-gray-700/50 text-white font-semibold py-3 px-6 rounded-lg hover:bg-gray-700 transition-all duration-300"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Normal loading state
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="text-center">
        <div className="mb-4">
          <div className="inline-block w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <p className="text-white text-lg font-medium">{message}</p>
        {timeout && (
          <p className="text-gray-500 text-xs mt-2">
            Please wait...
          </p>
        )}
      </div>
    </div>
  );
};

interface LoadingSkeletonProps {
  type?: 'card' | 'list' | 'grid' | 'album' | 'track';
  count?: number;
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ 
  type = 'card', 
  count = 4 
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="rounded-xl overflow-hidden bg-gray-800/50 animate-pulse">
            <div className="w-full aspect-square bg-gray-700"></div>
            <div className="p-3 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
          </div>
        );
      
      case 'album':
        return (
          <div className="rounded-xl overflow-hidden bg-gray-800/50 animate-pulse group">
            <div className="relative">
              <div className="w-full aspect-square bg-gray-700"></div>
            </div>
            <div className="p-3">
              <div className="h-4 bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-700 rounded w-3/4"></div>
              <div className="flex justify-between items-center mt-2">
                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
                <div className="h-3 bg-gray-700 rounded w-1/3"></div>
              </div>
            </div>
          </div>
        );
      
      case 'track':
        return (
          <div className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/50 animate-pulse">
            <div className="w-12 h-12 bg-gray-700 rounded"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-700 rounded w-1/2"></div>
            </div>
            <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
          </div>
        );
      
      case 'list':
        return (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>{renderSkeleton()}</div>
      ))}
    </>
  );
};

interface ErrorMessageProps {
  title?: string;
  message?: string;
  suggestion?: string;
  onRetry?: () => void;
  showRetryButton?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title = 'Something went wrong',
  message = 'Please try again',
  suggestion,
  onRetry,
  showRetryButton = true,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <svg
        className="w-16 h-16 text-red-400 mb-4"
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
      
      <h3 className="text-xl font-bold mb-2 text-text-primary">{title}</h3>
      <p className="text-gray-400 mb-4 max-w-md">{message}</p>
      
      {suggestion && (
        <p className="text-sm text-gray-500 mb-6">{suggestion}</p>
      )}
      
      {showRetryButton && onRetry && (
        <button
          onClick={onRetry}
          className="bg-gradient-to-r from-primary to-primary-light text-white font-semibold py-2 px-6 rounded-lg hover:opacity-90 transition-all duration-300"
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export const OfflineBanner: React.FC = () => {
  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center text-sm z-[9999] shadow-lg">
      <div className="flex items-center justify-center gap-2">
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
        <span>You're offline. Some features may not be available.</span>
      </div>
    </div>
  );
};
