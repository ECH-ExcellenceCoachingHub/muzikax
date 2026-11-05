'use client'

import { useAudioPlayer } from '../contexts/AudioPlayerContext'
import { usePayment } from '../contexts/PaymentContext'
import { useLanguage } from '../contexts/LanguageContext'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

interface BeatPlayerProps {
  className?: string
}

const BeatPlayer = ({ className = '' }: BeatPlayerProps) => {
  const { t } = useLanguage()
  const {
    currentTrack,
    isPlaying,
    isMinimized,
    togglePlayPause,
    closePlayer,
    progress,
    duration,
    setProgress,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    downloadTrack,
    favorites,
    addToFavorites,
    removeFromFavorites
  } = useAudioPlayer()
  
  const router = useRouter()
  const { showPayment } = usePayment()
  const progressRef = useRef<HTMLDivElement>(null)
  const [isFavorite, setIsFavorite] = useState(false)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  // Check if current track is a beat
  const isBeat = currentTrack?.type === 'beat' || 
                 (currentTrack?.title && currentTrack.title.toLowerCase().includes('beat'))

  // Check if current track is in favorites
  useEffect(() => {
    if (currentTrack) {
      setIsFavorite(favorites.some(track => track.id === currentTrack.id))
    }
  }, [currentTrack, favorites])

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentTrack || !duration) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const newProgress = percent * duration
    
    setProgress(newProgress)
  }

  // Toggle favorite status
  const toggleFavorite = () => {
    if (!currentTrack) return
    
    if (isFavorite) {
      removeFromFavorites(currentTrack.id)
    } else {
      addToFavorites(currentTrack)
    }
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
  }

  // Don't render if there's no current track or if it's not a beat
  if (!currentTrack || !isBeat) return null

  return (
    <div className={`fixed bottom-4 right-4 w-[380px] rounded-2xl bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20 z-50 animate-[fadeInUp_0.3s_ease-out] ${className}`}>
      {/* Beat-specific header */}
      <div className="px-4 py-3 border-b border-gray-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative flex-shrink-0">
              <div className="absolute -inset-1 bg-primary rounded-lg blur opacity-30 animate-pulse"></div>
              <img
                src={currentTrack.coverImage}
                alt={currentTrack.title}
                className={`w-12 h-12 rounded-lg object-cover relative z-10 transition-transform duration-300 ${
                  isPlaying ? 'scale-105' : ''
                }`}
              />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-white font-bold text-sm truncate max-w-[160px]">{currentTrack.title}</h4>
              <p className="text-primary-light text-xs truncate max-w-[140px]">{currentTrack.artist}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-primary text-xs font-bold whitespace-nowrap">{t('beat')}</span>
                {currentTrack.paymentType === 'paid' ? (
                  <span className="text-green-400 text-xs font-semibold whitespace-nowrap">• {t('paid')}</span>
                ) : (
                  <span className="text-blue-400 text-xs font-semibold whitespace-nowrap">• {t('free')}</span>
                )}
                {currentTrack.paymentType === 'paid' && currentTrack.price && (
                  <span className="text-yellow-400 text-xs font-semibold whitespace-nowrap">• {currentTrack.price.toLocaleString()} RWF</span>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={closePlayer}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 py-3">
        <div
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-1.5 w-full bg-gray-800 rounded-full cursor-pointer group"
        >
          <div
            className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all group-hover:h-2"
            style={{ width: `${(progress / duration) * 100 || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{formatTime(progress)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Beat-specific controls */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Previous */}
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd"></path>
            </svg>
          </button>
          
          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary-light flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg"
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
            ) : (
              <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
              </svg>
            )}
          </button>
          
          {/* Next */}
          <button className="text-gray-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd"></path>
            </svg>
          </button>
        </div>

        {/* Beat-specific action buttons */}
        <div className="flex gap-2">
          {/* Favorite button */}
          <button
            onClick={toggleFavorite}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              isFavorite 
                ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
          >
            <svg 
              className="w-4 h-4" 
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
            <span className="text-xs font-medium">Save</span>
          </button>

          {/* Action button (Download/Buy) */}
          <button
            onClick={() => {
              const paymentType = currentTrack.paymentType || 'free';
              if (paymentType === 'paid') {
                if (!currentTrack.price || currentTrack.price <= 0) {
                  alert('Price not available for this beat');
                  return;
                }
                showPayment({
                  trackId: currentTrack.id,
                  trackTitle: currentTrack.title,
                  price: currentTrack.price,
                  audioUrl: currentTrack.audioUrl
                });
              } else {
                downloadTrack();
              }
            }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
              (() => {
                const paymentType = currentTrack.paymentType || 'free';
                return paymentType === 'paid'
                  ? 'btn-primary text-white'
                  : 'btn-secondary text-white';
              })()
            }`}
          >
            {(() => {
              const paymentType = currentTrack.paymentType || 'free';
              return paymentType === 'paid' ? (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  <span className="text-xs font-medium">Buy Now</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                  <span className="text-xs font-medium">Download</span>
                </>
              );
            })()}
          </button>
        </div>
      </div>

      {/* Additional controls */}
      <div className="px-4 py-2 border-t border-gray-800/50">
        <div className="flex items-center justify-between">
          {/* Playback speed */}
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-xs">Speed:</span>
            <select
              value={playbackRate}
              onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
              className="bg-gray-800/50 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>

          {/* Volume control */}
          <div className="relative">
            <button
              onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"></path>
              </svg>
            </button>
            
            {showVolumeSlider && (
              <div className="absolute bottom-6 right-0 bg-gray-900/90 backdrop-blur-lg rounded-lg p-2 border border-gray-700">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={handleVolumeChange}
                  className="w-20 accent-primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BeatPlayer