'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { FaArrowLeft } from 'react-icons/fa'
import { followCreator } from '@/services/trackService'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'

interface SearchTrack {
  id: string
  title: string
  artist: string
  album?: string
  plays: number
  likes: number
  coverImage: string
  duration?: string
  audioURL: string
  paymentType?: 'free' | 'paid'
  price?: number
  type?: 'song' | 'beat' | 'mix'
  creatorId?: string
  creatorWhatsapp?: string
}

interface PlayerTrack {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioUrl: string;
  duration?: number; // in seconds
  creatorId?: string; // Add creator ID for linking to artist profile
  albumId?: string; // Add album ID for album playback logic
  plays?: number; // Add plays property to track play counts
  likes?: number; // Add likes property to track like counts
  type?: 'song' | 'beat' | 'mix'; // Add type field to distinguish beats
  paymentType?: 'free' | 'paid'; // Add payment type for beat pricing
  price?: number; // Add price for paid beats
  creatorWhatsapp?: string; // Add creator's WhatsApp contact for beats
}

interface Creator {
  _id?: string
  id?: string
  name: string
  type: string
  followers?: number
  followersCount?: number
  avatar: string
  verified?: boolean
}

interface Album {
  id: string
  title: string
  artist: string
  coverImage: string
  year: number
  tracks: number
}
// Separate component for the main content that uses useSearchParams
interface Playlist {
  id: string
  name: string
  description: string
  creator: string
  coverImage: string
  tracks: any[]
  isPublic: boolean
}

function SearchResultsContent() {
  const { t } = useLanguage()
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const [searchQuery, setSearchQuery] = useState(query)
  const [activeTab, setActiveTab] = useState<'tracks' | 'artists' | 'albums' | 'playlists' | 'mixes'>('tracks')
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [tracks, setTracks] = useState<SearchTrack[]>([])
  const [artists, setArtists] = useState<Creator[]>([])
  const [albums, setAlbums] = useState<Album[]>([])
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [mixes, setMixes] = useState<SearchTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [following, setFollowing] = useState<Record<string, boolean>>({})
  const { isAuthenticated } = useAuth()
  const { playTrack, setCurrentPlaylist } = useAudioPlayer()
  
  // Genre list for filtering with colors and icons
  const genres = [
    { id: 'afrobeat', name: 'Afrobeat', color: 'from-green-500 to-emerald-700', icon: '🎵' },
    { id: 'amapiano', name: 'Amapiano', color: 'from-purple-600 to-indigo-800', icon: '🎹' },
    { id: 'hiphop', name: 'Hip Hop', color: 'from-orange-500 to-red-700', icon: '🎤' },
    { id: 'rnb', name: 'R&B', color: 'from-pink-500 to-rose-700', icon: '💜' },
    { id: 'afropop', name: 'Afropop', color: 'from-yellow-500 to-orange-600', icon: '⭐' },
    { id: 'gospel', name: 'Gospel', color: 'from-blue-500 to-cyan-700', icon: '✨' },
    { id: 'traditional', name: 'Traditional', color: 'from-amber-600 to-yellow-800', icon: '🥁' },
    { id: 'dancehall', name: 'Dancehall', color: 'from-red-500 to-pink-700', icon: '💃' },
    { id: 'reggae', name: 'Reggae', color: 'from-green-600 to-lime-700', icon: '🌴' },
    { id: 'pop', name: 'Pop', color: 'from-fuchsia-500 to-purple-700', icon: '🎸' },
    { id: 'electronic', name: 'Electronic', color: 'from-cyan-500 to-blue-700', icon: '⚡' },
    { id: 'house', name: 'House', color: 'from-violet-500 to-purple-800', icon: '🏠' },
    { id: 'jazz', name: 'Jazz', color: 'from-amber-500 to-orange-700', icon: '🎺' },
    { id: 'soul', name: 'Soul', color: 'from-rose-500 to-red-700', icon: '❤️' },
    { id: 'rock', name: 'Rock', color: 'from-gray-600 to-slate-800', icon: '🎸' },
    { id: 'drill', name: 'Drill', color: 'from-slate-600 to-zinc-800', icon: '🔥' },
    { id: 'trap', name: 'Trap', color: 'from-indigo-600 to-blue-900', icon: '🎧' },
    { id: 'lofi', name: 'Lo-Fi', color: 'from-teal-500 to-emerald-700', icon: '☕' },
    { id: 'ambient', name: 'Ambient', color: 'from-sky-500 to-blue-800', icon: '🌊' }
  ]

  // Browse categories for empty state (Spotify-style)
  const browseCategories = [
    { id: 'trending', name: 'Trending Now', color: 'from-primary to-primary-light', description: 'Hot tracks right now' },
    { id: 'new-releases', name: 'New Releases', color: 'from-purple-600 to-pink-600', description: 'Fresh drops this week' },
    { id: 'charts', name: 'Top Charts', color: 'from-blue-600 to-cyan-500', description: 'Most played songs' },
    { id: 'playlists', name: 'Curated Playlists', color: 'from-green-500 to-emerald-600', description: 'Handpicked collections' },
    { id: 'artists', name: 'Featured Artists', color: 'from-orange-500 to-red-600', description: 'Spotlight on creators' },
    { id: 'albums', name: 'Popular Albums', color: 'from-indigo-600 to-purple-700', description: 'Full album experiences' },
    { id: 'beats', name: 'Beats & Instrumentals', color: 'from-pink-500 to-rose-600', description: 'Producer specials' },
    { id: 'mixes', name: 'DJ Mixes', color: 'from-yellow-500 to-orange-600', description: 'Extended mixes' },
    { id: 'local', name: 'Local Favorites', color: 'from-teal-500 to-cyan-600', description: 'Rwanda\'s finest' },
    { id: 'international', name: 'International', color: 'from-violet-600 to-fuchsia-700', description: 'Global sounds' },
    { id: 'workout', name: 'Workout', color: 'from-red-600 to-orange-600', description: 'High energy tracks' },
    { id: 'chill', name: 'Chill Vibes', color: 'from-blue-500 to-indigo-600', description: 'Relaxing tunes' }
  ]
  
  // Fetch search results from API
  const fetchSearchResults = async (searchTerm: string) => {
    if (!searchTerm.trim() && !selectedGenre) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (searchTerm.trim()) {
        params.append('q', searchTerm.trim());
      }
      params.append('type', 'all');
      if (selectedGenre) {
        params.append('genre', selectedGenre);
      }
      // Don't add limit to get all results
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch search results')
      }
      
      const data = await response.json()
      
      setTracks(data.tracks || [])
      setArtists(data.artists || [])
      setAlbums(data.albums || [])
      setPlaylists(data.playlists || [])
      setMixes(data.mixes || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }
  
  // Fetch results when query or genre changes
  useEffect(() => {
    if (query || selectedGenre) {
      fetchSearchResults(query)
    }
  }, [query, selectedGenre])
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      // Update URL with new search query
      window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchQuery.trim())}`)
      fetchSearchResults(searchQuery.trim())
    }
  }

  // Handle playlist playback
  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      // Convert tracks to the format expected by the audio player
      const playerTracks: PlayerTrack[] = playlist.tracks
        .filter(track => track && track.audioURL)
        .map(track => ({
          id: track.id || track._id,
          title: track.title,
          artist: playlist.creator === 'admin' || playlist.creator?.toLowerCase().includes('muzikax') ? 'MuzikaX' : track.creatorId?.name || 'MuzikaX',
          coverImage: track.coverURL || track.coverImage || '',
          audioUrl: track.audioURL || '',
          creatorId: track.creatorId?._id || track.creatorId || '',
          type: 'song' as const
        }))
      
      if (playerTracks.length > 0) {
        // Set the current playlist
        setCurrentPlaylist(playerTracks)
        
        // Play the first track
        playTrack(playerTracks[0], playerTracks)
      }
    }
  }

  // Handle following an artist
  const handleFollowArtist = async (artistId: string) => {
    if (!isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login';
      return;
    }

    try {
      // Call the follow creator service
      await followCreator(artistId);
      
      // Update the following state
      setFollowing(prev => ({
        ...prev,
        [artistId]: !prev[artistId]
      }));
      
      // Show success feedback
      console.log('Successfully followed creator');
    } catch (error) {
      console.error('Error following artist:', error);
      alert('Failed to follow creator. Please try again.');
    }
  }

  return (
    <div className="relative overflow-hidden min-h-screen pt-20 pb-8 sm:pt-28 sm:pb-12 bg-background">
      {/* Mobile Header with Back Button */}
      <div className="md:hidden sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors p-2 -ml-2 active:scale-95"
              aria-label="Go back"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-black text-text-primary">Search</h1>
              <p className="text-xs text-gray-400">Find music & artists</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="w-full max-w-full px-3 sm:px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Search Header - Desktop */}
          <div className="hidden sm:block text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black mb-2 animate-gradient text-text-primary">
              {t('searchResults')}
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mb-6">Discover music, artists, and playlists</p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full px-6 py-4 pl-14 pr-24 bg-gray-800/60 backdrop-blur-lg border-2 border-gray-700 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 text-base transition-all shadow-xl group-hover:border-gray-600"
                />
                <div className="absolute left-5 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-primary to-primary-light hover:from-primary/90 hover:to-primary-light/90 text-white rounded-xl text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  {t('search')}
                </button>
              </div>
            </form>
            
            {/* Genre Filter */}
            <div className="mt-6">
              <div className="flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
                <button
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                    selectedGenre === null
                      ? 'bg-primary text-white'
                      : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                  }`}
                  onClick={() => setSelectedGenre(null)}
                >
                  {t('allGenres')}
                </button>
                
                {genres.slice(0, 10).map((genre) => (
                  <button
                    key={genre.id}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                      selectedGenre === genre.id
                        ? 'bg-primary text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                    onClick={() => setSelectedGenre(genre.id)}
                  >
                    {genre.name}
                  </button>
                ))}
                
                {/* Show more genres dropdown for smaller screens */}
                <div className="relative md:hidden">
                  <select 
                    value={selectedGenre || ''}
                    onChange={(e) => setSelectedGenre(e.target.value || null)}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gray-800/50 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('allGenres')}</option>
                    {genres.map((genre) => (
                      <option key={genre.id} value={genre.id}>
                        {genre.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* More genres button for larger screens */}
                <div className="hidden md:block relative">
                  {genres.length > 10 && (
                    <details className="group">
                      <summary className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 cursor-pointer list-none">
                        {t('moreGenres')}
                      </summary>
                      <div className="absolute z-10 mt-2 p-2 bg-gray-800 rounded-lg shadow-lg grid grid-cols-2 sm:grid-cols-3 gap-2 w-full max-w-64">
                        {genres.slice(10).map((genre) => (
                          <button
                            key={genre.id}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                              selectedGenre === genre.id
                                ? 'bg-primary text-white'
                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
                            }`}
                            onClick={() => {
                              setSelectedGenre(genre.id);
                              // Close the dropdown
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
            </div>
          </div>
          
          {/* Mobile Search Bar - Enhanced */}
          <div className="sm:hidden mb-4 px-1">
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full px-4 py-3 pl-12 pr-20 bg-gray-800/60 backdrop-blur-lg border-2 border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm transition-all shadow-lg"
                />
                <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  {t('search')}
                </button>
              </div>
            </form>
          </div>
          
          {/* Mobile Genre Filter - Horizontal Scroll */}
          <div className="sm:hidden mb-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
              <button
                className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all ${
                  selectedGenre === null
                    ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md'
                    : 'bg-gray-800/60 text-gray-300 border border-gray-700'
                }`}
                onClick={() => setSelectedGenre(null)}
              >
                All
              </button>
              
              {genres.slice(0, 8).map((genre) => (
                <button
                  key={genre.id}
                  className={`flex-shrink-0 px-3 py-2 rounded-full text-xs font-medium transition-all flex items-center gap-1 ${
                    selectedGenre === genre.id
                      ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-md'
                      : 'bg-gray-800/60 text-gray-300 border border-gray-700'
                  }`}
                  onClick={() => setSelectedGenre(genre.id)}
                >
                  <span>{genre.icon}</span>
                  <span>{genre.name}</span>
                </button>
              ))}
            </div>
          </div>
          
          {/* Results Info */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-6 w-full">
            <p className="text-gray-400 text-xs sm:text-sm">
              {loading ? t('searching') : selectedGenre 
                ? t('foundResultsInGenre', {
                    count: tracks.length + artists.length + albums.length + playlists.length + mixes.length,
                    query: query || 'all',
                    genre: genres.find(g => g.id === selectedGenre)?.name || selectedGenre
                  })
                : t('foundResults', {
                    count: tracks.length + artists.length + albums.length + playlists.length + mixes.length,
                    query: query
                  })}
            </p>
            
            {/* Tabs - Mobile Horizontal Scroll */}
            <div className="w-full sm:w-auto overflow-x-auto scrollbar-hide">
              <div className="flex border-b border-gray-800 min-w-max">
                <button
                  className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'tracks'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('tracks')}
                >
                  {t('tracks')} ({tracks.length})
                </button>
                <button
                  className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'artists'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('artists')}
                >
                  {t('artists')} ({artists.length})
                </button>
                <button
                  className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'albums'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('albums')}
                >
                  {t('albums')} ({albums.length})
                </button>
                <button
                  className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'playlists'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('playlists')}
                >
                  {t('playlists')} ({playlists.length})
                </button>
                <button
                  className={`py-2 px-3 sm:px-4 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                    activeTab === 'mixes'
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('mixes')}
                >
                  {t('mixes')} ({mixes.length})
                </button>
              </div>
            </div>
          </div>
          
          {/* Search Results */}
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
              <p className="mt-4 text-gray-400">Searching for "{query}"...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <h3 className="mt-4 text-lg font-medium text-text-primary">Error loading search results</h3>
              <p className="mt-2 text-gray-400">{error}</p>
              <button 
                onClick={() => fetchSearchResults(query)}
                className="mt-4 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-full text-sm font-medium transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : searchQuery ? (
            <>
              {/* Tracks Tab */}
              {activeTab === 'tracks' && (
                <div className="space-y-3">
                  {tracks.length > 0 ? (
                    tracks.map((track, index) => (
                      <div 
                        key={track.id} 
                        className="group flex items-center gap-4 p-3 sm:p-4 rounded-xl cursor-pointer mx-surface"
                        onClick={() => {
                          const formattedTrack: PlayerTrack = {
                            id: track.id,
                            title: track.title,
                            artist: track.artist,
                            coverImage: track.coverImage,
                            audioUrl: track.audioURL,
                            duration: undefined,
                            creatorId: track.creatorId,
                            albumId: undefined,
                            plays: track.plays,
                            likes: track.likes,
                            type: track.type || 'song',
                            paymentType: track.paymentType,
                            price: track.price,
                            creatorWhatsapp: track.creatorWhatsapp
                          };
                          playTrack(formattedTrack);
                        }}
                      >
                        {/* Track Number / Play Button */}
                        <div className="w-8 text-center text-gray-500 text-sm font-medium group-hover:hidden">
                          {index + 1}
                        </div>
                        <div className="w-8 hidden group-hover:flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        
                        {/* Cover Image */}
                        <div className="relative flex-shrink-0">
                          <img 
                            src={track.coverImage || '/placeholder-track.png'} 
                            alt={track.title} 
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                          />
                          {/* Beat indicator badge */}
                          {track.type === 'beat' && (
                            <div className="absolute -top-2 -left-2">
                              <span className="px-2 py-1 bg-purple-600 text-white text-[10px] font-bold rounded-full shadow-lg">
                                BEAT
                              </span>
                            </div>
                          )}
                          {/* Payment type indicator for beats */}
                          {track.type === 'beat' && track.paymentType === 'paid' && (
                            <div className="absolute -bottom-2 -right-2">
                              <span className="px-2 py-1 text-[10px] font-bold rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
                                {track.price?.toLocaleString()} RWF
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate group-hover:text-primary transition-colors text-text-primary">{track.title}</h3>
                          <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                          {track.album && <p className="text-gray-500 text-xs truncate mt-0.5">{track.album}</p>}
                        </div>
                        
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-right">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                            </svg>
                            <span className="text-gray-400 text-sm">{track.plays.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd"></path>
                            </svg>
                            <span className="text-gray-400 text-sm">{track.likes}</span>
                          </div>
                        </div>
                        
                        {/* Duration or More Options */}
                        <div className="text-gray-500 text-sm">
                          {track.duration || '3:45'}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 card-bg rounded-xl border border-gray-800">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-text-primary">No tracks found</h3>
                      <p className="text-gray-400 mb-4">Try adjusting your search or browse categories below</p>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedGenre(null);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-medium hover:shadow-lg transition-all"
                      >
                        Browse All
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Artists Tab */}
              {activeTab === 'artists' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {artists.length > 0 ? (
                    artists.map((artist) => (
                      <Link 
                        key={artist._id || artist.id} 
                        href={`/artists/${artist._id || artist.id}`} 
                        className="group relative card-bg rounded-lg sm:rounded-xl p-3 sm:p-4 block overflow-hidden active:scale-95"
                      >
                        {/* Background gradient on hover */}
                        <div className="absolute inset-0 bg-gradient-to-br from-primary-light/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        
                        <div className="relative flex flex-col items-center text-center">
                          <div className="relative mb-3">
                            <img 
                              src={artist.avatar || '/placeholder-avatar.png'} 
                              alt={artist.name} 
                              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto ring-2 ring-transparent group-hover:ring-primary-light transition-all duration-300"
                            />
                            {artist.verified && (
                              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-r from-primary to-primary-light border-2 border-gray-900 flex items-center justify-center shadow-lg">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                              </div>
                            )}
                          </div>
                          <h3 className="font-bold text-sm sm:text-base truncate w-full group-hover:text-primary-light transition-colors text-text-primary">{artist.name}</h3>
                          <p className="text-gray-400 text-xs sm:text-sm mb-2">{artist.type}</p>
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                            </svg>
                            <span>{(artist.followersCount || artist.followers || 0).toLocaleString()}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              handleFollowArtist(artist._id || artist.id || '');
                            }}
                            disabled={!isAuthenticated}
                            className={`mt-auto w-full px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 ${
                              following[artist._id || artist.id || ''] 
                                ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg' 
                                : isAuthenticated
                                  ? 'bg-transparent border-2 border-primary-light text-primary-light hover:bg-primary-light hover:text-gray-900 hover:shadow-lg'
                                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {following[artist._id || artist.id || ''] 
                              ? '✓ Following' 
                              : isAuthenticated 
                                ? '+ Follow' 
                                : 'Login to Follow'}
                          </button>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-16 card-bg rounded-xl border border-gray-800">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-text-primary">No artists found</h3>
                      <p className="text-gray-400 mb-4">Try adjusting your search or browse categories below</p>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedGenre(null);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-medium hover:shadow-lg transition-all"
                      >
                        Browse All
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Albums Tab */}
              {activeTab === 'albums' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {albums.length > 0 ? (
                    albums.map((album) => (
                      <div 
                        key={album.id} 
                        className="group card-bg rounded-lg sm:rounded-xl overflow-hidden cursor-pointer active:scale-95"
                        onClick={() => {
                          alert('Album playback coming soon!');
                        }}
                      >
                        <div className="relative aspect-square overflow-hidden">
                          <img 
                            src={album.coverImage || '/placeholder-album.png'} 
                            alt={album.title} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                          />
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                            <button 
                              className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary-light flex items-center justify-center text-white shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:scale-110"
                            >
                              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                              </svg>
                            </button>
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h3 className="font-bold text-sm sm:text-base mb-1 truncate group-hover:text-primary transition-colors text-text-primary">{album.title}</h3>
                          <p className="text-gray-400 text-xs sm:text-sm truncate mb-2">{album.artist}</p>
                          <div className="flex justify-between items-center text-xs text-gray-500">
                            <span>{album.year}</span>
                            <span className="flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path>
                              </svg>
                              {album.tracks} tracks
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-16 card-bg rounded-xl border border-gray-800">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-text-primary">No albums found</h3>
                      <p className="text-gray-400 mb-4">Try adjusting your search or browse categories below</p>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedGenre(null);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-medium hover:shadow-lg transition-all"
                      >
                        Browse All
                      </button>
                    </div>
                  )}
                </div>
              )}
              
              {/* Playlists Tab */}
              {activeTab === 'playlists' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {playlists.length > 0 ? (
                    playlists.map((playlist) => (
                      <div 
                        key={playlist.id} 
                        className="group card-bg rounded-lg sm:rounded-xl overflow-hidden cursor-pointer active:scale-95"
                        onClick={() => handlePlayPlaylist(playlist)}
                      >
                        <div className="relative aspect-square overflow-hidden">
                          {playlist.coverImage ? (
                            <img 
                              src={playlist.coverImage} 
                              alt={playlist.name} 
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                              <svg className="w-16 h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                              </svg>
                            </div>
                          )}
                          
                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
                            <button className="w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary-light flex items-center justify-center text-white shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 hover:scale-110">
                              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                              </svg>
                            </button>
                          </div>
                          
                          {/* Track Count Badge */}
                          <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
                            {playlist.tracks?.length || 0} tracks
                          </div>
                        </div>
                        
                        <div className="p-3">
                          <h3 className="font-bold text-sm sm:text-base mb-1 truncate group-hover:text-primary transition-colors text-text-primary">
                            {playlist.name}
                          </h3>
                          <p className="text-gray-400 text-[10px] sm:text-xs truncate mb-1">
                            By {playlist.creator}
                          </p>
                          {playlist.description && (
                            <p className="text-gray-500 text-[10px] sm:text-xs line-clamp-2">
                              {playlist.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-16 card-bg rounded-xl border border-gray-800">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm0 0v-8"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-text-primary">No playlists found</h3>
                      <p className="text-gray-400 mb-4">Try adjusting your search or browse categories below</p>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedGenre(null);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                      >
                        Browse All
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mixes Tab */}
              {activeTab === 'mixes' && (
                <div className="space-y-3">
                  {mixes.length > 0 ? (
                    mixes.map((mix, index) => (
                      <div 
                        key={mix.id} 
                        className="group flex items-center gap-4 p-3 sm:p-4 rounded-xl cursor-pointer mx-surface"
                        onClick={() => {
                          const formattedTrack: PlayerTrack = {
                            id: mix.id,
                            title: mix.title,
                            artist: mix.artist,
                            coverImage: mix.coverImage,
                            audioUrl: mix.audioURL,
                            creatorId: mix.creatorId,
                            plays: mix.plays,
                            likes: mix.likes,
                            type: 'mix'
                          };
                          playTrack(formattedTrack);
                        }}
                      >
                        {/* Track Number / Play Button */}
                        <div className="w-8 text-center text-gray-500 text-sm font-medium group-hover:hidden">
                          {index + 1}
                        </div>
                        <div className="w-8 hidden group-hover:flex items-center justify-center">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </div>
                        
                        {/* Cover Image */}
                        <div className="relative flex-shrink-0">
                          <img 
                            src={mix.coverImage || '/placeholder-track.png'} 
                            alt={mix.title} 
                            className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover shadow-lg group-hover:shadow-xl transition-shadow"
                          />
                          {/* Mix badge */}
                          <div className="absolute -top-2 -left-2">
                            <span className="px-2 py-1 bg-gradient-to-r from-primary-light to-orange-500 text-white text-[10px] font-bold rounded-full shadow-lg">
                              MIX
                            </span>
                          </div>
                        </div>
                        
                        {/* Mix Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold truncate group-hover:text-primary-light transition-colors text-text-primary">{mix.title}</h3>
                          <p className="text-gray-400 text-sm truncate">{mix.artist}</p>
                        </div>
                        
                        {/* Stats */}
                        <div className="hidden sm:flex items-center gap-4 text-right">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                            </svg>
                            <span className="text-gray-400 text-sm">{mix.plays.toLocaleString()}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" clipRule="evenodd"></path>
                            </svg>
                            <span className="text-gray-400 text-sm">{mix.likes}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 card-bg rounded-xl border border-gray-800">
                      <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm0 0v-8"></path>
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-text-primary">No mixes found</h3>
                      <p className="text-gray-400 mb-4">Try adjusting your search or browse categories below</p>
                      <button 
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedGenre(null);
                        }}
                        className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-full font-medium hover:shadow-lg transition-all"
                      >
                        Browse All
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-6 sm:space-y-8">
              {/* Browse Categories Section - Spotify Style */}
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6 text-text-primary">Browse All</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
                  {browseCategories.map((category, index) => (
                    <div
                      key={category.id}
                      onClick={() => {
                        // Navigate to appropriate page based on category
                        const routes: Record<string, string> = {
                          'trending': '/charts',
                          'new-releases': '/explore?filter=new',
                          'charts': '/charts',
                          'playlists': '/playlists',
                          'artists': '/explore?filter=artists',
                          'albums': '/explore?filter=albums',
                          'beats': '/beats',
                          'mixes': '/mixes',
                          'local': '/explore?filter=local',
                          'international': '/explore?filter=international',
                          'workout': '/playlists?genre=workout',
                          'chill': '/playlists?genre=chill'
                        }
                        router.push(routes[category.id] || '/explore')
                      }}
                      className={`relative overflow-hidden rounded-lg sm:rounded-xl aspect-square bg-gradient-to-br ${category.color} cursor-pointer transform active:scale-95 group animate-scale-in mx-surface`}
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <div className="absolute inset-0 p-3 sm:p-4 flex flex-col justify-between">
                        <h3 className="font-bold text-sm sm:text-lg leading-tight text-text-primary">{category.name}</h3>
                        <p className="text-white/80 text-[10px] sm:text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-300 line-clamp-2">
                          {category.description}
                        </p>
                      </div>
                      {/* Decorative element */}
                      <div className="absolute -bottom-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Popular Genres Section */}
              <div>
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 text-text-primary">Popular Genres</h2>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {genres.slice(0, 12).map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => setSelectedGenre(genre.id)}
                      className={`px-3 py-2 sm:px-4 sm:py-2.5 rounded-full bg-gradient-to-r ${genre.color} text-white font-medium text-xs sm:text-sm transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95 flex items-center gap-1.5 sm:gap-2`}
                    >
                      <span>{genre.icon}</span>
                      <span>{genre.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
                <div className="card-bg rounded-lg sm:rounded-xl p-4 sm:p-6 text-center border border-gray-800 hover:border-primary/50 transition-colors">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-text-primary">
                    10K+
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">Songs</div>
                </div>
                <div className="card-bg rounded-lg sm:rounded-xl p-4 sm:p-6 text-center border border-gray-800 hover:border-primary-light/50 transition-colors">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-text-primary">
                    500+
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">Artists</div>
                </div>
                <div className="card-bg rounded-lg sm:rounded-xl p-4 sm:p-6 text-center border border-gray-800 hover:border-primary/50 transition-colors">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-text-primary">
                    200+
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">Albums</div>
                </div>
                <div className="card-bg rounded-lg sm:rounded-xl p-4 sm:p-6 text-center border border-gray-800 hover:border-blue-500/50 transition-colors">
                  <div className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2 text-text-primary">
                    100+
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">Playlists</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Loading fallback component
function SearchLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-white">Loading search results...</div>
    </div>
  )
}

export default function SearchResults() {
  return (
    <Suspense fallback={<SearchLoading />}>
      <SearchResultsContent />
    </Suspense>
  )
}
