'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { SplashScreen as CapacitorSplashScreen } from '@capacitor/splash-screen';

export default function AppLauncher() {
  const [isVisible, setIsVisible] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if running in Capacitor native app
    const isNative = typeof window !== 'undefined' && 
                     (window as any).capacitor?.isNative === true;

    // Also show for PWA that's been installed to home screen
    const isPWA = typeof window !== 'undefined' && 
                  window.matchMedia('(display-mode: standalone)').matches;

    if (!isNative && !isPWA) {
      setIsVisible(false);
      return;
    }

    // Play animation sequence
    const playAnimation = async () => {
      setIsAnimating(true);
      
      // Wait for initial render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Scale up animation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Fade out
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setIsAnimating(false);
      setIsVisible(false);
      
      // Hide native splash screen if Capacitor
      if (isNative) {
        try {
          await CapacitorSplashScreen.hide();
        } catch (error) {
          console.log('Error hiding splash screen:', error);
        }
      }
    };

    playAnimation();
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black transition-opacity duration-500 overflow-hidden">
      {/* Animated Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black" />
      
      {/* Pulsing Glow Effect */}
      <div className={`absolute w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-gradient-to-r from-pink-500/30 to-red-500/30 blur-3xl transition-all duration-1000 ${
        isAnimating ? 'scale-150 opacity-50' : 'scale-100 opacity-30'
      }`} />
      
      {/* Main Content Container - Perfectly Centered */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full px-4">
        {/* App Icon with Animation - Responsive Sizing */}
        <div className={`relative transition-all duration-700 ease-out flex flex-col items-center justify-center ${
          isAnimating ? 'scale-110 opacity-0' : 'scale-100 opacity-100'
        }`}>
          <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-64 md:h-64 animate-pulse-slow rounded-3xl overflow-hidden mx-auto">
            <Image
              src="/app.png"
              alt="MuzikaX"
              fill
              className="object-contain drop-shadow-2xl rounded-3xl"
              priority
            />
          </div>
          
          {/* Loading Spinner Below Icon - Responsive */}
          <div className="mt-6 sm:mt-8 flex justify-center">
            <div className="relative w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14">
              <div className="absolute inset-0 border-2 sm:border-4 border-gray-800 rounded-full"></div>
              <div className="absolute inset-0 border-2 sm:border-4 border-transparent border-t-pink-500 border-r-pink-500 rounded-full animate-spin"></div>
            </div>
          </div>
          
          {/* App Name - Responsive Text */}
          <h1 className="mt-4 sm:mt-6 text-2xl sm:text-3xl md:text-4xl font-bold tracking-wider text-center w-full text-text-primary">
            MUZIKAX
          </h1>
          <p className="mt-2 text-sm sm:text-base md:text-lg text-gray-400 text-center w-full px-2">
            Rwanda&apos;s Digital Music Ecosystem
          </p>
        </div>
      </div>
      
      {/* Progress Bar - Responsive Position and Size */}
      <div className="absolute bottom-16 sm:bottom-20 left-1/2 transform -translate-x-1/2 w-64 sm:w-72 md:w-80 h-1 sm:h-1.5 bg-gray-800 rounded-full overflow-hidden px-4">
        <div className={`h-full bg-gradient-to-r from-pink-500 to-red-500 transition-all duration-1000 ease-out ${
          isAnimating ? 'w-full opacity-0' : 'w-full opacity-100'
        }`} />
      </div>
    </div>
  );
}
