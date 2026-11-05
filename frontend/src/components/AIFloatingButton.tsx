'use client';

import { useState, useEffect } from 'react';

export default function AIFloatingButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [showTooltip, setShowTooltip] = useState(false);

  // Handle scroll to hide/show button
  useEffect(() => {
    // Initially set to visible after component mounts
    setTimeout(() => setIsVisible(true), 100);
    
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      if (window.scrollY > lastScrollY && window.scrollY > 300) {
        // Scrolling down
        setIsVisible(false);
        setIsOpen(false);
      } else if (window.scrollY <= 10) {
        // At top of page
        setIsVisible(true);
      } else if (window.scrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      }
      lastScrollY = window.scrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-hide tooltip after delay
  useEffect(() => {
    if (showTooltip) {
      const timer = setTimeout(() => setShowTooltip(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showTooltip]);

  const handleAIClick = () => {
    // Toggle expanded options menu
    setIsOpen(!isOpen);
    setShowTooltip(false);
  };

  return (
    <div className={`fixed right-4 sm:right-6 bottom-32 sm:bottom-40 z-[9995] transition-all duration-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
      <div className="relative">
        {/* Main AI Button */}
        <button
          onClick={handleAIClick}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          className="w-12 h-12 btn-primary rounded-full shadow-xl flex items-center justify-center text-white hover:shadow-2xl transition-all duration-300 transform hover:scale-105 relative group"
          aria-label="AI Assistant"
        >
          {/* Main button content */}
          <div className="relative z-10">
            <svg 
              className={`w-6 h-6 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        </button>

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-3 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg whitespace-nowrap animate-fadeIn">
            AI Assistant
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* Expanded AI Options */}
        {isOpen && (
          <div className="absolute bottom-16 right-0 mb-2 space-y-3 animate-slideUp">
            {/* Chat Option - Opens AI Assistant */}
            <div className="transition-all duration-200 transform hover:scale-105">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  // Close this menu first
                  setIsOpen(false);
                  // Open WhatsApp for AI chat
                  setTimeout(() => {
                    window.open('https://wa.me/250793828834?text=Hi,%20I%20want%20to%20chat%20with%20AI%20assistant', '_blank');
                  }, 100);
                }}
                className="flex items-center bg-white text-gray-800 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Chat Now</span>
              </button>
            </div>

            {/* FAQ Option */}
            <div className="transition-all duration-200 transform hover:scale-105">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  // Link to FAQ/help page or open modal
                  alert('FAQ feature coming soon! For now, use Chat Now to contact us.');
                }}
                className="flex items-center bg-white text-gray-800 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-amber-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm0-14c-2.21 0-4 1.79-4 4h2c0-1.1.9-2 2-2s2 .9 2 2c0 2-3 1.75-3 5h2c0-2.25 3-2.5 3-5 0-2.21-1.79-4-4-4z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">FAQ Help</span>
              </button>
            </div>

            {/* Support Option */}
            <div className="transition-all duration-200 transform hover:scale-105">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                  setTimeout(() => {
                    window.open('https://wa.me/250793828834?text=I%20need%20technical%20support', '_blank');
                  }, 100);
                }}
                className="flex items-center bg-white text-gray-800 px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-rose-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" />
                  </svg>
                </div>
                <span className="text-sm font-medium">Support</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}