'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useOffline } from '../contexts/OfflineContext';

export default function MobileNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const { isAuthenticated: actualAuth, userRole: actualRole } = useAuth();
  const { currentTrack, isPlaying, togglePlayPause } = useAudioPlayer();
  const { t, language: actualLanguage, setLanguage } = useLanguage();
  const { isOnline } = useOffline();
  const [showHeader, setShowHeader] = useState(true);
  const [showBottomNav, setShowBottomNav] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll to show/hide header and bottom navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show header and bottom nav when scrolling up or at top, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setShowHeader(true);
        setShowBottomNav(true);
      } else {
        setShowHeader(false);
        setShowBottomNav(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const isAuthenticated = mounted ? actualAuth : false;
  const userRole = mounted ? actualRole : null;
  const language = mounted ? actualLanguage : 'en';

  // Navigation items
  const baseNavItems = [
    { 
      name: t('home'), 
      href: '/', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    { 
      name: t('charts'), 
      href: '/charts', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    { 
      name: t('community'), 
      href: '/community', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      )
    },
    { 
      name: t('upload'), 
      href: '/upload', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    { 
      name: t('library'), 
      href: isAuthenticated ? '/library' : '/login', 
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      activeIcon: (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      )
    }
  ];

  // Add offline button when offline
  const navItems = !isOnline 
    ? [...baseNavItems, {
        name: 'Offline', 
        href: '/offline', 
        icon: (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-3.244m16.942-12.73a9 9 0 00-12.728 0m0 0l2.829 2.829m-2.829-2.829L3 3m5.658 16.942a9 9 0 01-2.83-1.414" />
          </svg>
        ),
        activeIcon: (
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.364 5.636a9 9 0 010 12.728" />
          </svg>
        )
      }]
    : baseNavItems;

  // Active link checker
  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Native App-Style Top Header for Mobile */}
      <div 
        className={`md:hidden fixed top-0 left-0 right-0 z-50 bg-[var(--card-bg)] backdrop-blur-xl border-b border-white/10 shadow-lg transition-transform duration-300 ease-in-out ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`} 
        style={{ paddingTop: 'env(safe-area-inset-top)', zIndex: 9999 }} 
        data-testid="mobile-header"
      >
        <div className="flex items-center justify-between h-14 px-3">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center group flex-shrink-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden shadow-md">
              <img src="/muzikax.png" alt="MuzikaX Logo" className="w-full h-full object-cover rounded-lg transition-transform group-hover:scale-[1.04]" />
            </div>
            <span className="ml-2 text-xl font-black text-white tracking-tighter">MuzikaX</span>
          </Link>

          {/* Right: Search, Profile (if logged in), and Language */}
          <div className="flex items-center space-x-2">
            {/* Search Button */}
            <button
              onClick={() => router.push('/search')}
              className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition-all active:scale-95"
              aria-label="Search"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
            
            {/* Profile Icon (only when logged in) */}
            {isAuthenticated && (
              <Link
                href="/library"
                className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition-all active:scale-95"
                aria-label="Profile"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </Link>
            )}
            
            {/* Language Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowLanguageModal(true)}
                className="inline-flex items-center justify-center p-2 rounded-full text-gray-400 hover:text-white hover:bg-gray-800 focus:outline-none transition-all active:scale-95 relative"
                aria-label="Switch Language"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="absolute -top-0.5 -right-0.5 text-[8px] font-black uppercase bg-gradient-to-r from-primary to-primary-light text-white px-1 rounded-sm border border-gray-900 shadow-sm leading-none py-0.5 min-w-[16px] text-center">
                  {language === 'en' ? 'EN' : language === 'rw' ? 'RW' : 'SW'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Language Modal - Centered Outside Header */}
        {showLanguageModal && (
          <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            style={{ top: 0, left: 0, right: 0, bottom: 0, minHeight: '100vh' }}
            onClick={() => setShowLanguageModal(false)}
          >
            <div 
              className="bg-[var(--card-bg)] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-200 scale-100 animate-in fade-in zoom-in-95 overflow-auto"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              style={{ maxHeight: '90vh' }}
            >
              {/* Header with Close Button */}
              <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">
                  Select Language
                </h2>
                <button
                  onClick={() => setShowLanguageModal(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:bg-gray-800 transition-colors"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Language Options - Large & Touch-Friendly */}
              <div className="p-4 space-y-3 pb-6">
                {/* English Option */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLanguage('en');
                    setShowLanguageModal(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors duration-150 active:scale-[0.99] ${actualLanguage === 'en' ? 'bg-primary/10 border-primary/40' : 'bg-surface border-transparent hover:bg-surface-overlay'}`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">🇬🇧</span>
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-white">English</span>
                      <span className="text-xs text-text-muted">United Kingdom</span>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-primary ${actualLanguage === 'en' ? '' : 'invisible'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Kinyarwanda Option */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLanguage('rw');
                    setShowLanguageModal(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors duration-150 active:scale-[0.99] ${actualLanguage === 'rw' ? 'bg-primary/10 border-primary/40' : 'bg-surface border-transparent hover:bg-surface-overlay'}`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">🇷🇼</span>
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-white">Kinyarwanda</span>
                      <span className="text-xs text-text-muted">Rwanda</span>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-primary ${actualLanguage === 'rw' ? '' : 'invisible'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Kiswahili Option */}
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setLanguage('sw');
                    setShowLanguageModal(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors duration-150 active:scale-[0.99] ${actualLanguage === 'sw' ? 'bg-primary/10 border-primary/40' : 'bg-surface border-transparent hover:bg-surface-overlay'}`}
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">🇹🇿</span>
                    <div className="flex flex-col">
                      <span className="text-base font-semibold text-white">Kiswahili</span>
                      <span className="text-xs text-text-muted">Tanzania/Kenya</span>
                    </div>
                  </div>
                  <svg className={`w-5 h-5 text-primary ${actualLanguage === 'sw' ? '' : 'invisible'}`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>

              {/* Info Text */}
              <div className="px-6 pb-5 text-center border-t border-gray-800/50 pt-4">
                <p className="text-xs text-gray-400">
                  You can change this later in settings
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Player bar when track is playing - Enhanced with gradient */}
      {currentTrack && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--card-bg)] border-t border-white/10 shadow-lg backdrop-blur-sm" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <Link 
            href="/player" 
            className="flex items-center p-2.5 gap-3 active:scale-[0.98] transition-all duration-150 min-h-[60px]"
          >
            <img 
              src={currentTrack.coverImage} 
              alt={currentTrack.title} 
              className="w-10 h-10 rounded-lg object-cover border border-gray-600 flex-shrink-0 shadow-md animate-pulse-slow"
            />
            <div className="flex-1 min-w-0 overflow-hidden">
              <p className="text-white text-sm font-semibold truncate leading-tight">{currentTrack.title}</p>
              <p className="text-gray-300 text-xs truncate leading-tight mt-0.5">{currentTrack.artist}</p>
            </div>
            <button 
              onClick={(e) => {
                e.preventDefault();
                togglePlayPause();
              }}
              className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center active:scale-90 transition-transform duration-150 shadow-lg shadow-primary/30 flex-shrink-0"
            >
              {isPlaying ? (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </Link>
        </div>
      )}

      {/* Modern Bottom Navigation bar with glassmorphism */}
      <div 
        className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--card-bg)] backdrop-blur-xl border-t border-white/10 shadow-2xl transition-transform duration-300 ease-in-out ${
          showBottomNav ? 'translate-y-0' : 'translate-y-full'
        }`} 
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', zIndex: currentTrack ? 51 : 9999 }} 
        data-testid="mobile-navbar"
      >
        <div className="flex justify-around items-stretch">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`relative flex flex-col items-center justify-center py-3 px-1.5 flex-1 active:scale-90 transition-all duration-200 group ${
                  active
                    ? 'text-primary'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                {/* Active indicator background glow */}
                {active && (
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-t-lg" />
                )}
                
                {/* Icon with scale animation */}
                <div className={`relative z-10 transform transition-all duration-200 ${
                  active ? 'scale-110 -translate-y-0.5' : 'scale-100 group-hover:scale-105'
                }`}>
                  {active && item.activeIcon ? item.activeIcon : item.icon}
                </div>
                
                {/* Label with active state */}
                <span className={`relative z-10 text-[10px] mt-1 font-medium transition-all duration-200 ${
                  active ? 'text-primary font-semibold tracking-wide' : 'text-gray-400'
                }`}>
                  {item.name}
                </span>
                
                {/* Active dot indicator */}
                {active && (
                  <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full shadow-lg shadow-primary/50" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}