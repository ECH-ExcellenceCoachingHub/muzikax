"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DataFetchErrorProps {
  error?: Error;
  reset?: () => void;
}

export default function DataFetchError({ error, reset }: DataFetchErrorProps) {
  const router = useRouter();
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Check online status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const goToOffline = () => {
    router.push('/offline');
  };

  const isNetworkError = !isOnline || 
    error?.message.includes('network') || 
    error?.message.includes('offline') ||
    error?.message.includes('Cannot make API calls while offline');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="text-center max-w-2xl">
        {/* Error Illustration */}
        <div className="mb-8">
          <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${
            isNetworkError 
              ? 'bg-gradient-to-br from-orange-500 to-red-600' 
              : 'bg-gradient-to-br from-red-500 to-pink-600'
          }`}>
            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isNetworkError ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-3.244m16.942-12.73a9 9 0 00-12.728 0m0 0l2.829 2.829m-2.829-2.829L3 3m5.658 16.942a9 9 0 01-2.83-1.414" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              )}
            </svg>
          </div>
        </div>

        {/* Error Content */}
        <h1 className="text-5xl md:text-6xl font-bold mb-4 text-text-primary">
          {isNetworkError ? "You're Offline" : "Data Fetch Error"}
        </h1>
        
        <p className="text-gray-300 text-lg mb-2 max-w-md mx-auto">
          {isNetworkError 
            ? "It looks like you've lost internet connection."
            : "We couldn't load the data you requested."
          }
        </p>

        {error && !isNetworkError && (
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto bg-gray-800/50 p-3 rounded-lg">
            {error.message}
          </p>
        )}

        {isNetworkError ? (
          <>
            <p className="text-gray-400 text-base mb-8 max-w-md mx-auto">
              Don't worry! You can still play your local music files or access your downloaded tracks.
            </p>

            {/* Primary Action - Go Offline */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              <button
                onClick={goToOffline}
                className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg shadow-orange-500/30 flex items-center justify-center"
              >
                <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Go to Offline Player
              </button>
            </div>

            {/* Secondary Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {reset && (
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              )}
              
              <Link 
                href="/" 
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
            </div>

            {/* Info Box */}
            <div className="mt-8 p-4 bg-gray-800/50 border border-gray-700 rounded-lg">
              <h3 className="font-medium mb-2 text-text-primary">💡 Did you know?</h3>
              <p className="text-gray-400 text-sm">
                The offline player lets you:
              </p>
              <ul className="text-gray-400 text-sm mt-2 space-y-1 text-left">
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  Play local audio files from your device
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  Access your downloaded tracks
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  Drag & drop files for instant playback
                </li>
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  Enjoy music without internet
                </li>
              </ul>
            </div>
          </>
        ) : (
          <>
            <p className="text-gray-400 text-base mb-8 max-w-md mx-auto">
              Something went wrong while fetching data. You can try again or switch to offline mode.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
              {reset && (
                <button
                  onClick={reset}
                  className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary-light text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Try Again
                </button>
              )}
              
              <button
                onClick={goToOffline}
                className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium rounded-lg transition-all duration-300 flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Go Offline
              </button>
              
              <Link 
                href="/" 
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors flex items-center justify-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Home
              </Link>
            </div>
          </>
        )}

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <h3 className="text-lg font-medium mb-4 text-text-primary">Need Help?</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md mx-auto">
            <Link 
              href="/offline" 
              className="px-4 py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              Offline Player
            </Link>
            <Link 
              href="/faq" 
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
            >
              ❓ FAQ
            </Link>
            <Link 
              href="/contact" 
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
            >
              💬 Contact Support
            </Link>
            <Link 
              href="/tracks" 
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
            >
              🎵 Your Library
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
