'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'

interface User {
  id: string
  name: string
  email: string
  role: string
  creatorType?: string
  createdAt: string
}

interface Track {
  id: string
  title: string
  creatorId: {
    name: string
  }
  plays: number
  likes: number
  createdAt: string
}

interface AnalyticsData {
  totalUsers: number
  totalCreators: number
  totalAdmins: number
  totalTracks: number
  totalPlays: number
  trendingTracks: Track[]
  recentUsers: User[]
}

export default function AdminDashboard() {
  const [timeRange, setTimeRange] = useState('30d')
  const router = useRouter()
  const { isAuthenticated, userRole } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Access control is handled once in src/app/admin/layout.tsx.
  useEffect(() => {
    fetchAdminData()
  }, [])

  const fetchAdminData = async () => {
    try {
      setLoading(true)
      
      // Fetch analytics data
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/analytics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data')
      }
      
      const data = await response.json()
      setAnalytics(data)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching admin data:', err)
      setError('Failed to fetch data')
      setLoading(false)
    }
  }

  // Stats data based on real analytics
  const stats = analytics ? [
    { title: 'Total Users', value: analytics.totalUsers.toString(), change: '+12%', icon: 'users', color: 'from-primary to-primary' },
    { title: 'Active Creators', value: analytics.totalCreators.toString(), change: '+8%', icon: 'creator', color: 'from-primary-light to-primary-light' },
    { title: 'Total Tracks', value: analytics.totalTracks.toString(), change: '+15%', icon: 'music', color: 'from-[#6366F1] to-[#6366F1]' },
    { title: 'Total Plays', value: analytics.totalPlays.toLocaleString(), change: '+18%', icon: 'play', color: 'from-[#10B981] to-[#10B981]' }
  ] : []

  return (
    <div>

          {/* Time Range Selector */}
          <div className="flex justify-end mb-6 sm:mb-8">
            <div className="inline-flex rounded-lg bg-gray-800/50 p-1">
              {['7d', '30d', '90d', '1y'].map((range) => (
                <button
                  key={range}
                  type="button"
                  className={`px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
            {stats.map((stat, index) => (
              <div key={index} className="card-bg rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary/10">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-gray-400 text-xs sm:text-sm mb-1">{stat.title}</p>
                    <p className="text-xl sm:text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs sm:text-sm text-green-500 mt-1">{stat.change} from last period</p>
                  </div>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <div className="text-white">
                      {stat.icon === 'users' && (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                      )}
                      {stat.icon === 'creator' && (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                        </svg>
                      )}
                      {stat.icon === 'music' && (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                        </svg>
                      )}
                      {stat.icon === 'play' && (
                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Users */}
          <div className="card-bg rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">Recent Users</h2>
              <button 
                onClick={() => router.push('/admin/users')}
                className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View All Users
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4">{error}</div>
            ) : analytics ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs sm:text-sm border-b border-gray-800">
                      <th className="pb-3 font-normal">User</th>
                      <th className="pb-3 font-normal">Role</th>
                      <th className="pb-3 font-normal">Status</th>
                      <th className="pb-3 font-normal">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {analytics.recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 sm:py-4">
                          <div className="font-medium text-white text-sm sm:text-base">{user.name}</div>
                          <div className="text-gray-400 text-xs sm:text-sm">{user.email}</div>
                        </td>
                        <td className="py-3 sm:py-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-500/20 text-purple-400' 
                              : user.role === 'creator' 
                                ? 'bg-blue-500/20 text-blue-400' 
                                : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.role}
                            {user.creatorType && ` (${user.creatorType})`}
                          </span>
                        </td>
                        <td className="py-3 sm:py-4">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400">
                            Active
                          </span>
                        </td>
                        <td className="py-3 sm:py-4 text-gray-400 text-sm">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>

          {/* Trending Tracks */}
          <div className="card-bg rounded-2xl p-4 sm:p-6">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-bold text-white">Trending Tracks</h2>
              <button 
                onClick={() => router.push('/admin/content')}
                className="text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
              >
                View All Content
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <div className="text-red-500 text-center py-4">{error}</div>
            ) : analytics ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-500 text-xs sm:text-sm border-b border-gray-800">
                      <th className="pb-3 font-normal">Track</th>
                      <th className="pb-3 font-normal">Creator</th>
                      <th className="pb-3 font-normal">Plays</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {analytics.trendingTracks.map((track) => (
                      <tr key={track.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="py-3 sm:py-4">
                          <div className="font-medium text-white text-sm sm:text-base">{track.title}</div>
                        </td>
                        <td className="py-3 sm:py-4 text-gray-400 text-sm">
                          {track.creatorId?.name || 'Unknown'}
                        </td>
                        <td className="py-3 sm:py-4 text-gray-400 text-sm">
                          {track.plays.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </div>
    </div>
  )
}
