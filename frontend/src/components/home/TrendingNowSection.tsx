"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import { useLanguage } from "../../contexts/LanguageContext";

interface TrendingNowSectionProps {
  tracks: any[];
  loading: boolean;
  rawTracks?: any[];
}

export default function TrendingNowSection({ tracks, loading, rawTracks }: TrendingNowSectionProps) {
  const { playTrack, setCurrentPlaylist } = useAudioPlayer() as any;
  const { t } = useLanguage();

  const handleTrackClick = (trackId: string, track: any) => {
    const fullTrack = rawTracks?.find(t => t._id === trackId);
    if (fullTrack?.audioURL) {
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
        ?.filter(t => t.audioURL)
        .map(t => ({
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

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-6 md:py-8 lg:py-10 border-t border-white/5">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <motion.h2 
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="text-xl md:text-2xl lg:text-3xl xl:text-4xl font-black text-text-primary"
        >
          🔥 {t('trendingNow' as any)}
        </motion.h2>
        <Link
          href="/explore?tab=trending"
          className="text-gold-400 hover:text-gold-300 text-xs md:text-sm lg:text-base font-semibold transition-all hover:underline flex items-center gap-1 group"
        >
          {t('viewAll')}
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* Horizontal Scroll Container */}
      <div className="relative">
        <div className="flex gap-4 lg:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory">
          {loading ? (
            // Skeleton loaders
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[280px] md:w-[320px] snap-start">
                <div className="bg-[var(--card-bg)]/50 rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-64 bg-[var(--card-bg)]/70"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-5 bg-[var(--card-bg)]/70 rounded w-3/4"></div>
                    <div className="h-4 bg-[var(--card-bg)]/70 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Track cards
            tracks.slice(0, 10).map((track, index) => (
              <motion.div
                key={track.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex-shrink-0 w-[280px] md:w-[300px] lg:w-[320px] xl:w-[350px] snap-start"
              >
                <div 
                  onClick={() => handleTrackClick(track.id, track)}
                  className="modern-track-card card-glow group cursor-pointer"
                >
                  {/* Cover Image */}
                  <div className="relative h-56 md:h-60 lg:h-64 xl:h-72 overflow-hidden">
                    {track.coverImage && track.coverImage.trim() !== '' ? (
                      <img
                        src={track.coverImage}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold-500 via-orange-500 to-red-600 flex items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                        <svg className="w-20 h-20 text-white/60 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                      </div>
                    )}
                    
                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60 opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
                      <div className="w-16 h-16 md:w-20 lg:w-24 rounded-full bg-gradient-to-r from-gold-500 via-orange-500 to-red-600 flex items-center justify-center shadow-2xl transform scale-0 group-hover:scale-100 transition-all duration-500 delay-75 ring-4 ring-white/20 group-hover:ring-white/40">
                        <svg className="w-8 h-8 md:w-10 md:h-10 text-white ml-1 drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>

                    {/* Badge */}
                    <div className="absolute top-3 right-3 glass-strong px-3 py-1.5 rounded-full backdrop-blur-md border border-gold-500/20 shadow-lg">
                      <span className="text-xs font-bold text-gold-400 drop-shadow-md">#{index + 1} Trending</span>
                    </div>
                    
                    {/* Top gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 opacity-60"></div>
                  </div>

                  {/* Info Section */}
                  <div className="p-4 md:p-5 lg:p-6 relative">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-sm md:text-base lg:text-lg font-bold leading-tight line-clamp-2 flex-1 tracking-wide text-text-primary">
                        {track.title}
                      </h3>
                    </div>
                    <p className="text-xs md:text-sm text-gray-300 mb-3 truncate font-medium tracking-wide">
                      {track.artist}
                    </p>
                    
                    {/* Stats with Icons */}
                    <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-1.5 group/stat">
                        <div className="p-1.5 rounded-full bg-gradient-to-r from-gold-500/10 to-orange-500/10 group-hover/stat:from-gold-500/20 group-hover/stat:to-orange-500/20 transition-colors">
                          <svg className="w-3.5 h-3.5 text-gold-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{(track.plays / 1000).toFixed(1)}K {t('plays')}</span>
                      </div>
                      <div className="flex items-center gap-1.5 group/stat">
                        <div className="p-1.5 rounded-full bg-gradient-to-r from-red-500/10 to-pink-500/10 group-hover/stat:from-red-500/20 group-hover/stat:to-pink-500/20 transition-colors">
                          <svg className="w-3.5 h-3.5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <span className="text-xs text-gray-400 font-medium">{(track.likes / 1000).toFixed(1)}K likes</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
