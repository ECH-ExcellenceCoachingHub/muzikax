"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { getAlbumById } from "../../services/albumService";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";

interface Album {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  year: number;
  tracks: number;
}

interface PopularAlbumsSectionProps {
  albums: Album[];
  loading: boolean;
}

export default function PopularAlbumsSection({ albums, loading }: PopularAlbumsSectionProps) {
  const router = useRouter();
  const { playTrack, setCurrentPlaylist } = useAudioPlayer();
  const [playingAlbumId, setPlayingAlbumId] = useState<string | null>(null);

  const handlePlayAlbum = async (albumId: string, album: Album) => {
    setPlayingAlbumId(albumId);
    try {
      const albumData = await getAlbumById(album.id);
      const tracks = (Array.isArray(albumData.tracks) ? albumData.tracks : []).map((track: any) => {
        const artist = (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null) 
          ? (track.creatorId.name || "Unknown Artist")
          : "Unknown Artist";
        return {
          id: track._id || track.id,
          title: track.title,
          artist: artist,
          coverImage: (track.coverURL || track.coverImage) || "",
          audioUrl: track.audioURL,
          creatorId: (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null) 
            ? track.creatorId._id 
            : track.creatorId
        };
      });
      
      if (tracks.length > 0) {
        setCurrentPlaylist(tracks);
        playTrack(tracks[0], tracks, { albumId: album.id, tracks });
      }
    } catch (error) {
      console.error('Error playing album:', error);
    } finally {
      setPlayingAlbumId(null);
    }
  };

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 xl:px-16 2xl:px-24 py-2 sm:py-4 lg:py-6 border-t border-white/5">
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-text-primary">
          Popular Albums
        </h2>
        <a
          href="/albums"
          className="text-xs font-semibold uppercase tracking-widest text-text-secondary hover:text-text-primary transition-colors duration-200"
        >
          See All
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3 md:gap-4 lg:gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="group gradient-border-animated rounded-2xl overflow-hidden transition-all duration-500 card-lift-3d">
              <div className="rounded-[14px] glassmorphism-advanced p-0.5 backdrop-blur-xl hover:bg-[var(--card-bg)]/70 transition-colors">
                <div className="relative">
                  <div className="w-full aspect-square bg-[var(--card-bg)]/70 animate-pulse"></div>
                </div>
                <div className="p-3 pt-3.5">
                  <div className="h-4 bg-[var(--card-bg)]/70 rounded mb-2 animate-pulse"></div>
                  <div className="h-3 bg-[var(--card-bg)]/70 rounded w-3/4 animate-pulse"></div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="h-3 bg-[var(--card-bg)]/70 rounded w-1/3 animate-pulse"></div>
                    <div className="h-3 bg-[var(--card-bg)]/70 rounded w-1/3 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          albums.map((album, index) => (
            <div
              key={album.id}
              className={`group relative gradient-border-animated rounded-2xl overflow-hidden reveal-on-scroll holographic-shimmer card-lift-3d particle-float light-leak`}
              style={{ animationDelay: `${index * 0.05}s` }}
              onClick={() => router.push(`/album/${album.id}`)}
            >
              <div className="rounded-[14px] glassmorphism-advanced p-0.5 backdrop-blur-xl cursor-pointer hover:bg-[var(--card-bg)]/70 transition-colors">
                <div className="relative scanline-overlay">
                  {album.coverImage && album.coverImage.trim() !== '' ? (
                    <img src={album.coverImage} alt={album.title} className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-[1.04] reflective-surface" />
                  ) : (
                    <div className="w-full aspect-square bg-gradient-to-br from-primary to-primary-light flex items-center justify-center neon-glow">
                      <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--card-bg)] via-[var(--card-bg)]/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center backdrop-blur-sm">
                    <button 
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-500 fab-spring shadow-2xl hover:shadow-primary/50 pulse-ring"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAlbum(album.id, album);
                      }}
                      aria-label={`Play album ${album.title}`}
                    >
                      {playingAlbumId === album.id ? (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
                    {album.title}
                  </h3>
                  <p className="text-gray-300 text-xs md:text-sm truncate font-medium">
                    {album.artist}
                  </p>
                  <div className="flex justify-between items-center mt-2 md:mt-3 pt-2 border-t border-white/10">
                    <span className="text-gray-400 text-xs font-semibold">{album.year}</span>
                    <span className="text-gray-400 text-xs font-semibold flex items-center gap-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                      {album.tracks} tracks
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
