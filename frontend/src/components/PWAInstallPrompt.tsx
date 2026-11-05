"use client";

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { usePathname } from 'next/navigation';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const pathname = usePathname();
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Enhanced check for installed/native state
    const checkInstallState = () => {
      const isNative = Capacitor.isNativePlatform();
      const isStandalone = typeof window !== 'undefined' && 
                          window.matchMedia('(display-mode: standalone)').matches;
      const isInWebview = typeof window !== 'undefined' && 
                         /wv|WebView/i.test(navigator.userAgent);
      
      if (isNative || isStandalone || isInWebview) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstallState()) {
      return;
    }

    // Check if user has been prompted before
    const hasBeenPrompted = localStorage.getItem('pwaInstallPrompted');
    const lastPromptDate = localStorage.getItem('pwaInstallPromptDate');
    
    // Don't show if prompted in the last 7 days
    if (hasBeenPrompted && lastPromptDate) {
      const daysSincePrompt = (Date.now() - parseInt(lastPromptDate)) / (1000 * 60 * 60 * 24);
      if (daysSincePrompt < 7) {
        return;
      }
    }

    const handler = (e: Event) => {
      const beforeInstallPromptEvent = e as any;
      // Prevent the mini-infobar from appearing on mobile
      beforeInstallPromptEvent.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(beforeInstallPromptEvent);
      // Show the install prompt after 30 seconds
      setTimeout(() => {
        setShowInstallPrompt(true);
      }, 30000);
      console.log('PWA install prompt available');
    };

    window.addEventListener('beforeinstallprompt', handler as any);

    // Check if installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      localStorage.removeItem('pwaInstallPrompted');
      localStorage.removeItem('pwaInstallPromptDate');
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as any);
    };
  }, []);

  const installApp = () => {
    if (!deferredPrompt) {
      console.warn('Install prompt is not available');
      return;
    }

    // Log that we've prompted the user
    localStorage.setItem('pwaInstallPrompted', 'true');
    localStorage.setItem('pwaInstallPromptDate', Date.now().toString());

    try {
      // Show the install prompt
      deferredPrompt.prompt();

      // Wait for the user to respond to the prompt
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the install prompt');
          setIsInstalled(true);
        } else {
          console.log('User dismissed the install prompt');
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        // Hide the install prompt
        setShowInstallPrompt(false);
      });
    } catch (error) {
      console.error('Error showing install prompt:', error);
    }
  };

  const closePrompt = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwaInstallPrompted', 'true');
    localStorage.setItem('pwaInstallPromptDate', Date.now().toString());
  };

  if (!showInstallPrompt || isInstalled) return null;
  // never cover the DJ booth or the full-screen player
  if (pathname === '/dj' || pathname === '/player') return null;

  return (
    <div
      role="region"
      aria-label="Install MuzikaX app"
      // Sits above the mobile bottom nav, the mini player and the floating
      // action buttons on every breakpoint (all of those live below ~8rem).
      className="fixed left-3 right-3 sm:left-auto sm:right-6 sm:w-[21rem] z-[9998] bottom-[calc(9rem_+_env(safe-area-inset-bottom))] animate-slide-up-fade"
    >
      <div className="flex items-center gap-2.5 sm:gap-3 rounded-2xl border border-primary/30 bg-surface/95 backdrop-blur-xl px-2.5 py-2.5 sm:px-3 shadow-2xl shadow-black/60">
        {/* App icon */}
        <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-black ring-1 ring-primary/25">
          <img src="/app.png" alt="" className="w-full h-full object-cover" />
        </div>

        {/* Copy */}
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-[13px] sm:text-sm leading-tight truncate">
            Install MuzikaX
          </p>
          <p className="text-gray-400 text-[11px] sm:text-xs leading-tight truncate">
            Play offline, load faster
          </p>
        </div>

        {/* Install */}
        <button
          onClick={installApp}
          className="flex-shrink-0 bg-gradient-to-r from-primary-light via-primary-hover to-primary text-[#1a1200] font-bold text-xs px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg shadow-md shadow-primary/25 hover:brightness-110 active:scale-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#121214]"
        >
          Install
        </button>

        {/* Dismiss */}
        <button
          onClick={closePrompt}
          aria-label="Dismiss install prompt"
          className="flex-shrink-0 text-gray-500 hover:text-white transition-colors p-1 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;