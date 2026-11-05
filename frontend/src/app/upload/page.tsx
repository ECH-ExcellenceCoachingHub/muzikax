'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { getSignedUrl, uploadToS3, proxyUpload, uploadToCloudFront } from '../../services/s3Service'

export default function Upload() {
  const [dragActive, setDragActive] = useState(false)
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [genre, setGenre] = useState('afrobeat')
  const [type, setType] = useState<'song' | 'beat' | 'mix'>('song') // Add track type state
  const [paymentType, setPaymentType] = useState<'free' | 'paid'>('free') // Add payment type state for beats
  const [price, setPrice] = useState<number>(0) // Add price state for paid beats
  const [visibility, setVisibility] = useState('public')
  const [releaseDate, setReleaseDate] = useState<string>('') // Release date state
  const [collaborators, setCollaborators] = useState<string>('') // Collaborators state
  const [copyrightAccepted, setCopyrightAccepted] = useState<boolean>(false) // Copyright acceptance state
  const [file, setFile] = useState<File | null>(null)
  const [coverImage, setCoverImage] = useState<string | null>(null) // State for cover image
  const [audioUrl, setAudioUrl] = useState<string | null>(null) // State for uploaded audio URL
  const [coverUrl, setCoverUrl] = useState<string | null>(null) // State for uploaded cover URL
  
  // Album upload states
  const [isAlbumUpload, setIsAlbumUpload] = useState(false)
  const [albumTitle, setAlbumTitle] = useState('')
  const [albumDescription, setAlbumDescription] = useState('')
  const [albumCoverUrl, setAlbumCoverUrl] = useState<string | null>(null) // Album cover image
  const [albumTracks, setAlbumTracks] = useState<Array<{
    id: string;
    title: string;
    audioUrl: string | null;
    coverUrl: string | null;
    description: string;
    genre: string;
    type: 'song' | 'beat' | 'mix';
    price?: number;
    releaseDate?: string;
    collaborators?: string[];
    copyrightAccepted?: boolean;
  }>>([])
  
  const router = useRouter()
  const { isAuthenticated, userRole, upgradeToCreator, isLoading, user } = useAuth() // Add user to get avatar

  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [selectedCreatorType, setSelectedCreatorType] = useState<'artist' | 'dj' | 'producer'>('artist')
  const [isUpgrading, setIsUpgrading] = useState(false) // State for upload process
  const [isUploading, setIsUploading] = useState(false)
  
  // Stem processing states
  const [stemProcessingStatus, setStemProcessingStatus] = useState<'idle' | 'queued' | 'processing' | 'completed' | 'failed'>('idle')
  const [stemProgress, setStemProgress] = useState(0)
  const [estimatedTime, setEstimatedTime] = useState<string>('')

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
    console.log('Upload page - isAuthenticated:', isAuthenticated);
    console.log('Upload page - userRole:', userRole);
    
    // Don't redirect while loading
    if (!isLoading && !isAuthenticated) {
      // If not authenticated, redirect to login
      console.log('Not authenticated, redirecting to login');
      router.push('/login')
    } else if (!isLoading && isAuthenticated && userRole !== 'creator') {
      // If authenticated but not a creator, show upgrade prompt
      console.log('Authenticated but not creator, showing upgrade prompt');
      setShowUpgradePrompt(true)
    }
  }, [isAuthenticated, userRole, router, isLoading]) // Add isLoading to dependency array

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  // Handle S3 Upload
  const handleS3Upload = async (file: File, type: 'audio' | 'cover' | 'album-cover' | string) => {
    try {
      // Use the new CloudFront upload method (Backend API)
      const result: any = await uploadToCloudFront(file, (progress) => {
        setUploadProgress(prev => ({ ...prev, [type]: progress }));
      });
      
      return result.url;
    } catch (error) {
      console.error(`Error uploading ${type} to CloudFront:`, error);
      
      // Fallback to legacy methods if CloudFront fails
      try {
        let accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          accessToken = await refreshToken();
        }
        
        if (!accessToken) {
          alert('Authentication error. Please log in again.');
          return null;
        }

        // Try direct upload first
        try {
          // 1. Get signed URL
          const { uploadUrl, fileUrl, key } = await getSignedUrl(file.name, file.type, accessToken);

          // 2. Upload to S3
          await uploadToS3(file, uploadUrl, (progress) => {
            setUploadProgress(prev => ({ ...prev, [type]: progress }));
          });

          return fileUrl;
        } catch (directError: any) {
          console.warn('Direct S3 upload failed (possibly CORS), trying proxy upload...', directError);
          
          // Fallback to proxy upload
          const result: any = await proxyUpload(file, accessToken, (progress) => {
            setUploadProgress(prev => ({ ...prev, [type]: progress }));
          });
          
          return result.fileUrl;
        }
      } catch (fallbackError) {
        console.error(`Fallback error uploading ${type}:`, fallbackError);
        alert(`Failed to upload ${type}. Please try again.`);
        return null;
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  // Handle successful audio upload
  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAudioFile(file);
      setIsUploading(true);
      const url = await handleS3Upload(file, 'audio');
      if (url) {
        setAudioUrl(url);
      }
      setIsUploading(false);
    }
  };

  // Handle successful cover image upload
  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCoverFile(file);
      setIsUploading(true);
      const url = await handleS3Upload(file, 'cover');
      if (url) {
        setCoverUrl(url);
      }
      setIsUploading(false);
    }
  };

  // Handle successful album cover image upload
  const handleAlbumCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      const url = await handleS3Upload(file, 'album-cover');
      if (url) {
        setAlbumCoverUrl(url);
      }
      setIsUploading(false);
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

  // Album functions
  const addAlbumTrack = () => {
    setAlbumTracks(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        title: '',
        audioUrl: null,
        coverUrl: null,
        description: '',
        genre: 'afrobeat',
        type: 'song',
        releaseDate: new Date().toISOString().split('T')[0],
        collaborators: [],
        copyrightAccepted: true
      }
    ])
  }

  const removeAlbumTrack = (id: string) => {
    setAlbumTracks(prev => prev.filter(track => track.id !== id))
  }

  const updateAlbumTrack = (id: string, field: string, value: any) => {
    setAlbumTracks(prev => 
      prev.map(track => 
        track.id === id ? { ...track, [field]: value } : track
      )
    )
  }

  const handleAlbumAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>, trackId: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      const url = await handleS3Upload(file, `album-audio-${trackId}`);
      if (url) {
        updateAlbumTrack(trackId, 'audioUrl', url);
      }
      setIsUploading(false);
    }
  };

  const handleAlbumTrackCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>, trackId: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsUploading(true);
      const url = await handleS3Upload(file, `album-cover-${trackId}`);
      if (url) {
        updateAlbumTrack(trackId, 'coverUrl', url);
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUploading(true)
    
    try {
      if (isAlbumUpload) {
        // Handle album upload
        await handleAlbumUpload();
      } else {
        // Handle single track upload
        await handleSingleTrackUpload();
      }
    } catch (error: any) {
      console.error('Error uploading:', error);
      alert(`Error uploading: ${error.message || 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  }

  const handleSingleTrackUpload = async () => {
    // If no cover image is provided, use user's avatar
    let finalCoverUrl = coverUrl;
    if (!finalCoverUrl && user?.avatar) {
      finalCoverUrl = user.avatar;
    }
    
    // If we don't have an audio URL from UploadCare, we can't proceed
    if (!audioUrl) {
      alert('Please upload an audio file first');
      return;
    }
    
    console.log('Uploading:', { title, description, genre, type, paymentType, visibility, audioUrl, coverUrl: finalCoverUrl, releaseDate, collaborators, copyrightAccepted })
    
    // Get access token from localStorage
    let accessToken = localStorage.getItem('accessToken');
    
    if (!accessToken) {
      alert('Authentication error. Please log in again.');
      router.push('/login');
      return;
    }
    
    // Try to make the request with current token - USE upload-with-stems endpoint
    let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/upload-with-stems`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        title,
        description,
        genre,
        type,
        paymentType,
        price,
        audioURL: audioUrl,
        coverURL: finalCoverUrl || '',
        releaseDate: releaseDate || new Date().toISOString(),
        collaborators: collaborators ? collaborators.split(',').map(c => c.trim()) : [],
        copyrightAccepted
      })
    });
    
    // If token is expired, try to refresh it
    if (response.status === 401) {
      console.log('Token might be expired, attempting to refresh...');
      const newToken = await refreshToken();
      
      if (newToken) {
        // Retry the request with new token - USE upload-with-stems endpoint
        response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/upload-with-stems`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${newToken}`
          },
          body: JSON.stringify({
            title,
            description,
            genre,
            type,
            paymentType,
            price,
            audioURL: audioUrl,
            coverURL: finalCoverUrl || '',
            releaseDate: releaseDate || new Date().toISOString(),
            collaborators: collaborators ? collaborators.split(',').map(c => c.trim()) : [],
            copyrightAccepted
          })
        });
      } else {
        // Refresh failed, force logout
        alert('Session expired. Please log in again.');
        router.push('/login');
        return;
      }
    }
    
    if (!response.ok) {
      const errorData = await response.json();
      
      // Check if it's a WhatsApp requirement error for beats
      if (type === 'beat' && errorData.redirectToProfile) {
        if (confirm(`Beats require a WhatsApp contact number. Would you like to go to your profile to add your WhatsApp number?\n\nError: ${errorData.message}`)) {
          // Redirect to profile page with WhatsApp tab active
          router.push('/profile?tab=whatsapp');
        }
        return;
      }
      
      throw new Error(errorData.message || 'Failed to upload track');
    }
    
    const result = await response.json();
    console.log('Track uploaded successfully:', result);
    
    // If stem separation is queued, start polling for completion
    if (result.trackId) {
      setStemProcessingStatus('queued');
      setEstimatedTime(result.estimatedTime || '2-3 minutes');
      alert(`✅ Track uploaded! 🎵 Stem separation started (${result.estimatedTime || '2-3 min'})`);
      
      // Start polling for stem completion
      pollStemCompletion(result.trackId);
    } else {
      alert('Track uploaded successfully!');
    }
    
    // Reset form
    setTitle('');
    setDescription('');
    setFile(null);
    setAudioUrl(null);
    setCoverUrl(null);
    
    router.push('/profile'); // Redirect to profile page
  }
  
  const pollStemCompletion = async (trackId: string) => {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (60 * 5 seconds)
    
    const pollInterval = setInterval(async () => {
      try {
        attempts++;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/${trackId}/stems`);
        const data = await response.json();
        
        // Check if backend provides actual progress percentage
        const backendProgress = data.progress || data.stemProgress || 0;
        
        if (data.hasStems || backendProgress >= 100) {
          // Stems are ready!
          clearInterval(pollInterval);
          setStemProcessingStatus('completed');
          setStemProgress(100);
          console.log('🎉 Stems ready! Perfect quality available.');
        } else if (attempts >= maxAttempts) {
          // Timeout
          clearInterval(pollInterval);
          setStemProcessingStatus('failed');
          console.log('⏱️ Stem processing timeout');
        } else {
          // Use backend progress if available, otherwise use time-based estimation
          if (backendProgress > 0) {
            setStemProgress(backendProgress);
            console.log(`📊 Processing progress: ${backendProgress}%`);
          } else {
            // Fallback to time-based estimation
            const progress = Math.min((attempts / maxAttempts) * 100, 95);
            setStemProgress(progress);
          }
        }
      } catch (error) {
        console.error('Error polling stem status:', error);
        if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          setStemProcessingStatus('failed');
        }
      }
    }, 5000); // Poll every 5 seconds
  };

  const handleAlbumUpload = async () => {
    // Validate album
    if (!albumTitle.trim()) {
      alert('Please enter an album title');
      return;
    }
    
    if (albumTracks.length === 0) {
      alert('Please add at least one track to the album');
      return;
    }
    
    // Check if all tracks have audio files
    for (const track of albumTracks) {
      if (!track.audioUrl) {
        alert(`Please upload an audio file for track: ${track.title || 'Untitled'}`);
        return;
      }
    }
    
    // Upload each track and collect their IDs
    const uploadedTrackIds: string[] = [];
    
    for (const track of albumTracks) {
      // If no cover image is provided for this track, use album cover or user's avatar
      let finalCoverUrl = track.coverUrl || albumCoverUrl;
      if (!finalCoverUrl && user?.avatar) {
        finalCoverUrl = user.avatar;
      }
      
      // Get access token from localStorage
      let accessToken = localStorage.getItem('accessToken');
      
      if (!accessToken) {
        alert('Authentication error. Please log in again.');
        router.push('/login');
        return;
      }
      
      // Try to make the request with current token - USE upload-with-stems endpoint
      let response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/upload-with-stems`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({
          title: track.title.trim() || `${albumTitle} - Track ${albumTracks.indexOf(track) + 1}`,
          description: track.description,
          genre: track.genre,
          type: track.type,
          paymentType: paymentType,
          price: track.price || 0,
          audioURL: track.audioUrl,
          coverURL: finalCoverUrl || '',
          releaseDate: new Date().toISOString(),
          collaborators: [],
          copyrightAccepted: true
        })
      });
      
      // If token is expired, try to refresh it
      if (response.status === 401) {
        console.log('Token might be expired, attempting to refresh...');
        const newToken = await refreshToken();
        
        if (newToken) {
          // Retry the request with new token - USE upload-with-stems endpoint
          response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/upload-with-stems`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`
            },
            body: JSON.stringify({
              title: track.title.trim() || `${albumTitle} - Track ${albumTracks.indexOf(track) + 1}`,
              description: track.description,
              genre: track.genre,
              type: track.type,
              paymentType: paymentType,
              price: track.price || 0,
              audioURL: track.audioUrl,
              coverURL: finalCoverUrl || '',
              releaseDate: new Date().toISOString(),
              collaborators: [],
              copyrightAccepted: true
            })
          });
        } else {
          // Refresh failed, force logout
          alert('Session expired. Please log in again.');
          router.push('/login');
          return;
        }
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Check if it's a WhatsApp requirement error for beats
        if (track.type === 'beat' && errorData.redirectToProfile) {
          if (confirm(`Beats require a WhatsApp contact number. Would you like to go to your profile to add your WhatsApp number?\n\nError: ${errorData.message}`)) {
            // Redirect to profile page with WhatsApp tab active
            router.push('/profile?tab=whatsapp');
          }
          return;
        }
        
        throw new Error(`Failed to upload track "${track.title}": ${errorData.message || 'Unknown error'}`);
      }
      
      const result = await response.json();
      console.log('Track uploaded successfully:', result);
      console.log(`🎵 STEM separation started for track ${result.trackId || result._id}`);
      console.log('⏱️ Estimated time: 2-3 minutes');
      uploadedTrackIds.push(result.trackId || result._id);
    }
    
    // Create the album with the uploaded track IDs
    try {
      const albumResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/albums`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          title: albumTitle,
          description: albumDescription,
          genre: albumTracks[0]?.genre || 'afrobeat',
          coverURL: albumCoverUrl || '',
          trackIds: uploadedTrackIds
        })
      });
      
      if (!albumResponse.ok) {
        const errorData = await albumResponse.json();
        throw new Error(errorData.message || 'Failed to create album');
      }
      
      const albumResult = await albumResponse.json();
      console.log('Album created successfully:', albumResult);
      
      // Reset form
      setAlbumTitle('');
      setAlbumDescription('');
      setAlbumCoverUrl(null);
      setAlbumTracks([]);
      
      alert('Album uploaded successfully!');
      router.push('/profile'); // Redirect to profile page
    } catch (error: any) {
      console.error('Error creating album:', error);
      alert(`Failed to create album: ${error.message}`);
    }
  };

  const handleUpgradeToCreator = async () => {
    setIsUpgrading(true)
    try {
      const success = await upgradeToCreator(selectedCreatorType)
      if (success) {
        // Successfully upgraded, hide the prompt and show the upload form
        setShowUpgradePrompt(false)
      } else {
        // Handle error case
        console.error('Failed to upgrade to creator')
      }
    } catch (error) {
      console.error('Error upgrading to creator:', error)
    } finally {
      setIsUpgrading(false)
    }
  }

  return (
    <div className="min-h-screen py-8 sm:py-12 overflow-x-hidden bg-background">
      {/* Background elements with better positioning for mobile */}
      <div className="absolute top-10 left-10 w-64 h-64 sm:w-80 sm:h-80 bg-primary/10 rounded-full blur-3xl -z-10 hidden md:block"></div>
      <div className="absolute bottom-10 right-10 w-64 h-64 sm:w-80 sm:h-80 bg-primary-light/10 rounded-full blur-3xl -z-10 hidden md:block"></div>
      
      {/* Simpler mobile background */}
      <div className="absolute top-5 left-5 w-32 h-32 bg-primary/5 rounded-full blur-2xl -z-10 md:hidden"></div>
      <div className="absolute bottom-5 right-5 w-32 h-32 bg-primary-light/5 rounded-full blur-2xl -z-10 md:hidden"></div>
      
      {/* Upgrade Prompt Modal */}
      {showUpgradePrompt && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="card-bg rounded-2xl p-4 sm:p-5 md:p-8 max-w-sm sm:max-w-md w-full border border-gray-700/50 shadow-2xl my-4 sm:my-8">
            <div className="text-center">
              <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2 sm:mb-3 md:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
              </div>
              
              <h2 className="text-base sm:text-lg md:text-2xl font-bold mb-1 sm:mb-2 md:mb-3 text-text-primary">Become a Creator</h2>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 md:mb-6">
                You need to upgrade your account to upload music. Please select your creator type below.
              </p>
              
              <div className="grid grid-cols-3 gap-1 sm:gap-2 md:gap-3 mb-3 sm:mb-4 md:mb-6">
                {(['artist', 'dj', 'producer'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={`py-1.5 sm:py-2 md:py-3 px-1 sm:px-2 rounded-lg text-xs sm:text-sm md:text-base font-medium transition-all ${
                      selectedCreatorType === type
                        ? 'bg-primary text-white'
                        : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'
                    }`}
                    onClick={() => setSelectedCreatorType(type)}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
              
              <div className="flex flex-col gap-2 sm:gap-3">
                <button
                  onClick={handleUpgradeToCreator}
                  disabled={isUpgrading}
                  className={`w-full py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 rounded-lg text-white font-medium transition-opacity ${
                    isUpgrading 
                      ? 'bg-gray-600 cursor-not-allowed' 
                      : 'gradient-primary hover:opacity-90'
                  }`}
                >
                  {isUpgrading ? 'Upgrading...' : 'Upgrade Account'}
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full py-2 sm:py-2.5 md:py-3 px-3 sm:px-4 bg-gray-800/50 border border-gray-700 rounded-lg text-white font-medium hover:bg-gray-700/50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {isAuthenticated && userRole === 'creator' && (
        <div className="container mx-auto px-4 sm:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold gradient-text mb-3 sm:mb-4 text-text-primary">
                Upload Your Music
              </h1>
              <p className="text-gray-400 text-sm sm:text-base max-w-2xl mx-auto">
                Share your creations with the world. Upload your tracks and connect with fans across Rwanda and beyond.
              </p>
            </div>

            {/* Toggle between single track and album upload */}
            <div className="card-bg rounded-2xl p-5 sm:p-6 mb-6">
              <div className="flex space-x-4">
                <button
                  onClick={() => setIsAlbumUpload(false)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    !isAlbumUpload
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Single Track
                </button>
                <button
                  onClick={() => setIsAlbumUpload(true)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isAlbumUpload
                      ? 'bg-primary text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  Album
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
              {!isAlbumUpload ? (
                // Single Track Upload Form
                <>
                  {/* Audio Upload Section */}
                  <div className="card-bg rounded-2xl p-5 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-medium mb-4 text-text-primary">Audio File</h2>
                    
                    {!audioUrl ? (
                      <div className="flex flex-col space-y-2">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleAudioFileChange}
                          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                        />
                        {uploadProgress['audio'] > 0 && uploadProgress['audio'] <= 100 && (
                          <div className="space-y-1 mt-2">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>{uploadProgress['audio'] === 100 ? 'Processing...' : 'Uploading audio...'}</span>
                              <span>{Math.round(uploadProgress['audio'])}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${uploadProgress['audio'] === 100 ? 'bg-yellow-500 animate-pulse' : 'bg-primary'}`} 
                                style={{ width: `${uploadProgress['audio']}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-green-400">Audio uploaded successfully!</p>
                        <p className="text-sm text-gray-400 mt-1">File: {audioUrl.split('/').pop()}</p>
                      </div>
                    )}
                  </div>

                  {/* Cover Image Upload Section */}
                  <div className="card-bg rounded-2xl p-5 sm:p-6">
                    <h2 className="text-lg sm:text-xl font-medium mb-4 text-text-primary">Cover Image</h2>
                    
                    {!coverUrl ? (
                      <div className="flex flex-col space-y-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverFileChange}
                          className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                        />
                        {uploadProgress['cover'] > 0 && uploadProgress['cover'] <= 100 && (
                          <div className="space-y-1 mt-2">
                            <div className="flex justify-between text-xs text-gray-400">
                              <span>{uploadProgress['cover'] === 100 ? 'Processing...' : 'Uploading cover...'}</span>
                              <span>{Math.round(uploadProgress['cover'])}%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                              <div 
                                className={`h-2 rounded-full transition-all duration-300 ${uploadProgress['cover'] === 100 ? 'bg-yellow-500 animate-pulse' : 'bg-primary'}`} 
                                style={{ width: `${uploadProgress['cover']}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                        <p className="text-green-400">Cover image uploaded successfully!</p>
                        <img src={coverUrl} alt="Cover" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                      </div>
                    )}
                    
                    {/* Info about using avatar as cover */}
                    {!coverUrl && user?.avatar && (
                      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                        <p className="text-blue-400 text-sm">
                          If you don't upload a cover image, your profile avatar will be used as the track cover.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-5 sm:space-y-6 card-bg rounded-2xl p-5 sm:p-6">
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
                        Track Title
                      </label>
                      <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
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
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="Tell us about your track..."
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      <div>
                        <label htmlFor="genre" className="block text-sm font-medium text-gray-300 mb-2">
                          Genre
                        </label>
                        <select
                          id="genre"
                          value={genre}
                          onChange={(e) => setGenre(e.target.value)}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                        >
                          {genres.map(genreOption => (
                            <option key={genreOption} value={genreOption}>
                              {genreOption.charAt(0).toUpperCase() + genreOption.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label htmlFor="type" className="block text-sm font-medium text-gray-300 mb-2">
                          Type
                        </label>
                        <select
                          id="type"
                          value={type}
                          onChange={(e) => setType(e.target.value as 'song' | 'beat' | 'mix')}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                        >
                          <option value="song">Song</option>
                          <option value="beat">Beat</option>
                          <option value="mix">Mix</option>
                        </select>
                      </div>

                      {/* Payment type field for beats */}
                      {type === 'beat' && (
                        <div>
                          <label htmlFor="paymentType" className="block text-sm font-medium text-gray-300 mb-2">
                            Payment Type
                          </label>
                          <select
                            id="paymentType"
                            value={paymentType}
                            onChange={(e) => setPaymentType(e.target.value as 'free' | 'paid')}
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                          >
                            <option value="free">Free</option>
                            <option value="paid">Paid</option>
                          </select>
                          <p className="mt-1 text-xs text-gray-500">
                            {paymentType === 'paid' 
                              ? 'Users will contact you via WhatsApp to obtain this beat' 
                              : 'Users can download this beat for free'}
                          </p>
                        </div>
                      )}
                      
                      {/* Price field for paid beats */}
                      {type === 'beat' && paymentType === 'paid' && (
                        <div>
                          <label htmlFor="price" className="block text-sm font-medium text-gray-300 mb-2">
                            Price (RWF)
                          </label>
                          <input
                            type="number"
                            id="price"
                            min="0"
                            step="0.01"
                            value={price}
                            onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                            placeholder="0.00"
                          />
                          <p className="mt-1 text-xs text-gray-500">
                            Set the price for this beat
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                      <div>
                        <label htmlFor="releaseDate" className="block text-sm font-medium text-gray-300 mb-2">
                          Release Date
                        </label>
                        <input
                          type="date"
                          id="releaseDate"
                          value={releaseDate}
                          onChange={(e) => setReleaseDate(e.target.value)}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="visibility" className="block text-sm font-medium text-gray-300 mb-2">
                          Visibility
                        </label>
                        <select
                          id="visibility"
                          value={visibility}
                          onChange={(e) => setVisibility(e.target.value)}
                          className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                        >
                          <option value="public">Public</option>
                          <option value="fans">Fans Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="collaborators" className="block text-sm font-medium text-gray-300 mb-2">
                        Collaborators (comma separated)
                      </label>
                      <input
                        type="text"
                        id="collaborators"
                        value={collaborators}
                        onChange={(e) => setCollaborators(e.target.value)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="e.g., Producer: John Doe, Featuring: Jane Smith"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Enter collaborators with their roles (optional)
                      </p>
                    </div>

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="copyrightAccepted"
                          type="checkbox"
                          checked={copyrightAccepted}
                          onChange={(e) => setCopyrightAccepted(e.target.checked)}
                          required
                          className="w-4 h-4 text-primary bg-gray-800 border-gray-700 rounded focus:ring-primary focus:ring-2"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label htmlFor="copyrightAccepted" className="font-medium text-gray-300">
                          I accept the copyright policy
                        </label>
                        <p className="text-gray-500">
                          I confirm that this content is my original work and I have the rights to upload it.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                // Album Upload Form
                <>
                  {/* Album Info */}
                  <div className="space-y-5 sm:space-y-6 card-bg rounded-2xl p-5 sm:p-6">
                    <div>
                      <label htmlFor="albumTitle" className="block text-sm font-medium text-gray-300 mb-2">
                        Album Title
                      </label>
                      <input
                        type="text"
                        id="albumTitle"
                        value={albumTitle}
                        onChange={(e) => setAlbumTitle(e.target.value)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="Enter album title"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="albumDescription" className="block text-sm font-medium text-gray-300 mb-2">
                        Album Description
                      </label>
                      <textarea
                        id="albumDescription"
                        rows={3}
                        value={albumDescription}
                        onChange={(e) => setAlbumDescription(e.target.value)}
                        className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base"
                        placeholder="Tell us about your album..."
                      ></textarea>
                    </div>

                    {/* Album Cover Upload Section */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Album Cover Image
                      </label>
                      {!albumCoverUrl ? (
                        <div className="flex flex-col space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleAlbumCoverFileChange}
                            className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                          />
                          {uploadProgress['album-cover'] > 0 && uploadProgress['album-cover'] <= 100 && (
                            <div className="space-y-1 mt-2">
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>{uploadProgress['album-cover'] === 100 ? 'Processing...' : 'Uploading album cover...'}</span>
                                <span>{Math.round(uploadProgress['album-cover'])}%</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${uploadProgress['album-cover'] === 100 ? 'bg-yellow-500 animate-pulse' : 'bg-primary'}`} 
                                  style={{ width: `${uploadProgress['album-cover']}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-green-900/30 border border-green-700 rounded-lg">
                          <p className="text-green-400">Album cover uploaded successfully!</p>
                          <img src={albumCoverUrl} alt="Album Cover" className="mt-2 w-32 h-32 object-cover rounded-lg" />
                        </div>
                      )}
                      
                      {/* Info about using avatar as cover */}
                      {!albumCoverUrl && user?.avatar && (
                        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700 rounded-lg">
                          <p className="text-blue-400 text-sm">
                            If you don't upload an album cover, your profile avatar will be used as the default cover for tracks.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Album Tracks */}
                  <div className="card-bg rounded-2xl p-5 sm:p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-lg sm:text-xl font-medium text-text-primary">Album Tracks</h2>
                      <button
                        type="button"
                        onClick={addAlbumTrack}
                        className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/80 transition-colors text-sm"
                      >
                        Add Track
                      </button>
                    </div>

                    {albumTracks.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        No tracks added yet. Click "Add Track" to start adding tracks to your album.
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {albumTracks.map((track, index) => (
                          <div key={track.id} className="border border-gray-700 rounded-lg p-4">
                            <div className="flex justify-between items-center mb-3">
                              <h3 className="font-medium text-text-primary">Track {index + 1}</h3>
                              <button
                                type="button"
                                onClick={() => removeAlbumTrack(track.id)}
                                className="text-red-500 hover:text-red-400"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                              </button>
                            </div>

                            <div className="mb-4">
                              <h4 className="text-gray-300 text-sm mb-2">Audio File</h4>
                              {!track.audioUrl ? (
                                <div className="flex flex-col space-y-2">
                                  <input
                                    type="file"
                                    accept="audio/*"
                                    onChange={(e) => handleAlbumAudioFileChange(e, track.id)}
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                                  />
                                  {uploadProgress[`album-audio-${track.id}`] > 0 && uploadProgress[`album-audio-${track.id}`] <= 100 && (
                                    <div className="w-full mt-2">
                                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                        <span>{uploadProgress[`album-audio-${track.id}`] === 100 ? 'Processing...' : 'Uploading...'}</span>
                                        <span>{Math.round(uploadProgress[`album-audio-${track.id}`])}%</span>
                                      </div>
                                      <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                          className={`h-1.5 rounded-full transition-all duration-300 ${uploadProgress[`album-audio-${track.id}`] === 100 ? 'bg-yellow-500 animate-pulse' : 'bg-primary'}`} 
                                          style={{ width: `${uploadProgress[`album-audio-${track.id}`]}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-2 bg-green-900/30 border border-green-700 rounded-lg">
                                  <p className="text-green-400 text-sm">Audio uploaded successfully!</p>
                                </div>
                              )}
                            </div>

                            {/* Track Cover Upload */}
                            <div className="mb-4">
                              <h4 className="text-gray-300 text-sm mb-2">Track Cover Image (Optional)</h4>
                              {!track.coverUrl ? (
                                <div className="flex flex-col space-y-2">
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => handleAlbumTrackCoverFileChange(e, track.id)}
                                    className="w-full text-sm text-gray-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/80"
                                  />
                                  {uploadProgress[`album-cover-${track.id}`] > 0 && uploadProgress[`album-cover-${track.id}`] <= 100 && (
                                    <div className="w-full mt-2">
                                      <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                        <span>{uploadProgress[`album-cover-${track.id}`] === 100 ? 'Processing...' : 'Uploading...'}</span>
                                        <span>{Math.round(uploadProgress[`album-cover-${track.id}`])}%</span>
                                      </div>
                                      <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                          className={`h-1.5 rounded-full transition-all duration-300 ${uploadProgress[`album-cover-${track.id}`] === 100 ? 'bg-yellow-500 animate-pulse' : 'bg-primary'}`} 
                                          style={{ width: `${uploadProgress[`album-cover-${track.id}`]}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="p-2 bg-green-900/30 border border-green-700 rounded-lg">
                                  <p className="text-green-400 text-sm">Cover uploaded successfully!</p>
                                  <img src={track.coverUrl} alt="Track Cover" className="mt-2 w-16 h-16 object-cover rounded" />
                                </div>
                              )}
                            </div>

                            {/* Track Details */}
                            <div className="space-y-3">
                              <div>
                                <label className="block text-gray-300 text-xs mb-1">
                                  Track Title
                                </label>
                                <input
                                  type="text"
                                  value={track.title}
                                  onChange={(e) => updateAlbumTrack(track.id, 'title', e.target.value)}
                                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-white text-sm"
                                  placeholder="Enter track title"
                                />
                              </div>

                              <div>
                                <label className="block text-gray-300 text-xs mb-1">
                                  Description
                                </label>
                                <textarea
                                  value={track.description}
                                  onChange={(e) => updateAlbumTrack(track.id, 'description', e.target.value)}
                                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-white text-sm"
                                  placeholder="Track description"
                                  rows={2}
                                ></textarea>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-gray-300 text-xs mb-1">
                                    Genre
                                  </label>
                                  <select
                                    value={track.genre}
                                    onChange={(e) => updateAlbumTrack(track.id, 'genre', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-white text-sm"
                                  >
                                    {genres.map(genreOption => (
                                      <option key={genreOption} value={genreOption}>
                                        {genreOption.charAt(0).toUpperCase() + genreOption.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>

                                <div>
                                  <label className="block text-gray-300 text-xs mb-1">
                                    Type
                                  </label>
                                  <select
                                    value={track.type}
                                    onChange={(e) => updateAlbumTrack(track.id, 'type', e.target.value)}
                                    className="w-full px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-white text-sm"
                                  >
                                    <option value="song">Song</option>
                                    <option value="beat">Beat</option>
                                    <option value="mix">Mix</option>
                                  </select>
                                </div>
                              </div>

                              <div>
                                <label className="block text-gray-300 text-xs mb-1">
                                  Release Date
                                </label>
                                <input
                                  type="date"
                                  value={track.releaseDate || ''}
                                  onChange={(e) => updateAlbumTrack(track.id, 'releaseDate', e.target.value)}
                                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-white text-sm"
                                />
                              </div>

                              <div>
                                <label className="block text-gray-300 text-xs mb-1">
                                  Collaborators
                                </label>
                                <input
                                  type="text"
                                  value={track.collaborators ? track.collaborators.join(', ') : ''}
                                  onChange={(e) => {
                                    const collabArray = e.target.value ? e.target.value.split(',').map(c => c.trim()) : [];
                                    updateAlbumTrack(track.id, 'collaborators', collabArray);
                                  }}
                                  className="w-full px-2 py-1 bg-gray-800/50 border border-gray-700 rounded text-white text-sm"
                                  placeholder="e.g., Producer: John Doe, Featuring: Jane Smith"
                                />
                              </div>

                              <div className="flex items-start">
                                <div className="flex items-center h-4">
                                  <input
                                    type="checkbox"
                                    checked={track.copyrightAccepted || false}
                                    onChange={(e) => updateAlbumTrack(track.id, 'copyrightAccepted', e.target.checked)}
                                    className="w-3 h-3 text-primary bg-gray-800 border-gray-700 rounded focus:ring-primary focus:ring-2"
                                  />
                                </div>
                                <div className="ml-2 text-xs">
                                  <label className="font-medium text-gray-300">
                                    I accept the copyright policy
                                  </label>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Tips Card */}
              <div className="card-bg rounded-2xl p-5 sm:p-6 border-l-4 border-primary-light">
                <h3 className="font-medium mb-2 flex items-center gap-2 text-text-primary">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-light" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"></path>
                  </svg>
                  Upload Tips
                </h3>
                <ul className="text-xs sm:text-sm text-gray-400 space-y-1">
                  <li>• High quality audio files (320kbps MP3 or lossless) sound best</li>
                  <li>• Add detailed descriptions to help fans discover your music</li>
                  <li>• Use relevant hashtags to increase visibility</li>
                  <li>• Consider uploading artwork for a professional look</li>
                </ul>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isUploading || (!isAlbumUpload && !audioUrl) || (isAlbumUpload && albumTracks.length === 0)}
                  className={`px-5 py-2.5 sm:px-6 sm:py-3 rounded-lg font-medium transition-all ${
                    !isUploading && ((isAlbumUpload && albumTracks.length > 0) || (!isAlbumUpload && audioUrl))
                      ? 'gradient-primary text-white hover:opacity-90'
                      : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  } text-sm sm:text-base`}
                >
                  {isUploading ? (
                    isAlbumUpload ? 'Uploading Album...' : 'Uploading Track...'
                  ) : (
                    isAlbumUpload ? 'Upload Album' : 'Upload Track'
                  )}
                </button>
              </div>

              {/* Stem Processing Status */}
              {stemProcessingStatus !== 'idle' && (
                <div className="mt-6 p-4 rounded-xl border bg-gray-800/50">
                  {stemProcessingStatus === 'queued' && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                        <p className="text-white font-medium">🎵 Stem Separation Queued</p>
                      </div>
                      <p className="text-gray-400 text-sm">
                        Your track is being processed in the background. Estimated time: {estimatedTime}
                      </p>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-gold-500 to-orange-500 transition-all duration-500"
                          style={{ width: `${stemProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        You can navigate away - processing will continue automatically
                      </p>
                    </div>
                  )}
                  
                  {stemProcessingStatus === 'processing' && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="animate-pulse text-2xl">⚙️</div>
                        <p className="text-white font-medium">Processing Stems...</p>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-gold-500 to-orange-500 transition-all duration-500"
                          style={{ width: `${stemProgress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">
                        AI is separating your track into 4 stems (vocals, drums, bass, other)
                      </p>
                    </div>
                  )}
                  
                  {stemProcessingStatus === 'completed' && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">✅</div>
                        <p className="text-green-400 font-medium">🎉 Perfect Stems Ready!</p>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div 
                          className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-300">
                        Your track has been separated into professional quality stems. Users can now:
                      </p>
                      <ul className="text-xs text-gray-400 space-y-1 ml-4">
                        <li>• Enable Karaoke Mode (remove vocals)</li>
                        <li>• Boost instruments for practice</li>
                        <li>• Create custom remixes</li>
                        <li>• Control each stem independently</li>
                      </ul>
                    </div>
                  )}
                  
                  {stemProcessingStatus === 'failed' && (
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">⚠️</div>
                        <p className="text-yellow-400 font-medium">Stem Processing Incomplete</p>
                      </div>
                      <p className="text-sm text-gray-400">
                        The stem separation took longer than expected. Your track is still available with standard playback.
                      </p>
                      <button
                        onClick={() => setStemProcessingStatus('idle')}
                        className="text-xs text-primary hover:underline"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
