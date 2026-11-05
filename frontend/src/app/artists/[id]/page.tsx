'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { useAuth } from '@/contexts/AuthContext'
import { fetchTracksByCreatorPublic, followCreator, unfollowCreator, checkFollowStatus } from '@/services/trackService'
import { getAlbumsByCreator, getAlbumById } from '@/services/albumService'
interface Creator {
  _id: string
  name: string
  creatorType: string
  followersCount: number
  avatar: string
  bio: string
  genres?: string[]
  socials?: {
    facebook?: string
    twitter?: string
    instagram?: string
    youtube?: string
    soundcloud?: string
  }
  createdAt: string
}

interface Track {
  paymentType: any
  price: any
  _id: string
  title: string
  artist: string
  album?: string
  duration: number // in seconds
  plays: number
  uniquePlays?: number // Added for unique plays tracking
  likes: number // Added likes property
  coverArt?: string
  audioUrl: string
  createdAt: string
  albumId?: string // Added to identify if track belongs to an album
  type?: 'song' | 'beat' | 'mix'; // Add track type for WhatsApp functionality
  creatorWhatsapp?: string; // Add creator's WhatsApp contact
  description?: string; // Add track description
  collaborators?: string[]; // Add collaborators
}

interface Album {
  id: string
  title: string
  artist: string
  coverImage: string
  year: number
  tracks: number
  createdAt: string
}
interface CreatorStats {
  totalPlays: number
  totalUniquePlays?: number // Added for unique plays
  monthlyPlays: number
  monthlyUniquePlays?: number // Added for unique plays
  totalTracks: number
}

// Function to generate avatar with first letter of name
const generateAvatar = (name: string) => {
  const firstLetter = name.charAt(0).toUpperCase()
  return (
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
      <span className="text-4xl font-bold text-white">{firstLetter}</span>
    </div>
  )
}

// Format duration from seconds to MM:SS
const formatDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`
}

// Format large numbers (e.g., 1.2K, 3.4M)
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export default function ArtistProfilePage() {
  const [creator, setCreator] = useState<Creator | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [albums, setAlbums] = useState<Album[]>([]) // Added for storing albums
  const [stats, setStats] = useState<CreatorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums'>('tracks') // Added for tab switching
  const [searchFilter, setSearchFilter] = useState('') // Added for search filtering
  const [isFollowing, setIsFollowing] = useState(false) // Added to track follow status
  const params = useParams()
  const router = useRouter()
  const { playTrack, setCurrentPlaylist } = useAudioPlayer()
  const { user } = useAuth()  
  const creatorId = params.id as string
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch creator data
        const creatorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/creators/${creatorId}`)
        
        if (!creatorResponse.ok) {
          throw new Error(`Failed to fetch creator: ${creatorResponse.status} ${creatorResponse.statusText}`)
        }
        
        const creatorData = await creatorResponse.json()
        setCreator(creatorData)
        
        // Fetch creator's tracks using the new public function
        try {
          const tracksData = await fetchTracksByCreatorPublic(creatorId)
          setTracks(tracksData)
        } catch (tracksError) {
          console.error('Failed to fetch tracks:', tracksError)
          setTracks([])
        }
        
        // Fetch creator's albums
        try {
          const albumsData = await getAlbumsByCreator(creatorId)
          // Transform albums to match our interface
          const transformedAlbums = albumsData.map((album: any) => ({
            id: album._id || album.id,
            title: album.title,
            artist: album.creatorId?.name || creatorData.name || 'Unknown Artist',
            coverImage: album.coverURL || '',
            year: album.releaseDate ? new Date(album.releaseDate).getFullYear() : new Date().getFullYear(),
            tracks: Array.isArray(album.tracks) ? album.tracks.length : 0,
            createdAt: album.createdAt || new Date().toISOString()
          }))
          setAlbums(transformedAlbums)
        } catch (albumsError) {
          console.error('Failed to fetch albums:', albumsError)
          setAlbums([])
        }
        
        // Fetch creator stats
        const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/creators/${creatorId}/stats`)
        
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setStats(statsData)
        }
        
        // Check if user is following this creator
        if (user) {
          try {
            const isFollowingStatus = await checkFollowStatus(creatorId);
            setIsFollowing(isFollowingStatus);
          } catch (followCheckError) {
            console.error('Error checking follow status:', followCheckError);
            setIsFollowing(false);
          }
        }
        
        setError(null)
      } catch (err) {
        console.error('Failed to fetch data:', err)
        setError('Failed to load artist profile. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    if (creatorId) {
      fetchData()
    }
  }, [creatorId, user])
  
  const handlePlayTrack = (track: Track) => {
    // Validate that we have a valid audio URL
    if (!track.audioUrl || track.audioUrl.trim() === '') {
      console.error('Invalid audio URL for track:', track);
      return;
    }
    
    // Convert track to the format expected by the audio player
    const playerTrack = {
      id: track._id,
      title: track.title,
      artist: track.artist,
      coverImage: track.coverArt || '', // This is handled in the audio player component
      audioUrl: track.audioUrl,
      plays: track.plays || 0,
      likes: track.likes || 0,
      duration: track.duration,
      creatorId: creatorId, // The current artist's ID
      type: track.type || 'song', // Include track type for WhatsApp functionality
      paymentType: track.paymentType, // Include payment type
      price: track.price, // Include price
      creatorWhatsapp: track.creatorWhatsapp, // Include creator's WhatsApp contact
      description: track.description || '', // Include track description
      collaborators: track.collaborators || [] // Include collaborators
    };
    
    playTrack(playerTrack);
  }

  const handlePlayAlbum = async (albumId: string) => {
    try {
      // Fetch the full album data
      const albumData = await getAlbumById(albumId);
      
      // Transform tracks to match player format
      const tracks = (Array.isArray(albumData.tracks) ? albumData.tracks : []).map((track: any) => ({
        id: track._id || track.id,
        title: track.title,
        artist: (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null) 
          ? (track.creatorId.name || "Unknown Artist")
          : "Unknown Artist",
        coverImage: (track.coverURL || track.coverImage) || "",
        audioUrl: track.audioURL,
        plays: track.plays || 0,
        likes: track.likes || 0,
        creatorId: (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null) 
          ? track.creatorId._id 
          : track.creatorId,
        type: track.type || 'song', // Include track type for WhatsApp functionality
        creatorWhatsapp: (track.creatorId && typeof track.creatorId === 'object' && track.creatorId !== null) 
          ? track.creatorId.whatsappContact 
          : undefined // Include creator's WhatsApp contact
      }));
      
      // Set the current playlist to the album tracks
      setCurrentPlaylist(tracks);
      
      // Play the first track of the album
      if (tracks.length > 0) {
        playTrack(tracks[0], tracks, { albumId, tracks });
      }
    } catch (error) {
      console.error('Error playing album:', error);
    }
  }
  // Filter tracks to separate singles from album tracks
  const getSingles = () => {
    return tracks.filter(track => !track.albumId || track.albumId.trim() === '');
  };

  // Filter tracks based on search filter
  const getFilteredTracks = () => {
    const singles = getSingles();
    if (!searchFilter) return singles;
    
    return singles.filter(track => 
      track.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      track.artist.toLowerCase().includes(searchFilter.toLowerCase())
    );
  };

  // Filter albums based on search filter
  const getFilteredAlbums = () => {
    if (!searchFilter) return albums;
    
    return albums.filter(album => 
      album.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      album.artist.toLowerCase().includes(searchFilter.toLowerCase())
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-white">Loading artist profile...</div>
          </div>
        </div>
      </div>
    )
  }
  
  if (error || !creator) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">{error || 'Artist not found'}</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="container mx-auto px-4">
        {/* Back button */}
        <button 
          onClick={() => router.back()}
          className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Artists
        </button>
        
        {/* Artist Header Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800/80 via-gray-900/90 to-black border border-gray-700/30 mb-8">
          {/* Subtle Background Effect */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-primary/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-primary-light/50 rounded-full blur-[100px] pointer-events-none opacity-20"></div>

          <div className="relative z-10 p-6 md:p-10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
              {/* Profile Picture */}
              <div className="flex-shrink-0 group relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-light rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative w-32 h-32 md:w-44 md:h-44 rounded-full border-4 border-gray-900 overflow-hidden shadow-2xl">
                  {creator.avatar && creator.avatar.trim() !== '' ? (
                    <img 
                      src={creator.avatar} 
                      alt={creator.name} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-700 flex items-center justify-center">
                      <span className="text-5xl font-bold text-primary">{creator.name.charAt(0).toUpperCase()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="text-center md:text-left flex-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-widest rounded-full border border-primary/20">
                    Verified Artist
                  </span>
                  <span className="px-3 py-1 bg-primary-light/10 text-primary-light text-[10px] uppercase font-bold tracking-widest rounded-full border border-primary-light/20 capitalize">
                    {creator.creatorType || 'Artist'}
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight drop-shadow-md text-text-primary">
                  {creator.name}
                </h1>
                
                <div className="flex flex-wrap justify-center md:justify-start gap-6 text-sm text-gray-400 mb-8">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">{creator.followersCount?.toLocaleString() || 0}</span>
                    <span className="text-[10px] uppercase tracking-widest font-medium">Followers</span>
                  </div>
                  <div className="w-px h-10 bg-gray-800 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">{stats?.totalTracks || tracks.length}</span>
                    <span className="text-[10px] uppercase tracking-widest font-medium">Tracks</span>
                  </div>
                  <div className="w-px h-10 bg-gray-800 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">{formatNumber(stats?.totalPlays || 0)}</span>
                    <span className="text-[10px] uppercase tracking-widest font-medium">Total Plays</span>
                  </div>
                  {stats?.totalUniquePlays !== undefined && (
                    <>
                      <div className="w-px h-10 bg-gray-800 hidden md:block"></div>
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-lg">{formatNumber(stats.totalUniquePlays)}</span>
                        <span className="text-[10px] uppercase tracking-widest font-medium">Unique Listeners</span>
                      </div>
                    </>
                  )}
                  <div className="w-px h-10 bg-gray-800 hidden md:block"></div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-lg">
                      {new Date(creator.createdAt).getFullYear()}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest font-medium">Since</span>
                  </div>
                </div>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                  <button 
                    className={`px-8 py-3.5 rounded-full font-bold text-sm transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl ${
                      isFollowing 
                        ? 'bg-gray-800 text-gray-300 border border-gray-700 hover:bg-gray-700' 
                        : 'bg-primary text-white shadow-primary/20'
                    }`}
                    onClick={async () => {
                      if (!user) {
                        router.push('/login');
                      } else {
                        try {
                          if (isFollowing) {
                            await unfollowCreator(creator._id);
                            setCreator(prev => prev ? { ...prev, followersCount: Math.max(0, prev.followersCount - 1) } : null);
                            setIsFollowing(false);
                          } else {
                            await followCreator(creator._id);
                            setCreator(prev => prev ? { ...prev, followersCount: prev.followersCount + 1 } : null);
                            setIsFollowing(true);
                          }
                        } catch (error) {
                          console.error('Failed to follow/unfollow:', error);
                        }
                      }
                    }}
                  >
                    {isFollowing ? 'Following' : 'Follow Artist'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content Layout: Sidebar + Main Content */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar (Desktop Only) / Top Info (Mobile) */}
          <div className="lg:w-1/3 space-y-8">
            {/* Bio Card */}
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-3xl p-6 border border-gray-700/30">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-text-primary">
                <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Artist Bio
              </h2>
              <p className="text-gray-400 leading-relaxed text-sm">
                {creator.bio || `${creator.name} is a talented ${creator.creatorType || 'artist'} on MuzikaX. Stay tuned for their upcoming releases!`}
              </p>
              
              {creator.genres && creator.genres.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-700/50">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Genres</h3>
                  <div className="flex flex-wrap gap-2">
                    {creator.genres.map((genre, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-lg border border-gray-700/50"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Stats Summary - New Card */}
            <div className="bg-gradient-to-br from-primary/10 to-primary-light/5 rounded-3xl p-6 border border-primary/10">
              <h3 className="font-bold mb-4 text-text-primary">Engagement</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Monthly Plays</span>
                  <span className="text-white font-bold">{formatNumber(stats?.monthlyPlays || 0)}</span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: '65%' }}></div>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-gray-400 text-sm">Popularity</span>
                  <span className="text-primary-light font-bold">Trending</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:w-2/3">
            {/* Search & Tabs Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
              {/* Tabs */}
              <div className="flex p-1 bg-gray-800/50 rounded-xl w-fit">
                <button
                  className={`py-2 px-6 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'tracks' 
                      ? 'bg-gray-700 text-white shadow-lg' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('tracks')}
                >
                  Singles ({getSingles().length})
                </button>
                <button
                  className={`py-2 px-6 rounded-lg text-sm font-bold transition-all ${
                    activeTab === 'albums' 
                      ? 'bg-gray-700 text-white shadow-lg' 
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                  onClick={() => setActiveTab('albums')}
                >
                  Albums ({albums.length})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative flex-1 max-w-xs">
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Search in profile..."
                  className="w-full px-4 py-2.5 pl-10 bg-gray-800/50 border border-gray-700/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-sm"
                />
                <div className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>
            </div>
            
            {/* Content Display */}
            {activeTab === 'tracks' ? (
              getFilteredTracks().length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                  {getFilteredTracks().map((track) => (
                    <div key={track._id} className="flex items-center gap-4 p-4 card-bg rounded-xl group">
                      <div className="relative">
                        <img 
                          src={track.coverArt || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'} 
                          alt={track.title} 
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handlePlayTrack(track)}
                            className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold truncate text-text-primary">{track.title}</h3>
                        <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                        {track.album && <p className="text-gray-500 text-xs truncate">{track.album}</p>}
                      </div>
                      
                      <div className="text-right">
                        <p className="text-gray-500 text-xs sm:text-sm">{track.plays.toLocaleString()} plays</p>
                        {track.uniquePlays !== undefined && (
                          <p className="text-gray-600 text-[10px] sm:text-xs">{track.uniquePlays.toLocaleString()} unique</p>
                        )}
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                          </svg>
                          <span className="text-gray-500 text-xs sm:text-sm">{track.likes}</span>
                        </div>
                      </div>
                      
                      <div className="text-gray-500 text-sm hidden sm:block">
                        {formatDuration(track.duration)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-text-primary">No tracks found</h3>
                  <p className="mt-2 text-gray-400">Try adjusting your search to find what you're looking for.</p>
                </div>
              )
            ) : (
              getFilteredAlbums().length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {getFilteredAlbums().map((album) => (
                    <div key={album.id} className="group card-bg rounded-xl p-4">
                      <div className="relative mb-3">
                        <img 
                          src={album.coverImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'} 
                          alt={album.title} 
                          className="w-full aspect-square rounded-lg object-cover"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlayAlbum(album.id);
                            }}
                            className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                            </svg>
                          </button>
                        </div>
                      </div>
                      <h3 className="font-bold text-sm truncate text-text-primary">{album.title}</h3>
                      <p className="text-gray-400 text-xs truncate">{album.artist}</p>
                      <p className="text-gray-500 text-xs mt-1">{album.year} • {album.tracks} tracks</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <h3 className="mt-4 text-lg font-medium text-text-primary">No albums found</h3>
                  <p className="mt-2 text-gray-400">Try adjusting your search to find what you're looking for.</p>
                </div>
              )
            )}
      </div>
    </div>
  </div>
</div>
)
}