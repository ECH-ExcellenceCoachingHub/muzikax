'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { getAlbumById, updateAlbum, deleteAlbum } from '../../../services/albumService'

// Define Album interface based on backend structure
interface Album {
  _id: string;
  id: string;
  title: string;
  description: string;
  genre: string;
  creatorId: {
    _id: string;
    name: string;
    avatar?: string;
  } | string;
  coverURL: string;
  releaseDate: string;
  tracks: Array<any>;
  plays: number;
  likes: number;
  createdAt: string;
  updatedAt: string;
}

// Helper function to refresh token
const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken })
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      return data.accessToken;
    }
  } catch (error) {
    console.error('Error refreshing token:', error);
  }
  return null;
};

// Helper function to make authenticated request with token refresh
const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}): Promise<Response> => {
  let accessToken = localStorage.getItem('accessToken');
  
  if (!accessToken) {
    throw new Error('No access token found');
  }

  // Add authorization header to options
  const requestOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  };

  // Make initial request
  let response = await fetch(url, requestOptions);

  // If token is expired, try to refresh it
  if (response.status === 401) {
    console.log('Token might be expired, attempting to refresh...');
    const newToken = await refreshToken();
    
    if (newToken) {
      // Retry the request with new token
      requestOptions.headers = {
        ...requestOptions.headers,
        'Authorization': `Bearer ${newToken}`
      };
      
      response = await fetch(url, requestOptions);
    }
  }

  return response;
};

interface EditAlbumFormData {
  title: string
  description: string
  genre: string
}

export default function EditAlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const [formData, setFormData] = useState<EditAlbumFormData>({
    title: '',
    description: '',
    genre: ''
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuth()
  const [albumId, setAlbumId] = useState<string | null>(null)

  // Unwrap params Promise
  useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params
      setAlbumId(unwrappedParams.id)
    }
    
    unwrapParams()
  }, [])

  // Check authentication on component mount
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch album data when component mounts
  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId || isLoading) return
      
      try {
        setLoading(true)
        
        // Fetch album with token refresh
        const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/albums/${albumId}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch album');
        }
        
        const album: any = await response.json();
        
        // Check if user is authorized to edit this album
        const albumOwnerId = typeof album.creatorId === 'object' ? album.creatorId._id : album.creatorId
        if (albumOwnerId !== user?.id) {
          setError('You are not authorized to edit this album')
          return
        }
        
        setFormData({
          title: album.title,
          description: album.description || '',
          genre: album.genre || ''
        })
      } catch (err: any) {
        console.error('Failed to fetch album:', err)
        setError(err.message || 'Failed to load album data')
      } finally {
        setLoading(false)
      }
    }

    if (user && !isLoading && albumId) {
      fetchAlbum()
    }
  }, [albumId, user, isLoading])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      setError('Title is required')
      return
    }
    
    if (!albumId) {
      setError('Album ID is missing')
      return
    }
    
    try {
      setSubmitting(true)
      setError(null)
      setSuccess(null)
      
      // Make API call to update the album with token refresh
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/albums/${albumId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          genre: formData.genre
        })
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update album');
      }
      
      const updatedAlbum = await response.json();
      
      setSuccess('Album updated successfully!')
      
      // Redirect to album page after a short delay
      setTimeout(() => {
        router.push(`/album/${albumId}`)
      }, 1500)
    } catch (err: any) {
      console.error('Failed to update album:', err)
      setError(err.message || 'Failed to update album')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!albumId) return
    
    if (!window.confirm('Are you sure you want to delete this album? This action cannot be undone.')) {
      return
    }
    
    try {
      setDeleting(true)
      setError(null)
      
      // Make API call to delete the album with token refresh
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/albums/${albumId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete album');
      }
      
      // Redirect to profile page after successful deletion
      router.push('/profile')
    } catch (err: any) {
      console.error('Failed to delete album:', err)
      setError(err.message || 'Failed to delete album')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Loading album...</div>
      </div>
    )
  }

  if (error && error.includes('authorized')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white text-center max-w-md p-6">
          <h2 className="text-xl mb-4 text-text-primary">Access Denied</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button 
            onClick={() => router.push('/profile')}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors"
          >
            Back to Profile
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-background">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <button 
              onClick={() => router.back()}
              className="flex items-center text-gray-400 hover:text-white mb-6 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd"></path>
              </svg>
              Back
            </button>
            
            <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-text-primary">
              Edit Album
            </h1>
            <p className="text-gray-400">
              Update your album details
            </p>
          </div>
          
          <div className="card-bg rounded-2xl p-6 sm:p-8 border border-gray-700/50">
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
                <div className="text-red-300">{error}</div>
              </div>
            )}
            
            {success && (
              <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 mb-6">
                <div className="text-green-300">{success}</div>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                    Album Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Enter album title"
                  />
                </div>
                
                <div>
                  <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-2">
                    Genre
                  </label>
                  <select
                    id="genre"
                    name="genre"
                    value={formData.genre}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    <option value="">Select a genre</option>
                    <option value="afrobeat">Afrobeat</option>
                    <option value="amapiano">Amapiano</option>
                    <option value="hiphop">Hip Hop</option>
                    <option value="rnb">R&B</option>
                    <option value="afropop">Afropop</option>
                    <option value="gospel">Gospel</option>
                    <option value="traditional">Traditional</option>
                    <option value="dancehall">Dancehall</option>
                    <option value="reggae">Reggae</option>
                    <option value="soul">Soul</option>
                    <option value="jazz">Jazz</option>
                    <option value="blues">Blues</option>
                    <option value="pop">Pop</option>
                    <option value="rock">Rock</option>
                    <option value="electronic">Electronic</option>
                    <option value="house">House</option>
                    <option value="techno">Techno</option>
                    <option value="drill">Drill</option>
                    <option value="trap">Trap</option>
                    <option value="lofi">Lo-Fi</option>
                    <option value="ambient">Ambient</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Describe your album..."
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {submitting ? 'Updating...' : 'Update Album'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {deleting ? 'Deleting...' : 'Delete Album'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}