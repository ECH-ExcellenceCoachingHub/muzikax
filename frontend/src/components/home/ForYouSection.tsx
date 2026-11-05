"use client";

import { useState, useEffect } from "react";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";

interface ForYouSectionProps {
  tracks: any[];
  rawTracks?: any[];
}

export default function ForYouSection({ tracks, rawTracks }: ForYouSectionProps) {
  const { playTrack, setCurrentPlaylist, currentTrack, isPlaying, favorites, addToFavorites, removeFromFavorites } = useAudioPlayer() as any;
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});

  // Update favorite status when favorites change
  useEffect(() => {
    const status: Record<string, boolean> = {};
    (favorites as any[]).forEach(track => {
      status[track.id] = true;
    });
    setFavoriteStatus(status);
  }, [favorites]);

  const handlePlayTrack = (trackId: string, track: any) => {
    const fullTrack = rawTracks?.find(t => t._id === trackId);
    if (fullTrack && fullTrack.audioURL) {
      playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverImage: track.coverImage,
        audioUrl: fullTrack.audioURL,
        plays: fullTrack.plays || 0,
        likes: fullTrack.likes || 0,
        creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null 
          ? (fullTrack.creatorId as any)._id 
          : fullTrack.creatorId,
        type: fullTrack.type,
        creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null 
          ? (fullTrack.creatorId as any).whatsappContact 
          : undefined)
      });
      
      const playlistTracks = rawTracks
        ?.filter((t) => t.audioURL)
        .map((t) => ({
          id: t._id,
          title: t.title,
          artist: typeof t.creatorId === "object" && t.creatorId !== null 
            ? (t.creatorId as any).name 
            : "Unknown Artist",
          coverImage: t.coverURL || "",
          audioUrl: t.audioURL,
          creatorId: typeof t.creatorId === 'object' && t.creatorId !== null 
            ? (t.creatorId as any)._id 
            : t.creatorId,
          type: t.type,
          creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
            ? (t.creatorId as any).whatsappContact 
            : undefined)
        })) || [];
      
      setCurrentPlaylist(playlistTracks);
    }
  };

  const toggleFavorite = (trackId: string, track: any) => {
    if (favoriteStatus[trackId]) {
      removeFromFavorites(trackId);
    } else {
      addToFavorites({
        id: track._id,
        title: track.title,
        artist: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any).name 
          : 'Unknown Artist',
        coverImage: track.coverURL || '',
        audioUrl: track.audioURL || '',
        creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any)._id 
          : track.creatorId
      });
    }
  };

  const isFavorite = (trackId: string) => {
    return favoriteStatus[trackId] || false;
  };

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-2 sm:py-4 lg:py-6 overflow-x-hidden border-t border-white/5">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-text-primary">
          For You
        </h2>
        <a
          href="/foryou"
          className="text-xs font-semibold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          See All
        </a>
      </div>

      {/* Mobile List View - Vertical */}
      <div className="md:hidden flex flex-col space-y-1.5 overflow-x-hidden">
        {tracks.map((track, index) => (
          <div
            key={`for-you-mobile-${track.id}`}
            className="group relative flex items-center gap-2 p-1.5 rounded-xl bg-[var(--card-bg)]/60 backdrop-blur-sm border border-[var(--card-bg)]/50 hover:bg-[var(--card-bg)]/80 transition-all active:scale-[0.98]"
          >
            {/* Track Cover */}
            <div className="relative w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
              {track.coverImage && track.coverImage.trim() !== '' ? (
                <img src={track.coverImage} alt={track.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                  </svg>
                </div>
              )}
              {/* Play Button Overlay */}
              <button
                onClick={() => handlePlayTrack(track.id, track)}
                className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm truncate tracking-wide text-text-primary">
                {track.title}
              </h3>
              <p className="text-gray-300 text-xs truncate font-medium mt-0.5">
                {track.artist}
              </p>
              
              {/* Stats */}
              <div className="flex items-center gap-3 mt-1.5">
                <div className="flex items-center gap-1">
                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs text-gray-400">{track.plays >= 1000 ? `${(track.plays / 1000).toFixed(1)}k` : track.plays}</span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const fullTrack = rawTracks?.find(t => t._id === track.id);
                    if (fullTrack) {
                      toggleFavorite(track.id, fullTrack);
                    }
                  }}
                  className="flex items-center gap-1"
                >
                  <svg 
                    className={`w-3.5 h-3.5 ${isFavorite(track.id) ? 'text-red-500 fill-current' : 'text-gray-400'}`}
                    fill={isFavorite(track.id) ? "currentColor" : "none"}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                  </svg>
                </button>
              </div>
            </div>

            {/* More Options */}
            <button className="p-2 text-gray-400 hover:text-white">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM16 10a2 2 0 11-4 0 2 2 0 014 0zM6 16a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Desktop Grid View - Hidden on Mobile */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
        {tracks.map((track, index) => (
          <div
            key={`for-you-${track.id}`}
            className="group relative gradient-border-animated overflow-hidden reveal-on-scroll holographic-shimmer card-lift-3d particle-float light-leak chromatic-aberration"
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="relative rounded-[14px] overflow-hidden bg-[var(--card-bg)]/90 backdrop-blur-md p-0.5 hover:bg-[var(--card-bg)] transition-colors">
              <div className="relative">
                {track.coverImage && track.coverImage.trim() !== '' ? (
                  <img src={track.coverImage} alt={track.title} className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-[1.04] scanline-overlay" />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-primary to-primary-light flex items-center justify-center neon-glow">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] via-[var(--card-bg)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-2 backdrop-blur-sm">
                  <button
                    onClick={() => handlePlayTrack(track.id, track)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 fab-spring shadow-2xl hover:shadow-primary/50 pulse-ring"
                  >
                    {currentTrack?.id === track.id && isPlaying ? (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const fullTrack = rawTracks?.find(t => t._id === track.id);
                      if (fullTrack) {
                        toggleFavorite(track.id, fullTrack);
                      }
                    }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full glassmorphism-advanced flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 fab-spring hover:scale-110 border border-white/40"
                  >
                    <svg 
                      className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${isFavorite(track.id) ? 'text-red-500 fill-current scale-110 neon-glow' : 'stroke-current'}`}
                      fill={isFavorite(track.id) ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-3 md:p-4">
                <h3 className="font-bold text-xs md:text-sm lg:text-base mb-1 truncate tracking-wide drop-shadow-md text-text-primary">
                  {track.title}
                </h3>
                <p className="text-gray-300 text-xs md:text-sm truncate font-medium">
                  {track.artist}
                </p>
                
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-400 text-xs font-semibold">{track.plays?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-primary-light" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                    </svg>
                    <span className="text-gray-400 text-xs font-semibold">{track.likes || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
