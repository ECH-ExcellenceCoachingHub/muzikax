'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '../../../contexts/AuthContext'

interface Album {
  id: string
  title: string
  description: string
  creatorId: {
    _id: string
    name: string
  }
  genre: string
  tracks: string[]
  plays: number
  createdAt: string
  coverURL: string
}

export default function AlbumsManagementPage() {
  const [albums, setAlbums] = useState<Album[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [genreFilter, setGenreFilter] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [albumToDelete, setAlbumToDelete] = useState<Album | null>(null)
  const [deletionReason, setDeletionReason] = useState('')
  const router = useRouter()
  const { isAuthenticated, userRole } = useAuth()

  // Access control is handled once in src/app/admin/layout.tsx.
  useEffect(() => {
    fetchAlbums()
  }, [currentPage, searchQuery, genreFilter])

  const fetchAlbums = async () => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams()
      params.append('page', currentPage.toString())
      params.append('limit', '10')
      
      if (searchQuery) {
        params.append('search', searchQuery)
      }
      
      if (genreFilter !== 'all') {
        params.append('genre', genreFilter)
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/albums?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch albums')
      }
      
      const data = await response.json()
      const transformedAlbums: Album[] = data.albums.map((album: any) => ({
        id: album._id || album.id || '',
        title: album.title || '',
        description: album.description || '',
        creatorId: {
          _id: (album.creatorId && typeof album.creatorId === 'object') ? 
            (album.creatorId._id || album.creatorId.id) : 
            album.creatorId,
          name: (album.creatorId && typeof album.creatorId === 'object') ? 
            album.creatorId.name : 
            'Unknown'
        },
        genre: album.genre || '',
        tracks: album.tracks || [],
        plays: album.plays || 0,
        createdAt: album.createdAt || '',
        coverURL: album.coverURL || ''
      }))
      
      setAlbums(transformedAlbums)
      setTotalPages(data.pagination?.pages || 1)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching albums:', err)
      setError('Failed to fetch albums')
      setLoading(false)
    }
  }

  const handleDeleteAlbum = async () => {
    if (!albumToDelete) return
    
    try {
      const url = new URL(`${process.env.NEXT_PUBLIC_API_URL}/api/albums/${albumToDelete.id}`)
      url.searchParams.append('reason', encodeURIComponent(deletionReason))
      
      const response = await fetch(url.toString(), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete album')
      }
      
      fetchAlbums()
      setShowDeleteModal(false)
      setAlbumToDelete(null)
      setDeletionReason('')
    } catch (err) {
      console.error('Error deleting album:', err)
      setError('Failed to delete album')
    }
  }

  const openDeleteModal = (album: Album) => {
    setAlbumToDelete(album)
    setShowDeleteModal(true)
  }

  return (
    <div className="w-full">

          {/* Search and Filter Controls */}
          <div className="card-bg rounded-2xl p-4 sm:p-6 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="search" className="block text-sm font-medium text-gray-400 mb-1">
                  Search Albums
                </label>
                <input
                  type="text"
                  id="search"
                  placeholder="Search by title..."
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-light"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div>
                <label htmlFor="genre-filter" className="block text-sm font-medium text-gray-400 mb-1">
                  Genre
                </label>
                <select
                  id="genre-filter"
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-light"
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

              <div className="sm:col-span-2 flex items-end">
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setGenreFilter('all')
                    setCurrentPage(1)
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          </div>

          {/* Albums Table */}
          <div className="card-bg rounded-2xl p-4 sm:p-6">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-light"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-8">{error}</div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[800px]">
                    <thead>
                      <tr className="text-left text-gray-500 text-sm border-b border-gray-800">
                        <th className="pb-4 font-normal whitespace-nowrap">Album</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Creator</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Genre</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Tracks</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Plays</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Created</th>
                        <th className="pb-4 font-normal whitespace-nowrap">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {albums.filter(a => a.id).map((album) => (
                        <tr key={album.id} className="hover:bg-gray-800/30 transition-colors">
                          <td className="py-4 pr-4">
                            <div className="flex items-center gap-3">
                              {album.coverURL && (
                                <img 
                                  src={album.coverURL} 
                                  alt={album.title} 
                                  width="50" 
                                  height="50" 
                                  className="rounded-lg object-cover flex-shrink-0"
                                />
                              )}
                              <div className="font-medium text-white truncate">{album.title}</div>
                            </div>
                          </td>
                          <td className="py-4 text-gray-400 max-w-xs truncate">{album.creatorId?.name || 'Unknown'}</td>
                          <td className="py-4 text-gray-400 capitalize whitespace-nowrap">{album.genre}</td>
                          <td className="py-4 text-gray-400 whitespace-nowrap">{album.tracks?.length || 0}</td>
                          <td className="py-4 text-gray-400 whitespace-nowrap">{album.plays.toLocaleString()}</td>
                          <td className="py-4 text-gray-400 whitespace-nowrap">
                            {new Date(album.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => {
                                  if (album.id) {
                                    router.push(`/album/${album.id}`)
                                  }
                                }}
                                disabled={!album.id}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors whitespace-nowrap ${album.id ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
                              >
                                View
                              </button>
                              <button
                                onClick={() => openDeleteModal(album)}
                                disabled={!album.id}
                                className={`px-3 py-1 rounded-lg text-sm transition-colors whitespace-nowrap ${album.id ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-gray-500 text-gray-300 cursor-not-allowed'}`}
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
      {showDeleteModal && albumToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card-bg rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
            <p className="text-gray-400 mb-4">
              Are you sure you want to delete the album{' '}
              <span className="text-white font-semibold">{albumToDelete.title}</span>{' '}
              This action cannot be undone and will permanently remove the album from the platform.
            </p>
                  
            <div className="mb-6">
              <label htmlFor="deletion-reason" className="block text-sm font-medium text-gray-400 mb-2">
                Reason for Deletion
              </label>
              <textarea
                id="deletion-reason"
                value={deletionReason}
                onChange={(e) => setDeletionReason(e.target.value)}
                placeholder="Enter reason for deleting this album..."
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-light min-h-[100px]"
              />
            </div>
                  
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setAlbumToDelete(null)
                  setDeletionReason('')
                }}
                className="w-full sm:flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAlbum}
                className="w-full sm:flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                disabled={!deletionReason.trim()}
              >
                Delete Album
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
