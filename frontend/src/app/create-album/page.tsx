'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { createAlbum } from '../../services/albumService'
import { fetchCreatorTracks } from '../../services/creatorService'
import { getSignedUrl, uploadToS3, proxyUpload, uploadToCloudFront } from '../../services/s3Service'

interface AlbumTrack {
  id: string;
  title: string;
  audioUrl: string | null;
  coverUrl: string | null;
  description: string;
  genre: string;
  type: 'song' | 'beat' | 'mix';
}

export default function CreateAlbum() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('afrobeat')
  const [coverUrl, setCoverUrl] = useState<string | null>(null) // State for uploaded cover URL
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [tracks, setTracks] = useState<AlbumTrack[]>([])
  const [availableTracks, setAvailableTracks] = useState<any[]>([]) // Tracks available for selection
  const [selectedTrackIds, setSelectedTrackIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  const router = useRouter()
  const { isAuthenticated, userRole, isLoading } = useAuth()

  // Extended list of popular genres
  const genres = [
    'afrobeat',
    'amapiano',
    'gakondo',
    'amapiyano',
    'afro gako',
    'hiphop',
    'rnb',
    'afropop',
    'gospel',
    'traditional',
    'dancehall',
    'reggae',
    'soul',
    'jazz',
    'blues',
    'pop',
    'rock',
    'electronic',
    'house',
    'techno',
    'drill',
    'trap',
    'lofi',
    'ambient'
  ]

  // Check authentication and role on component mount
  useEffect(() => {
    // Don't redirect while loading
    if (!isLoading && !isAuthenticated) {
      // If not authenticated, redirect to login
      router.push('/login')
    } else if (!isLoading && isAuthenticated && userRole !== 'creator') {
      // If authenticated but not a creator, redirect to upgrade
      router.push('/upgrade')
    }
  }, [isAuthenticated, userRole, router, isLoading])

  // Fetch creator tracks on component mount
  useEffect(() => {
    const loadTracks = async () => {
      if (!isLoading && isAuthenticated && userRole === 'creator') {
        try {
          setLoading(true)
          
          // Fetch tracks with token refresh
          const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/creator/tracks?page=1&limit=100`);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch tracks');
          }
          
          const data = await response.json();
          setAvailableTracks(data.tracks)
        } catch (err) {
          console.error('Failed to fetch tracks:', err)
          setError('Failed to load your tracks')
        } finally {
          setLoading(false)
        }
      }
    }
    
    loadTracks()
  }, [isAuthenticated, userRole, isLoading])

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  // Handle cover image upload with S3
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        // Use the new CloudFront upload method (Backend API)
        const result: any = await uploadToCloudFront(file, (progress) => {
          setUploadProgress(prev => ({ ...prev, cover: progress }));
        });
        
        setCoverUrl(result.url);
      } catch (error) {
        console.error('Error uploading cover to CloudFront:', error);
        
        // Fallback to legacy methods
        try {
          let accessToken = localStorage.getItem('accessToken');
          if (!accessToken) {
            accessToken = await refreshToken();
          }

          if (!accessToken) {
            alert('Authentication error. Please log in again.');
            return;
          }

          try {
            const { uploadUrl, fileUrl } = await getSignedUrl(file.name, file.type, accessToken);
            await uploadToS3(file, uploadUrl, (progress) => {
              setUploadProgress(prev => ({ ...prev, cover: progress }));
            });
            setCoverUrl(fileUrl);
          } catch (directError: any) {
            console.warn('Direct S3 upload failed (possibly CORS), trying proxy upload...', directError);
            const result: any = await proxyUpload(file, accessToken, (progress) => {
              setUploadProgress(prev => ({ ...prev, cover: progress }));
            });
            setCoverUrl(result.fileUrl);
          }
        } catch (fallbackError) {
          console.error('Fallback error uploading cover:', fallbackError);
          alert('Failed to upload cover. Please try again.');
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Function to refresh token
  const refreshToken = async (): Promise<string | null> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        console.error('No refresh token found');
        return null;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken })
      });

      if (!response.ok) {
        console.error('Failed to refresh token');
        return null;
      }

      const data = await response.json();
      // Save new tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      return data.accessToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
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

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      setError('Album title is required')
      return
    }
    
    if (selectedTrackIds.length === 0) {
      setError('Please select at least one track for your album')
      return
    }
    
    try {
      setIsUploading(true)
      setError(null)
      setSuccess(null)
      
      // Create the album with token refresh
      const albumData = {
        title,
        description,
        genre,
        coverURL: coverUrl || '',
        trackIds: selectedTrackIds
      }
      
      const response = await makeAuthenticatedRequest(`${process.env.NEXT_PUBLIC_API_URL}/api/albums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(albumData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create album');
      }
      
      const newAlbum = await response.json();
      
      setSuccess('Album created successfully!')
      
      // Redirect to album page after a short delay
      setTimeout(() => {
        router.push(`/album/${newAlbum._id}`)
      }, 1500)
    } catch (err: any) {
      console.error('Failed to create album:', err)
      setError(err.message || 'Failed to create album')
    } finally {
      setIsUploading(false)
    }
  }

  // Toggle track selection
  const toggleTrackSelection = (trackId: string) => {
    setSelectedTrackIds(prev => {
      if (prev.includes(trackId)) {
        return prev.filter(id => id !== trackId)
      } else {
        return [...prev, trackId]
      }
    })
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-background">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 sm:px-8">
        <div className="max-w-4xl mx-auto">
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
              Create New Album
            </h1>
            <p className="text-gray-400">
              Organize your tracks into a cohesive album
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
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  >
                    {genres.map((g) => (
                      <option key={g} value={g}>
                        {g.charAt(0).toUpperCase() + g.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    placeholder="Describe your album..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Album Cover Image
                  </label>
                  <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
                    {coverUrl ? (
                      <div className="relative">
                        <img 
                          src={coverUrl} 
                          alt="Album cover" 
                          className="mx-auto max-h-64 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => setCoverUrl(null)}
                          className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileChange}
                          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                        />
                        {uploadProgress['cover'] > 0 && uploadProgress['cover'] <= 100 && (
                          <div className="w-full mt-2">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                              <span>{uploadProgress['cover'] === 100 ? 'Processing...' : 'Uploading Cover...'}</span>
                              <span>{Math.round(uploadProgress['cover'])}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className={`h-1.5 rounded-full transition-all duration-300 ${uploadProgress['cover'] === 100 ? 'bg-yellow-500 animate-pulse' : 'bg-primary'}`} 
                                style={{ width: `${uploadProgress['cover']}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Select Tracks for Album *
                  </label>
                  
                  {loading ? (
                    <div className="text-white py-4">Loading your tracks...</div>
                  ) : availableTracks.length > 0 ? (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                      {availableTracks.map((track) => (
                        <div 
                          key={track._id}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedTrackIds.includes(track._id) 
                              ? 'border-primary bg-primary/10' 
                              : 'border-gray-700 hover:border-gray-600'
                          }`}
                          onClick={() => toggleTrackSelection(track._id)}
                        >
                          <div className="flex items-center">
                            <div className={`w-5 h-5 rounded border flex items-center justify-center mr-3 ${
                              selectedTrackIds.includes(track._id) 
                                ? 'bg-primary border-primary' 
                                : 'border-gray-600'
                            }`}>
                              {selectedTrackIds.includes(track._id) && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                                </svg>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-white font-medium truncate">{track.title}</h4>
                              <div className="flex text-xs text-gray-400 gap-2">
                                <span>{track.genre}</span>
                                <span>•</span>
                                <span>{new Date(track.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-400 py-4 text-center">
                      You haven't uploaded any tracks yet. <button 
                        type="button"
                        onClick={() => router.push('/upload')}
                        className="text-primary hover:underline"
                      >
                        Upload tracks first
                      </button>
                    </div>
                  )}
                  
                  {selectedTrackIds.length > 0 && (
                    <div className="mt-3 text-sm text-gray-400">
                      Selected {selectedTrackIds.length} track{selectedTrackIds.length !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={isUploading || !title.trim() || selectedTrackIds.length === 0}
                    className="flex-1 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isUploading ? 'Creating Album...' : 'Create Album'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => router.push('/profile')}
                    className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    Cancel
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
