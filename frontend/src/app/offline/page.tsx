'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOffline } from '../../contexts/OfflineContext';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useLanguage } from '../../contexts/LanguageContext';

export default function OfflinePage() {
  const { isOnline, offlineTracks, isMobileApp } = useOffline();
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    togglePlayPause,
    audioRef,
    progress,
    duration,
    setProgress
  } = useAudioPlayer();
  const router = useRouter();
  const { t } = useLanguage();
  
  const [localFiles, setLocalFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Auto-redirect to offline page when offline
  useEffect(() => {
    if (!isOnline && typeof window !== 'undefined') {
      console.log('🔴 Detected offline - redirecting to offline player');
      // The useOfflineRouting hook will handle the actual redirect
    }
  }, [isOnline]);

  // Go back handler for mobile apps
  const handleGoBack = () => {
    if (isOnline) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return '0:00';
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

  // Handle file selection from device
  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || 
        file.name.endsWith('.mp3') || 
        file.name.endsWith('.wav') || 
        file.name.endsWith('.ogg') ||
        file.name.endsWith('.m4a')
      );
      setLocalFiles(prev => [...prev, ...audioFiles]);
      // Auto-play first file if nothing is playing
      if (audioFiles.length > 0 && !currentTrack) {
        setTimeout(() => {
          playTrack({
            id: `local-${Date.now()}`,
            title: audioFiles[0].name.replace(/\.[^/.]+$/, ''),
            artist: 'Local File',
            audioUrl: URL.createObjectURL(audioFiles[0]),
            coverImage: '/app.png',
            duration: 0
          });
        }, 100);
      }
    }
  }, [currentTrack, playTrack]);

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files) {
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || 
        file.name.endsWith('.mp3') || 
        file.name.endsWith('.wav') || 
        file.name.endsWith('.ogg') ||
        file.name.endsWith('.m4a')
      );
      setLocalFiles(prev => [...prev, ...audioFiles]);
      // Auto-play first file if nothing is playing
      if (audioFiles.length > 0 && !currentTrack) {
        setTimeout(() => {
          playTrack({
            id: `local-${Date.now()}`,
            title: audioFiles[0].name.replace(/\.[^/.]+$/, ''),
            artist: 'Local File',
            audioUrl: URL.createObjectURL(audioFiles[0]),
            coverImage: '/app.png',
            duration: 0
          });
        }, 100);
      }
    }
  }, [currentTrack, playTrack]);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  // Request file system access (modern browsers)
  const requestFileSystemAccess = useCallback(async () => {
    try {
      // @ts-ignore - File System Access API
      if (window.showOpenFilePicker) {
        // @ts-ignore
        const handles = await window.showOpenFilePicker({
          multiple: true,
          types: [{
            description: 'Audio Files',
            accept: {
              'audio/*': ['.mp3', '.wav', '.ogg', '.m4a']
            }
          }]
        });
        
        const files = await Promise.all(handles.map((handle: any) => handle.getFile()));
        const audioFiles = files.filter((file: File) => 
          file.type.startsWith('audio/') || 
          file.name.endsWith('.mp3') || 
          file.name.endsWith('.wav') || 
          file.name.endsWith('.ogg') ||
          file.name.endsWith('.m4a')
        );
        
        setLocalFiles(prev => [...prev, ...audioFiles]);
        
        // Auto-play first file
        if (audioFiles.length > 0 && !currentTrack) {
          setTimeout(() => {
            playTrack({
              id: `local-${Date.now()}`,
              title: audioFiles[0].name.replace(/\.[^/.]+$/, ''),
              artist: 'Local File',
              audioUrl: URL.createObjectURL(audioFiles[0]),
              coverImage: '/app.png',
              duration: 0
            });
          }, 100);
        }
      }
    } catch (error) {
      console.error('File system access denied or not supported:', error);
      // Fallback to traditional file input
      openFileDialog();
    }
  }, [currentTrack, playTrack]);

  // Trigger file input
  const openFileDialog = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Play a local file from the list
  const playLocalFile = (file: File) => {
    playTrack({
      id: `local-${file.name}-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'Local File',
      audioUrl: URL.createObjectURL(file),
      coverImage: '/app.png',
      duration: 0
    });
  };

  // Remove a file from the list
  const removeFile = (index: number) => {
    setLocalFiles(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div 
      className={`min-h-screen bg-background transition-all duration-300 ${isDragging ? 'scale-[1.02]' : ''}`} 
      onDrop={handleDrop} 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* Drag & Drop Overlay */}
      {isDragging && (
        <div className="fixed inset-0 bg-gradient-to-br from-orange-600/90 to-red-600/90 backdrop-blur-sm z-[10000] flex items-center justify-center pointer-events-none">
          <div className="text-center text-white px-4">
            <svg className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 mx-auto mb-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2 text-text-primary">Drop Your Audio Files Here!</h2>
            <p className="text-base sm:text-lg md:text-xl opacity-90">Supports MP3, WAV, OGG, M4A</p>
          </div>
        </div>
      )}

      {/* Offline Status Banner */}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 sm:py-3 px-3 sm:px-4 text-center font-medium z-[9999] shadow-lg" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          <div className="flex items-center justify-center gap-1.5 sm:gap-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-3.244m16.942-12.73a9 9 0 00-12.728 0m0 0l2.829 2.829m-2.829-2.829L3 3m5.658 16.942a9 9 0 01-2.83-1.414" />
            </svg>
            <span className="text-xs sm:text-sm md:text-base">{isMobileApp ? 'Offline Mode - Play Your Local Music' : "You're Offline - Local Player Mode Active"}</span>
          </div>
        </div>
      )}

      <div className="max-w-5xl w-full mx-auto space-y-4 sm:space-y-6 lg:space-y-8 mt-12 sm:mt-14 md:mt-16 px-3 sm:px-4 md:px-6 lg:px-8 pb-24 md:pb-4">
        {/* Mobile Back Button */}
        <div className="md:hidden flex items-center justify-between mb-3 sm:mb-4">
          <button
            onClick={handleGoBack}
            className="flex items-center gap-1.5 sm:gap-2 text-gray-300 hover:text-white transition-colors active:scale-95"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs sm:text-sm font-medium">Back</span>
          </button>
          {isOnline && (
            <span className="text-[10px] sm:text-xs text-green-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full"></span>
              Online
            </span>
          )}
        </div>

        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-orange-500 to-red-600 mb-3 sm:mb-4 shadow-2xl shadow-orange-500/30">
            <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold px-2 text-text-primary">
            {isMobileApp ? 'Local Music Player' : 'Offline Music Player'}
          </h1>
          <p className="text-gray-300 text-sm sm:text-base md:text-lg lg:text-xl px-3 max-w-2xl mx-auto leading-relaxed">
            {offlineTracks.length > 0 
              ? `You have ${offlineTracks.length} downloaded track${offlineTracks.length !== 1 ? 's' : ''} available`
              : isMobileApp 
                ? "Play music from your device!" 
                : "No downloaded tracks? Play music from your device!"}
          </p>
          <p className="text-gray-400 text-xs sm:text-sm md:text-base">
            {isMobileApp 
              ? "Select songs from your device or drag & drop"
              : "Drag & drop audio files here or use the buttons below"}
          </p>
        </div>

        {/* Full Audio Player - Integrated with AudioPlayerContext */}
        {currentTrack && (
          <div className="bg-gradient-to-br from-gray-900 to-black border border-gray-700/50 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 lg:p-8 shadow-2xl shadow-orange-500/10">
            {/* Track Info */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4 md:mb-6">
              <img 
                src={currentTrack.coverImage || '/app.png'} 
                alt={currentTrack.title} 
                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-lg sm:rounded-xl object-cover shadow-lg flex-shrink-0" 
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold truncate leading-tight text-text-primary">{currentTrack.title}</h2>
                <p className="text-xs sm:text-sm md:text-base text-gray-400 truncate mt-0.5">{currentTrack.artist}</p>
              </div>
            </div>
        
            {/* Progress Bar */}
            <div className="mb-3 sm:mb-4 md:mb-6">
              <div 
                ref={progressRef}
                className="h-1.5 sm:h-2 bg-gray-700 rounded-full cursor-pointer overflow-hidden"
                onClick={handleProgressClick}
              >
                <div 
                  className="h-full bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-100"
                  style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] sm:text-xs md:text-sm text-gray-400 mt-1.5 sm:mt-2">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration || 0)}</span>
              </div>
            </div>
        
            {/* Play/Pause Control */}
            <div className="flex items-center justify-center">
              <button
                onClick={togglePlayPause}
                className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center hover:from-orange-600 hover:to-red-600 transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/30"
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Local File Upload Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2 sm:gap-3">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold text-text-primary">Load More Audio Files</h2>
            <div className="flex gap-1.5 sm:gap-2 w-full sm:w-auto">
              <button
                onClick={requestFileSystemAccess}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg font-medium hover:from-primary-hover hover:to-primary-light transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 text-xs sm:text-sm md:text-base"
                title="Modern file picker (recommended)"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="hidden md:inline">Select Files</span>
                <span className="md:hidden">Select</span>
              </button>
              <button
                onClick={openFileDialog}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 sm:py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 flex items-center justify-center gap-1.5 sm:gap-2 active:scale-95 text-xs sm:text-sm md:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span className="hidden md:inline">Add Files</span>
                <span className="md:hidden">Add</span>
              </button>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.mp3,.wav,.ogg,.m4a"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          {localFiles.length === 0 ? (
            <div 
              onClick={openFileDialog}
              className="border-2 border-dashed border-gray-600 rounded-xl p-4 sm:p-6 md:p-8 text-center cursor-pointer hover:border-orange-500 transition-colors active:scale-[0.98]"
            >
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 mx-auto text-gray-500 mb-2 sm:mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <p className="text-xs sm:text-sm md:text-base text-gray-400">Click to select more audio files from your computer or phone</p>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 mt-1 sm:mt-2">Supports MP3, WAV, OGG, M4A</p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
              {localFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between bg-gray-700/50 rounded-lg p-2 sm:p-3 group mx-surface"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs sm:text-sm font-medium truncate">{file.name}</p>
                      <p className="text-gray-400 text-[10px] sm:text-xs">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <button
                      onClick={() => playLocalFile(file)}
                      className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-green-600 hover:bg-green-700 text-white transition-colors flex items-center justify-center active:scale-95 flex-shrink-0"
                      title="Play"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeFile(index)}
                      className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-red-600/0 hover:bg-red-600 text-white transition-colors opacity-0 group-hover:opacity-100 flex items-center justify-center active:scale-95 flex-shrink-0"
                      title="Remove"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Downloaded Tracks Section */}
        {offlineTracks.length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6">
            <h2 className="text-base sm:text-lg md:text-xl font-semibold mb-2 sm:mb-3 md:mb-4 text-text-primary">Your Downloaded Tracks</h2>
            <p className="text-xs sm:text-sm md:text-base text-gray-400 mb-3 sm:mb-4">These tracks are available for offline playback</p>
            <Link
              href="/tracks"
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg font-medium hover:from-primary-hover hover:to-primary-light transition-all active:scale-95 text-xs sm:text-sm md:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              View Downloaded Tracks
            </Link>
          </div>
        )}

        {/* Back to App */}
        <div className="text-center pt-3 sm:pt-4 pb-20 md:pb-4">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 sm:gap-2 text-gray-400 hover:text-white transition-colors active:scale-95"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span className="text-xs sm:text-sm md:text-base">Back to MuzikaX</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
