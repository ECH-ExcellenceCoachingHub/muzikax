'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'
import { useTracksByType } from '../../hooks/useTracks'
import { useAudioPlayer } from '../../contexts/AudioPlayerContext'
import { usePayment } from '../../contexts/PaymentContext'
import { ITrack } from '@/types'
import PesaPalPayment from '@/components/PesaPalPayment'

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  plays: number
  likes: number
  coverImage: string
  duration?: string
  category?: string
  type?: 'song' | 'beat' | 'mix'
  paymentType?: 'free' | 'paid'
  creatorWhatsapp?: string
}

export default function BeatsPage() {
  const router = useRouter()
  const { tracks: allBeatTracks, loading: beatsLoading, refresh: refreshBeats } = useTracksByType('beat', 0); // 0 means no limit
  const { favorites, favoritesLoading, addToFavorites, removeFromFavorites, playTrack, setCurrentPlaylist } = useAudioPlayer()
  const { showPayment } = usePayment()

  // State for tracking which tracks are favorited
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>({})
  
  // MTN MoMo payment state
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentData, setPaymentData] = useState({
    trackId: '',
    trackTitle: '',
    price: 0
  })
  
  // Filter states
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'free' | 'paid'>('all')
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  
  // Genre list for filtering
  const genres = [
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
    { id: 'ambient', name: 'Ambient' }
  ]
  
  // Filter tracks based on selected criteria
  const filteredTracks = allBeatTracks.filter(track => {
    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const titleMatch = track.title.toLowerCase().includes(query);
      const artistMatch = typeof track.creatorId === 'object' && track.creatorId !== null 
        ? (track.creatorId as any).name.toLowerCase().includes(query)
        : false;
      const genreMatch = track.genre?.toLowerCase().includes(query);
      
      if (!titleMatch && !artistMatch && !genreMatch) return false;
    }
    
    // Payment type filter - handle missing paymentType field
    if (selectedFilter !== 'all') {
      // If paymentType is missing, treat as 'free' for backward compatibility
      const trackPaymentType = track.paymentType || 'free';
      
      if (selectedFilter === 'free' && trackPaymentType !== 'free') return false
      if (selectedFilter === 'paid' && trackPaymentType !== 'paid') return false
    }
    
    // Genre filter
    if (selectedGenre && track.genre !== selectedGenre) return false
    
    return true
  })
  
  const refreshTrendingTracks = refreshBeats; // Alias for compatibility with existing code

  // Update favorite status when favorites change or when favorites are loaded
  useEffect(() => {
    if (!favoritesLoading) {
      const status: Record<string, boolean> = {}
      favorites.forEach(track => {
        status[track.id] = true
      })
      setFavoriteStatus(status)
    }
  }, [favorites, favoritesLoading])

  // Listen for favorites loaded event to update favorite status
  useEffect(() => {
    const handleFavoritesLoaded = () => {
      const status: Record<string, boolean> = {}
      favorites.forEach(track => {
        status[track.id] = true
      })
      setFavoriteStatus(status)
    }

    // Add event listener
    window.addEventListener('favoritesLoaded', handleFavoritesLoaded)

    // Clean up event listener
    return () => {
      window.removeEventListener('favoritesLoaded', handleFavoritesLoaded)
    }
  }, [favorites])

  // Toggle favorite status for a track
  const toggleFavorite = (trackId: string, track: any) => {
    if (favoriteStatus[trackId]) {
      // Remove from favorites
      removeFromFavorites(trackId)
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
          : track.creatorId,
        type: track.type,
        paymentType: track.paymentType,
        creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any).whatsappContact 
          : undefined)
      })
    }
  }

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
        refreshTrendingTracks()
      }
    }
    
    // Add event listener
    window.addEventListener('trackUpdated', handleTrackUpdate as EventListener)
    
    // Clean up event listener
    return () => {
      window.removeEventListener('trackUpdated', handleTrackUpdate as EventListener)
    }
  }, [refreshTrendingTracks])

  // Listen for MTN MoMo payment requests
  useEffect(() => {
    const handleMomoPayment = (event: CustomEvent) => {
      const { trackId, trackTitle, price } = event.detail;
      setPaymentData({ trackId, trackTitle, price });
      setShowPaymentModal(true);
    };

    window.addEventListener('openMomoPayment', handleMomoPayment as EventListener);
    
    return () => {
      window.removeEventListener('openMomoPayment', handleMomoPayment as EventListener);
    };
  }, []);

  // Loading state
  if (beatsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Loading beats...</div>
      </div>
    );
  }

  // Handle successful payment
  const handlePaymentSuccess = (downloadLink: string) => {
    // Automatically download the beat
    if (downloadLink) {
      const link = document.createElement('a');
      link.href = downloadLink;
      link.download = `${paymentData.trackTitle}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen pt-14 md:pt-0 bg-background">
      {/* Mobile Header - Minimalist */}
      <div className="md:hidden sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-white/5">
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-white/60 hover:text-white transition-colors p-2 -ml-2 rounded-full hover:bg-white/5"
              aria-label="Go back"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-text-primary">Beats</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Search & Filters - Clean Design */}
      <div className="md:hidden sticky top-[3.2rem] z-40 bg-background/95 backdrop-blur-xl border-b border-white/5">
        {/* Search Bar */}
        <div className="px-4 py-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search beats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-2.5 px-4 pl-10 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all text-sm"
            />
            <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-white/40">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            )}
          </div>
        </div>
        
        {/* Filter Pills */}
        <div className="px-4 pb-3 space-y-2">
          {/* Payment Type Filters */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {(['all', 'free', 'paid'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setSelectedFilter(filter)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedFilter === filter
                    ? 'bg-primary text-black'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
          
          {/* Genre Scroll */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedGenre(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                selectedGenre === null
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              All Genres
            </button>
            {genres.map((genre) => (
              <button
                key={genre.id}
                onClick={() => setSelectedGenre(genre.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  selectedGenre === genre.id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
              >
                {genre.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hero Section - Minimalist */}
      <div className="relative py-12 sm:py-16 lg:py-20 overflow-hidden">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent"></div>
        
        <div className="container mx-auto px-4 sm:px-8 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4 tracking-tight text-text-primary">
              Beats
            </h1>
            <p className="text-base sm:text-lg text-white/60 max-w-xl mx-auto">
              Discover premium beats from talented producers
            </p>
          </div>
        </div>
      </div>

      {/* Desktop Filters - Clean Design */}
      <div className="hidden md:block container mx-auto px-4 sm:px-8 pb-8">
        <div className="max-w-5xl mx-auto space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search by beat name, producer, or genre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-5 py-3.5 pl-12 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all"
            />
            <svg
              className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                </svg>
              </button>
            )}
          </div>
          
          {/* Filter Pills Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Payment Type Filters */}
            <div className="flex gap-2">
              {(['all', 'free', 'paid'] as const).map((filter) => (
                <button 
                  key={filter}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedFilter === filter 
                      ? 'bg-primary text-black' 
                      : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                  }`}
                  onClick={() => setSelectedFilter(filter)}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
            
            <div className="w-px h-6 bg-white/10"></div>
            
            {/* Genre Filters - First few visible */}
            <div className="flex flex-wrap gap-2 flex-1">
              <button
                className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedGenre === null
                    ? 'bg-white/10 text-white border border-white/20'
                    : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                }`}
                onClick={() => setSelectedGenre(null)}
              >
                All Genres
              </button>
              
              {genres.slice(0, 10).map((genre) => (
                <button
                  key={genre.id}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedGenre === genre.id
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                  }`}
                  onClick={() => setSelectedGenre(genre.id)}
                >
                  {genre.name}
                </button>
              ))}
              
              {/* More genres dropdown */}
              {genres.length > 10 && (
                <details className="group relative">
                  <summary className="px-3 py-2 rounded-full text-sm font-medium bg-white/5 text-white/60 hover:bg-white/10 border border-white/10 cursor-pointer list-none transition-all">
                    +{genres.length - 10} more
                  </summary>
                  <div className="absolute z-20 mt-2 p-3 bg-surface border border-white/10 rounded-xl shadow-2xl grid grid-cols-2 sm:grid-cols-3 gap-2 w-72 backdrop-blur-xl">
                    {genres.slice(10).map((genre) => (
                      <button
                        key={genre.id}
                        className={`px-3 py-2 rounded-full text-xs font-medium transition-all ${
                          selectedGenre === genre.id
                            ? 'bg-primary/20 text-primary border border-primary/30'
                            : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
                        }`}
                        onClick={() => {
                          setSelectedGenre(genre.id);
                          const details = document.querySelector('details');
                          if (details) details.removeAttribute('open');
                        }}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>
          </div>
          
          {/* Results count */}
          <div className="text-white/40 text-sm pt-2">
            {filteredTracks.length} beat{filteredTracks.length !== 1 ? 's' : ''}
            {selectedFilter !== 'all' && ` • ${selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)}`}
            {selectedGenre && ` • ${genres.find(g => g.id === selectedGenre)?.name}`}
            {searchQuery && ` • "${searchQuery}"`}
          </div>
        </div>
      </div>

      {/* Beats Grid - Modern Minimalist */}
      <div className="container mx-auto px-4 sm:px-8 pb-16">
        {beatsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
          </div>
        ) : filteredTracks.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <svg className="w-10 h-10 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium mb-2 text-text-primary">No beats found</h3>
            <p className="text-white/50 text-sm mb-6 max-w-md mx-auto">
              {selectedFilter === 'all' && selectedGenre === null && !searchQuery
                ? 'No beats available at the moment.'
                : 'Try adjusting your filters or search query'}
            </p>
            {(selectedFilter !== 'all' || selectedGenre !== null || searchQuery) && (
              <button 
                onClick={() => {
                  setSelectedFilter('all');
                  setSelectedGenre(null);
                  setSearchQuery('');
                }}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-full text-sm font-medium transition-all border border-white/10"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Mobile List View */}
            <div className="block md:hidden space-y-3">
              {filteredTracks.map((track: ITrack) => {
                const isPaid = track.paymentType === 'paid';
                return (
                  <div key={track._id} className="group rounded-xl overflow-hidden active:scale-[0.98] mx-surface">
                    <div className="flex gap-3 p-3">
                      {/* Cover Image */}
                      <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden">
                        <img 
                          src={track.coverURL || '/placeholder-cover.jpg'} 
                          alt={track.title} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/placeholder-cover.jpg';
                          }}
                        />
                        {/* Play overlay */}
                        <button 
                          onClick={() => {
                            if (track.audioURL) {
                              playTrack({
                                id: track._id,
                                title: track.title,
                                artist: typeof track.creatorId === 'object' && track.creatorId !== null 
                                  ? (track.creatorId as any).name 
                                  : 'Unknown Artist',
                                coverImage: track.coverURL || '',
                                audioUrl: track.audioURL,
                                creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
                                  ? (track.creatorId as any)._id 
                                  : track.creatorId,
                                type: track.type,
                                paymentType: track.paymentType,
                                price: track.price,
                                creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null 
                                  ? (track.creatorId as any).whatsappContact 
                                  : undefined)
                              });
                              const playlistTracks = filteredTracks.map((t: ITrack) => ({
                                id: t._id,
                                title: t.title,
                                artist: typeof t.creatorId === 'object' && t.creatorId !== null 
                                  ? (t.creatorId as any).name 
                                  : 'Unknown Artist',
                                coverImage: t.coverURL || '',
                                audioUrl: t.audioURL,
                                creatorId: typeof t.creatorId === 'object' && t.creatorId !== null 
                                  ? (t.creatorId as any)._id 
                                  : t.creatorId,
                                type: t.type,
                                paymentType: t.paymentType,
                                price: t.price,
                                creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                  ? (t.creatorId as any).whatsappContact 
                                  : undefined)
                              }));
                              setCurrentPlaylist(playlistTracks);
                            }
                          }}
                          className="absolute inset-0 flex items-end justify-end p-2 sm:p-3"
                        >
                          <span className="mx-card-play !static"><svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd"></path>
                          </svg></span>
                        </button>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold text-sm truncate flex-1 text-text-primary">{track.title}</h3>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                const mockTrack = {
                                  _id: track._id,
                                  title: track.title,
                                  creatorId: { name: typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any).name : 'Unknown Artist' },
                                  coverURL: track.coverURL,
                                  audioURL: track.audioURL,
                                  type: track.type,
                                  paymentType: track.paymentType,
                                  creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any).whatsappContact : undefined)
                                };
                                toggleFavorite(track._id, mockTrack);
                              }}
                              className="mx-card-play !static pointer-events-auto hover:bg-primary-hover [&_svg]:w-4 [&_svg]:h-4"
                            >
                              <svg 
                                className={`w-4 h-4 transition-all ${favoriteStatus[track._id] ? 'text-primary fill-current' : 'text-white/40 hover:text-white/70'}`}
                                fill={favoriteStatus[track._id] ? "currentColor" : "none"}
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                              </svg>
                            </button>
                          </div>
                          <p className="text-white/50 text-xs mb-2 truncate">
                            {typeof track.creatorId === 'object' && track.creatorId !== null 
                              ? (track.creatorId as any).name 
                              : 'Unknown Artist'}
                          </p>
                          <div className="flex items-center gap-3 text-xs text-white/40">
                            <span>{track.plays?.toLocaleString() || '0'} plays</span>
                            <div className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                              </svg>
                              <span>{track.likes}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <div className="mt-2">
                          {isPaid ? (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!track.price || track.price <= 0) {
                                  alert('Price not available for this beat');
                                  return;
                                }
                                showPayment({
                                  trackId: track._id,
                                  trackTitle: track.title,
                                  price: track.price,
                                  audioUrl: track.audioURL
                                });
                              }}
                              className="w-full py-2 bg-primary hover:bg-primary/90 text-black rounded-lg text-xs font-semibold transition-colors"
                            >
                              Buy • {track.price?.toLocaleString()} RWF
                            </button>
                          ) : (
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if (track.audioURL) {
                                  const link = document.createElement('a');
                                  link.href = track.audioURL;
                                  link.download = `${track.title}.mp3`;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } else {
                                  alert('Download link not available');
                                }
                              }}
                              className="w-full py-2 bg-white/10 hover:bg-white/15 text-white rounded-lg text-xs font-medium transition-colors"
                            >
                              Download Free
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Desktop Grid View */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredTracks.map((track: ITrack) => {
                const isPaid = track.paymentType === 'paid';
                return (
                  <div key={track._id} className="group rounded-xl overflow-hidden mx-surface">
                    <div className="relative aspect-square">
                      <img 
                        src={track.coverURL || '/placeholder-cover.jpg'} 
                        alt={track.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder-cover.jpg';
                        }}
                      />
                      
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      
                      {/* Payment type badge */}
                      <div className="absolute top-3 left-3">
                        {isPaid ? (
                          <span className="px-2.5 py-1 bg-primary text-black text-xs font-bold rounded-full shadow-lg">
                            {track.price?.toLocaleString()} RWF
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-bold rounded-full border border-white/30">
                            FREE
                          </span>
                        )}
                      </div>
                      
                      {/* Favorite button */}
                      <div className="absolute top-3 right-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const mockTrack = {
                              _id: track._id,
                              title: track.title,
                              creatorId: { name: typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any).name : 'Unknown Artist' },
                              coverURL: track.coverURL,
                              audioURL: track.audioURL,
                              type: track.type,
                              paymentType: track.paymentType,
                              creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null ? (track.creatorId as any).whatsappContact : undefined)
                            };
                            toggleFavorite(track._id, mockTrack);
                          }}
                          className="p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/50"
                        >
                          <svg 
                            className={`w-4 h-4 transition-all ${favoriteStatus[track._id] ? 'text-primary fill-current scale-110' : 'stroke-current'}`}
                            fill={favoriteStatus[track._id] ? "currentColor" : "none"}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                          </svg>
                        </button>
                      </div>
                      
                      {/* Play button overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button 
                          onClick={() => {
                            if (track.audioURL) {
                              playTrack({
                                id: track._id,
                                title: track.title,
                                artist: typeof track.creatorId === 'object' && track.creatorId !== null 
                                  ? (track.creatorId as any).name 
                                  : 'Unknown Artist',
                                coverImage: track.coverURL || '',
                                audioUrl: track.audioURL,
                                creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
                                  ? (track.creatorId as any)._id 
                                  : track.creatorId,
                                type: track.type,
                                paymentType: track.paymentType,
                                price: track.price,
                                creatorWhatsapp: (typeof track.creatorId === 'object' && track.creatorId !== null 
                                  ? (track.creatorId as any).whatsappContact 
                                  : undefined)
                              });
                                    
                              const playlistTracks = filteredTracks
                                .map((t: ITrack) => ({
                                  id: t._id,
                                  title: t.title,
                                  artist: typeof t.creatorId === 'object' && t.creatorId !== null 
                                    ? (t.creatorId as any).name 
                                    : 'Unknown Artist',
                                  coverImage: t.coverURL || '',
                                  audioUrl: t.audioURL,
                                  creatorId: typeof t.creatorId === 'object' && t.creatorId !== null 
                                    ? (t.creatorId as any)._id 
                                    : t.creatorId,
                                  type: t.type,
                                  paymentType: t.paymentType,
                                  price: t.price,
                                  creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
                                    ? (t.creatorId as any).whatsappContact 
                                    : undefined)
                                }));
                              setCurrentPlaylist(playlistTracks);
                            }
                          }}
                          className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 transform scale-50 group-hover:scale-100 transition-all duration-300 hover:scale-110"
                        >
                          <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                          
                    <div className="p-4">
                      <h3 className="font-semibold text-base mb-1 truncate group-hover:text-primary transition-colors text-text-primary">{track.title}</h3>
                      <p className="text-white/50 text-sm mb-3 truncate">
                        {typeof track.creatorId === 'object' && track.creatorId !== null 
                          ? (track.creatorId as any).name 
                          : 'Unknown Artist'}
                      </p>
                            
                      <div className="flex items-center justify-between text-xs text-white/40 mb-3">
                        <span>{track.plays?.toLocaleString() || '0'} plays</span>
                        <div className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                          </svg>
                          <span>{track.likes}</span>
                        </div>
                      </div>
          
                      {/* Action button */}
                      {isPaid ? (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!track.price || track.price <= 0) {
                              alert('Price not available for this beat');
                              return;
                            }
                            showPayment({
                              trackId: track._id,
                              trackTitle: track.title,
                              price: track.price,
                              audioUrl: track.audioURL
                            });
                          }}
                          className="w-full py-2.5 bg-primary hover:bg-primary/90 text-black rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                          </svg>
                          Buy Now • {track.price?.toLocaleString()} RWF
                        </button>
                      ) : (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (track.audioURL) {
                              const link = document.createElement('a');
                              link.href = track.audioURL;
                              link.download = `${track.title}.mp3`;
                              link.target = '_blank';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            } else {
                              alert('Download link not available');
                            }
                          }}
                          className="w-full py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                          </svg>
                          Download Free
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
      
      {/* MTN MoMo Payment Modal */}
      {showPaymentModal && (
        <PesaPalPayment
          trackId={paymentData.trackId}
          trackTitle={paymentData.trackTitle}
          price={paymentData.price}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}
