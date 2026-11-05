'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useAudioPlayer } from '../../contexts/AudioPlayerContext'
import { getUserPlaylists, deletePlaylist, addTrackToPlaylist } from '../../services/userService'

interface PlaylistTrack {
  _id: string
  title: string
  creatorId: {
    name: string
  }
  plays: number
  coverURL?: string
  audioURL?: string  // Add audioURL field
  audioUrl?: string  // Alternative naming
  url?: string      // Alternative naming
  coverImage?: string // Alternative naming
  audio?: string     // Another possible naming
  src?: string       // Another possible naming
}

interface Playlist {
  _id: string
  name: string
  description: string
  userId: {
    _id: string
    name: string
  }
  tracks: PlaylistTrack[]
  isPublic: boolean
  createdAt: string
}

export default function PublicPlaylists() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-8 sm:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    }>
      <PlaylistsContent />
    </Suspense>
  )
}

function PlaylistsContent() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [filteredPlaylists, setFilteredPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('recommended') // recent, popular, tracks, recommended
  const [filterType, setFilterType] = useState('all') // all, mine, muzikax, other
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newPlaylistName, setNewPlaylistName] = useState('')
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('')
  const [newPlaylistPublic, setNewPlaylistPublic] = useState(true)
  const [creatingPlaylist, setCreatingPlaylist] = useState(false)
  const [selectedTracksForNewPlaylist, setSelectedTracksForNewPlaylist] = useState<PlaylistTrack[]>([])
  const [showTrackSelector, setShowTrackSelector] = useState(false)
  const [showTracksModal, setShowTracksModal] = useState(false)
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null)
  const [addingTrackId, setAddingTrackId] = useState<string | null>(null)
  const [showAddToPlaylistModal, setShowAddToPlaylistModal] = useState(false)
  const [selectedTrackToAdd, setSelectedTrackToAdd] = useState<PlaylistTrack | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { currentTrack, playTrack, setCurrentPlaylist } = useAudioPlayer()
  const hasFetchedRef = useRef(false)
  const hasCheckedParamsRef = useRef(false)

  // Handle create from query param
  useEffect(() => {
    if (isAuthenticated && !authLoading && !hasCheckedParamsRef.current) {
      const createParam = searchParams.get('create');
      if (createParam === 'true') {
        setShowCreateModal(true);
        
        // Add current track if it exists
        if (currentTrack) {
          const playlistTrack: PlaylistTrack = {
            _id: currentTrack.id,
            title: currentTrack.title,
            creatorId: {
              name: currentTrack.artist
            },
            plays: currentTrack.plays || 0,
            coverURL: currentTrack.coverImage,
            audioURL: currentTrack.audioUrl || (currentTrack as any).audioURL
          };
          
          setSelectedTracksForNewPlaylist([playlistTrack]);
        }
      }
      hasCheckedParamsRef.current = true;
    }
  }, [isAuthenticated, authLoading, searchParams, currentTrack]);

  // Reset the fetch ref when auth state changes significantly
  useEffect(() => {
    // Reset fetch flag when auth loading starts or auth state changes significantly
    if (authLoading || (hasFetchedRef.current && !isAuthenticated)) {
      hasFetchedRef.current = false;
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    console.log('Auth loading effect triggered:', { authLoading, isAuthenticated, hasFetched: hasFetchedRef.current });
    // Only fetch playlists when authentication state is fully loaded AND we haven't fetched yet
    if (!authLoading && !hasFetchedRef.current) {
      hasFetchedRef.current = true;
      fetchPlaylists();
    }
  }, [authLoading, isAuthenticated])

  useEffect(() => {
    filterAndSortPlaylists()
  }, [playlists, searchQuery, sortBy, filterType])
  
  // Debug logs
  useEffect(() => {
    console.log('Playlists page debug:', {
      isAuthenticated,
      playlistsLength: playlists.length,
      filteredPlaylistsLength: filteredPlaylists.length,
      searchQuery,
      filterType
    });
  }, [isAuthenticated, playlists.length, filteredPlaylists.length, searchQuery, filterType]);

  const fetchPlaylists = async () => {
    try {
      setLoading(true)
      setError('')
      
      console.log('fetchPlaylists called with:', { isAuthenticated, authLoading });
      
      // Fetch both public playlists and user's personal playlists when authenticated
      let publicPlaylists = [];
      let userPlaylists = [];
      
      // Always fetch public playlists
      try {
        const publicResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/playlists`);
        if (publicResponse.ok) {
          const publicData = await publicResponse.json();
          publicPlaylists = publicData.playlists || [];
        }
      } catch (error) {
        console.error('Error fetching public playlists:', error);
        // Continue with empty public playlists
      }
      
      // Fetch user's personal playlists if authenticated
      if (isAuthenticated) {
        try {
          userPlaylists = await getUserPlaylists();
        } catch (error) {
          console.error('Error fetching user playlists:', error);
          // Continue with empty user playlists
        }
      }
      
      // Combine both sets of playlists (prefer user playlists to avoid duplicates)
      let allPlaylists = [...publicPlaylists];
      
      // Add user playlists that aren't already in public playlists
      for (const userPlaylist of userPlaylists) {
        if (!allPlaylists.some(pl => pl._id === userPlaylist._id)) {
          allPlaylists.push(userPlaylist);
        }
      }
      
      // Structure the response like the API response
      const data = { playlists: allPlaylists };
      
      console.log('Fetched public playlists:', publicPlaylists.length, 'and user playlists:', userPlaylists.length);
      
      // Filter out default/mock playlists
      const filteredPlaylists = (data.playlists || []).filter((playlist: Playlist) => {
        // Exclude default/favorite playlists (more specific matching)
        const lowerName = playlist.name.toLowerCase();
        return !(lowerName.includes('favorite') && lowerName.includes('playlist')) && 
               !lowerName.includes('dox ') && !lowerName.includes('dox_') &&
               !lowerName.startsWith('dox') &&
               playlist.name.toLowerCase() !== 'default' && 
               playlist.name.toLowerCase() !== 'mock';
      });
      setPlaylists(filteredPlaylists);
    } catch (err: any) {
      console.error('Error fetching playlists:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortPlaylists = () => {
    let filtered = [...playlists]
    
    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(playlist => {
        const isMuzikaX = playlist.userId?.name === 'admin' || 
                         playlist.userId?.name?.toLowerCase().includes('muzikax');
        const isMine = user && (playlist.userId?._id === user.id || (playlist as any).userId === user.id);
        
        if (filterType === 'mine') return isMine;
        if (filterType === 'muzikax') return isMuzikaX;
        if (filterType === 'other') return !isMine && !isMuzikaX;
        return true;
      });
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim()
      filtered = filtered.filter(playlist => 
        playlist.name.toLowerCase().includes(query) ||
        playlist.description.toLowerCase().includes(query) ||
        playlist.userId?.name?.toLowerCase().includes(query) ||
        playlist.tracks.some(track => 
          track.title.toLowerCase().includes(query) ||
          track.creatorId?.name?.toLowerCase().includes(query)
        )
      )
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      // Recommendation sort (MuzikaX first, then by plays/recent)
      const isMuzikaXA = a.userId?.name === 'admin' || a.userId?.name?.toLowerCase().includes('muzikax');
      const isMuzikaXB = b.userId?.name === 'admin' || b.userId?.name?.toLowerCase().includes('muzikax');
      
      if (sortBy === 'recommended') {
        if (isMuzikaXA && !isMuzikaXB) return -1;
        if (!isMuzikaXA && isMuzikaXB) return 1;
        // If both are MuzikaX or both are not, fall through to default sort (recent)
      }

      switch (sortBy) {
        case 'popular':
          return b.tracks.reduce((sum, track) => sum + (track.plays || 0), 0) - 
                 a.tracks.reduce((sum, track) => sum + (track.plays || 0), 0)
        case 'tracks':
          return b.tracks.length - a.tracks.length
        case 'recent':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })
    
    setFilteredPlaylists(filtered)
  }

  const handlePlayPlaylist = async (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      // Since the playlist tracks might not have audio URLs, we need to fetch complete track details
      // We'll build the player tracks with available info and try to enhance with full track data
      
      // Build initial player tracks with available data
      const playerTracks: any[] = [];
      
      for (const track of playlist.tracks) {
        // Try to get audio URL from the available track data
        let audioUrl = track.audioURL || track.audioUrl || track.url || track.audio || track.src || '';
        
        // If no audio URL is available in the playlist track data, we need to fetch it
        if (!audioUrl) {
          try {
            // Import the track service function
            const { fetchTrackById } = await import('../../services/trackService');
            // Fetch the complete track data by ID to get the audio URL
            const fullTrack = await fetchTrackById(track._id);
            audioUrl = fullTrack.audioURL || '';
          } catch (error) {
            console.error('Error fetching full track data:', error);
          }
        }
        
        // Only add to player tracks if we have an audio URL
        if (audioUrl && audioUrl.trim() !== '') {
          playerTracks.push({
            id: track._id,
            title: track.title || 'Unknown Title',
            artist: playlist.userId?.name === 'admin' || playlist.userId?.name?.toLowerCase().includes('muzikax') ? 'MuzikaX' : track.creatorId?.name || 'MuzikaX', // Use 'MuzikaX' for admin playlists
            coverImage: track.coverURL || track.coverImage || '',
            audioUrl: audioUrl,
            creatorId: (track.creatorId as any)?._id || '',
            type: 'song' as const
          });
        }
      }
      
      if (playerTracks.length > 0) {
        // Set the current playlist
        setCurrentPlaylist(playerTracks)
        
        // Play the first track
        playTrack(playerTracks[0], playerTracks)
      }
    }
  }
  
  const handleSharePlaylist = async (playlist: Playlist) => {
    try {
      // Create a shareable link
      const shareUrl = `${window.location.origin}/playlists#${playlist._id}`;
      const shareText = `Check out this playlist: ${playlist.name} by ${playlist.userId?.name || 'MuzikaX'} on MuzikaX!`;
      
      // Try to use the Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: playlist.name,
          text: shareText,
          url: shareUrl
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Playlist link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing playlist:', error);
      // Fallback: copy to clipboard
      try {
        const shareUrl = `${window.location.origin}/playlists#${playlist._id}`;
        const shareText = `Check out this playlist: ${playlist.name} by ${playlist.userId?.name || 'MuzikaX'} on MuzikaX!`;
        await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
        alert('Playlist link copied to clipboard!');
      } catch (copyError) {
        console.error('Error copying to clipboard:', copyError);
      }
    }
  }
  
  const handlePlayFromTrack = async (playlist: Playlist, startIndex: number) => {
    // Build the full playlist with audio URLs
    const playerTracks: any[] = [];
    
    for (let i = 0; i < playlist.tracks.length; i++) {
      const track = playlist.tracks[i];
      
      // Try to get audio URL from the available track data
      let audioUrl = track.audioURL || track.audioUrl || track.url || track.audio || track.src || '';
      
      // If no audio URL is available in the playlist track data, we need to fetch it
      if (!audioUrl) {
        try {
          // Fetch the complete track data by ID to get the audio URL
          // Import the track service function
          const { fetchTrackById } = await import('../../services/trackService');
          const fullTrack = await fetchTrackById(track._id);
          audioUrl = fullTrack.audioURL || '';
        } catch (error) {
          console.error('Error fetching full track data:', error);
        }
      }
      
      // Only add to player tracks if we have an audio URL
      if (audioUrl) {
        playerTracks.push({
          id: track._id,
          title: track.title || 'Unknown Title',
          artist: playlist.userId?.name === 'admin' || playlist.userId?.name?.toLowerCase().includes('muzikax') ? 'MuzikaX' : track.creatorId?.name || 'MuzikaX', // Use 'MuzikaX' for admin playlists
          coverImage: track.coverURL || track.coverImage || '',
          audioUrl: audioUrl,
          creatorId: (track.creatorId as any)?._id || '',
          type: 'song' as const
        });
      }
    }
    
    if (playerTracks.length > 0 && startIndex < playerTracks.length) {
      // Set the current playlist
      setCurrentPlaylist(playerTracks);
      
      // Play from the selected track
      playTrack(playerTracks[startIndex], playerTracks);
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getTotalPlays = (playlist: Playlist) => {
    return playlist.tracks.reduce((sum, track) => sum + (track.plays || 0), 0)
  }
  
  const handleDeletePlaylist = async (playlistId: string, playlistName: string) => {
    if (!confirm(`Are you sure you want to delete the playlist "${playlistName}"? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const result = await deletePlaylist(playlistId);
      if (result) {
        // Remove the deleted playlist from the state
        setPlaylists(playlists.filter(p => p._id !== playlistId));
        setFilteredPlaylists(filteredPlaylists.filter(p => p._id !== playlistId));
        alert('Playlist deleted successfully!');
      } else {
        alert('Failed to delete playlist. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('An error occurred while deleting the playlist. Please try again.');
    }
  };
  
  const handleAddTrackToPlaylist = async (track: PlaylistTrack) => {
    if (!isAuthenticated) {
      alert('Please log in to add tracks to playlists');
      router.push('/login');
      return;
    }
    
    setSelectedTrackToAdd(track);
    setShowAddToPlaylistModal(true);
  };
  
  const handleConfirmAddToPlaylist = async (playlistId: string) => {
    if (!selectedTrackToAdd) return;
    
    setAddingTrackId(selectedTrackToAdd._id);
    
    try {
      const result = await addTrackToPlaylist(playlistId, selectedTrackToAdd._id);
      if (result) {
        alert('Track added to playlist successfully!');
        setShowAddToPlaylistModal(false);
        setSelectedTrackToAdd(null);
      } else {
        alert('Failed to add track to playlist. Please try again.');
      }
    } catch (error) {
      console.error('Error adding track to playlist:', error);
      alert('An error occurred while adding track to playlist');
    } finally {
      setAddingTrackId(null);
    }
  };
  
  const [trackSearchQuery, setTrackSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaylistTrack[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // Function to search for tracks
  const searchTracks = async () => {
    if (!trackSearchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setSearchLoading(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${encodeURIComponent(trackSearchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        // Transform the search result tracks to match the expected structure
        const transformedTracks = (data.tracks || []).map((track: any) => ({

          _id: track.id,
          title: track.title,
          creatorId: {
            name: track.artist
          },
          coverURL: track.coverImage,
          audioURL: track.audioURL,
          plays: track.plays
        }));
        setSearchResults(transformedTracks);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching tracks:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };
  
  // Function to toggle track selection for new playlist
  const toggleTrackSelection = (track: PlaylistTrack) => {
    setSelectedTracksForNewPlaylist(prev => {
      const isSelected = prev.some(t => t._id === track._id);
      if (isSelected) {
        return prev.filter(t => t._id !== track._id);
      } else {
        return [...prev, track];  
      }
    });
  };
  
  const createPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      alert('Playlist name is required');
      return;
    }
    
    if (selectedTracksForNewPlaylist.length === 0) {
      alert('Please select at least one track for your playlist');
      return;
    }
    
    setCreatingPlaylist(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          name: newPlaylistName,
          description: newPlaylistDescription,
          isPublic: newPlaylistPublic,
          trackIds: selectedTracksForNewPlaylist.map(track => track._id)
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create playlist');
      }
      
      const data = await response.json();
      alert('Playlist created successfully!');
      setShowCreateModal(false);
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setNewPlaylistPublic(true);
      setSelectedTracksForNewPlaylist([]);
      
      // Optionally refresh the playlists list
      fetchPlaylists();
    } catch (error: any) {
      console.error('Error creating playlist:', error);
      alert(`Error creating playlist: ${error.message}`);
    } finally {
      setCreatingPlaylist(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen py-8 sm:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen py-8 sm:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">Error loading playlists</div>
            <button 
              onClick={fetchPlaylists}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 overflow-x-hidden relative bg-background">
      {/* Animated background gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/15 rounded-full blur-[120px] animate-pulse -z-10"></div>
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-primary-light/10 rounded-full blur-[120px] animate-pulse delay-1000 -z-10"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-primary/5 to-primary-light/5 rounded-full blur-[150px] -z-10"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl pt-20 sm:pt-16 md:pt-12 lg:pt-8">
        {/* Modern Header with Gradient Background */}
        <div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-light/20 rounded-2xl sm:rounded-3xl blur-xl -z-10"></div>
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 lg:p-10">
            <div className="flex flex-col gap-4 sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-2 sm:space-y-3 w-full">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black drop-shadow-lg leading-tight text-text-primary">
                  Your Playlists
                </h1>
                <p className="text-gray-300 text-sm sm:text-base md:text-lg leading-relaxed">
                  Curate your musical journey • Create, share & discover playlists
                </p>
              </div>
              <button 
                onClick={() => {
                  if (isAuthenticated) {
                    setShowCreateModal(true);
                  } else {
                    router.push('/login');
                  }
                }}
                className="group relative px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary-light text-white font-bold rounded-xl sm:rounded-2xl transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-primary/30 hover:scale-105 active:scale-95 min-w-fit overflow-hidden whitespace-nowrap"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Create Playlist
                </span>
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Modern Search and Filters Card */}
        <div className="card-bg rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Modern Filter Tabs with Pill Design */}
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {[
                { id: 'all', label: 'All' },
                ...(isAuthenticated ? [{ id: 'mine', label: 'My Playlists' }] : []),
                { id: 'muzikax', label: 'MuzikaX Picks' },
                { id: 'other', label: 'Community' }
              ].map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => setFilterType(filter.id)}
                  className={`group relative px-3 sm:px-4 md:px-6 py-2 sm:py-3 rounded-full text-xs sm:text-sm font-bold transition-all duration-300 whitespace-nowrap ${
                    filterType === filter.id 
                      ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-xl shadow-primary/30 scale-105' 
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10'
                  }`}
                >
                  <span className="flex items-center gap-1 sm:gap-2">
                    {filter.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Modern Search and Sort Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Modern Search Input */}
              <div className="md:col-span-2">
                <label htmlFor="search" className="block text-xs sm:text-sm font-bold text-gray-300 mb-2">
                  Search Playlists
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    id="search"
                    placeholder="Search by playlist name, creator, or tracks..."
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all group-hover:bg-white/10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-500 group-hover:text-primary transition-colors">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                </div>
              </div>
              
              {/* Modern Sort Dropdown */}
              <div>
                <label htmlFor="sort" className="block text-xs sm:text-sm font-bold text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  id="sort"
                  className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-white/5 border border-white/20 rounded-xl sm:rounded-2xl text-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all cursor-pointer appearance-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23FF4D67'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.75rem center',
                    backgroundSize: '1em 1em',
                    paddingRight: '2.5rem'
                  }}
                >
                  <option value="recommended">Recommended</option>
                  <option value="recent">Most Recent</option>
                  <option value="popular">Most Popular</option>
                  <option value="tracks">Most Tracks</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Info with Modern Badge */}
        <div className="mb-6 sm:mb-8 flex justify-between items-center">
          <div className="inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-primary/20 to-primary-light/20 border border-primary/30 rounded-full backdrop-blur-sm">
            <p className="text-gray-200 font-semibold text-xs sm:text-sm md:text-base">
              Showing <span className="text-primary font-bold">{filteredPlaylists.length}</span> playlists
            </p>
          </div>
        </div>

        {/* Playlists Grid */}
        {/* Empty State with Modern Design */}
        {filteredPlaylists.length === 0 ? (
          <div className="card-bg rounded-2xl sm:rounded-3xl p-8 sm:p-12 md:p-16 text-center backdrop-blur-xl bg-white/5 border border-white/10 shadow-2xl">
            <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center mb-6 sm:mb-8 border-2 border-primary/30">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
              </svg>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-text-primary">No playlists found</h3>
            <p className="text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base md:text-lg">
              {searchQuery ? 'Try adjusting your search terms or filters' : 'Be the first to create an amazing playlist!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary-light text-white font-bold rounded-xl sm:rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:scale-105 text-sm sm:text-base"
              >
                Create Your First Playlist
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Modern Playlists Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
            {filteredPlaylists.map((playlist) => (
              <div 
                key={playlist._id} 
                className="group relative rounded-2xl sm:rounded-3xl p-4 sm:p-5 cursor-pointer overflow-hidden mx-surface"
                onClick={() => handlePlayPlaylist(playlist)}
              >
                {/* Animated gradient border on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary-light/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10 blur-xl"></div>
                
                {/* Playlist Cover */}
                <div className="relative mb-4 sm:mb-5 rounded-xl sm:rounded-2xl overflow-hidden bg-gray-900/50 aspect-square shadow-xl">
                  {playlist.tracks.length > 0 && playlist.tracks[0]?.coverURL ? (
                    <img 
                      src={playlist.tracks[0].coverURL}
                      alt={playlist.name}
                      className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-primary via-primary-hover to-primary-light flex items-center justify-center">
                      <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                      </svg>
                    </div>
                  )}
                  
                  {/* Play Overlay with Gradient */}
                  <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                    <div className="mx-card-play !static [&_svg]:w-4 [&_svg]:h-4 [&_svg]:text-black">
                      <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white ml-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Track Count Badge with Modern Design */}
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 bg-black/80 backdrop-blur-md text-white text-xs font-bold px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-white/20 whitespace-nowrap">
                    🎵 {playlist.tracks.length} tracks
                  </div>
                  
                  {/* Owner Actions */}
                  {user && playlist.userId._id === user.id && (
                    <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-1.5 sm:gap-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/playlists/${playlist._id}`);
                        }}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-blue-600/90 backdrop-blur-md flex items-center justify-center hover:bg-blue-500 transition-all hover:scale-110"
                        aria-label="Edit playlist"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlaylist(playlist._id, playlist.name);
                        }}
                        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-red-600/90 backdrop-blur-md flex items-center justify-center hover:bg-red-500 transition-all hover:scale-110"
                        aria-label="Delete playlist"
                      >
                        <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                  
                  {/* Share Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSharePlaylist(playlist);
                    }}
                    className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center hover:bg-primary transition-all hover:scale-110"
                    aria-label="Share playlist"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  
                  {/* View Tracks Button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPlaylist(playlist);
                      setShowTracksModal(true);
                    }}
                    className="absolute bottom-2 sm:bottom-3 right-12 sm:right-14 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/70 backdrop-blur-md flex items-center justify-center hover:bg-primary-light hover:text-black transition-all hover:scale-110"
                    aria-label="View tracks"
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
                
                {/* Playlist Info */}
                <div className="space-y-2 sm:space-y-3">
                  <div>
                    <h3 className="font-bold text-base sm:text-lg mb-1 truncate group-hover:text-primary transition-colors text-text-primary">
                      {playlist.name}
                    </h3>
                    <p className="text-gray-400 text-xs sm:text-sm font-medium">
                      by <span className="text-primary-light">{playlist.userId?.name === 'admin' ? 'MuzikaX' : (playlist.userId?.name || 'MuzikaX')}</span>
                    </p>
                  </div>
                  {playlist.description && (
                    <p className="text-gray-500 text-xs sm:text-sm line-clamp-2 leading-relaxed">
                      {playlist.description}
                    </p>
                  )}
                </div>
                
                {/* Stats with Modern Design */}
                <div className="flex justify-between items-center text-xs pt-3 sm:pt-4 mt-3 sm:mt-4 border-t border-white/10">
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-semibold text-xs sm:text-sm">{getTotalPlays(playlist).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                    </svg>
                    <span className="text-xs sm:text-sm">{formatDate(playlist.createdAt)}</span>
                  </div>
                </div>
              </div>
            ))}
            </div>
          </>
        )}
      </div>
      
      {/* Create Playlist Modal with Modern Design */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-background to-black rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-primary-light/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex justify-between items-center mb-8 relative">
              <h3 className="text-2xl font-bold text-text-primary">
                ✨ Create New Playlist
              </h3>
              <button 
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                  setNewPlaylistPublic(true);
                }}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="space-y-6 relative">
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  🎵 Playlist Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Enter playlist name"
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:bg-white/10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-300 mb-2">
                  📝 Description
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  placeholder="Tell people about your playlist..."
                  rows={3}
                  className="w-full px-5 py-3.5 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:bg-white/10 resize-none"
                />
              </div>
              
              <div className="flex items-center p-4 bg-white/5 rounded-2xl border border-white/10">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newPlaylistPublic}
                  onChange={(e) => setNewPlaylistPublic(e.target.checked)}
                  className="w-5 h-5 text-primary bg-gray-800 border-gray-700 rounded focus:ring-primary cursor-pointer"
                />
                <label htmlFor="isPublic" className="ml-3 text-sm text-gray-300 cursor-pointer select-none">
                  🌍 Make this playlist public and shareable
                </label>
              </div>
              
              {/* Selected Tracks Preview */}
              <div className="pt-2">
                <div className="flex justify-between items-center mb-3">
                  <label className="block text-sm font-bold text-gray-300">🎶 Selected Tracks</label>
                  <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">{selectedTracksForNewPlaylist.length} tracks</span>
                </div>
                
                {selectedTracksForNewPlaylist.length > 0 ? (
                  <div className="max-h-40 overflow-y-auto bg-white/5 rounded-2xl p-3 border border-white/10">
                    {selectedTracksForNewPlaylist.map((track, index) => (
                      <div key={track._id} className="flex items-center justify-between py-2.5 px-3 hover:bg-white/10 rounded-xl transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="text-primary-light font-bold text-xs w-5">{(index + 1).toString().padStart(2, '0')}.</span>
                          <span className="text-sm text-white truncate max-w-[180px] font-medium">{track.title}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => toggleTrackSelection(track)}
                          className="text-red-400 hover:text-red-300 p-1.5 hover:bg-red-500/20 rounded-full transition-all"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500 text-sm bg-white/5 rounded-2xl border border-white/10">
                    🎵 No tracks selected yet
                  </div>
                )}
                
                <button
                  type="button"
                  onClick={() => setShowTrackSelector(true)}
                  className="mt-3 w-full py-3.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-2xl transition-all border border-white/10 hover:border-primary/50"
                >
                  {selectedTracksForNewPlaylist.length > 0 ? '➕ Add More Tracks' : '🎵 Select Tracks'}
                </button>
              </div>
            </div>
            
            <div className="flex space-x-4 mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewPlaylistName('');
                  setNewPlaylistDescription('');
                  setNewPlaylistPublic(true);
                  setSelectedTracksForNewPlaylist([]);
                }}
                className="flex-1 px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-white/10"
              >
                Cancel
              </button>
              <button
                onClick={createPlaylist}
                disabled={creatingPlaylist || selectedTracksForNewPlaylist.length === 0}
                className="flex-1 px-6 py-3.5 bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary-light text-white font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creatingPlaylist ? '⏳ Creating...' : `✨ Create (${selectedTracksForNewPlaylist.length} tracks)`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Tracks Modal with Modern Design */}
      {showTracksModal && selectedPlaylist && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-background to-black rounded-3xl w-full max-w-sm sm:max-w-lg md:max-w-2xl border border-white/10 shadow-2xl max-h-[85vh] flex flex-col relative overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-primary-light/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="p-6 sm:p-8 pb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl sm:text-2xl font-bold truncate text-text-primary">{selectedPlaylist.name} Tracks</h3>
                <button 
                  onClick={() => {
                    setShowTracksModal(false);
                    setSelectedPlaylist(null);
                  }}
                  className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 pb-6">
              <div className="space-y-3">
                {selectedPlaylist.tracks.map((track, index) => (
                  <div 
                    key={track._id}
                    className="flex items-center p-4 rounded-2xl group mx-surface"
                  >
                    <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden mr-4 shadow-lg">
                      {track.coverURL ? (
                        <img 
                          src={track.coverURL} 
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                          <svg className="w-6 h-6 sm:w-7 sm:h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => {
                        handlePlayFromTrack(selectedPlaylist, index);
                        setShowTracksModal(false);
                        setSelectedPlaylist(null);
                      }}
                    >
                      <h4 className="font-bold text-white truncate text-sm sm:text-base group-hover:text-primary transition-colors">{track.title}</h4>
                      <p className="text-xs sm:text-sm text-gray-400 truncate">
                        by {selectedPlaylist.userId?.name === 'admin' || selectedPlaylist.userId?.name?.toLowerCase().includes('muzikax') ? 'MuzikaX' : track.creatorId?.name || 'MuzikaX'}
                      </p>
                    </div>
                    <div className="ml-4 text-xs text-primary-light font-bold mr-3 bg-primary-light/10 px-3 py-1.5 rounded-full">
                      {(index + 1).toString().padStart(2, '0')}
                    </div>
                    {isAuthenticated && (
                      <button
                        onClick={() => handleAddTrackToPlaylist(track)}
                        disabled={addingTrackId === track._id}
                        className="p-3 rounded-full bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary-light text-white transition-all hover:scale-110 disabled:opacity-50 shadow-lg"
                        title="Add to playlist"
                      >
                        {addingTrackId === track._id ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                          </svg>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
            
      {/* Track Selector Modal with Modern Design */}
      {showTrackSelector && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-background to-black rounded-3xl w-full max-w-2xl border border-white/10 shadow-2xl max-h-[85vh] flex flex-col relative overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-primary-light/10 rounded-full blur-3xl -z-10"></div>
                  
            <div className="p-8 pb-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text-primary">Select Tracks for Playlist</h3>
                <button 
                  onClick={() => {
                    setShowTrackSelector(false);
                  }}
                  className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
                >
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
                    
              {/* Search Bar */}
              <div className="mb-5">
                <div className="relative">
                  <input
                    type="text"
                    value={trackSearchQuery}
                    onChange={(e) => setTrackSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchTracks()}
                    placeholder="Search tracks by title, artist..."
                    className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all hover:bg-white/10"
                  />
                  <button
                    onClick={searchTracks}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary-light text-white rounded-xl transition-all hover:scale-105"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </button>
                </div>
              </div>
                    
              {/* Selected Tracks Summary */}
              <div className="mb-5 p-4 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-2xl border border-primary/30">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-300">🎶 Selected Tracks</span>
                  <span className="text-sm font-bold text-primary bg-primary/20 px-4 py-1.5 rounded-full">{selectedTracksForNewPlaylist.length} tracks</span>
                </div>
              </div>
            </div>
                  
            <div className="flex-1 overflow-y-auto px-8 pb-4">
              <div className="space-y-3">
                {(trackSearchQuery ? searchResults : selectedTracksForNewPlaylist).map((track) => (
                  <div 
                    key={track._id}
                    className={`flex items-center p-4 rounded-2xl transition-all border ${
                      selectedTracksForNewPlaylist.some(t => t._id === track._id) 
                        ? 'bg-gradient-to-r from-primary/20 to-primary-light/20 border-primary/50 shadow-lg shadow-primary/20' 
                        : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-primary/30'
                    }`}
                  >
                    <div className="flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden mr-4 shadow-lg">
                      {track.coverURL ? (
                        <img 
                          src={track.coverURL} 
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-white truncate">{track.title}</h4>
                      <p className="text-xs text-gray-400 truncate">
                        by {track.creatorId?.name || 'Unknown Artist'}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleTrackSelection(track)}
                      className={`p-3 rounded-full transition-all hover:scale-110 ${
                        selectedTracksForNewPlaylist.some(t => t._id === track._id) 
                          ? 'bg-gradient-to-r from-primary to-primary-light text-white shadow-lg' 
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      {selectedTracksForNewPlaylist.some(t => t._id === track._id) ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
                          
              {trackSearchQuery && searchResults.length === 0 && !searchLoading && (
                <div className="text-center py-8 text-gray-500">
                  😕 No tracks found for "{trackSearchQuery}".
                </div>
              )}
                          
              {!trackSearchQuery && selectedTracksForNewPlaylist.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  🎵 No tracks selected yet. Search and add tracks to your playlist.
                </div>
              )}
                          
              {searchLoading && (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
                        
            <div className="p-8 pt-4">
              <button
                onClick={() => {
                  setShowTrackSelector(false);
                }}
                className="w-full px-6 py-4 bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary-light text-white font-bold rounded-2xl transition-all shadow-xl hover:shadow-2xl hover:shadow-primary/30"
              >
                ✅ Done ({selectedTracksForNewPlaylist.length} tracks)
              </button>
            </div>
          </div>
        </div>
      )}
            
      {/* Add to Playlist Modal with Modern Design */}
      {showAddToPlaylistModal && selectedTrackToAdd && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 via-background to-black rounded-3xl p-8 w-full max-w-md border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Background gradient effect */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-primary/10 to-primary-light/10 rounded-full blur-3xl -z-10"></div>
            
            <div className="flex justify-between items-center mb-8 relative">
              <h3 className="text-2xl font-bold text-text-primary">
                ➕ Add to Playlist
              </h3>
              <button 
                onClick={() => {
                  setShowAddToPlaylistModal(false);
                  setSelectedTrackToAdd(null);
                }}
                className="text-gray-400 hover:text-white p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4 font-semibold">Select a playlist to add:</p>
              <div className="p-4 bg-gradient-to-r from-primary/10 to-primary-light/10 rounded-2xl border border-primary/30">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden shadow-lg">
                    {selectedTrackToAdd.coverURL ? (
                      <img 
                        src={selectedTrackToAdd.coverURL} 
                        alt={selectedTrackToAdd.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                        <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white truncate">{selectedTrackToAdd.title}</h4>
                    <p className="text-sm text-gray-400 truncate">
                      by {selectedTrackToAdd.creatorId?.name || 'MuzikaX'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 max-h-64 overflow-y-auto mb-8 pr-2 custom-scrollbar">
              {playlists.filter(pl => pl.userId?._id === user?.id).length > 0 ? (
                playlists
                  .filter(pl => pl.userId?._id === user?.id)
                  .map((playlist) => (
                    <button
                      key={playlist._id}
                      onClick={() => handleConfirmAddToPlaylist(playlist._id)}
                      disabled={addingTrackId === selectedTrackToAdd._id}
                      className="w-full text-left p-4 rounded-2xl disabled:opacity-50 group mx-surface"
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center group-hover:scale-105 transition-transform">
                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                            </svg>
                          </div>
                          <div>
                            <h4 className="font-bold text-white group-hover:text-primary transition-colors">{playlist.name}</h4>
                            <p className="text-xs text-gray-400">{playlist.tracks.length} tracks</p>
                          </div>
                        </div>
                        {addingTrackId === selectedTrackToAdd._id && (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        )}
                      </div>
                    </button>
                  ))
              ) : (
                <div className="text-center py-10 bg-white/5 rounded-2xl border border-white/10">
                  <div className="mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-primary-light/20 flex items-center justify-center mb-4 border-2 border-primary/30">
                    <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                    </svg>
                  </div>
                  <p className="text-gray-400 mb-6">You don't have any playlists yet</p>
                  <button
                    onClick={() => {
                      setShowAddToPlaylistModal(false);
                      setSelectedTrackToAdd(null);
                      setShowCreateModal(true);
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-primary to-primary-light hover:from-primary-hover hover:to-primary-light text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl"
                  >
                    ✨ Create New Playlist
                  </button>
                </div>
              )}
            </div>
            
            <button
              onClick={() => {
                setShowAddToPlaylistModal(false);
                setSelectedTrackToAdd(null);
              }}
              className="w-full px-6 py-3.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all border border-white/10"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

