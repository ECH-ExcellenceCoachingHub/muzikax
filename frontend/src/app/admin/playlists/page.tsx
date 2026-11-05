'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../../contexts/AuthContext'


interface Track {
  _id: string
  id: string
  title: string
  creatorId: {
    name: string
  }
  genre: string
  type: string
  plays: number
  createdAt: string
  coverURL?: string
}

interface PlaylistTrack extends Track {
  order: number
}

export default function AdminPlaylistMaker() {
  const { isAuthenticated, userRole } = useAuth()
  
  // Form states
  const [playlistName, setPlaylistName] = useState('')
  const [playlistDescription, setPlaylistDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  
  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchGenre, setSearchGenre] = useState('all')
  const [searchType, setSearchType] = useState('all')
  const [searchResults, setSearchResults] = useState<Track[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  
  // Playlist creation states
  const [selectedTracks, setSelectedTracks] = useState<PlaylistTrack[]>([])
  const [creating, setCreating] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  
  // Genres and types for dropdowns
  const genres = ['all', 'afrobeat', 'hip-hop', 'r&b', 'afropop', 'gospel', 'dancehall', 'reggae', 'pop', 'rock', 'electronic']
  const types = ['all', 'song', 'beat', 'mix']


  // Search tracks function
  const searchTracks = async () => {
    // Don't search if no criteria provided
    if (!searchQuery.trim() && searchGenre === 'all' && searchType === 'all') {
      setSearchResults([])
      return
    }
    
    setSearchLoading(true)
    setErrorMessage('')
    
    try {
      const queryParams = new URLSearchParams()
      
      // Always include query if provided
      if (searchQuery.trim()) {
        queryParams.append('query', searchQuery.trim())
      }
      
      // Include filters
      if (searchGenre !== 'all') {
        queryParams.append('genre', searchGenre)
      }
      
      if (searchType !== 'all') {
        queryParams.append('type', searchType)
      }
      
      queryParams.append('limit', '100') // Increase limit for better results
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/playlists/search-tracks?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      )
      
      if (!response.ok) {
        throw new Error('Failed to search tracks')
      }
      
      const tracks = await response.json()
      setSearchResults(tracks)
    } catch (error) {
      console.error('Error searching tracks:', error)
      setErrorMessage('Failed to search tracks. Please try again.')
      setSearchResults([])
    } finally {
      setSearchLoading(false)
    }
  }

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    searchTracks()
  }

  // Auto-search when filters change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim() || searchGenre !== 'all' || searchType !== 'all') {
        searchTracks()
      } else {
        setSearchResults([])
      }
    }, 500) // Debounce search by 500ms
    
    return () => clearTimeout(timer)
  }, [searchQuery, searchGenre, searchType])

  // Add track to playlist
  const addTrackToPlaylist = (track: Track) => {
    if (selectedTracks.some(t => t._id === track._id)) {
      return // Already added
    }
    
    const newTrack: PlaylistTrack = {
      ...track,
      order: selectedTracks.length + 1
    }
    
    setSelectedTracks([...selectedTracks, newTrack])
  }

  // Remove track from playlist
  const removeTrackFromPlaylist = (trackId: string) => {
    const updatedTracks = selectedTracks
      .filter(t => t._id !== trackId)
      .map((track, index) => ({
        ...track,
        order: index + 1
      }))
    
    setSelectedTracks(updatedTracks)
  }

  // Reorder tracks (drag and drop simulation)
  const reorderTracks = (fromIndex: number, toIndex: number) => {
    const updatedTracks = [...selectedTracks]
    const [movedTrack] = updatedTracks.splice(fromIndex, 1)
    updatedTracks.splice(toIndex, 0, movedTrack)
    
    // Update order numbers
    const reorderedTracks = updatedTracks.map((track, index) => ({
      ...track,
      order: index + 1
    }))
    
    setSelectedTracks(reorderedTracks)
  }

  // Create playlist
  const createPlaylist = async () => {
    if (!playlistName.trim()) {
      setErrorMessage('Playlist name is required')
      return
    }
    
    if (selectedTracks.length === 0) {
      setErrorMessage('Please add at least one track to the playlist')
      return
    }
    
    setCreating(true)
    setErrorMessage('')
    setSuccessMessage('')
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/playlists`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          name: playlistName.trim(),
          description: playlistDescription.trim(),
          isPublic,
          trackIds: selectedTracks.map(t => t._id)
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create playlist')
      }
      
      const result = await response.json()
      setSuccessMessage(`Playlist "${result.playlist.name}" created successfully!`)
      
      // Reset form
      setPlaylistName('')
      setPlaylistDescription('')
      setIsPublic(true)
      setSelectedTracks([])
      setSearchResults([])
      setSearchQuery('')
      setSearchGenre('all')
      setSearchType('all')
      
    } catch (error: any) {
      console.error('Error creating playlist:', error)
      setErrorMessage(error.message || 'Failed to create playlist')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="w-full">

          {successMessage && (
            <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
              <p className="text-green-400">{successMessage}</p>
            </div>
          )}

          {errorMessage && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-400">{errorMessage}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Column - Search and Track Selection */}
            <div className="space-y-6">
              {/* Search Form */}
              <div className="card-bg rounded-2xl p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-white">Find Tracks</h2>
                  {(searchQuery || searchGenre !== 'all' || searchType !== 'all') && (
                    <button
                      onClick={() => {
                        setSearchQuery('')
                        setSearchGenre('all')
                        setSearchType('all')
                      }}
                      className="text-xs px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="search-query" className="block text-sm font-medium text-gray-400 mb-1">
                      Search by Title or Description
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        id="search-query"
                        placeholder="Enter track title, artist, or keywords..."
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary pr-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="genre-filter" className="block text-sm font-medium text-gray-400 mb-1">
                        Filter by Genre
                      </label>
                      <select
                        id="genre-filter"
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchGenre}
                        onChange={(e) => setSearchGenre(e.target.value)}
                      >
                        <option value="all">All Genres</option>
                        {genres.filter(g => g !== 'all').map(genre => (
                          <option key={genre} value={genre}>
                            {genre.charAt(0).toUpperCase() + genre.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label htmlFor="type-filter" className="block text-sm font-medium text-gray-400 mb-1">
                        Filter by Type
                      </label>
                      <select
                        id="type-filter"
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                        value={searchType}
                        onChange={(e) => setSearchType(e.target.value)}
                      >
                        <option value="all">All Types</option>
                        {types.filter(t => t !== 'all').map(type => (
                          <option key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="pt-2 text-xs text-gray-500 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Search updates automatically as you type. Results appear below.</span>
                  </div>
                </div>
              </div>

              {/* Search Results */}
              <div className="card-bg rounded-2xl p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">
                    Search Results {searchResults.length > 0 && `(${searchResults.length})`}
                  </h3>
                  {searchResults.length > 0 && (
                    <button
                      onClick={() => {
                        // Add all visible tracks to playlist
                        searchResults.forEach(track => {
                          if (!selectedTracks.some(t => t._id === track._id)) {
                            addTrackToPlaylist(track)
                          }
                        })
                      }}
                      className="text-xs px-3 py-1 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                    >
                      Add All Visible
                    </button>
                  )}
                </div>
                
                {searchLoading ? (
                  <div className="flex justify-center items-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : searchResults.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <p className="text-gray-500">{searchQuery || searchGenre !== 'all' || searchType !== 'all' ? 'No tracks found matching your criteria' : 'Search for tracks to add to your playlist'}</p>
                    <p className="text-sm mt-1">Try adjusting your search terms or filters</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                    {searchResults.map((track) => (
                      <div 
                        key={track._id} 
                        className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-700/50 transition-all duration-200 group border border-transparent hover:border-primary/30"
                      >
                        {/* Track Cover */}
                        {track.coverURL ? (
                          <img 
                            src={track.coverURL} 
                            alt={track.title}
                            className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center flex-shrink-0">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                            </svg>
                          </div>
                        )}
                        
                        {/* Track Info */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate text-sm">{track.title}</h4>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                            <span className="truncate">{track.creatorId?.name || 'Unknown Artist'}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span className="capitalize">{track.genre}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span className="capitalize">{track.type}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                            <span>{track.plays?.toLocaleString() || 0} plays</span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Uploaded: {new Date(track.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        
                        {/* Action Button */}
                        <button
                          onClick={() => addTrackToPlaylist(track)}
                          disabled={selectedTracks.some(t => t._id === track._id)}
                          className={`px-3 py-1.5 text-sm rounded-lg transition-all flex-shrink-0 flex items-center gap-1 ${
                            selectedTracks.some(t => t._id === track._id)
                              ? 'bg-green-900/30 text-green-400 cursor-not-allowed'
                              : 'bg-primary hover:bg-primary/90 text-white hover:scale-105'
                          }`}
                        >
                          {selectedTracks.some(t => t._id === track._id) ? (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                              </svg>
                              Added
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                              </svg>
                              Add
                            </>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Playlist Creation */}
            <div className="space-y-6">
              {/* Playlist Details */}
              <div className="card-bg rounded-2xl p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Create Playlist</h2>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="playlist-name" className="block text-sm font-medium text-gray-400 mb-1">
                      Playlist Name *
                    </label>
                    <input
                      type="text"
                      id="playlist-name"
                      placeholder="Enter playlist name..."
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={playlistName}
                      onChange={(e) => setPlaylistName(e.target.value)}
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="playlist-description" className="block text-sm font-medium text-gray-400 mb-1">
                      Description
                    </label>
                    <textarea
                      id="playlist-description"
                      placeholder="Enter playlist description..."
                      rows={3}
                      className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                      value={playlistDescription}
                      onChange={(e) => setPlaylistDescription(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is-public"
                      className="w-4 h-4 text-primary bg-gray-800 border-gray-700 rounded focus:ring-primary focus:ring-2"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <label htmlFor="is-public" className="ml-2 text-sm text-gray-300">
                      Make this playlist public
                    </label>
                  </div>
                </div>
              </div>

              {/* Selected Tracks */}
              <div className="card-bg rounded-2xl p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-white">
                    Selected Tracks ({selectedTracks.length})
                  </h3>
                  {selectedTracks.length > 0 && (
                    <button
                      onClick={() => setSelectedTracks([])}
                      className="text-sm text-red-500 hover:text-red-400 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                </div>
                
                {selectedTracks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                    </svg>
                    <p>No tracks selected yet</p>
                    <p className="text-sm mt-1">Search and add tracks from the left panel</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {selectedTracks.map((track, index) => (
                      <div 
                        key={`${track._id}-${track.order}`}
                        className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg group"
                      >
                        <div className="text-gray-500 text-sm font-medium w-6">
                          {track.order}
                        </div>
                        
                        {track.coverURL ? (
                          <img 
                            src={track.coverURL} 
                            alt={track.title}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                            </svg>
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-white truncate text-sm">{track.title}</h4>
                          <p className="text-gray-400 text-xs truncate">
                            {track.creatorId?.name || 'Unknown Artist'}
                          </p>
                        </div>
                        
                        <button
                          onClick={() => removeTrackFromPlaylist(track._id)}
                          className="p-1.5 text-gray-500 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                          title="Remove track"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Button */}
              <button
                onClick={createPlaylist}
                disabled={creating || !playlistName.trim() || selectedTracks.length === 0}
                className="w-full py-3 bg-gradient-to-r from-primary to-primary-light hover:opacity-90 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? 'Creating Playlist...' : `Create Playlist (${selectedTracks.length} tracks)`}
              </button>
            </div>
          </div>
        </div>
  )
}
