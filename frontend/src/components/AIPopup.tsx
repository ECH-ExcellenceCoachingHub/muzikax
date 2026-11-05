'use client';

import React, { useState, useEffect } from 'react';
import { useAIAssistant } from '../contexts/AIAssistantContext';

const AIPopup: React.FC = () => {
  const { openAssistant } = useAIAssistant();
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Check if user has seen this before
    const hasSeenPopup = localStorage.getItem('aiAssistantPopupSeen');
    
    if (!hasSeenPopup) {
      // Show popup after 2 seconds of page load
      const timer = setTimeout(() => {
        setIsVisible(true);
        setTimeout(() => setIsAnimating(true), 100);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsVisible(false);
      localStorage.setItem('aiAssistantPopupSeen', 'true');
    }, 300);
  };

  const handleTryNow = () => {
    handleClose();
    openAssistant();
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isAnimating ? 'opacity-100' : 'opacity-0'}`}>
      {/* Popup Content */}
      <div className={`relative bg-gradient-to-br from-gray-900 via-black to-gray-900 rounded-2xl shadow-2xl max-w-sm w-full border-primary/30 transform transition-all duration-300 ${isAnimating ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}>
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors z-10"
          aria-label="Close popup"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-6 pt-10">
          {/* Animated AI Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary rounded-full blur-lg animate-pulse"></div>
              <div className="relative bg-primary p-4 rounded-full">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="absolute -top-1 -right-1 text-xl animate-bounce">🎵</div>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-center mb-2 text-text-primary">
            MuzikaX AI Assistant 🎧
          </h2>

          {/* Subtitle */}
          <p className="text-primary/80 text-center mb-5 text-xs">
            Your personal music companion
          </p>

          {/* Features - Minimalist */}
          <div className="space-y-3 mb-5">
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <span className="text-primary">✨</span>
              <span>Smart recommendations</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <span className="text-primary-light">🎤</span>
              <span>Voice commands</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300 text-sm">
              <span className="text-primary">🧠</span>
              <span>Learns your taste</span>
            </div>
          </div>

          {/* Example prompt */}
          <div className="bg-primary/20 rounded-lg p-3 border border-primary/30 mb-5">
            <p className="text-primary/80 text-xs italic text-center">
              "Play trending Afrobeat in Kigali"
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 bg-gray-800 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors border border-gray-700"
            >
              Later
            </button>
            <button
              onClick={handleTryNow}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg text-sm font-bold hover:shadow-lg hover:shadow-primary/50 transition-all transform hover:scale-105"
            >
              Try Now 🚀
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPopup;
