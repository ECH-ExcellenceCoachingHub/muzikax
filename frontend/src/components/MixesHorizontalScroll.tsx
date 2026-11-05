'use client';

import { useState, useEffect, useRef } from 'react';
import SectionHeader from './home/SectionHeader';
import Link from 'next/link';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { FaPlay, FaPause, FaHeart } from 'react-icons/fa';

interface Track {
  _id: string;
  title: string;
  creatorId: {
    name: string;
    _id: string;
  } | string;
  coverURL?: string;
  audioURL: string;
  plays?: number;
  likes?: number;
  type?: 'song' | 'beat' | 'mix';
}

interface MixesHorizontalScrollProps {
  title?: string;
  viewAllLink?: string;
}

const MixesHorizontalScroll = ({ title, viewAllLink = '/mixes' }: MixesHorizontalScrollProps) => {
  const { t } = useLanguage();
  const displayTitle = title || t('popularMixes');
  const [mixes, setMixes] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, favoritesLoading, addToFavorites, removeFromFavorites } = useAudioPlayer();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Check scroll position and update button states
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  // Initial check and add event listener
  useEffect(() => {
    updateScrollButtons();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', updateScrollButtons);
      // Also check on window resize
      window.addEventListener('resize', updateScrollButtons);
      return () => {
        container.removeEventListener('scroll', updateScrollButtons);
        window.removeEventListener('resize', updateScrollButtons);
      };
    }
  }, [mixes]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Width of typical card + gap
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  // State for tracking which tracks are favorited
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});

  // Update favorite status when favorites change or when favorites are loaded
  useEffect(() => {
    if (!favoritesLoading) {
      const status: Record<string, boolean> = {};
      favorites.forEach(track => {
        status[track.id] = true;
      });
      setFavoriteStatus(status);
    }
  }, [favorites, favoritesLoading]);

  // Fetch mixes from API
  useEffect(() => {
    const fetchMixes = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/type?type=mix&limit=20`);
        
        if (response.ok) {
          const data: Track[] = await response.json();
          
          // Filter out tracks without audio URLs
          const filteredData = data.filter((track: any) => 
            track.audioURL && track.audioURL.trim() !== ''
          );
          
          setMixes(filteredData);
        } else {
          throw new Error(`Failed to fetch mixes: ${response.status}`);
        }
      } catch (err: any) {
        console.error('Error fetching mixes:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMixes();
  }, []);

  // Toggle favorite status for a track
  const toggleFavorite = (trackId: string, track: any) => {
    if (favoriteStatus[trackId]) {
      // Remove from favorites
      removeFromFavorites(trackId);
    } else {
      // Add to favorites
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

  // Play a track and set the playlist
  const handlePlayTrack = (track: Track) => {
    const trackToPlay = {
      id: track._id,
      title: track.title,
      artist: typeof track.creatorId === 'object' && track.creatorId !== null 
        ? (track.creatorId as any).name 
        : 'Unknown Artist',
      coverImage: track.coverURL || '',
      audioUrl: track.audioURL,
      creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
        ? (track.creatorId as any)._id 
        : track.creatorId
    };

    playTrack(trackToPlay);

    // Set the current playlist to all mixes
    const playlistTracks = mixes
      .filter((t) => t.audioURL) // Only tracks with audio
      .map((t) => ({
        id: t._id,
        title: t.title,
        artist: typeof t.creatorId === 'object' && t.creatorId !== null 
          ? (t.creatorId as any).name 
          : 'Unknown Artist',
        coverImage: t.coverURL || '',
        audioUrl: t.audioURL,
        creatorId: typeof t.creatorId === 'object' && t.creatorId !== null 
          ? (t.creatorId as any)._id 
          : t.creatorId
      }));
      
    setCurrentPlaylist(playlistTracks);
  };

  if (loading) {
    return (
      <section className="px-4 md:px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">{displayTitle}</h2>
          <Link href={viewAllLink} className="text-primary hover:text-primary-light transition-colors">
            {t('viewAll')}
          </Link>
        </div>
        <div className="flex overflow-x-auto pb-4 scrollbar-hide">
          <div className="flex space-x-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex-shrink-0 w-64 bg-gray-800/50 rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-40 bg-gray-700"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-3 bg-gray-700 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 md:px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-text-primary">{displayTitle}</h2>
          <Link href={viewAllLink} className="text-primary hover:text-primary-light transition-colors">
            {t('viewAll')}
          </Link>
        </div>
        <div className="text-red-500">Error loading mixes: {error}</div>
      </section>
    );
  }

  if (mixes.length === 0) {
    return null; // Don't render anything if there are no mixes
  }

  return (
    <section className="px-4 md:px-6 py-8">
      <SectionHeader title={displayTitle} href={viewAllLink} actionLabel={t('viewAll')} />
      <div className="relative group/scroll">
        <div 
          ref={scrollContainerRef}
          className="flex overflow-x-auto pb-4 scrollbar-hide -mx-4 md:-mx-6 px-4 md:px-6 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex space-x-4">
            {mixes.map((track) => {
              const artistName = typeof track.creatorId === 'object' && track.creatorId !== null 
                ? (track.creatorId as any).name 
                : 'Unknown Artist';
              
              const isActive = currentTrack?.id === track._id;
              
              return (
                <div
                  key={track._id}
                  data-active={isActive}
                  className="mx-card group/card flex-shrink-0 w-64 snap-start"
                >
                  <div className="mx-card-media aspect-[16/10] w-full">
                    {track.coverURL ? (
                      <img
                        src={track.coverURL}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="mx-card-zoom flex items-center justify-center bg-surface-overlay">
                        <span className="text-2xl font-bold text-text-secondary">
                          {track.title.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    <button
                      onClick={() => handlePlayTrack(track)}
                      disabled={!track.audioURL}
                      aria-label={isActive && isPlaying ? 'Pause' : 'Play'}
                      className="mx-card-play pointer-events-auto hover:bg-primary-hover"
                    >
                      {isActive && isPlaying ? <FaPause className="w-4 h-4" /> : <FaPlay className="w-4 h-4 ml-0.5" />}
                    </button>

                    {/* Now Playing Badge */}
                    {isActive && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-black text-[10px] font-bold rounded-full">
                        {t('nowPlaying')}
                      </div>
                    )}
                    
                    {/* Favorite Button */}
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(track._id, track);
                        }}
                        className="p-1.5 rounded-full bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover/card:opacity-100 focus-visible:opacity-100 transition-opacity duration-200"
                      >
                        <FaHeart 
                          className={`w-4 h-4 ${favoriteStatus[track._id] ? 'text-red-500 fill-current scale-110' : 'text-white'}`}
                        />
                      </button>
                    </div>
                  </div>
                  
                  {/* Track Info */}
                  <div className="min-w-0">
                    <h3 className="mx-card-title" title={track.title}>
                      {track.title}
                    </h3>
                    <p className="mx-card-subtitle" title={artistName}>
                      {artistName}
                    </p>
                    
                    {/* Stats */}
                    <div className="flex justify-between text-xs text-text-muted mt-2 pt-2 border-t border-border-light">
                      <span>{(track.plays || 0).toLocaleString()} {t('plays')}</span>
                      <div className="flex items-center gap-1">
                        <FaHeart className="w-3 h-3" />
                        <span>{track.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll Buttons with Modern Styling */}
        <button 
          className="absolute left-2 md:left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-800/80 backdrop-blur-lg flex items-center justify-center text-white shadow-xl hover:bg-primary/80 transition-all duration-300 hover:scale-110 opacity-0 group-hover/scroll:opacity-100"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <button 
          className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-800/80 backdrop-blur-lg flex items-center justify-center text-white shadow-xl hover:bg-primary/80 transition-all duration-300 hover:scale-110 opacity-0 group-hover/scroll:opacity-100"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </section>
  );
};

export default MixesHorizontalScroll;