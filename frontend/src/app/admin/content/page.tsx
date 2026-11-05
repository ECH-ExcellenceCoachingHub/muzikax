'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { useAudioPlayer } from '../../../contexts/AudioPlayerContext'

interface Track {
  id: string
  title: string
  creatorId: {
    _id: string,
    name: string
  }
  genre: string
  type: string
  plays: number
  likes: number
  createdAt: string
  audioURL: string
  coverURL: string
}

export default function ContentManagementPage() {
  const [tracks, setTracks] = useState<Track[]>([])
  const { playTrack } = useAudioPlayer()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [playCountFilter, setPlayCountFilter] = useState('all')
  const [likeCountFilter, setLikeCountFilter] = useState('all')
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all')
  const [genreFilter, setGenreFilter] = useState('all')
  const [creatorTypeFilter, setCreatorTypeFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [trackToDelete, setTrackToDelete] = useState<Track | null>(null)
  const [deletionReason, setDeletionReason] = useState('')
  const router = useRouter()
  const { isAuthenticated, userRole } = useAuth()

  // Access control is handled once in src/app/admin/layout.tsx.
  useEffect(() => {
    fetchTracks()
  }, [currentPage, searchQuery, typeFilter, sortBy, sortOrder, dateFrom, dateTo, playCountFilter, likeCountFilter, paymentTypeFilter, genreFilter, creatorTypeFilter])

  const fetchTracks = async () => {
    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', '10')
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      if (typeFilter !== 'all') {
        params.append('type', typeFilter)
      }
      
      if (sortBy) {
        params.append('sortBy', sortBy)
      }
      
      if (sortOrder) {
        params.append('sortOrder', sortOrder)
      }
      
      if (dateFrom) {
        params.append('dateFrom', dateFrom)
      }
      
      if (dateTo) {
        params.append('dateTo', dateTo)
      }
      
      if (playCountFilter !== 'all') {
        params.append('playCountFilter', playCountFilter)
      }
      
      if (likeCountFilter !== 'all') {
        params.append('likeCountFilter', likeCountFilter)
      }
      
      if (paymentTypeFilter !== 'all') {
        params.append('paymentType', paymentTypeFilter)
      }
      
      if (genreFilter !== 'all') {
        params.append('genre', genreFilter)
      }
      
      if (creatorTypeFilter !== 'all') {
        params.append('creatorType', creatorTypeFilter)
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch tracks')
      }
      
      const data = await response.json()
      // Transform the data to match our interface
      const transformedTracks = data.tracks.map((track: any) => ({
        id: track._id || track.id || '',
        title: track.title || '',
        genre: track.genre || '',
        type: track.type || '',
        plays: track.plays || 0,
        likes: track.likes || 0,
        createdAt: track.createdAt || '',
        audioURL: track.audioURL || track.audioUrl || '',
        coverURL: track.coverURL || track.coverImage || '',
        creatorId: {
          _id: (track.creatorId && typeof track.creatorId === 'object') ? 
            (track.creatorId._id || track.creatorId.id) : 
            track.creatorId,
          name: (track.creatorId && typeof track.creatorId === 'object') ? 
            track.creatorId.name : 
            'Unknown'
        }
      }));
      setTracks(transformedTracks)
      setTotalPages(data.pages)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching tracks:', err)
      setError('Failed to fetch tracks')
      setLoading(false)
    }
  }

  const handleDeleteTrack = async () => {
    if (!trackToDelete) return
    
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackToDelete.id}`);
      url.searchParams.append('reason', encodeURIComponent(deletionReason));
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete track')
      }
      
      // Refresh the track list
      fetchTracks()
      setShowDeleteModal(false)
      setTrackToDelete(null)
      setDeletionReason('') // Clear the reason after successful deletion
    } catch (err) {
      console.error('Error deleting track:', err)
      setError('Failed to delete track')
    }
  }

  const openDeleteModal = (track: Track) => {
    setTrackToDelete(track)
    setShowDeleteModal(true)
  }

  const closeDeleteModal = () => {
    setShowDeleteModal(false)
    setTrackToDelete(null)
  }

  return (
    <div className="w-full">

          {/* Search and Filter Controls */}
          <div className="card-bg rounded-2xl p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-1">
                  Search Tracks
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by title..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Sort By */}
              <div>
                <label htmlFor="sort-by" className="block text-sm font-medium text-gray-400 mb-1">
                  Sort By
                </label>
                <select
                  id="sort-by"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="createdAt">Upload Date</option>
                  <option value="plays">Play Count</option>
                  <option value="likes">Like Count</option>
                  <option value="title">Title</option>
                </select>
              </div>
              
              {/* Sort Order */}
              <div>
                <label htmlFor="sort-order" className="block text-sm font-medium text-gray-400 mb-1">
                  Sort Order
                </label>
                <select
                  id="sort-order"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">Descending</option>
                  <option value="asc">Ascending</option>
                </select>
              </div>
              
              {/* Type Filter */}
              <div>
                <label htmlFor="type-filter" className="block text-sm font-medium text-gray-400 mb-1">
                  Filter by Type
                </label>
                <select
                  id="type-filter"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                >
                  <option value="all">All Types</option>
                  <option value="song">Song</option>
                  <option value="beat">Beat</option>
                  <option value="mix">Mix</option>
                </select>
              </div>
              
              {/* Payment Type Filter */}
              <div>
                <label htmlFor="payment-type-filter" className="block text-sm font-medium text-gray-400 mb-1">
                  Payment Type
                </label>
                <select
                  id="payment-type-filter"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={paymentTypeFilter}
                  onChange={(e) => setPaymentTypeFilter(e.target.value)}
                >
                  <option value="all">All Payment Types</option>
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
              
              {/* Genre Filter */}
              <div>
                <label htmlFor="genre-filter" className="block text-sm font-medium text-gray-400 mb-1">
                  Genre
                </label>
                <select
                  id="genre-filter"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={genreFilter}
                  onChange={(e) => setGenreFilter(e.target.value)}
                >
                  <option value="all">All Genres</option>
                  <option value="afrobeat">Afrobeat</option>
                  <option value="hip-hop">Hip-Hop</option>
                  <option value="pop">Pop</option>
                  <option value="r&b">R&B</option>
                  <option value="dancehall">Dancehall</option>
                  <option value="reggae">Reggae</option>
                  <option value="electronic">Electronic</option>
                  <option value="rock">Rock</option>
                  <option value="jazz">Jazz</option>
                  <option value="traditional">Traditional</option>
                </select>
              </div>
              
              {/* Creator Type Filter */}
              <div>
                <label htmlFor="creator-type-filter" className="block text-sm font-medium text-gray-400 mb-1">
                  Creator Type
                </label>
                <select
                  id="creator-type-filter"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={creatorTypeFilter}
                  onChange={(e) => setCreatorTypeFilter(e.target.value)}
                >
                  <option value="all">All Creator Types</option>
                  <option value="artist">Artist</option>
                  <option value="dj">DJ</option>
                  <option value="producer">Producer</option>
                </select>
              </div>
              
              {/* Play Count Filter */}
              <div>
                <label htmlFor="play-count-filter" className="block text-sm font-medium text-gray-400 mb-1">
                  Play Count
                </label>
                <select
                  id="play-count-filter"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={playCountFilter}
                  onChange={(e) => setPlayCountFilter(e.target.value)}
                >
                  <option value="all">All Play Counts</option>
                  <option value="high">High (&gt;1000 plays)</option>
                  <option value="medium">Medium (100-1000 plays)</option>
                  <option value="low">Low (&lt;100 plays)</option>
                  <option value="new">New (&lt;10 plays)</option>
                </select>
              </div>
              
              {/* Like Count Filter */}
              <div>
                <label htmlFor="like-count-filter" className="block text-sm font-medium text-gray-400 mb-1">
                  Like Count
                </label>
                <select
                  id="like-count-filter"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={likeCountFilter}
                  onChange={(e) => setLikeCountFilter(e.target.value)}
                >
                  <option value="all">All Like Counts</option>
                  <option value="popular">Popular (&gt;100 likes)</option>
                  <option value="moderate">Moderate (10-100 likes)</option>
                  <option value="low">Low (&lt;10 likes)</option>
                </select>
              </div>
              
              {/* Date From */}
              <div>
                <label htmlFor="date-from" className="block text-sm font-medium text-gray-400 mb-1">
                  Uploaded After
                </label>
                <input
                  type="date"
                  id="date-from"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              
              {/* Date To */}
              <div>
                <label htmlFor="date-to" className="block text-sm font-medium text-gray-400 mb-1">
                  Uploaded Before
                </label>
                <input
                  type="date"
                  id="date-to"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>
            
            {/* Reset Filters Button */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setTypeFilter('all');
                  setSortBy('createdAt');
                  setSortOrder('desc');
                  setDateFrom('');
                  setDateTo('');
                  setPlayCountFilter('all');
                  setLikeCountFilter('all');
                  setPaymentTypeFilter('all');
                  setGenreFilter('all');
                  setCreatorTypeFilter('all');
                  setCurrentPage(1);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Reset All Filters
              </button>
            </div>
          </div>

          {/* Tracks Table */}
          <div className="card-bg rounded-2xl p-4 sm:p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-8">{error}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="text-left text-gray-500 text-sm border-b border-gray-800">
                        <th className="pb-4 font-normal whitespace-nowrap">Track</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Creator</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Genre</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Type</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Plays</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Likes</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Uploaded</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {tracks.filter(t => t.id).map((track) => (
                        <tr key={track.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="font-medium text-white max-w-xs truncate">{track.title}</div>
                          </td>
                          <td className="py-4 text-gray-400 max-w-xs truncate">{track.creatorId?.name || 'Unknown'}</td>
                          <td className="py-4 text-gray-400 capitalize whitespace-nowrap">{track.genre}</td>
                          <td className="py-4">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 capitalize whitespace-nowrap">
                              {track.type}
                            </span>
                          </td>
                          <td className="py-4 text-gray-400 whitespace-nowrap">{track.plays.toLocaleString()}</td>
                          <td className="py-4 text-gray-400 whitespace-nowrap">{track.likes.toLocaleString()}</td>
                          <td className="py-4 text-gray-400 whitespace-nowrap">
                            {new Date(track.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => {
                                  // Play the track using the audio player
                                  if (track.id && track.audioURL) {
                                    playTrack({
                                      id: track.id,
                                      title: track.title,
                                      artist: track.creatorId?.name || 'Unknown',
                                      coverImage: track.coverURL,
                                      audioUrl: track.audioURL,
                                      creatorId: track.creatorId?._id,
                                      plays: track.plays,
                                      likes: track.likes,
                                      type: track.type as 'song' | 'beat' | 'mix'
                                    });
                                  }
                                }}
                                disabled={!track.id || !track.audioURL}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors whitespace-nowrap ${track.id && track.audioURL ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                              >
                                Play
                              </button>
                              <button
                                onClick={() => {
                                  if (track.id) {
                                    router.push(`/tracks/${track.id}`);
                                  }
                                }}
                                disabled={!track.id}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors whitespace-nowrap ${track.id ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                              >
                                View
                              </button>
                              <button
                                onClick={() => openDeleteModal(track)}
                                disabled={!track.id}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors whitespace-nowrap ${track.id ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-800">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`w-full sm:w-auto px-4 py-2 rounded-lg ${
                        currentPage === 1 
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      Previous
                    </button>
                    
                    <div className="text-gray-400 text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`w-full sm:w-auto px-4 py-2 rounded-lg ${
                        currentPage === totalPages 
                          ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && trackToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-bg rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete the track <span className="text-white font-semibold">{trackToDelete.title}</span>? 
              This action cannot be undone and will permanently remove the track from the platform.
            </p>
            
            <div className="mb-6">
              <label htmlFor="deletion-reason" className="block text-sm font-medium text-gray-400 mb-2">
                Reason for Deletion
              </label>
              <textarea
                id="deletion-reason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Enter reason for deleting this track..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px]"
              />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={closeDeleteModal}
                className="w-full sm:flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTrack}
                className="w-full sm:flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                disabled={!deletionReason.trim()}
              >
                Delete Track
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
