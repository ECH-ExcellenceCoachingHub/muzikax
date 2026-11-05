'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTrendingTracks, usePopularCreators } from '@/hooks/useTracks'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { Suspense } from 'react'
import { followCreator, unfollowCreator, checkFollowStatus } from '@/services/trackService'
import { FaMusic, FaHeadphones, FaCompactDisc, FaListUl, FaUsers, FaArrowLeft } from 'react-icons/fa'

interface Album {
  _id: string
  id: string
  title: string
  artist: string
  coverImage?: string
  coverURL?: string
  releaseDate?: string
  tracks?: any[]
  plays: number
  category?: string
}

interface Playlist {
  _id: string
  id: string
  name: string
  description?: string
  userId: {
    _id: string
    name: string
  }
  tracks: any[]
  isPublic: boolean
  createdAt: string
}

interface Track {  
  _id?: string
  id: string
  title: string
  artist: string
  plays: number
  likes: number
  coverImage?: string
  coverURL?: string
  category: string
  duration?: string
  audioURL?: string
  type?: 'song' | 'beat' | 'mix'
  paymentType?: 'free' | 'paid'
  price?: number
  creatorId?: string
  creatorWhatsapp?: string
}

interface Creator {
  _id: string
  id: string
  name: string
  creatorType: string
  followersCount: number
  avatar: string
  verified?: boolean
}

// Removed duplicate categories definition - keeping only the one at the top level

// Separate component for the main content that uses useSearchParams
function ExploreContent() {
  const [activeTab, setActiveTab] = useState<'tracks' | 'beats' | 'creators' | 'albums' | 'playlists'>('tracks')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState<string>('')
  const searchParams = useSearchParams()
  const router = useRouter()
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const { tracks: trendingTracksData, loading: trendingLoading, refresh: refreshTrendingTracks } = useTrendingTracks(0); // 0 means fetch all tracks without limit

  // Handle data loading - fetch all tracks at once
  useEffect(() => {
    if (trendingTracksData.length > 0 && !trendingLoading) {
      const newTracks: Track[] = trendingTracksData.map(track => ({
        id: track._id,
        _id: track._id,
        title: track.title,
        artist: typeof track.creatorId === "object" && track.creatorId !== null
          ? (track.creatorId as any).name
          : "Unknown Artist",
        album: "",
        plays: track.plays,
        likes: track.likes,
        coverImage: track.coverURL || "",
        coverURL: track.coverURL,
        duration: "",
        category: track.genre,
        type: track.type as 'song' | 'beat' | 'mix',
        paymentType: track.paymentType,
        creatorId: typeof track.creatorId === "object" && track.creatorId !== null
          ? (track.creatorId as any)._id
          : track.creatorId
      }));
      setAllTracks(newTracks);
    }
  }, [trendingTracksData, trendingLoading]);
  const { creators: popularCreatorsData, loading: creatorsLoading, refresh: refreshCreators } = usePopularCreators(20)
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, favoritesLoading, addToFavorites, removeFromFavorites, addToQueue } = useAudioPlayer()
  const { t } = useLanguage()

  // State for albums and playlists
  const [albums, setAlbums] = useState<Album[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [beats, setBeats] = useState<Track[]>([])
  const [albumsLoading, setAlbumsLoading] = useState<boolean>(true)
  const [playlistsLoading, setPlaylistsLoading] = useState<boolean>(true)
  const [beatsLoading, setBeatsLoading] = useState<boolean>(true)

  // State for tracking which tracks are favorited
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({});

  // State for tracking follow status for creators
  const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});

  // Define categories array
  const categories = [
    { id: 'afrobeat', name: 'Afrobeat' },
    { id: 'amapiano', name: 'Amapiano' },
    { id: 'gakondo', name: 'Gakondo' },
    { id: 'amapiyano', name: 'Amapiano' },
    { id: 'afro gako', name: 'Afro Gako' },
    { id: 'hiphop', name: 'Hip Hop' },
    { id: 'rnb', name: 'R&B' },
    { id: 'afropop', name: 'Afropop' },
    { id: 'gospel', name: 'Gospel' },
    { id: 'traditional', name: 'Traditional' },
    { id: 'dancehall', name: 'Dancehall' },
    { id: 'reggae', name: 'Reggae' },
    { id: 'soul', name: 'Soul' },
    { id: 'jazz', name: 'Jazz' },
    { id: 'blues', name: 'Blues' },
    { id: 'pop', name: 'Pop' },
    { id: 'rock', name: 'Rock' },
    { id: 'electronic', name: 'Electronic' },
    { id: 'house', name: 'House' },
    { id: 'techno', name: 'Techno' },
    { id: 'drill', name: 'Drill' },
    { id: 'trap', name: 'Trap' },
    { id: 'lofi', name: 'Lo-Fi' },
    { id: 'ambient', name: 'Ambient' },
    { id: 'beats', name: 'Beats' },
    { id: 'mixes', name: 'Mixes' }
  ];

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

  // Fetch albums data
  useEffect(() => {
    const fetchAlbums = async () => {
      try {
        setAlbumsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/albums`);
        if (response.ok) {
          const data = await response.json();
          const albumsData = Array.isArray(data) ? data : (data.albums || []);
          setAlbums(albumsData.map((album: any) => ({
            _id: album._id,
            id: album._id,
            title: album.title,
            artist: album.creatorId ? 
              (typeof album.creatorId === 'object' ? album.creatorId.name : 'Unknown Artist') : 
              'Unknown Artist',
            coverImage: album.coverURL || '',
            coverURL: album.coverURL || '',
            releaseDate: album.releaseDate,
            tracks: album.tracks || [],
            plays: album.plays || 0,
            category: album.genre
          })));
        }
      } catch (error) {
        console.error('Error fetching albums:', error);
      } finally {
        setAlbumsLoading(false);
      }
    };

    fetchAlbums();
  }, []);

  // Fetch playlists data
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        setPlaylistsLoading(true);
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/playlists/recommended`);
        if (response.ok) {
          const data = await response.json();
          const playlistsData = data.popular || data.recent || [];
          setPlaylists(playlistsData.map((playlist: any) => ({
            _id: playlist._id,
            id: playlist._id,
            name: playlist.name,
            description: playlist.description || '',
            userId: playlist.userId || { _id: '', name: 'Unknown Creator' },
            tracks: playlist.tracks || [],
            isPublic: playlist.isPublic || true,
            createdAt: playlist.createdAt
          })));
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
      } finally {
        setPlaylistsLoading(false);
      }
    };

    fetchPlaylists();
  }, []);

  // Fetch beats data
  useEffect(() => {
    const fetchBeats = async () => {
      try {
        setBeatsLoading(true);
        // Fetch beats - tracks with type 'beat'
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/type?type=beat&limit=20`);
        if (response.ok) {
          const data = await response.json();
          const beatsData = Array.isArray(data) ? data : (data.tracks || []);
          
          // Filter out tracks without audio URLs
          const filteredBeatsData = beatsData.filter((beat: any) => 
            beat.audioURL && beat.audioURL.trim() !== ''
          );
          
          setBeats(filteredBeatsData.map((beat: any) => ({
            _id: beat._id,
            id: beat._id,
            title: beat.title,
            artist: typeof beat.creatorId === 'object' && beat.creatorId !== null ? 
              (beat.creatorId as any).name : 'Unknown Artist',
            plays: beat.plays || 0,
            likes: beat.likes || 0,
            coverImage: beat.coverURL || '',
            coverURL: beat.coverURL || '',
            category: beat.genre || 'afrobeat',
            duration: beat.duration || '',
            audioURL: beat.audioURL || '',
            type: beat.type || 'beat',
            paymentType: beat.paymentType || 'free',
            price: beat.price || 0,
            creatorId: typeof beat.creatorId === 'object' && beat.creatorId !== null ? 
              (beat.creatorId as any)._id : beat.creatorId,
            creatorWhatsapp: typeof beat.creatorId === 'object' && beat.creatorId !== null ? 
              (beat.creatorId as any).whatsappContact : undefined
          })));
        }
      } catch (error) {
        console.error('Error fetching beats:', error);
      } finally {
        setBeatsLoading(false);
      }
    };

    fetchBeats();
  }, []);

  // Update follow status for creators when they are loaded
  useEffect(() => {
    const loadFollowStatus = async () => {
      if (popularCreatorsData && popularCreatorsData.length > 0) {
        const status: Record<string, boolean> = {};
        
        // Check follow status for each creator
        for (const creator of popularCreatorsData) {
          try {
            const isFollowing = await checkFollowStatus(creator._id);
            status[creator._id] = isFollowing;
          } catch (error) {
            console.error(`Error checking follow status for creator ${creator._id}:`, error);
            status[creator._id] = false; // Default to not following
          }
        }
        
        setFollowStatus(status);
      }
    };
    
    loadFollowStatus();
  }, [popularCreatorsData]);

  // Listen for favorites loaded event to update favorite status
  useEffect(() => {
    const handleFavoritesLoaded = () => {
      const status: Record<string, boolean> = {};
      favorites.forEach(track => {
        status[track.id] = true;
      });
      setFavoriteStatus(status);
    };

    // Add event listener
    window.addEventListener('favoritesLoaded', handleFavoritesLoaded);

    // Clean up event listener
    return () => {
      window.removeEventListener('favoritesLoaded', handleFavoritesLoaded);
    };
  }, [favorites]);

  // Toggle favorite status for a track
  const toggleFavorite = (trackId: string, track: any) => {
    const isCurrentlyFavorite = favoriteStatus[trackId];
    
    if (isCurrentlyFavorite) {
      // Remove from favorites
      removeFromFavorites(trackId);
      // Optimistically update UI
      setFavoriteStatus(prev => ({
        ...prev,
        [trackId]: false
      }));
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
      // Optimistically update UI
      setFavoriteStatus(prev => ({
        ...prev,
        [trackId]: true
      }));
    }
    
    // Dispatch event to notify other components
    const event = new CustomEvent('trackUpdated', {
      detail: {
        trackId: trackId,
        isFavorite: !isCurrentlyFavorite
      }
    });
    window.dispatchEvent(event);
  };

  // Listen for track updates (when favorites are added/removed)
  useEffect(() => {
    const handleTrackUpdate = (event: CustomEvent) => {
      const detail = event.detail;
      if (detail && detail.trackId) {
        // Update favorite status if provided
        if (detail.isFavorite !== undefined) {
          setFavoriteStatus(prev => ({
            ...prev,
            [detail.trackId]: detail.isFavorite
          }));
        }
        
        // Refresh trending tracks to update like counts
        refreshTrendingTracks();
      }
    };

    // Add event listener
    window.addEventListener('trackUpdated', handleTrackUpdate as EventListener);

    // Clean up event listener
    return () => {
      window.removeEventListener('trackUpdated', handleTrackUpdate as EventListener);
    };
  }, [refreshTrendingTracks]);

  // Listen for toast notifications and forward them to player
  useEffect(() => {
    const handleShowToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      // Dispatch a custom event that the player page can listen to
      const playerToastEvent = new CustomEvent('playerToast', {
        detail: { message, type }
      });
      window.dispatchEvent(playerToastEvent);
    };

    // Add event listener
    window.addEventListener('showToast', handleShowToast as EventListener);

    // Clean up event listener
    return () => {
      window.removeEventListener('showToast', handleShowToast as EventListener);
    };
  }, []);
  
  // Get category from URL params
  const categoryParam = searchParams.get('category')
  
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }
  }, [categoryParam])
  
  // Transform real tracks data to match existing interface
  // Note: This is now redundant since we're handling tracks in the useEffect above
  // Keeping it for backward compatibility but it's not used in the current implementation
  const existingTracks: Track[] = [];

  // Transform real creators data to match existing interface
  const allCreators: Creator[] = popularCreatorsData.map(creator => ({
    _id: creator._id,
    id: creator._id || 'unknown',
    name: creator.name,
    creatorType: creator.creatorType || 'artist',
    followersCount: creator.followersCount || 0,
    avatar: creator.avatar || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
    verified: true // Assuming all creators from backend are verified for now
  }))

  // Filter tracks based on selected category and search term
  const filteredTracks = allTracks.filter(track => {
    // Apply category filter if selected
    const categoryMatch = selectedCategory ? track.category === selectedCategory : true;
    
    // Apply search filter if search term exists
    const searchMatch = searchTerm 
      ? track.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        track.artist.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return categoryMatch && searchMatch;
  });

  // Filter beats based on selected category and search term
  const filteredBeats = beats.filter(beat => {
    // Apply category filter if selected
    const categoryMatch = selectedCategory ? beat.category === selectedCategory : true;
    
    // Apply search filter if search term exists
    const searchMatch = searchTerm 
      ? beat.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        beat.artist.toLowerCase().includes(searchTerm.toLowerCase())
      : true;
    
    return categoryMatch && searchMatch;
  });

  // Filter creators based on search term
  const filteredCreators = allCreators.filter(creator => {
    return searchTerm 
      ? creator.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        creator.creatorType.toLowerCase().includes(searchTerm.toLowerCase())
      : true; // Show all creators if no search term
  });

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId || (categoryId === '' && selectedCategory === null)) {
      // If clicking the same category or clicking 'All Categories' when already showing all
      setSelectedCategory(null)
      router.push('/explore')
    } else {
      // Set the new category filter
      if (categoryId === '') {
        setSelectedCategory(null)
        router.push('/explore')
      } else {
        setSelectedCategory(categoryId)
        router.push(`/explore?category=${categoryId}`)
      }
    }
  }

  return (
    <div className="min-h-screen text-white bg-background">

      {/* ── Background ambience ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-orange-600/5 rounded-full blur-[120px]" />
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pt-16 sm:pt-20 md:pt-16 lg:pt-8 pb-32 space-y-4 sm:space-y-6 md:space-y-8">
      {/* Mobile Header with Back Button */}
      <div className="md:hidden sticky top-0 z-50 bg-gradient-to-r from-amber-500 via-amber-500/95 to-orange-600 backdrop-blur-md border-b border-white/10 shadow-2xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-black/70 hover:text-black transition-colors p-2 -ml-2"
              aria-label="Go back"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-black">Explore</h1>
              <p className="text-xs text-black/80">Discover new music</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Category Filters - Horizontal Scroll (Compact) */}
      <section className="md:hidden w-full px-0 py-2 bg-gradient-to-b from-gray-900/95 to-gray-900/90 backdrop-blur-md border-b border-gray-800/50 shadow-xl sticky top-[8.5rem] z-40">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide px-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          <button
            onClick={() => handleCategoryClick('')}
            className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0 transition-all duration-200 active:scale-95 ${
              selectedCategory === null
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30 scale-105'
                : 'bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border border-white/10'
            }`}
          >
            All
          </button>
          {categories.slice(0, 15).map((category) => (
            <button
              key={category.id}
              onClick={() => handleCategoryClick(category.id)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap flex-shrink-0 transition-all duration-200 active:scale-95 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-lg shadow-amber-500/30 scale-105'
                  : 'bg-white/5 text-white/80 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      {/* Desktop Search & Category Filters - Combined Bar */}
      <div className="hidden md:block container mx-auto px-4 sm:px-6 py-4">
        {/* Search and Filters in same row */}
        <div className="flex items-center gap-4">
          {/* Search Bar - Left side */}
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 px-4 pl-11 pr-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-sm shadow-lg"
            />
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/40">
              <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
          
          {/* Category Filters - Right side, scrollable */}
          <div className="flex-1 flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-1">
            <button
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex-shrink-0 ${
                selectedCategory === null
                  ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg shadow-primary/20 scale-105'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:scale-105'
              }`}
              onClick={() => handleCategoryClick('')}
            >
              {t('all')}
            </button>
            
            {categories.slice(0, 10).map((category) => (
              <button
                key={category.id}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                  selectedCategory === category.id
                    ? 'bg-gradient-to-r from-primary-light to-primary-hover text-gray-900 shadow-lg shadow-primary-light/30 scale-105 ring-2 ring-primary-light/40'
                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:scale-105 hover:text-white'
                }`}
                onClick={() => handleCategoryClick(category.id)}
              >
                {category.name}
              </button>
            ))}
            
            {/* More genres dropdown */}
            <div className="flex items-center flex-shrink-0 relative">
              <details className="group">
                <summary className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 cursor-pointer list-none flex items-center gap-1 hover:scale-105 transition-all">
                  <span>{t('more')}</span>
                  <svg className="w-3 h-3 ml-1 transition-transform duration-300 group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </summary>
                <div className="fixed z-50 inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-primary/50 border border-gray-700/50 max-h-[80vh] w-full max-w-md overflow-hidden">
                    <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-text-primary">{t('moreGenres')}</h3>
                      <button 
                        onClick={() => {
                          const details = document.querySelector('details');
                          if (details) details.removeAttribute('open');
                        }}
                        className="text-gray-400 hover:text-white"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {categories.slice(10).map((category) => (
                          <button
                            key={category.id}
                            className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${
                              selectedCategory === category.id
                                ? 'bg-gradient-to-r from-primary-light to-primary-hover text-gray-900 shadow-lg shadow-primary-light/20'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                            }`}
                            onClick={() => {
                              handleCategoryClick(category.id);
                              const details = document.querySelector('details');
                              if (details) details.removeAttribute('open');
                            }}
                          >
                            {category.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search Bar - Compact Native Style */}
      <div className="md:hidden sticky top-[5.3rem] z-40 bg-gradient-to-r from-gray-900 via-gray-900/95 to-gray-900 backdrop-blur-md border-b border-gray-800/50 shadow-xl py-2">
        <div className="px-3 py-2">
          <div className="relative">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2.5 px-4 pl-10 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent transition-all text-xs shadow-md"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 active:text-white transition-colors"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content Tabs - Reduced Padding */}
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8 pb-32 flex-1">
        {/* Mobile Tab Navigation - Bottom Fixed (Visible only on mobile) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900 via-gray-900/95 to-gray-900/90 backdrop-blur-md border-t border-gray-800/50 shadow-2xl z-50 safe-area-pb">
          <div className="flex justify-around items-center">
            <button
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-all active:scale-95 ${
                activeTab === 'tracks'
                  ? 'text-primary'
                  : 'text-gray-400'
              }`}
              onClick={() => setActiveTab('tracks')}
            >
              <FaMusic className={`w-5 h-5 mb-1 ${activeTab === 'tracks' ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-medium">{t('tracks')}</span>
            </button>
            <button
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-all active:scale-95 ${
                activeTab === 'beats'
                  ? 'text-primary'
                  : 'text-gray-400'
              }`}
              onClick={() => setActiveTab('beats')}
            >
              <FaHeadphones className={`w-5 h-5 mb-1 ${activeTab === 'beats' ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-medium">{t('beats')}</span>
            </button>
            <button
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-all active:scale-95 ${
                activeTab === 'albums'
                  ? 'text-primary'
                  : 'text-gray-400'
              }`}
              onClick={() => setActiveTab('albums')}
            >
              <FaCompactDisc className={`w-5 h-5 mb-1 ${activeTab === 'albums' ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-medium">{t('albums')}</span>
            </button>
            <button
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-all active:scale-95 ${
                activeTab === 'playlists'
                  ? 'text-primary'
                  : 'text-gray-400'
              }`}
              onClick={() => setActiveTab('playlists')}
            >
              <FaListUl className={`w-5 h-5 mb-1 ${activeTab === 'playlists' ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-medium">{t('playlists')}</span>
            </button>
            <button
              className={`flex-1 flex flex-col items-center justify-center py-3 transition-all active:scale-95 ${
                activeTab === 'creators'
                  ? 'text-primary-light'
                  : 'text-gray-400'
              }`}
              onClick={() => setActiveTab('creators')}
            >
              <FaUsers className={`w-5 h-5 mb-1 ${activeTab === 'creators' ? 'text-primary-light' : ''}`} />
              <span className="text-[10px] font-medium">{t('topCreators')}</span>
            </button>
          </div>
        </div>

        {/* Desktop Tab Navigation - Hidden on Mobile */}
        <div className="hidden md:block">
          <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-full p-1 w-fit mx-auto mb-8 sm:mb-10 border border-white/10 shadow-lg overflow-x-auto scrollbar-hide">
            <button
              className={`flex items-center gap-2 py-2.5 px-5 sm:px-6 rounded-full transition-all duration-300 font-semibold text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                activeTab === 'tracks'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('tracks')}
            >
              <FaMusic className={activeTab === 'tracks' ? 'text-black' : ''} />
              <span>{t('trendingTracks')}</span>
            </button>
            <button
              className={`flex items-center gap-2 py-2.5 px-5 sm:px-6 rounded-full transition-all duration-300 font-semibold text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                activeTab === 'beats'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('beats')}
            >
              <FaHeadphones className={activeTab === 'beats' ? 'text-black' : ''} />
              <span>{t('beats')}</span>
            </button>
            <button
              className={`flex items-center gap-2 py-2.5 px-5 sm:px-6 rounded-full transition-all duration-300 font-semibold text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                activeTab === 'albums'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('albums')}
            >
              <FaCompactDisc className={activeTab === 'albums' ? 'text-black' : ''} />
              <span>{t('albums')}</span>
            </button>
            <button
              className={`flex items-center gap-2 py-2.5 px-5 sm:px-6 rounded-full transition-all duration-300 font-semibold text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                activeTab === 'playlists'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('playlists')}
            >
              <FaListUl className={activeTab === 'playlists' ? 'text-black' : ''} />
              <span>{t('playlists')}</span>
            </button>
            <button
              className={`flex items-center gap-2 py-2.5 px-5 sm:px-6 rounded-full transition-all duration-300 font-semibold text-xs sm:text-sm whitespace-nowrap flex-shrink-0 ${
                activeTab === 'creators'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black shadow-md'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/5'
              }`}
              onClick={() => setActiveTab('creators')}
            >
              <FaUsers className={activeTab === 'creators' ? 'text-black' : ''} />
              <span>{t('topCreators')}</span>
            </button>
          </div>
        </div>

        {/* Beats - Mobile List View & Desktop Grid View */}
        {activeTab === 'beats' && (
          <>
            {beatsLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-white">{t('loadingBeats')}</div>
              </div>
            ) : (
              <>
                {/* Mobile List View - Home Page Style */}
                <div className="md:hidden space-y-1.5 pb-32 px-2 -mt-2">
                  {filteredBeats.length > 0 ? (
                    filteredBeats.map((beat, index) => (
                      <div key={`beat-${beat.id}-mobile`} className="w-full mb-2">
                        <div 
                          className="group relative flex items-center gap-2 p-2 rounded-xl active:scale-[0.98] cursor-pointer mx-surface"
                          onClick={() => {
                            if (beat.audioURL) {
                              playTrack({
                                id: beat.id,
                                title: beat.title,
                                artist: beat.artist,
                                coverImage: beat.coverImage || beat.coverURL || '/placeholder-track.png',
                                audioUrl: beat.audioURL,
                                plays: beat.plays || 0,
                                likes: beat.likes || 0,
                                creatorId: beat.creatorId,
                                type: beat.type,
                                paymentType: beat.paymentType,
                                price: beat.price,
                                creatorWhatsapp: beat.creatorWhatsapp
                              });
                              
                              const beatTracks = filteredBeats
                                .filter(b => b.audioURL)
                                .map(b => ({
                                  id: b.id,
                                  title: b.title,
                                  artist: b.artist,
                                  coverImage: b.coverImage || b.coverURL || '/placeholder-track.png',
                                  audioUrl: b.audioURL || '',
                                  plays: b.plays || 0,
                                  likes: b.likes || 0,
                                  creatorId: b.creatorId,
                                  type: b.type,
                                  paymentType: b.paymentType,
                                  price: b.price,
                                  creatorWhatsapp: b.creatorWhatsapp
                                }));
                              setCurrentPlaylist(beatTracks);
                            }
                          }}
                        >
                          {/* Track Number */}
                          <div className="w-6 text-center text-gray-400 text-xs font-bold">
                            {currentTrack?.id === beat.id && isPlaying ? (
                              <div className="flex items-end justify-center gap-0.5 h-4">
                                <div className="w-1 bg-primary animate-[musicBar_0.6s_ease-in-out_infinite]"></div>
                                <div className="w-1 bg-primary animate-[musicBar_0.8s_ease-in-out_infinite_0.2s]"></div>
                                <div className="w-1 bg-primary animate-[musicBar_0.5s_ease-in-out_infinite_0.1s]"></div>
                              </div>
                            ) : (
                              <span>{index + 1}</span>
                            )}
                          </div>

                          {/* Track Cover */}
                          <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                            <img 
                              src={beat.coverImage || beat.coverURL || '/placeholder-track.png'} 
                              alt={beat.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/placeholder-track.png';
                              }}
                            />
                            {/* Beat badge */}
                            <div className="absolute top-0.5 left-0.5">
                              <span className="px-1 py-0.5 bg-purple-600 text-white text-[8px] rounded-full">
                                {t('beat')}
                              </span>
                            </div>
                            {/* Play Button Overlay */}
                            <button
                              className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                              </svg>
                            </button>
                          </div>

                          {/* Track Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-xs sm:text-sm truncate tracking-wide drop-shadow-md text-text-primary">
                              {beat.title}
                            </h3>
                            <p className="text-gray-300 text-xs truncate font-medium">
                              {beat.artist}
                            </p>
                          </div>

                          {/* Stats */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                              <span className="text-gray-400 text-xs font-semibold">{beat.plays.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 text-primary-light" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                              </svg>
                              <span className="text-gray-400 text-xs font-semibold">{beat.likes}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-20 text-center text-gray-400">
                      {t('noBeatsFound')}
                    </div>
                  )}
                </div>

                {/* Desktop Grid View */}
                <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8 pb-32">
                  {filteredBeats.length > 0 ? (
                    filteredBeats.map((beat) => (
                      <div key={`beat-${beat.id}-desktop`} className="group card-bg rounded-lg sm:rounded-2xl overflow-hidden">
                        <div className="relative">
                          <img 
                            src={beat.coverImage || beat.coverURL || '/placeholder-track.png'} 
                            alt={beat.title} 
                            className="w-full aspect-square sm:h-48 md:h-56 object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-track.png';
                            }}
                          />
                          <div className="absolute top-3 left-3">
                            <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                              {t('beat')}
                            </span>
                          </div>
                          <div className="absolute top-3 right-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${beat.paymentType === 'paid' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>
                              {beat.paymentType === 'paid' ? t('paid') : t('free')}
                            </span>
                          </div>
                          {beat.paymentType === 'paid' && beat.price && (
                            <div className="absolute top-10 right-3">
                              <span className="px-2 py-1 text-xs rounded-full bg-yellow-600 text-white">
                                {beat.price.toLocaleString()} RWF
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                            <button 
                              onClick={() => {
                                if (beat.audioURL) {
                                  playTrack({
                                    id: beat.id,
                                    title: beat.title,
                                    artist: beat.artist,
                                    coverImage: beat.coverImage || beat.coverURL || '/placeholder-track.png',
                                    audioUrl: beat.audioURL,
                                    plays: beat.plays || 0,
                                    likes: beat.likes || 0,
                                    creatorId: beat.creatorId,
                                    type: beat.type,
                                    paymentType: beat.paymentType,
                                    price: beat.price,
                                    creatorWhatsapp: beat.creatorWhatsapp
                                  });
                                  
                                  const beatTracks = filteredBeats
                                    .filter(b => b.audioURL)
                                    .map(b => ({
                                      id: b.id,
                                      title: b.title,
                                      artist: b.artist,
                                      coverImage: b.coverImage || b.coverURL || '/placeholder-track.png',
                                      audioUrl: b.audioURL || '',
                                      plays: b.plays || 0,
                                      likes: b.likes || 0,
                                      creatorId: b.creatorId,
                                      type: b.type,
                                      paymentType: b.paymentType,
                                      price: b.price,
                                      creatorWhatsapp: b.creatorWhatsapp
                                    }));
                                  setCurrentPlaylist(beatTracks);
                                }
                              }}
                              className="mx-card-play !static pointer-events-auto hover:bg-primary-hover [&_svg]:w-4 [&_svg]:h-4">
                              <svg className="w-6 h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd"></path>
                              </svg>
                            </button>
                          </div>
                          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavorite(beat.id, beat);
                              }}
                              className="p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md"
                            >
                              <svg 
                                className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${favoriteStatus[beat.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                                fill={favoriteStatus[beat.id] ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="1.5"
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4 4 0 000 6.364L12 20.364l7.682-7.682a4 4 0 00-6.364-6.364L12 7.636l-1.318-1.318a4 4 0 000-5.656z"></path>
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                try {
                                  addToQueue({
                                    id: beat.id,
                                    title: beat.title,
                                    artist: beat.artist,
                                    coverImage: beat.coverImage || beat.coverURL || '/placeholder-track.png',
                                    audioUrl: beat.audioURL || '',
                                    duration: undefined,
                                    creatorId: beat.creatorId,
                                    type: beat.type,
                                    paymentType: beat.paymentType,
                                    price: beat.price,
                                    creatorWhatsapp: beat.creatorWhatsapp
                                  });
                                  const toastEvent = new CustomEvent('showToast', {
                                    detail: {
                                      message: t('addedToPlaylist'),
                                      type: 'success'
                                    }
                                  });
                                  window.dispatchEvent(toastEvent);
                                } catch (error) {
                                  console.error('Error adding beat to queue:', error);
                                }
                              }}
                              className="p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md"
                              title={t('queue')}
                            >
                              <svg 
                                className="w-5 h-5 sm:w-6 sm:h-6"
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24" 
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-4 sm:p-5">
                          <h3 className="font-bold text-sm sm:text-lg mb-1 truncate text-text-primary">{beat.title}</h3>
                          <p className="text-gray-400 text-xs sm:text-base mb-2 sm:mb-3">{beat.artist}</p>
                          
                          <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                            <span>{beat.plays.toLocaleString()} {t('plays')}</span>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                              </svg>
                              <span>{beat.likes}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-20 text-center text-gray-400">
                      {t('noBeatsFound')}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}

        {/* Albums Grid */}
        {activeTab === 'albums' && (
          <>
            {albumsLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-white">{t('loadingAlbums')}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8 -mt-2">
                {albums.length > 0 ? (
                  albums.map((album) => (
                  <div key={`album-${album.id}`} className="group card-bg rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="relative">
                      <img 
                        src={album.coverImage || album.coverURL || '/placeholder-album.png'} 
                        alt={album.title} 
                        className="w-full aspect-square sm:h-48 md:h-56 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-album.png';
                        }}
                      />
                      
                      {/* Layered stack effect for multi-track albums */}
                      {(album.tracks?.length || 0) > 1 && (
                        <>
                          {/* Second layer */}
                          <div className="absolute top-1 left-1 w-full h-full rounded-xl overflow-hidden shadow-lg border border-white/20 pointer-events-none">
                            <img 
                              src={album.coverImage || album.coverURL || '/placeholder-album.png'} 
                              alt={album.title} 
                              className="w-full h-full object-cover opacity-80"
                            />
                          </div>
                          
                          {/* Third layer for albums with many tracks */}
                          {(album.tracks?.length || 0) > 3 && (
                            <div className="absolute top-2 left-2 w-full h-full rounded-xl overflow-hidden shadow-lg border border-white/15 pointer-events-none">
                              <img 
                                src={album.coverImage || album.coverURL || '/placeholder-album.png'} 
                                alt={album.title} 
                                className="w-full h-full object-cover opacity-60"
                              />
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Track count badge */}
                      {(album.tracks?.length || 0) > 1 && (
                        <div className="absolute bottom-2 right-2 bg-white/90 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md min-w-[20px] text-center backdrop-blur-sm">
                          {album.tracks?.length || 0}
                        </div>
                      )}
                      
                      <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                        <button 
                          onClick={() => {
                            // Play first track from album if available
                            if (album.tracks && album.tracks.length > 0) {
                              const firstTrack = album.tracks[0];
                              if (firstTrack.audioURL) {
                                playTrack({
                                  id: firstTrack._id || firstTrack.id,
                                  title: firstTrack.title,
                                  artist: album.artist,
                                  coverImage: album.coverImage || album.coverURL || '/placeholder-album.png',
                                  audioUrl: firstTrack.audioURL,
                                  plays: firstTrack.plays || 0,
                                  likes: firstTrack.likes || 0,
                                  creatorId: typeof firstTrack.creatorId === 'object' && firstTrack.creatorId !== null ? (firstTrack.creatorId as any)._id : firstTrack.creatorId,
                                });
                                
                                // Set playlist to all tracks in album
                                const albumTracks = album.tracks
                                  .filter((t: any) => t.audioURL)
                                  .map((t: any) => ({
                                    id: t._id || t.id || 'unknown',
                                    title: t.title,
                                    artist: album.artist,
                                    coverImage: album.coverImage || album.coverURL || '/placeholder-album.png',
                                    audioUrl: t.audioURL,
                                    plays: t.plays || 0,
                                    likes: t.likes || 0,
                                    creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId,
                                  }));
                                setCurrentPlaylist(albumTracks);
                                
                                // Add all tracks to queue
                                albumTracks.forEach((track: any) => {
                                  try {
                                    addToQueue({
                                      id: track.id,
                                      title: track.title,
                                      artist: track.artist,
                                      coverImage: track.coverImage,
                                      audioUrl: track.audioUrl,
                                      plays: track.plays,
                                      likes: track.likes,
                                      creatorId: track.creatorId,
                                    });
                                  } catch (error) {
                                    console.error('Error adding track to queue:', error);
                                  }
                                });
                                
                                // Show success notification
                                const toastEvent = new CustomEvent('showToast', {
                                  detail: {
                                    message: `Added ${albumTracks.length} tracks from "${album.title}" to queue!`,
                                    type: 'success'
                                  }
                                });
                                window.dispatchEvent(toastEvent);
                              }
                            }
                          }}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-[#E67E00] hover:scale-105">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 xs:p-4 sm:p-5">
                      <h3 className="font-bold text-xs xs:text-sm sm:text-lg mb-1 truncate text-text-primary">{album.title}</h3>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mb-2 xs:mb-3 sm:mb-4">{album.artist}</p>
                      
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                        <span className="text-xs">{album.tracks?.length || 0} {t('tracks')}</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                          </svg>
                          <span className="text-xs">{album.plays}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="col-span-full py-20 text-center text-gray-400">
                    {t('noAlbumsFound')}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Playlists Grid */}
        {activeTab === 'playlists' && (
          <>
            {playlistsLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-white">{t('loadingPlaylists')}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 lg:gap-8 -mt-2">
                {playlists.length > 0 ? (
                  playlists.map((playlist) => (
                  <div key={`playlist-${playlist.id}`} className="group card-bg rounded-lg xs:rounded-xl sm:rounded-2xl overflow-hidden">
                    <div className="relative">
                      <img 
                        src={playlist.tracks && playlist.tracks.length > 0 ? 
                          (playlist.tracks[0].coverURL || '/placeholder-playlist.png') : 
                          '/placeholder-playlist.png'} 
                        alt={playlist.name} 
                        className="w-full aspect-square sm:h-48 md:h-56 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-playlist.png';
                        }}
                      />
                      
                      {/* Layered stack effect for multi-track playlists */}
                      {(playlist.tracks?.length || 0) > 1 && (
                        <>
                          {/* Second layer */}
                          <div className="absolute top-1 left-1 w-full h-full rounded-xl overflow-hidden shadow-lg border border-white/20 pointer-events-none">
                            <img 
                              src={playlist.tracks && playlist.tracks.length > 0 ? 
                                (playlist.tracks[0].coverURL || '/placeholder-playlist.png') : 
                                '/placeholder-playlist.png'} 
                              alt={playlist.name} 
                              className="w-full h-full object-cover opacity-80"
                            />
                          </div>
                          
                          {/* Third layer for playlists with many tracks */}
                          {(playlist.tracks?.length || 0) > 3 && (
                            <div className="absolute top-2 left-2 w-full h-full rounded-xl overflow-hidden shadow-lg border border-white/15 pointer-events-none">
                              <img 
                                src={playlist.tracks && playlist.tracks.length > 0 ? 
                                  (playlist.tracks[0].coverURL || '/placeholder-playlist.png') : 
                                  '/placeholder-playlist.png'} 
                                alt={playlist.name} 
                                className="w-full h-full object-cover opacity-60"
                              />
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Track count badge */}
                      {(playlist.tracks?.length || 0) > 1 && (
                        <div className="absolute bottom-2 right-2 bg-amber-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md min-w-[20px] text-center">
                          {playlist.tracks?.length || 0}
                        </div>
                      )}
                      
                      <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                        <button 
                          onClick={() => {
                            // Play first track from playlist if available
                            if (playlist.tracks && playlist.tracks.length > 0) {
                              const playableTracks = playlist.tracks.filter((t: any) => t.audioURL);
                              if (playableTracks.length > 0) {
                                const firstTrack = playableTracks[0];
                                playTrack({
                                  id: firstTrack._id || firstTrack.id,
                                  title: firstTrack.title,
                                  artist: typeof firstTrack.creatorId === 'object' && firstTrack.creatorId !== null ? 
                                    (firstTrack.creatorId as any).name : 'Unknown Artist',
                                  coverImage: firstTrack.coverURL || '/placeholder-playlist.png',
                                  audioUrl: firstTrack.audioURL,
                                  plays: firstTrack.plays || 0,
                                  likes: firstTrack.likes || 0,
                                  creatorId: typeof firstTrack.creatorId === 'object' && firstTrack.creatorId !== null ? 
                                    (firstTrack.creatorId as any)._id : firstTrack.creatorId,
                                });
                                
                                // Set playlist to all playable tracks
                                const formattedTracks = playableTracks.map((t: any) => ({
                                  id: t._id || t.id || 'unknown',
                                  title: t.title,
                                  artist: typeof t.creatorId === 'object' && t.creatorId !== null ? 
                                    (t.creatorId as any).name : 'Unknown Artist',
                                  coverImage: t.coverURL || '/placeholder-playlist.png',
                                  audioUrl: t.audioURL,
                                  plays: t.plays || 0,
                                  likes: t.likes || 0,
                                  creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? 
                                    (t.creatorId as any)._id : t.creatorId,
                                }));
                                setCurrentPlaylist(formattedTracks);
                                
                                // Add all tracks to queue
                                formattedTracks.forEach((track: any) => {
                                  try {
                                    addToQueue({
                                      id: track.id,
                                      title: track.title,
                                      artist: track.artist,
                                      coverImage: track.coverImage,
                                      audioUrl: track.audioUrl,
                                      plays: track.plays,
                                      likes: track.likes,
                                      creatorId: track.creatorId,
                                    });
                                  } catch (error) {
                                    console.error('Error adding track to queue:', error);
                                  }
                                });
                                
                                // Show success notification
                                const toastEvent = new CustomEvent('showToast', {
                                  detail: {
                                    message: t('addedTracksToQueue', { count: formattedTracks.length, name: playlist.name }),
                                    type: 'success'
                                  }
                                });
                                window.dispatchEvent(toastEvent);
                              }
                            }
                          }}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-[#E67E00] hover:scale-105">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <div className="p-3 xs:p-4 sm:p-5">
                      <h3 className="font-bold text-xs xs:text-sm sm:text-lg mb-1 truncate text-text-primary">{playlist.name}</h3>
                      <p className="text-gray-400 text-xs xs:text-sm sm:text-base mb-2 xs:mb-3 sm:mb-4">
                        {playlist.description ? `${playlist.description.substring(0, 60)}...` : t('playlists')}
                      </p>
                      <p className="text-gray-500 text-xs mb-2 xs:mb-3">{t('byCreator', { name: playlist.userId?.name === 'admin' ? 'MuzikaX' : (playlist.userId?.name || 'MuzikaX') })}</p>
                      
                      <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                        <span>{playlist.tracks?.length || 0} {t('tracks')}</span>
                        <span className="capitalize">{playlist.isPublic ? t('public') : t('private')}</span>
                      </div>
                    </div>
                  </div>
                ))
                ) : (
                  <div className="col-span-full py-20 text-center text-gray-400">
                    {t('noPlaylistsFound')}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Tracks - Mobile List View & Desktop Grid View */}
        {activeTab === 'tracks' && (
          <>
            {trendingLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="text-white">{t('loading')}</div>
              </div>
            ) : (
              <>
                {/* Mobile List View - Home Page Style */}
                <div className="md:hidden space-y-2 pb-32 px-2 mt-4">
                  {filteredTracks.map((track, index) => (
                    <div key={`track-${track.id}-mobile`} className="w-full mb-2">
                      <div 
                        className="group relative flex items-center gap-2 p-2 rounded-xl active:scale-[0.98] cursor-pointer mx-surface"
                        onClick={() => {
                          const fullTrack = trendingTracksData.find(t => t._id === track._id);
                          if (fullTrack && fullTrack.audioURL) {
                            playTrack({
                              id: track.id,
                              title: track.title,
                              artist: track.artist,
                              coverImage: track.coverImage || track.coverURL || '/placeholder-track.png',
                              audioUrl: fullTrack.audioURL,
                              plays: fullTrack.plays || 0,
                              likes: fullTrack.likes || 0,
                              creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? (fullTrack.creatorId as any)._id : fullTrack.creatorId,
                              type: fullTrack.type,
                              creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null 
                                ? (fullTrack.creatorId as any).whatsappContact 
                                : undefined)
                            });
                            
                            const playlistTracks = trendingTracksData
                              .filter(t => t.audioURL)
                              .map(t => ({
                                id: t._id || 'unknown',
                                title: t.title,
                                artist: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any).name : 'Unknown Artist',
                                coverImage: t.coverURL || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
                                audioUrl: t.audioURL,
                                plays: t.plays || 0,
                                likes: t.likes || 0,
                                creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId,
                                type: t.type,
                                creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                  ? (t.creatorId as any).whatsappContact 
                                  : undefined)
                              }));
                            setCurrentPlaylist(playlistTracks);
                          }
                        }}
                      >
                        {/* Track Number */}
                        <div className="w-6 text-center text-gray-400 text-xs font-bold">
                          {currentTrack?.id === track.id && isPlaying ? (
                            <div className="flex items-end justify-center gap-0.5 h-4">
                              <div className="w-1 bg-primary animate-[musicBar_0.6s_ease-in-out_infinite]"></div>
                              <div className="w-1 bg-primary animate-[musicBar_0.8s_ease-in-out_infinite_0.2s]"></div>
                              <div className="w-1 bg-primary animate-[musicBar_0.5s_ease-in-out_infinite_0.1s]"></div>
                            </div>
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>

                        {/* Track Cover */}
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
                          <img 
                            src={track.coverImage || track.coverURL || '/placeholder-track.png'} 
                            alt={track.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-track.png';
                            }}
                          />
                          {/* Play Button Overlay */}
                          <button
                            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                            </svg>
                          </button>
                        </div>

                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xs sm:text-sm truncate tracking-wide drop-shadow-md text-text-primary">
                            {track.title}
                          </h3>
                          <p className="text-gray-300 text-xs truncate font-medium">
                            {track.artist}
                          </p>
                        </div>

                        {/* Stats */}
                        <div className="flex items-center gap-2">
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-400 text-xs font-semibold">{track.plays.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 text-primary-light" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                            </svg>
                            <span className="text-gray-400 text-xs font-semibold">{track.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Grid View */}
                <div className="hidden md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 md:gap-6 lg:gap-8 pb-32">
                  {filteredTracks.map((track) => (
                    <div key={`track-${track.id}-desktop`} className="group card-bg rounded-lg sm:rounded-2xl overflow-hidden">
                      <div className="relative">
                        <img 
                          src={track.coverImage || track.coverURL || '/placeholder-track.png'} 
                          alt={track.title} 
                          className="w-full aspect-square sm:h-48 md:h-56 object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-track.png';
                          }}
                        />
                        <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                          <button 
                            onClick={() => {
                              const fullTrack = trendingTracksData.find(t => t._id === track._id);
                              if (fullTrack && fullTrack.audioURL) {
                                playTrack({
                                  id: track.id,
                                  title: track.title,
                                  artist: track.artist,
                                  coverImage: track.coverImage || track.coverURL || '/placeholder-track.png',
                                  audioUrl: fullTrack.audioURL,
                                  plays: fullTrack.plays || 0,
                                  likes: fullTrack.likes || 0,
                                  creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? (fullTrack.creatorId as any)._id : fullTrack.creatorId,
                                  type: fullTrack.type,
                                  creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null 
                                    ? (fullTrack.creatorId as any).whatsappContact 
                                    : undefined)
                                });
                                
                                const playlistTracks = trendingTracksData
                                  .filter(t => t.audioURL)
                                  .map(t => ({
                                    id: t._id || 'unknown',
                                    title: t.title,
                                    artist: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any).name : 'Unknown Artist',
                                    coverImage: t.coverURL || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
                                    audioUrl: t.audioURL,
                                    plays: t.plays || 0,
                                    likes: t.likes || 0,
                                    creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? (t.creatorId as any)._id : t.creatorId,
                                    type: t.type,
                                    creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                      ? (t.creatorId as any).whatsappContact 
                                      : undefined)
                                  }));
                                setCurrentPlaylist(playlistTracks);
                              }
                            }}
                            className="mx-card-play !static pointer-events-auto hover:bg-primary-hover [&_svg]:w-4 [&_svg]:h-4">
                            {currentTrack?.id === track.id && isPlaying ? (
                              <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd"></path>
                              </svg>
                            ) : (
                              <svg className="w-6 h-6 sm:w-7 sm:h-7 ml-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                              </svg>
                            )}
                          </button>
                        </div>
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              const fullTrack = trendingTracksData.find(t => t._id === track._id);
                              if (fullTrack) {
                                toggleFavorite(track.id, fullTrack);
                              }
                            }}
                            className="p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md"
                          >
                            <svg 
                              className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                              fill={favoriteStatus[track.id] ? "currentColor" : "none"}
                              stroke="currentColor"
                              strokeWidth="1.5"
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4 4 0 000 6.364L12 20.364l7.682-7.682a4 4 0 00-6.364-6.364L12 7.636l-1.318-1.318a4 4 0 000-5.656z"></path>
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const fullTrack = trendingTracksData.find(t => t._id === track._id);
                              if (fullTrack && fullTrack.audioURL) {
                                try {
                                  addToQueue({
                                    id: track._id || track.id || 'unknown',
                                    title: track.title,
                                    artist: track.artist,
                                    coverImage: track.coverImage || track.coverURL || '/placeholder-track.png',
                                    audioUrl: fullTrack.audioURL,
                                    duration: fullTrack.duration ? (fullTrack.duration.includes(':') ? 
                                      (() => {
                                        const [mins, secs] = fullTrack.duration.split(':').map(Number);
                                        return mins * 60 + secs;
                                      })() : Number(fullTrack.duration)
                                    ) : undefined,
                                    creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? (fullTrack.creatorId as any)._id : fullTrack.creatorId,
                                    type: fullTrack.type,
                                    creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null 
                                      ? (fullTrack.creatorId as any).whatsappContact 
                                      : undefined)
                                  });
                                  const toastEvent = new CustomEvent('showToast', {
                                    detail: {
                                      message: `Added ${track.title} to queue!`,
                                      type: 'success'
                                    }
                                  });
                                  window.dispatchEvent(toastEvent);
                                } catch (error) {
                                  console.error('Error adding to queue:', error);
                                }
                              }
                            }}
                            className="p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md"
                            title={`Add ${track.title} to queue`}
                          >
                            <svg 
                              className="w-5 h-5 sm:w-6 sm:h-6"
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24" 
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="p-4 sm:p-5">
                        <h3 className="font-bold text-sm sm:text-lg mb-1 truncate text-text-primary">{track.title}</h3>
                        <p className="text-gray-400 text-xs sm:text-base mb-2 sm:mb-3">{track.artist}</p>
                        
                        <div className="flex justify-between text-xs sm:text-sm text-gray-500">
                          <span>{track.plays.toLocaleString()} {t('plays')}</span>
                          <div className="flex items-center gap-1">
                            <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                            </svg>
                            <span>{track.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {/* Creators Grid */}
        {activeTab === 'creators' && (
          <>
            {creatorsLoading ? (
              <div className="flex justify-center items-center h-48">
                <div className="text-white">{t('loading')}</div>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 xs:gap-4 sm:gap-5 md:gap-6 -mt-2">
                {filteredCreators.length > 0 ? (
                  filteredCreators.map((creator) => (
                  <div key={`creator-${creator._id || creator.id}`} className="group card-bg rounded-lg xs:rounded-xl sm:rounded-2xl p-3 xs:p-4 sm:p-5 md:p-6 cursor-pointer"
                    onClick={() => {
                      router.push(`/artists/${creator._id || creator.id}`);
                    }}>
                    <div className="flex flex-col items-center text-center mb-3 xs:mb-4">
                      <div className="relative mb-2 xs:mb-3">
                        <img 
                          src={creator.avatar} 
                          alt={creator.name} 
                          className="w-14 h-14 xs:w-16 xs:h-16 rounded-full object-cover"
                        />
                        {creator.verified && (
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 xs:w-6 xs:h-6 bg-primary rounded-full flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 xs:w-3 xs:h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                            </svg>
                          </div>
                        )}
                      </div>
                      <h3 className="font-bold text-xs xs:text-sm sm:text-base truncate w-full text-text-primary">{creator.name}</h3>
                      <p className="text-gray-400 text-xs sm:text-sm mb-1 xs:mb-2">{creator.creatorType}</p>
                    </div>
                    
                    <div className="flex justify-center text-xs xs:text-sm text-gray-500 mb-2 xs:mb-3">
                      <span>{creator.followersCount.toLocaleString()} {t('followers')}</span>
                    </div>
                    
                    <button 
                      className={`w-full py-2 xs:py-2.5 sm:py-3 rounded-lg font-bold hover:opacity-90 transition-all duration-300 text-xs xs:text-sm sm:text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${followStatus[creator._id || creator.id || ''] ? 'bg-gray-600 text-white' : 'bg-gradient-to-r from-primary-light to-primary-hover text-gray-900'}`}
                      onClick={async (e) => {
                        e.stopPropagation();
                        const creatorId = creator._id || creator.id;
                        if (!creatorId) {
                          alert('Creator ID not found');
                          return;
                        }
                        try {
                          const currentFollowStatus = followStatus[creatorId];
                          if (currentFollowStatus) {
                            await unfollowCreator(creatorId);
                            
                            setFollowStatus(prev => ({
                              ...prev,
                              [creatorId]: false
                            }));
                          } else {
                            await followCreator(creatorId);
                            
                            setFollowStatus(prev => ({
                              ...prev,
                              [creatorId]: true
                            }));
                          }
                          
                          console.log(`Successfully ${currentFollowStatus ? 'unfollowed' : 'followed'} creator`);
                          
                          refreshCreators();
                        } catch (error) {
                          console.error(`Failed to ${followStatus[creatorId] ? 'unfollow' : 'follow'} creator:`, error);
                          alert(`Failed to ${followStatus[creatorId] ? 'unfollow' : 'follow'} creator. Please try again.`);
                        }
                      }}
                    >
                      {followStatus[creator._id || creator.id || ''] ? t('following') : t('follow')}
                    </button>
                  </div>
                ))
                ) : (
                  <div className="col-span-full py-20 text-center text-gray-400">
                    {t('noCreatorsFound')}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
      </main>
    </div>
  )
}

export default function Explore() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExploreContent />
    </Suspense>
  )
}
