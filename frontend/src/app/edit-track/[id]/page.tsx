'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import { fetchTrackById } from '../../../services/trackService'

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

interface EditTrackFormData {
  title: string
  description: string
  genre: string
  type: 'song' | 'beat' | 'mix'
}

export default function EditTrackPage({ params }: { params: Promise<{ id: string }> }) {
  const [formData, setFormData] = useState<EditTrackFormData>({
    title: '',
    description: '',
    genre: '',
    type: 'song'
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { isAuthenticated, user, isLoading } = useAuth()
  const [trackId, setTrackId] = useState<string | null>(null)

  // Unwrap params Promise
  useEffect(() => {
    const unwrapParams = async () => {
      const unwrappedParams = await params
      setTrackId(unwrappedParams.id)
    }
    
    unwrapParams()
  }, [])

  // Check authentication on component mount
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, isLoading, router])

  // Fetch track data when component mounts
  useEffect(() => {
    const fetchTrack = async () => {
      if (!trackId || isLoading) return
      
      try {
        setLoading(true)
        const track = await fetchTrackById(trackId)
        
        // Detailed debugging for authorization check
        console.log('=== DETAILED AUTHORIZATION DEBUG ===')
        console.log('Track ID from URL params:', trackId)
        console.log('Full track data:', JSON.stringify(track, null, 2))
        console.log('Track creatorId:', track.creatorId)
        console.log('Track creatorId type:', typeof track.creatorId)
        console.log('Track creatorId constructor:', track.creatorId?.constructor?.name)
        console.log('User data:', JSON.stringify(user, null, 2))
        console.log('User ID:', user?.id)
        console.log('User ID type:', typeof user?.id)
        
        // Check if user is authorized to edit this track
        // Handle both cases: when creatorId is populated (object) or not (ObjectId)
        const trackOwnerId = track.creatorId && typeof track.creatorId === 'object' && track.creatorId !== null && '_id' in track.creatorId ? 
          (track.creatorId as any)._id.toString() : 
          track.creatorId.toString();
        
        if (trackOwnerId !== user?.id) {
          const errorMsg = `You are not authorized to edit this track. Track owner ID: "${trackOwnerId}", Your ID: "${user?.id}"`
          console.log('ERROR DETAILS:', errorMsg)
          setError(errorMsg)
          return
        }
        
        setFormData({
          title: track.title,
          description: track.description,
          genre: track.genre,
          type: track.type
        })
      } catch (err: any) {
        console.error('Failed to fetch track:', err)
        setError(err.message || 'Failed to load track data')
      } finally {
        setLoading(false)
      }
    }

    if (user && !isLoading && trackId) {
      fetchTrack()
    }
  }, [trackId, user, isLoading])

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
    
    if (!trackId) {
      setError('Track ID is missing')
      return
    }
    
    try {
      setSubmitting(true)
      setError(null)
      
      // Make API call to update the track
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackId}`, {
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
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to update track')
      }
      
      // Redirect to profile page after successful update
      router.push('/profile')
    } catch (err: any) {
      console.error('Failed to update track:', err)
      setError(err.message || 'Failed to update track')
    } finally {
      setSubmitting(false)
    }
  }

  // Show loading state while checking auth
  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Don't render the page if not authenticated
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-background">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 sm:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 text-text-primary">
              Edit Track
            </h1>
            <p className="text-gray-400 text-sm sm:text-base">
              Update your track information
            </p>
          </div>

          <div className="card-bg rounded-2xl p-6 sm:p-8 border border-gray-700/50">
            {error && (
              <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 mb-6">
                <div className="text-red-300">{error}</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                  Track Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Enter track title"
                  required
                />
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
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Describe your track..."
                />
              </div>

              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-2">
                  Genre
                </label>
                <input
                  type="text"
                  id="genre"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                  placeholder="Enter genre (e.g., Afrobeat, Hip Hop)"
                />
              </div>

              <div>
                <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                  Track Type
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                  disabled
                >
                  <option value="song">Song</option>
                  <option value="beat">Beat</option>
                  <option value="mix">Mix</option>
                </select>
                <p className="text-gray-500 text-xs mt-1">Track type cannot be changed after upload</p>
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-5 py-2.5 sm:px-6 sm:py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 sm:px-6 sm:py-3 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base disabled:opacity-50"
                >
                  {submitting ? 'Updating...' : 'Update Track'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}