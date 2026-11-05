"use client";

import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import { motion } from "framer-motion";

interface PopularMixesSectionProps {
  tracks: any[];
  rawTracks?: any[];
}

export default function PopularMixesSection({ tracks, rawTracks }: PopularMixesSectionProps) {
  const { playTrack, setCurrentPlaylist, currentTrack, isPlaying } = useAudioPlayer() as any;

  const handlePlayTrack = (trackId: string, track: any) => {
    const fullTrack = rawTracks?.find(t => t._id === trackId);
    if (fullTrack && fullTrack.audioURL) {
      playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverImage: track.coverImage,
        audioUrl: fullTrack.audioURL,
        creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null 
          ? (fullTrack.creatorId as any)._id 
          : fullTrack.creatorId
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
            : t.creatorId
        })) || [];
      
      setCurrentPlaylist(playlistTracks);
    }
  };

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-2 sm:py-4 lg:py-6 border-t border-white/5 pb-12">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-text-primary">
          Popular Mixes
        </h2>
        <a
          href="/tracks?category=mixes"
          className="text-xs font-semibold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          See All
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4 lg:gap-6">
        {tracks.filter((track) => track.category === "mix").slice(0, 10).map((track, index) => (
          <div
            key={`featured-mixes-${track.id}`}
            className={`group relative gradient-border-animated rounded-2xl overflow-hidden reveal-on-scroll holographic-shimmer card-lift-3d particle-float light-leak`}
            style={{ animationDelay: `${index * 0.05}s` }}
          >
            <div className="rounded-[14px] glassmorphism-advanced p-0.5 backdrop-blur-xl hover:bg-[var(--card-bg)]/70 transition-colors">
              <div className="relative scanline-overlay">
                {track.coverImage && track.coverImage.trim() !== '' ? (
                  <img src={track.coverImage} alt={track.title} className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-[1.04] reflective-surface" />
                ) : (
                  <div className="w-full aspect-square bg-gradient-to-br from-primary to-primary-light flex items-center justify-center neon-glow">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] via-[var(--card-bg)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
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
                </div>
              </div>

              <div className="p-3 md:p-4">
                <h3 className="font-bold text-xs md:text-sm lg:text-base mb-1 truncate tracking-wide drop-shadow-md text-text-primary">
                  {track.title}
                </h3>
                <p className="text-gray-300 text-xs md:text-sm truncate font-medium">
                  {track.artist}
                </p>
                <div className="flex justify-between items-center mt-2 md:mt-3 pt-2 border-t border-white/10">
                  <span className="text-gray-400 text-xs font-semibold">{track.duration}</span>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 text-primary-light" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-400 text-xs font-semibold">{track.likes}</span>
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
