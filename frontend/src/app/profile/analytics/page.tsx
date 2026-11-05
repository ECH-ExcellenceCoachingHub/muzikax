'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface AnalyticsData {
  totalTracks: number
  totalPlays: number
  totalUniquePlays: number
  monthlyListeners: number
  totalLikes: number
  topCountries: { country: string; count: number }[]
}

interface TrackAnalytics {
  _id: string
  title: string
  coverURL?: string
  plays: number
  uniquePlays: number
  likes: number
  type: string
  createdAt: string
}

export default function ProfileAnalytics() {
  const router = useRouter()
  const { user, logout } = useAuth()
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [trackAnalytics, setTrackAnalytics] = useState<TrackAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'month' | 'week'>('all')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!user) {
          router.push('/auth/login?redirect=/profile/analytics')
          return
        }

        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        
        // Fetch creator analytics
        const analyticsResponse = await fetch(`${API_BASE_URL}/api/creator/analytics`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!analyticsResponse.ok) {
          throw new Error('Failed to fetch analytics')
        }
        
        const analyticsData = await analyticsResponse.json()
        setAnalytics(analyticsData)

        // Fetch detailed track analytics
        const tracksResponse = await fetch(`${API_BASE_URL}/api/creator/tracks?limit=100`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json()
          setTrackAnalytics(tracksData.tracks || [])
        }

      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError('Unable to load analytics data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchAnalytics()
  }, [user, router])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-400">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (error || !analytics) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">Error Loading Analytics</h2>
          <p className="text-gray-400 mb-6 max-w-md">{error || 'Analytics data not available'}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => router.push('/profile')}
              className="bg-primary hover:bg-primary/80 text-white font-bold py-2 px-6 rounded-lg transition-all active:scale-95"
            >
              Back to Profile
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-gray-800 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-lg transition-all active:scale-95"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-14 md:pt-0 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-gray-400 hover:text-primary transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-black text-text-primary">Analytics Dashboard</h1>
                <p className="text-sm text-gray-400">Track your music performance</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-600/10 hover:bg-red-600/20 text-red-500 font-bold py-2 px-4 rounded-lg transition-all active:scale-95 border border-red-600/20"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Time Period Selector */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setSelectedPeriod('all')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              selectedPeriod === 'all'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setSelectedPeriod('month')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              selectedPeriod === 'month'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setSelectedPeriod('week')}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
              selectedPeriod === 'week'
                ? 'bg-primary text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            Last 7 Days
          </button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-6 border border-primary/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs text-primary font-bold uppercase tracking-wider">+12%</span>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Plays</p>
            <p className="text-3xl font-black text-white">{analytics.totalPlays.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-[#10B981]/10 to-[#10B981]/5 rounded-2xl p-6 border border-[#10B981]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#10B981]/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#10B981]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <span className="text-xs text-[#10B981] font-bold uppercase tracking-wider">Active</span>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Monthly Listeners</p>
            <p className="text-3xl font-black text-white">{analytics.monthlyListeners.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-[#EF4444]/10 to-[#EF4444]/5 rounded-2xl p-6 border border-[#EF4444]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#EF4444]/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#EF4444]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs text-[#EF4444] font-bold uppercase tracking-wider">+8%</span>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Unique Listeners</p>
            <p className="text-3xl font-black text-white">{analytics.totalUniquePlays.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#8B5CF6]/5 rounded-2xl p-6 border border-[#8B5CF6]/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-[#8B5CF6]/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#8B5CF6]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="text-xs text-[#8B5CF6] font-bold uppercase tracking-wider">+15%</span>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Likes</p>
            <p className="text-3xl font-black text-white">{analytics.totalLikes.toLocaleString()}</p>
          </div>

          <div className="bg-gradient-to-br from-primary-light/10 to-primary-light/5 rounded-2xl p-6 border border-primary-light/20">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-primary-light/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-xs text-primary-light font-bold uppercase tracking-wider">Active</span>
            </div>
            <p className="text-gray-400 text-sm font-medium mb-1">Total Tracks</p>
            <p className="text-3xl font-black text-white">{analytics.totalTracks}</p>
          </div>
        </div>

        {/* Geography Section */}
        {analytics.topCountries && analytics.topCountries.length > 0 && (
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[#6366F1]/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-[#6366F1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-black text-text-primary">Listener Geography</h2>
                <p className="text-sm text-gray-400">Where your fans are listening from</p>
              </div>
            </div>

            <div className="space-y-4">
              {analytics.topCountries.map((item, index) => (
                <div key={index} className="flex items-center gap-4">
                  <span className="text-lg font-bold text-gray-500 w-6">{index + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-white">{item.country}</span>
                      <span className="text-sm text-gray-400 font-medium">{item.count.toLocaleString()} listeners</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] rounded-full transition-all duration-500"
                        style={{ width: `${(item.count / analytics.topCountries[0].count) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Track Performance */}
        <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18.896 0H1.104C.494 0 0 .494 0 1.104v17.793C0 19.506.494 20 1.104 20h9.58v-7.745H8.076V9.237h2.608V7.01c0-2.583 1.578-3.99 3.883-3.99 1.104 0 2.052.082 2.329.119v2.7h-1.598c-1.254 0-1.501.597-1.501 1.47v1.926h3.002l-.39 3.018h-2.612V20h5.11c.61 0 1.104-.494 1.104-1.104V1.104C20 .494 19.506 0 18.896 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-text-primary">Track Performance</h2>
              <p className="text-sm text-gray-400">How each of your tracks is performing</p>
            </div>
          </div>

          {trackAnalytics.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {trackAnalytics.map((track) => (
                <Link
                  key={track._id}
                  href={`/tracks/${track._id}`}
                  className="group rounded-xl overflow-hidden mx-surface"
                >
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={track.coverURL || '/placeholder-cover.jpg'}
                      alt={track.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-cover.jpg'
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-primary text-white font-black uppercase rounded">
                          {track.type}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold group-hover:text-primary transition-colors truncate mb-3 text-text-primary">
                      {track.title}
                    </h3>
                    
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Plays</p>
                        <p className="text-lg font-black text-white">{track.plays.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Unique</p>
                        <p className="text-lg font-black text-[#10B981]">{track.uniquePlays?.toLocaleString() || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Likes</p>
                        <p className="text-lg font-black text-[#EF4444]">{track.likes.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm">No tracks uploaded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
