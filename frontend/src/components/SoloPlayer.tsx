'use client';

import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useRef, useEffect, useState } from 'react';
import MuzikaXSoundEngine from './MuzikaXSoundEngine';

interface SoloPlayerProps {
  onClose: () => void;
}

const SoloPlayer = ({ onClose }: SoloPlayerProps) => {
  const { t } = useLanguage();
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    playNextTrack,
    playPreviousTrack,
    progress,
    duration,
    setProgress,
    audioRef
  } = useAudioPlayer();

  const progressRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [showSoundEngine, setShowSoundEngine] = useState(false);

  // Initialize Audio Context

  useEffect(() => {
    setIsMounted(true);
    // Prevent scrolling when solo player is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  if (!currentTrack || !isMounted) return null;



  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newProgress = percent * duration;
    
    setProgress(newProgress);
    
    // Seek in audio element and ensure playback continues
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center overflow-y-auto overflow-x-hidden animate-fadeIn backdrop-blur-3xl">
      {/* Background with blurred thumbnail */}
      <div 
        className="absolute inset-0 bg-cover bg-center blur-[120px] opacity-30 scale-125 pointer-events-none"
        style={{ backgroundImage: `url(${currentTrack.coverImage})` }}
      />
      
      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/80 pointer-events-none" />

      {/* Header Controls */}
      <div className="fixed top-6 sm:top-10 left-6 sm:left-10 right-6 sm:right-10 z-30 flex justify-between items-center pointer-events-none">
        {/* Sound Engine Button */}
        <button 
          onClick={() => setShowSoundEngine(!showSoundEngine)}
          className={`inline-flex items-center gap-2 h-11 px-4 rounded-full backdrop-blur-xl border transition-colors pointer-events-auto ${
            showSoundEngine
              ? 'bg-primary text-black border-primary'
              : 'bg-black/30 text-white/80 hover:text-white hover:bg-black/50 border-white/10'
          }`}
          aria-label="Sound settings"
          title="Sound settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" />
          </svg>
          <span className="text-sm font-semibold">Sound</span>
        </button>

        <button 
          onClick={onClose}
          className="p-3 text-white/70 hover:text-white transition-all bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-xl border border-white/10 hover:rotate-90 pointer-events-auto"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* MuzikaX Sound Engine */}
      {showSoundEngine && audioRef.current && (
        <MuzikaXSoundEngine 
          audioElement={audioRef.current}
          onClose={() => setShowSoundEngine(false)}
        />
      )}

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-5xl px-6 sm:px-12 py-10 flex flex-col md:flex-row items-center justify-center gap-10 md:gap-16 min-h-screen md:min-h-0">
        {/* Track Thumbnail Container */}
        <div className="w-full max-w-[280px] sm:max-w-[380px] md:max-w-[450px] aspect-square relative group flex-shrink-0">
          <div className={`absolute -inset-4 bg-gradient-to-tr from-primary/20 to-primary-light/20 blur-2xl rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${isPlaying ? 'opacity-40 animate-pulse' : ''}`} />
          <div className={`relative w-full h-full rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-1000 ease-out border border-white/10 ${isPlaying ? 'scale-100 rotate-0' : 'scale-90 -rotate-2 opacity-80'}`}>
            <img 
              src={currentTrack.coverImage} 
              alt={currentTrack.title}
              className="w-full h-full object-cover transform transition-transform duration-[2000ms] group-hover:scale-[1.04]"
            />
          </div>
        </div>

        {/* Track Controls & Info Side */}
        <div className="flex-1 w-full flex flex-col items-center md:items-start">
          <div className="text-center md:text-left mb-8 w-full">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black mb-3 tracking-tight leading-tight text-text-primary">
              {currentTrack.title}
            </h2>
            <p className="text-lg sm:text-xl text-white/50 font-medium">
              {currentTrack.artist}
            </p>
          </div>

          {/* Progress Bar Section */}
          <div className="w-full mb-10">
            <div 
              ref={progressRef}
              onClick={handleProgressClick}
              className="group relative h-2 w-full bg-white/5 rounded-full cursor-pointer overflow-hidden mb-4"
            >
              <div 
                className="absolute h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-100 ease-linear rounded-full"
                style={{ width: `${(progress / duration) * 100}%` }}
              />
              {/* Hover indicator point */}
              <div className="absolute top-1/2 -translate-y-1/2 h-4 w-4 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-[0_0_15px_rgba(255,255,255,0.5)]" 
                   style={{ left: `${(progress / duration) * 100}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
            <div className="flex justify-between text-xs sm:text-sm font-bold tracking-wider text-white/30 uppercase">
              <span>{formatTime(progress)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center md:justify-start gap-8 sm:gap-12 w-full">
            {/* Previous */}
            <button 
              onClick={() => playPreviousTrack(true)}
              className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-90 group"
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            {/* Play/Pause */}
            <button 
              onClick={togglePlayPause}
              className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center bg-white text-black rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.3)] hover:scale-110 active:scale-95 transition-all duration-300 relative group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-primary-light/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              {isPlaying ? (
                <svg className="w-8 h-8 sm:w-10 sm:h-10 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" rx="1.5" />
                  <rect x="14" y="5" width="4" height="14" rx="1.5" />
                </svg>
              ) : (
                <svg className="w-8 h-8 sm:w-10 sm:h-10 ml-1.5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Next */}
            <button 
              onClick={() => playNextTrack(true)}
              className="text-white/40 hover:text-white transition-all hover:scale-110 active:scale-90 group"
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 6l8.5 6L6 18zm9 0h2v12h-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SoloPlayer;
