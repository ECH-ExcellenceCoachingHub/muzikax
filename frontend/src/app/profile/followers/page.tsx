'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  role: string
  creatorType?: string
  followersCount: number
  followingCount: number
  bio?: string
}

export default function FollowersPage() {
  const router = useRouter()
  const { user: currentUser, isLoading: isAuthLoading } = useAuth()
  
  const [followers, setFollowers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pullRefresh, setPullRefresh] = useState(false)
  const [touchStartY, setTouchStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      setTouchStartY(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY > 0 && window.scrollY === 0) {
      const currentY = e.touches[0].clientY
      const distance = Math.max(0, currentY - touchStartY)
      setPullDistance(distance)
    }
  }

  const handleTouchEnd = async () => {
    if (pullDistance > 100 && !loading && !pullRefresh) {
      setPullRefresh(true)
      setPullDistance(0)
      
      // Refresh followers list
      await fetchFollowers()
      
      setTimeout(() => setPullRefresh(false), 500)
    } else {
      setPullDistance(0)
    }
  }

  const fetchFollowers = async () => {
    try {
      setError(null)

      // First check if we have a user (from AuthContext or localStorage)
      const storedUser = localStorage.getItem('user')
      const currentUserData = currentUser || (storedUser ? JSON.parse(storedUser) : null)
      
      if (!currentUserData) {
        console.log('No user found, redirecting to login')
        router.push('/auth/login?redirect=/profile/followers')
        return
      }

      // Fetch followers for the current user
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      
      if (!token) {
        console.error('No token found')
        router.push('/auth/login?redirect=/profile/followers')
        return
      }

      console.log('Fetching followers with token:', token.substring(0, 20) + '...')
      
      const response = await fetch(`${API_BASE_URL}/api/users/${currentUserData.id}/followers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('Followers response status:', response.status)

      if (response.status === 401) {
        console.error('Unauthorized - Token expired or invalid')
        // Try to refresh token
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          try {
            const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh-token`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken })
            })
            
            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json()
              localStorage.setItem('accessToken', refreshData.accessToken)
              localStorage.setItem('refreshToken', refreshData.refreshToken)
              
              // Retry with new token
              const retryResponse = await fetch(`${API_BASE_URL}/api/users/${currentUserData.id}/followers`, {
                headers: {
                  'Authorization': `Bearer ${refreshData.accessToken}`,
                  'Content-Type': 'application/json'
                }
              })
              
              if (retryResponse.ok) {
                const data = await retryResponse.json()
                console.log('Followers fetched after refresh:', data)
                setFollowers(data.followers || [])
              } else {
                console.error('Failed to fetch followers after token refresh')
                // If still fails, use public endpoint
                await fetchFollowersWithUserId(currentUserData._id || currentUserData.id)
              }
            } else {
              const errorData = await refreshResponse.json()
              
              // If 403 with requiresRelogin (artist 2FA), use public endpoint
              if (refreshResponse.status === 403 && errorData.requiresRelogin) {
                // This is expected for artist accounts with 2FA - using public endpoint instead
                await fetchFollowersWithUserId(currentUserData._id || currentUserData.id)
                return
              }
              
              // For other errors, try direct fetch
              await fetchFollowersWithUserId(currentUserData._id || currentUserData.id)
            }
          } catch (refreshError) {
            // Fallback to direct fetch (expected for artist accounts with 2FA)
            await fetchFollowersWithUserId(currentUserData._id || currentUserData.id)
          }
        } else {
          // No refresh token available, use public endpoint
          await fetchFollowersWithUserId(currentUserData._id || currentUserData.id)
        }
      } else if (response.ok) {
        const data = await response.json()
        console.log('Followers fetched:', data)
        setFollowers(data.followers || [])
      } else {
        // If authenticated endpoint fails, use public endpoint (expected for artist 2FA accounts)
        await fetchFollowersWithUserId(currentUserData._id || currentUserData.id)
      }
    } catch (err) {
      console.error('Error fetching followers:', err)
      setError('Unable to load followers')
    } finally {
      setLoading(false)
    }
  }

  // Fallback function to fetch followers using user ID directly (public endpoint)
  const fetchFollowersWithUserId = async (userId: string) => {
    try {
      console.log('Attempting to fetch followers with user ID:', userId)
      const response = await fetch(`${API_BASE_URL}/api/users/${userId}/followers`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Followers fetched via public endpoint:', data)
        setFollowers(data.followers || [])
      } else {
        console.error('Public endpoint also failed')
        setFollowers([])
      }
    } catch (error) {
      console.error('Error fetching followers with user ID:', error)
      setFollowers([])
    }
  }

  useEffect(() => {
    // Wait for auth to finish loading
    if (isAuthLoading) {
      console.log('AuthContext is still loading...')
      return
    }

    fetchFollowers()
  }, [currentUser, isAuthLoading])

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-400">{isAuthLoading ? 'Authenticating...' : 'Loading followers...'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">Error</h2>
          <p className="text-gray-400 mb-6">{error}</p>
          <button
            onClick={() => router.back()}
            className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-lg transition-all"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen pt-14 md:pt-0 bg-background"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      {pullRefresh && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50 bg-gray-800/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm text-white font-medium">Refreshing...</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-primary transition-colors p-2 -ml-2 rounded-full hover:bg-gray-800"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl font-black truncate text-text-primary">Your Followers</h1>
              <p className="text-xs sm:text-sm text-gray-400 truncate">{followers.length} people follow you</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        {followers.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {followers.map((follower) => (
              <Link
                key={follower._id}
                href={`/profile/${follower._id}`}
                className="group rounded-xl sm:rounded-2xl p-4 sm:p-6 active:scale-[0.98] mx-surface"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-700 group-hover:border-primary/40 transition-colors">
                    {follower.avatar ? (
                      <img
                        src={follower.avatar}
                        alt={follower.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-lg sm:text-xl">
                        {follower.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm sm:text-base truncate group-hover:text-primary transition-colors text-text-primary">
                      {follower.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-400 truncate">{follower.email}</p>
                    {follower.role === 'creator' && (
                      <span className="inline-block mt-1 text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 bg-primary/20 text-primary rounded-full font-medium">
                        {follower.creatorType || 'Creator'}
                      </span>
                    )}
                  </div>
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 group-hover:text-primary transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 bg-gray-800/10 rounded-2xl border border-dashed border-gray-700/50 mx-4 sm:mx-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
              <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-base sm:text-lg font-bold mb-2 text-text-primary">No Followers Yet</h3>
            <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto mb-4 sm:mb-6 px-4">
              When people follow you, they'll appear here. Keep creating great music!
            </p>
            <button
              onClick={() => router.push('/upload')}
              className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/20 text-sm sm:text-base"
            >
              Upload Music
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
