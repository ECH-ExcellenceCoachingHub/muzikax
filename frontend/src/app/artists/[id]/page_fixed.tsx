'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'
import { useAuth } from '@/contexts/AuthContext'
import { fetchTracksByCreatorPublic, followCreator, unfollowCreator, checkFollowStatus } from '@/services/trackService'
import { getAlbumsByCreator } from '@/services/albumService'
import AddToQueueButton from '@/components/AddToQueueButton'

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
  _id: string
  title: string
  artist: string
  album?: string
  duration: number // in seconds
  plays: number
  likes: number // Added likes property
  coverArt?: string
  audioUrl: string
  createdAt: string
  albumId?: string // Added to identify if track belongs to an album
  type?: 'song' | 'beat' | 'mix'; // Add track type for WhatsApp functionality
  creatorWhatsapp?: string; // Add creator's WhatsApp contact
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
  monthlyPlays: number
  totalTracks: number
}

// Function to generate avatar with first letter of name
const generateAvatar = (name: string) => {
  const firstLetter = name.charAt(0).toUpperCase()
  return (
    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#FF4D67] to-[#FFCB2B] flex items-center justify-center">
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
  const { playTrack } = useAudioPlayer()
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
      creatorWhatsapp: track.creatorWhatsapp // Include creator's WhatsApp contact
    };
    
    playTrack(playerTrack);
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
        
        {/* Artist Header */}
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 md:p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            <div className="flex-shrink-0">
              {creator.avatar && creator.avatar.trim() !== '' ? (
                <img 
                  src={creator.avatar} 
                  alt={creator.name} 
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                generateAvatar(creator.name)
              )}
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{creator.name}</h1>
              <p className="text-[#FFCB2B] text-lg mb-4 capitalize">{creator.creatorType || 'Artist'}</p>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-gray-400 text-sm">Followers</p>
                  <p className="text-white font-bold">{creator.followersCount?.toLocaleString() || 0}</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-gray-400 text-sm">Tracks</p>
                  <p className="text-white font-bold">{stats?.totalTracks || tracks.length}</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-gray-400 text-sm">Total Plays</p>
                  <p className="text-white font-bold">{formatNumber(stats?.totalPlays || 0)}</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-gray-400 text-sm">Monthly Plays</p>
                  <p className="text-white font-bold">{formatNumber(stats?.monthlyPlays || 0)}</p>
                </div>
                
                <div className="bg-gray-800 rounded-lg px-4 py-2">
                  <p className="text-gray-400 text-sm">Member Since</p>
                  <p className="text-white font-bold">
                    {new Date(creator.createdAt).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long' 
                    })}
                  </p>
                </div>
              </div>
              
              <button 
                className={`px-6 py-3 ${isFollowing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-[#FF4D67] hover:bg-[#FF4D67]/90'} text-white rounded-full font-medium transition-colors`}
                onClick={async () => {
                  // Handle follow/unfollow action here
                  if (!user) {
                    router.push('/login');
                  } else {
                    try {
                      if (isFollowing) {
                        // Unfollow the creator
                        await unfollowCreator(creator._id);
                        
                        // Update the followers count in the UI
                        setCreator(prev => 
                          prev ? {
                            ...prev,
                            followersCount: Math.max(0, prev.followersCount - 1)  // Prevent negative counts
                          } : null
                        );
                        
                        // Update the follow status
                        setIsFollowing(false);
                        
                        // Show success feedback
                        console.log('Successfully unfollowed creator');
                      } else {
                        // Follow the creator
                        await followCreator(creator._id);
                        
                        // Update the followers count in the UI
                        setCreator(prev => 
                          prev ? {
                            ...prev,
                            followersCount: prev.followersCount + 1
                          } : null
                        );
                        
                        // Update the follow status
                        setIsFollowing(true);
                        
                        // Show success feedback
                        console.log('Successfully followed creator');
                      }
                    } catch (error) {
                      console.error('Failed to follow/unfollow creator:', error);
                      alert('Failed to follow/unfollow creator. Please try again.');
                    }
                  }
                }}
              >
                {isFollowing ? 'Unfollow' : 'Follow'}
              </button>            </div>
          </div>
        </div>
        
        {/* Artist Bio */}
        <div className="bg-gray-800/50 rounded-2xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">About</h2>
          <p className="text-gray-300">
            {creator.bio || `${creator.name} is a talented ${creator.creatorType || 'artist'} on MuzikaX. Stay tuned for their upcoming releases!`}
          </p>
          
          {/* Display genres if available */}
          {creator.genres && creator.genres.length > 0 && (
            <div className="mt-4">
              <h3 className="text-gray-400 text-sm mb-2">Genres</h3>
              <div className="flex flex-wrap gap-2">
                {creator.genres.map((genre, index) => (
                  <span 
                    key={index} 
                    className="px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              placeholder="Search tracks or albums..."
              className="w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#FF4D67] focus:border-transparent"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-700 mb-6">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'tracks' ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('tracks')}
          >
            Singles ({getSingles().length})
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'albums' ? 'text-[#FF4D67] border-b-2 border-[#FF4D67]' : 'text-gray-400 hover:text-white'}`}
            onClick={() => setActiveTab('albums')}
          >
            Albums ({albums.length})
          </button>
        </div>
        
        {/* Content based on active tab */}
        {activeTab === 'tracks' ? (
          <>
            {getFilteredTracks().length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {getFilteredTracks().map((track) => (
                  <div key={track._id} className="flex items-center gap-4 p-4 card-bg rounded-xl hover:bg-gray-800/50 transition-colors group">
                    <div className="relative">
                      <img 
                        src={track.coverArt || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'} 
                        alt={track.title} 
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handlePlayTrack(track)}
                          className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </button>
                        <AddToQueueButton 
                          track={{
                            id: track._id,
                            title: track.title,
                            artist: track.artist || creator?.name || 'Unknown Artist',
                            coverImage: track.coverArt || '',
                            audioUrl: track.audioUrl || '',
                            duration: track.duration,
                            creatorId: creatorId,
                            type: track.type || 'song',
                            creatorWhatsapp: track.creatorWhatsapp
                          }}
                          size="sm"
                          variant="secondary"
                          className="opacity-0 group-hover:opacity-100 transition-opacity delay-75"
                        />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{track.title}</h3>
                      <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                      {track.album && <p className="text-gray-500 text-xs truncate">{track.album}</p>}
                    </div>
                    
                    <div className="text-right">
                      <p className="text-gray-500 text-xs sm:text-sm">{track.plays.toLocaleString()} plays</p>
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
                <h3 className="mt-4 text-lg font-medium text-white">No tracks found</h3>
                <p className="mt-2 text-gray-400">Try adjusting your search to find what you're looking for.</p>
              </div>
            )}
          </>
        ) : (
          <>
            {getFilteredAlbums().length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {getFilteredAlbums().map((album) => (
                  <div key={album.id} className="group card-bg rounded-xl p-4 transition-all duration-300 hover:border-[#FFCB2B]/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-[#FFCB2B]/10">
                    <div className="relative mb-3">
                      <img 
                        src={album.coverImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80'} 
                        alt={album.title} 
                        className="w-full aspect-square rounded-lg object-cover"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                    </div>
                    <h3 className="font-bold text-white text-sm truncate">{album.title}</h3>
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
                <h3 className="mt-4 text-lg font-medium text-white">No albums found</h3>
                <p className="mt-2 text-gray-400">Try adjusting your search to find what you're looking for.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}