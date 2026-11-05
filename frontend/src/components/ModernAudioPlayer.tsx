'use client';

import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
import { usePayment } from '../contexts/PaymentContext';
import { useLanguage } from '../contexts/LanguageContext';
import SoloPlayer from './SoloPlayer';

const ModernAudioPlayer = () => {
  const { t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const {
    currentTrack,
    isPlaying,
    isMinimized,
    isSoloPlayerOpen,
    setIsSoloPlayerOpen,
    togglePlayPause,
    progress,
    duration,
    setProgress,
    playNextTrack,
    playPreviousTrack,
    addToFavorites,
    removeFromFavorites,
    favorites,
    audioRef,
    shareTrack,
    currentPlaylistName
  } = useAudioPlayer();  
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const progressRef = useRef<HTMLDivElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { showPayment, hidePayment, isPaymentVisible, paymentData } = usePayment();
  
  // Set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
    };
    
    // Check on mount
    checkIsMobile();
    
    // Add resize listener
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', checkIsMobile);
      return () => window.removeEventListener('resize', checkIsMobile);
    }
  }, []);

  // Listen for payment requests from AudioPlayerContext
  useEffect(() => {
    const handlePaymentRequest = (event: CustomEvent) => {
      const { trackId, trackTitle, price, audioUrl } = event.detail;
      showPayment({
        trackId,
        trackTitle,
        price,
        audioUrl
      });
    };

    window.addEventListener('requestTrackPayment', handlePaymentRequest as EventListener);
    
    return () => {
      window.removeEventListener('requestTrackPayment', handlePaymentRequest as EventListener);
    };
  }, [showPayment]);

  // Handle successful payment
  const handlePaymentSuccess = () => {
    // Close payment modal
    hidePayment();
    
    // Play the track using the bypass function
    if (paymentData && paymentData.audioUrl) {
      // Access playTrackAfterPurchase from window object
      const audioPlayerContext = (window as any).audioPlayerContext;
      if (audioPlayerContext && audioPlayerContext.playTrackAfterPurchase) {
        audioPlayerContext.playTrackAfterPurchase({
          id: paymentData.trackId,
          title: paymentData.trackTitle,
          audioUrl: paymentData.audioUrl
        });
      }
    }
  };
  
  // Check if current track is in favorites
  useEffect(() => {
    if (currentTrack) {
      setIsFavorite(favorites.some(track => track.id === currentTrack.id));
    }
  }, [currentTrack, favorites]);

  // Toast notification effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentTrack || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newProgress = percent * duration;
    
    // Update progress in context
    setProgress(newProgress);
    
    // Seek in audio element by accessing it through the context
    if (audioRef && audioRef.current) {
      audioRef.current.currentTime = newProgress;
      // Ensure playback continues after seeking
      if (isPlaying && audioRef.current.paused) {
        audioRef.current.play().catch(error => {
          console.error('Error resuming playback after seek:', error);
        });
      }
    }
  };

  // Toggle favorite status
  const toggleFavorite = () => {
    if (!currentTrack) return;
    
    if (isFavorite) {
      // Remove from favorites
      removeFromFavorites(currentTrack.id);
      setToast({message: t('removedFromFavorites'), type: 'success'});
    } else {
      // Add to favorites
      addToFavorites(currentTrack);
      setToast({message: t('addedToFavorites'), type: 'success'});
    }
    setIsFavorite(!isFavorite);
  };

  // Navigate to full player page
  const goToFullPlayer = () => {
    router.push('/player');
  };

  // No longer redirect to full player page automatically
  // The player will stay minimized and visible on all pages
  // Users can click the expand button to go to the full player page

  // Check if current track is a beat
  const isBeat = currentTrack?.type === 'beat' || 
                 (currentTrack?.title && currentTrack.title.toLowerCase().includes('beat'));

  // Don't render if there's no current track or if not mounted
  if (!mounted || !currentTrack) return null;

  // DJ mode has its own decks; the regular player stays out of the way
  if (pathname === '/dj') return null;

  // Don't render minimized player on mobile devices (handled by MobileNavbar)
  if (isMinimized && isMobile) {
    return null;
  }

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
          {toast.message}
        </div>
      )}
      
      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">{t('shareTrack')}</h3>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="flex items-center mb-6 p-4 bg-gray-700 rounded-lg">
              <img 
                src={currentTrack.coverImage} 
                alt={currentTrack.title} 
                className="w-16 h-16 rounded-lg object-cover"
              />
              <div className="ml-4">
                <h4 className="font-bold truncate">{currentTrack.title}</h4>
                <p className="text-gray-400 text-sm">{currentTrack.artist}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <button 
                onClick={() => {
                  shareTrack('facebook');
                  setIsShareModalOpen(false);
                }}
                className="flex flex-col items-center p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z"></path>
                </svg>
                <span className="text-xs mt-2">Facebook</span>
              </button>
              
              <button 
                onClick={() => {
                  shareTrack('twitter');
                  setIsShareModalOpen(false);
                }}
                className="flex flex-col items-center p-3 bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
                </svg>
                <span className="text-xs mt-2">Twitter</span>
              </button>
              
              <button 
                onClick={() => {
                  shareTrack('whatsapp');
                  setIsShareModalOpen(false);
                }}
                className="flex flex-col items-center p-3 bg-green-500 rounded-lg hover:bg-green-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
                </svg>
                <span className="text-xs mt-2">WhatsApp</span>
              </button>
              
              <button 
                onClick={() => {
                  shareTrack('linkedin');
                  setIsShareModalOpen(false);
                }}
                className="flex flex-col items-center p-3 bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
                <span className="text-xs mt-2">LinkedIn</span>
              </button>
            </div>
            
            <button 
              onClick={() => {
                shareTrack('copy');
                setToast({message: t('linkCopied'), type: 'success'});
                setIsShareModalOpen(false);
              }}
              className="w-full mt-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              {t('copyLink')}
            </button>
          </div>
        </div>
      )}
      
      {/* Minimized Player */}
      {isMinimized && (
        <div className={`
          fixed bottom-20 sm:bottom-6 right-2 sm:right-6 
          left-2 sm:left-auto
          w-[calc(100vw-1rem)] sm:w-auto 
          min-w-[300px] sm:min-w-[340px]
          max-w-[420px]
          rounded-2xl 
          ${isBeat ? 'bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20' : 'bg-black/70 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]'} 
          z-40 animate-[fadeInUp_0.3s_ease-out]
          sm:z-50
        `}>
          {/* Beat-specific styling */}
          {isBeat && (
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary-light/20 to-primary-light/20 rounded-2xl"></div>
          )}
          
          {/* Player Content */}
          <div className="relative z-10 flex items-center p-2 sm:p-3">
            <button 
              onClick={() => setIsSoloPlayerOpen(true)}
              className="relative shrink-0 cursor-pointer hover:scale-105 transition-transform duration-300 z-20"
              title={t('openSoloPlayer')}
            >
              <img
                src={currentTrack.coverImage}
                alt={currentTrack.title}
                className={`w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover transition-transform duration-300 ${
                  isPlaying ? 'scale-105' : ''
                } ${isBeat ? 'rounded-lg' : ''}`}
              />
              {/* Beat-specific glow effect */}
              {isBeat && (
                <div className="absolute -inset-1 bg-primary rounded-lg blur opacity-30 animate-pulse"></div>
              )}
              {/* Regular glow effect for non-beats */}
              {!isBeat && (
                <div className="absolute -inset-1 bg-gradient-to-r from-#FF8C00 to-purple-500 blur opacity-30 rounded-xl"></div>
              )}
            </button>
            
            <div className="ml-2 sm:ml-3 flex-1 min-w-0 overflow-hidden">
              {isBeat ? (
                <>
                  <h4 className="text-white font-bold text-sm truncate">{currentTrack.title}</h4>
                  <p className="text-primary-light text-xs truncate">{currentTrack.artist}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-primary text-xs font-medium">{t('beat')}</span>
                    {(() => {
                      // Handle missing or null paymentType by defaulting to 'free'
                      const paymentType = currentTrack.paymentType || 'free';
                      return paymentType === "paid" ? (
                        <span className="text-green-400 text-xs">• {t('paid')}</span>
                      ) : (
                        <span className="text-blue-400 text-xs">• {t('free')}</span>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <>
                  <h4 className="text-white font-medium text-sm truncate">{currentTrack.title}</h4>
                  <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
                </>
              )}
              
              
              {/* Current Playlist Indicator in Mini Player */}
              {currentPlaylistName && (
                <div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-primary-light" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                  <p className="text-primary-light text-xs truncate">{t('fromPlaylist', { name: currentPlaylistName })}</p>
                </div>
              )}
              
              {/* Mini Progress Bar */}
              <div
                ref={progressRef}
                onClick={handleProgressClick}
                className="mt-1 h-1.5 sm:h-1 w-full bg-white/10 rounded-full cursor-pointer touch-manipulation"
              >
                <div
                  className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all"
                  style={{ width: `${(progress / duration) * 100 || 0}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* Previous Button */}
              <button
                onClick={() => playPreviousTrack(true)}
                className="
                  w-8 h-8 sm:w-9 sm:h-9 rounded-full 
                  bg-white/5 hover:bg-white/15 
                  flex items-center justify-center
                  transition-all
                  min-w-[32px] min-h-[32px]
                  sm:min-w-[40px] sm:min-h-[40px]
                  touch-manipulation
                  p-1
                "
                title={t('previousTrack')}
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
                </svg>
              </button>

              {/* Play / Pause Button */}
              <button
                onClick={togglePlayPause}
                className="
                  w-10 h-10 sm:w-11 sm:h-11 rounded-full 
                  bg-white/10 hover:bg-white/20 
                  flex items-center justify-center
                  transition-all
                  min-w-[44px] min-h-[44px]
                  sm:min-w-[48px] sm:min-h-[48px]
                  touch-manipulation
                  p-1
                "
              >
                {isPlaying ? (
                  /* Pause Icon */
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1" />
                    <rect x="14" y="5" width="4" height="14" rx="1" />
                  </svg>
                ) : (
                  /* Play Icon */
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-[1px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Next Button */}
              <button
                onClick={() => playNextTrack(true)}
                className="
                  w-8 h-8 sm:w-9 sm:h-9 rounded-full 
                  bg-white/5 hover:bg-white/15 
                  flex items-center justify-center
                  transition-all
                  min-w-[32px] min-h-[32px]
                  sm:min-w-[40px] sm:min-h-[40px]
                  touch-manipulation
                  p-1
                "
                title={t('nextTrack')}
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6zm9-12h2v12h-2z" />
                </svg>
              </button>
              
              {/* Expand Button */}
              <button
                onClick={goToFullPlayer}
                className="
                  w-8 h-8 sm:w-9 sm:h-9 rounded-full
                  bg-white/5 hover:bg-white/15
                  flex items-center justify-center
                  transition
                  min-w-[32px] min-h-[32px]
                  sm:min-w-[40px] sm:min-h-[40px]
                  touch-manipulation
                  p-1
                  ml-1
                "
                title={t('openFullPlayer')}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14" />
                  <path d="M5 12l7-7 7 7" />
                </svg>
              </button>
            </div>
              

            </div>
          </div>
        )}
      {/* Full Player - Only show when on the player page */}
      {!isMinimized && currentTrack && (
        <div className="hidden">
          {/* This div ensures the component renders but doesn't display anything */}
          {/* The actual full player is rendered on the /player page */}
        </div>
      )}
      
      {/* PesaPal Payment Modal */}
      {/* Global payment modal is handled by PaymentProvider in layout */}

      {/* Solo Player Overlay */}
      {isSoloPlayerOpen && (
        <SoloPlayer onClose={() => setIsSoloPlayerOpen(false)} />
      )}
    </>
  );
};

export default ModernAudioPlayer;
