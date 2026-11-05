'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '../../contexts/AuthContext'
import { useLanguage } from '../../contexts/LanguageContext'
import Link from 'next/link'
import { FaArrowLeft } from 'react-icons/fa'
import { getUserProfile, getUserFollowers, getUserFollowing, getCreatorTracks } from '@/services/userService'
import { getRecentlyPlayed } from '@/services/recentlyPlayedService'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface UserProfile {
  _id: string
  name: string
  email: string
  avatar?: string
  bio?: string
  followersCount?: number
  followingCount?: number
  creatorType?: string
  role?: string
  genres?: string[]
  whatsappContact?: string
}

interface Track {
  _id: string
  title: string
  artist: string
  coverURL?: string
  plays?: number
  likes?: number
  type?: 'song' | 'beat' | 'mix'
}

interface AnalyticsData {
  totalTracks: number
  totalPlays: number
  totalUniquePlays: number
  monthlyListeners: number
  totalLikes: number
  topCountries: { country: string; count: number }[]
}

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

type TabType = 'overview' | 'tracks' | 'analytics' | 'followers' | 'following' | 'recentlyPlayed'

export default function LibraryPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { logout, isLoading: isAuthLoading } = useAuth()
  const { t } = useLanguage()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [followers, setFollowers] = useState<User[]>([])
  const [following, setFollowing] = useState<User[]>([])
  const [recentlyPlayed, setRecentlyPlayed] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  // Get tab from URL query parameter
  useEffect(() => {
    const tab = searchParams.get('tab') as TabType
    if (tab && ['overview', 'tracks', 'analytics', 'followers', 'following', 'recentlyPlayed'].includes(tab)) {
      setActiveTab(tab)
    } else {
      setActiveTab('overview')
    }
  }, [searchParams])

  // Fetch all data on mount
  useEffect(() => {
    if (isAuthLoading) return

    let isMounted = true
    
    const fetchData = async () => {
      try {
        setLoading(true)
        
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        
        if (!token) {
          router.push('/auth/login?redirect=/library')
          setLoading(false)
          return
        }

        // Fetch user profile using dedicated service
        const userProfile = await getUserProfile()
        if (!userProfile) {
          router.push('/auth/login?redirect=/library')
          setLoading(false)
          return
        }
        
        const currentProfile = {
          _id: userProfile.id,
          name: userProfile.name,
          email: userProfile.email,
          avatar: userProfile.avatar,
          bio: userProfile.bio,
          followersCount: userProfile.followersCount || 0,
          followingCount: userProfile.followingCount || 0,
          creatorType: userProfile.creatorType,
          role: userProfile.role,
          genres: userProfile.genres,
          whatsappContact: userProfile.whatsappContact
        }
        
        if (isMounted) {
          setProfile(currentProfile)
        }

        // Fetch tracks using dedicated service
        try {
          const tracksData = await getCreatorTracks()
          if (isMounted) setTracks(tracksData)
        } catch (err) {
          console.error('Error fetching tracks:', err)
        }

        // Fetch analytics (only for creators)
        try {
          const analyticsResponse = await fetch(`${API_BASE_URL}/api/creator/analytics`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          
          if (analyticsResponse.ok) {
            const analyticsData = await analyticsResponse.json()
            if (isMounted) setAnalytics(analyticsData)
          }
        } catch (err) {
          console.error('Error fetching analytics:', err)
        }

        // Fetch followers and following using the current profile ID
        if (currentProfile._id) {
          try {
            const followersData = await getUserFollowers(currentProfile._id)
            if (isMounted) setFollowers(followersData)
          } catch (err) {
            console.error('Error fetching followers:', err)
          }

          try {
            const followingData = await getUserFollowing(currentProfile._id)
            if (isMounted) setFollowing(followingData)
          } catch (err) {
            console.error('Error fetching following:', err)
          }
        }

        // Fetch recently played tracks from API
        try {
          const recentlyPlayedData = await getRecentlyPlayed()
          if (isMounted && recentlyPlayedData && recentlyPlayedData.length > 0) {
            // Transform API data to match Track interface
            const transformedTracks = recentlyPlayedData.slice(0, 10).map((track: any) => ({
              _id: track._id || track.id,
              title: track.title,
              artist: typeof track.creatorId === 'object' && track.creatorId !== null ? track.creatorId.name : (track.artist || 'Unknown Artist'),
              coverURL: track.coverURL || track.coverImage,
              plays: track.plays || 0,
              likes: track.likes || 0,
              type: track.type || 'song'
            }))
            setRecentlyPlayed(transformedTracks)
          }
        } catch (err) {
          console.error('Error fetching recently played:', err)
          // Silently fail - recently played is not critical
        }

      } catch (err) {
        console.error('Error fetching library data:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchData()
    
    return () => {
      isMounted = false
    }
  }, [router, isAuthLoading])

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (isAuthLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-400 font-medium">Loading your library...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">Please Log In</h2>
          <p className="text-gray-400 mb-6">You need to be logged in to view your library</p>
          <button
            onClick={() => router.push('/auth/login?redirect=/library')}
            className="inline-block bg-primary hover:bg-primary/80 text-white py-2 px-6 rounded-lg transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 md:pb-8 pt-14 md:pt-0 bg-background">
      {/* Header - Desktop & Mobile */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button */}
              <button
                onClick={() => router.back()}
                className="md:hidden text-gray-400 hover:text-white transition-colors p-2 -ml-2"
                aria-label="Go back"
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-black text-text-primary">{t('myLibrary')}</h1>
                <p className="text-sm text-gray-400">{t('manageMusicProfile')}</p>
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

      {/* Profile Summary Card - Enhanced for Desktop */}
      <div className="container mx-auto px-4 py-6">
        <div className="bg-gradient-to-br from-primary/10 via-primary-light/5 to-primary-light/10 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mb-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-gradient-to-r from-primary to-primary-light flex-shrink-0 shadow-lg ring-2 ring-white/10">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold text-xl">
                    {profile.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-xl md:text-2xl font-black text-text-primary">{profile.name}</h2>
                <p className="text-sm text-gray-400">{profile.email}</p>
                {profile.role === 'creator' && (
                  <span className="inline-block mt-2 text-xs px-3 py-1 bg-gradient-to-r from-primary/30 to-primary-light/30 text-white rounded-full font-semibold border border-primary/40">
                    {profile.creatorType || 'Creator'}
                  </span>
                )}
              </div>
            </div>
            
            {/* Quick Stats - Desktop Layout */}
            <div className="grid grid-cols-3 gap-4 md:gap-6 pt-4 md:pt-0 md:border-l md:border-white/10 md:pl-6">
              <div className="text-center cursor-pointer hover:scale-105 transition-transform group" onClick={() => router.push('/library?tab=tracks')}>
                <p className="text-2xl md:text-3xl font-black transition-all text-text-primary">{tracks.length}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-medium">Tracks</p>
              </div>
              <div className="text-center cursor-pointer hover:scale-105 transition-transform group" onClick={() => router.push('/library?tab=followers')}>
                <p className="text-2xl md:text-3xl font-black transition-all text-text-primary">{(profile.followersCount || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-medium">Followers</p>
              </div>
              <div className="text-center cursor-pointer hover:scale-105 transition-transform group" onClick={() => router.push('/library?tab=following')}>
                <p className="text-2xl md:text-3xl font-black transition-all text-text-primary">{(profile.followingCount || 0).toLocaleString()}</p>
                <p className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-medium">Following</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Navigation - Responsive Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          {/* My Tracks */}
          <button
            onClick={() => router.push('/library?tab=tracks')}
            className="p-4 rounded-2xl bg-gradient-to-br from-primary-light/15 to-primary-light/5 border border-primary-light/30 hover:border-primary-light/50 transition-all group active:scale-[0.98]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary-light/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-primary-light" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">{t('myTracks')}</span>
              <span className="text-xs text-gray-400 mt-1">{tracks.length} songs</span>
            </div>
          </button>

          {/* Analytics */}
          <button
            onClick={() => router.push('/library?tab=analytics')}
            className="p-4 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/30 hover:border-primary/50 transition-all group active:scale-[0.98]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">{t('analytics')}</span>
              <span className="text-xs text-gray-400 mt-1">Insights</span>
            </div>
          </button>

          {/* Monetization - Only for creators */}
          {profile.role === 'creator' && (
            <button
              onClick={() => router.push('/monetization')}
              className="p-4 rounded-2xl bg-gradient-to-br from-[#10B981]/15 to-[#10B981]/5 border border-[#10B981]/30 hover:border-[#10B981]/50 transition-all group active:scale-[0.98]"
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-white">{t('earn')}</span>
                <span className="text-xs text-gray-400 mt-1">Earn money</span>
              </div>
            </button>
          )}

          {/* Settings */}
          <button
            onClick={() => router.push('/settings')}
            className={`p-4 rounded-2xl bg-gradient-to-br from-[#EF4444]/15 to-[#EF4444]/5 border border-[#EF4444]/30 hover:border-[#EF4444]/50 transition-all group active:scale-[0.98] ${
              profile.role !== 'creator' ? 'col-span-2 md:col-span-1' : ''
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#EF4444]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-[#EF4444]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">{t('settings')}</span>
              <span className="text-xs text-gray-400 mt-1">General</span>
            </div>
          </button>

          {/* Followers - Hidden on mobile, visible on desktop */}
          <button
            onClick={() => router.push('/library?tab=followers')}
            className="hidden md:flex p-4 rounded-2xl bg-gradient-to-br from-[#10B981]/15 to-[#10B981]/5 border border-[#10B981]/30 hover:border-[#10B981]/50 transition-all group active:scale-[0.98]"
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-[#10B981]/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-[#10B981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <span className="text-sm font-semibold text-white">{t('followers')}</span>
              <span className="text-xs text-gray-400 mt-1">{(profile.followersCount || 0).toLocaleString()}</span>
            </div>
          </button>
        </div>

        {/* Important Links - Privacy, Terms, Help */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Privacy Policy */}
          <Link
            href="/privacy"
            className="p-3 rounded-xl group active:scale-[0.98] flex items-center gap-3 mx-surface"
          >
            <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-white block">{t('privacyPolicy')}</span>
              <span className="text-xs text-gray-400">Your data</span>
            </div>
          </Link>

          {/* Terms of Use */}
          <Link
            href="/terms"
            className="p-3 rounded-xl group active:scale-[0.98] flex items-center gap-3 mx-surface"
          >
            <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-white block">{t('termsOfUse')}</span>
              <span className="text-xs text-gray-400">Guidelines</span>
            </div>
          </Link>

          {/* Help Center */}
          <Link
            href="/help"
            className="p-3 rounded-xl group active:scale-[0.98] flex items-center gap-3 mx-surface"
          >
            <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-white block">{t('helpCenter')}</span>
              <span className="text-xs text-gray-400">Support</span>
            </div>
          </Link>

          {/* Contact Us */}
          <Link
            href="/contact"
            className="p-3 rounded-xl group active:scale-[0.98] flex items-center gap-3 mx-surface"
          >
            <div className="w-10 h-10 rounded-full bg-gray-700/50 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div className="text-left">
              <span className="text-sm font-semibold text-white block">{t('contactUs')}</span>
              <span className="text-xs text-gray-400">Get in touch</span>
            </div>
          </Link>
        </div>

        {/* Edit Profile & Settings Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {/* Edit Profile */}
          <button
            onClick={() => router.push('/edit-profile')}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/40 hover:border-primary/60 transition-all group active:scale-[0.98] flex items-center gap-3 shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <span className="text-base font-bold text-white block">{t('editProfile')}</span>
              <p className="text-xs text-gray-400 mt-0.5">{t('updateInfo')}</p>
            </div>
            <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* General Settings */}
          <button
            onClick={() => router.push('/settings')}
            className="w-full p-4 rounded-2xl bg-gradient-to-r from-primary/20 via-primary/10 to-transparent border border-primary/40 hover:border-primary/60 transition-all group active:scale-[0.98] flex items-center gap-3 shadow-lg"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="text-left flex-1">
              <span className="text-base font-bold text-white block">{t('settings')}</span>
              <p className="text-xs text-gray-400 mt-0.5">Manage account & preferences</p>
            </div>
            <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Recently Played */}
        {recentlyPlayed.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-text-primary">Recently Played</h3>
              <button
                onClick={() => router.push('/history')}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                See All
              </button>
            </div>
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide -mx-4 px-4">
              {recentlyPlayed.map((track) => (
                <div
                  key={track._id}
                  className="flex-shrink-0 w-36 rounded-xl p-3 cursor-pointer group mx-surface"
                  onClick={() => router.push(`/player?id=${track._id}`)}
                >
                  <div className="relative mb-3">
                    <img
                      src={track.coverURL || '/default-cover.jpg'}
                      alt={track.title}
                      className="w-full aspect-square object-cover rounded-lg group-hover:scale-[1.04] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                      <span className="mx-card-play !static"><svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg></span>
                    </div>
                  </div>
                  <h4 className="text-sm font-semibold text-white truncate">{track.title}</h4>
                  <p className="text-xs text-gray-400 truncate mt-1">{track.artist}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation - Inline Tabs for Mobile (Not Fixed Bottom) */}
        <div className="md:hidden sticky top-14 z-40 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 -mx-4 px-4 mb-6">
          <div className="flex gap-2 py-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => router.push('/library?tab=overview')}
              className="mx-card-play !static pointer-events-auto hover:bg-primary-hover [&_svg]:w-4 [&_svg]:h-4"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>{t('home')}</span>
            </button>
            
            <button
              onClick={() => router.push('/library?tab=tracks')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${
                activeTab === 'tracks' 
                  ? 'bg-primary-light text-gray-900' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span>{t('yourTracks')}</span>
            </button>
            
            <button
              onClick={() => router.push('/library?tab=recentlyPlayed')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${
                activeTab === 'recentlyPlayed' 
                  ? 'bg-primary-light text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t('recentlyPlayed')}</span>
            </button>
            
            <button
              onClick={() => router.push('/library?tab=followers')}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all text-sm font-medium ${
                activeTab === 'followers' || activeTab === 'following'
                  ? 'bg-[#10B981] text-white' 
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span>{t('followers')}</span>
            </button>
          </div>
        </div>

        {/* Overview Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => router.push('/edit-profile')}
                className="bg-gradient-to-br from-primary/25 to-primary/10 backdrop-blur-sm rounded-2xl p-5 border border-primary/40 hover:border-primary/60 transition-all active:scale-[0.98] shadow-lg"
              >
                <svg className="w-8 h-8 text-primary mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <h3 className="font-bold mb-1 text-text-primary">{t('editProfile')}</h3>
                <p className="text-xs text-gray-400">{t('updateInfo')}</p>
              </button>
              
              <button
                onClick={() => router.push('/upload')}
                className="bg-gradient-to-br from-primary-light/25 to-primary-light/10 backdrop-blur-sm rounded-2xl p-5 border border-primary-light/40 hover:border-primary-light/60 transition-all active:scale-[0.98] shadow-lg"
              >
                <svg className="w-8 h-8 text-primary-light mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <h3 className="font-bold mb-1 text-text-primary">{t('uploadNew')}</h3>
                <p className="text-xs text-gray-400">{t('newTrack')}</p>
              </button>
            </div>

            {/* Recently Played Section */}
            {recentlyPlayed.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-light to-primary flex items-center justify-center shadow-lg">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-text-primary">{t('recentlyPlayed')}</h3>
                      <p className="text-xs text-gray-400">{t('yourListeningHistory')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.push('/recently-played')}
                      className="text-primary-light text-sm font-bold hover:underline"
                    >
                      View All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {recentlyPlayed.slice(0, 5).map((track, index) => (
                    <Link
                      key={`${track._id}-${index}`}
                      href={`/player?id=${track._id}`}
                      className="group rounded-xl overflow-hidden mx-surface"
                    >
                      <div className="aspect-square relative overflow-hidden">
                        <img
                          src={track.coverURL || '/default-cover.jpg'}
                          alt={track.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                        />
                        <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                          <span className="mx-card-play !static"><svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg></span>
                        </div>
                      </div>
                      <div className="p-2">
                        <h3 className="font-semibold text-xs truncate text-text-primary">{track.title}</h3>
                        <p className="text-[10px] text-gray-400 truncate mt-0.5">{track.artist}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Tracks Preview */}
            {tracks.length > 0 && (
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text-primary">Your Tracks</h3>
                  <button
                    onClick={() => router.push('/library?tab=tracks')}
                    className="mx-card-play !static pointer-events-auto hover:bg-primary-hover [&_svg]:w-4 [&_svg]:h-4"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-3">
                  {tracks.slice(0, 3).map((track) => (
                    <Link
                      key={track._id}
                      href={`/tracks/${track._id}`}
                      className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl hover:bg-gray-700/50 transition-all border border-white/5 hover:border-primary/30"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
                        <img src={track.coverURL || '/placeholder-cover.jpg'} alt={track.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate text-sm">{track.title}</p>
                        <p className="text-xs text-gray-400">{track.plays || 0} plays</p>
                      </div>
                      <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Analytics Preview */}
            {analytics && (
              <div className="bg-gradient-to-br from-primary/15 via-primary-light/10 to-primary/5 backdrop-blur-xl rounded-2xl border border-primary/40 p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-text-primary">{t('analytics')}</h3>
                  <button
                    onClick={() => router.push('/library?tab=analytics')}
                    className="text-primary text-sm font-bold hover:underline"
                  >
                    View All
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                    <p className="text-2xl font-black text-text-primary">{analytics.totalPlays.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-medium">Total Plays</p>
                  </div>
                  <div className="bg-gray-800/50 rounded-xl p-4 border border-white/5">
                    <p className="text-2xl font-black text-text-primary">{analytics.monthlyListeners.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mt-1 font-medium">Monthly</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'tracks' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-black text-text-primary">{t('yourTracks')}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'} uploaded
                </p>
              </div>
              <button
                onClick={() => router.push('/upload')}
                className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-bold py-2 px-4 rounded-lg transition-all active:scale-95 text-sm flex items-center gap-2 w-full sm:w-auto justify-center shadow-lg"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Upload New
              </button>
            </div>
            
            {tracks.length > 0 ? (
              <>
                {/* Refresh indicator */}
                <div className="flex justify-end mb-3">
                  <button
                    onClick={async () => {
                      setLoading(true)
                      try {
                        const tracksData = await getCreatorTracks()
                        setTracks(tracksData)
                      } catch (err) {
                        console.error('Error refreshing tracks:', err)
                      }
                      setLoading(false)
                    }}
                    disabled={loading}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 disabled:opacity-50"
                  >
                    <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                {tracks.map((track) => (
                  <Link
                    key={track._id}
                    href={`/tracks/${track._id}`}
                    className="group rounded-2xl overflow-hidden mx-surface"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img src={track.coverURL || '/placeholder-cover.jpg'} alt={track.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
                      <div className="absolute bottom-2 left-2">
                        <span className="px-2 py-1 bg-gradient-to-r from-primary to-primary-hover text-[10px] md:text-xs font-black text-white uppercase rounded shadow-md">
                          {track.type || 'Track'}
                        </span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="p-3 md:p-4">
                      <h3 className="font-bold group-hover:text-primary transition-colors truncate text-sm md:text-base text-text-primary">
                        {track.title}
                      </h3>
                      <p className="text-gray-400 text-xs md:text-sm mt-1">
                        {track.plays || 0} plays • {track.likes || 0} likes
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
              </>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-800/20 to-gray-800/10 rounded-2xl border border-dashed border-gray-700/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">No tracks yet</h3>
                <p className="text-gray-500 text-sm mb-4">Start uploading your music!</p>
                <button
                  onClick={() => router.push('/upload')}
                  className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95 shadow-lg"
                >
                  Upload First Track
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div>
            {analytics ? (
              <>
                <h2 className="text-xl font-black mb-4 text-text-primary">{t('analytics')} Dashboard</h2>
                
                {/* Overview Stats - Responsive Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-primary/15 to-primary/5 rounded-2xl p-5 border border-primary/30 shadow-lg">
                    <p className="text-2xl font-black mb-1 text-text-primary">{analytics.totalPlays.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Total Plays</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#10B981]/15 to-[#10B981]/5 rounded-2xl p-5 border border-[#10B981]/30 shadow-lg">
                    <p className="text-2xl font-black mb-1 text-text-primary">{analytics.monthlyListeners.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Monthly Listeners</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#EF4444]/15 to-[#EF4444]/5 rounded-2xl p-5 border border-[#EF4444]/30 shadow-lg">
                    <p className="text-2xl font-black mb-1 text-text-primary">{analytics.totalUniquePlays.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Unique Listeners</p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-primary-light/15 to-primary-light/5 rounded-2xl p-5 border border-primary-light/30 shadow-lg">
                    <p className="text-2xl font-black mb-1 text-text-primary">{analytics.totalLikes.toLocaleString()}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Total Likes</p>
                  </div>
                </div>

                {/* Top Countries - Responsive Layout */}
                {analytics.topCountries && analytics.topCountries.length > 0 && (
                  <div className="bg-gradient-to-br from-gray-800/40 to-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/10 p-5 shadow-xl">
                    <h3 className="font-bold mb-4 text-text-primary">Top Countries</h3>
                    <div className="space-y-3">
                      {analytics.topCountries.slice(0, 5).map((item, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-bold text-white">{item.country}</span>
                            <span className="text-xs text-gray-400">{item.count.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full"
                              style={{ width: `${(item.count / analytics.topCountries[0].count) * 100}%` }}
                            ></div>
                          </div>
                        </div>))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-800/20 to-gray-800/10 rounded-2xl border border-dashed border-gray-700/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">Analytics Not Available</h3>
                <p className="text-gray-500 text-sm">Only available for creators and DJs</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-black text-text-primary">{t('followers')}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {followers.length} {followers.length === 1 ? 'follower' : 'followers'}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (profile && profile._id) {
                    setLoading(true)
                    try {
                      const followersData = await getUserFollowers(profile._id)
                      setFollowers(followersData)
                    } catch (err) {
                      console.error('Error refreshing followers:', err)
                    }
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            
            {followers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {followers.map((follower) => (
                  <Link
                    key={follower._id}
                    href={`/profile/${follower._id}`}
                    className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-800/40 to-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-gray-800/60 hover:border-primary/40 transition-all shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
                      {follower.avatar ? (
                        <img src={follower.avatar} alt={follower.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold">
                          {follower.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate text-text-primary">{follower.name}</h3>
                      <p className="text-xs text-gray-400 truncate">{follower.email}</p>
                      {follower.role === 'creator' && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gradient-to-r from-primary/30 to-primary-light/30 text-white rounded-full font-semibold border border-primary/40">
                          {follower.creatorType || 'Creator'}
                        </span>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-800/20 to-gray-800/10 rounded-2xl border border-dashed border-gray-700/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">No Followers Yet</h3>
                <p className="text-gray-500 text-sm mb-4">Keep creating great music!</p>
                <button
                  onClick={() => router.push('/upload')}
                  className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95 shadow-lg"
                >
                  Upload Music
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-black text-text-primary">Following</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {following.length} {following.length === 1 ? 'creator' : 'creators'}
                </p>
              </div>
              <button
                onClick={async () => {
                  if (profile && profile._id) {
                    setLoading(true)
                    try {
                      const followingData = await getUserFollowing(profile._id)
                      setFollowing(followingData)
                    } catch (err) {
                      console.error('Error refreshing following:', err)
                    }
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 disabled:opacity-50 w-full sm:w-auto justify-center"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </button>
            </div>
            
            {following.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                {following.map((creator) => (
                  <Link
                    key={creator._id}
                    href={`/profile/${creator._id}`}
                    className="flex items-center gap-3 p-4 bg-gradient-to-br from-gray-800/40 to-gray-800/20 backdrop-blur-xl rounded-2xl border border-white/10 hover:bg-gray-800/60 hover:border-primary/40 transition-all shadow-lg"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700 flex-shrink-0">
                      {creator.avatar ? (
                        <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white font-bold">
                          {creator.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold truncate text-text-primary">{creator.name}</h3>
                      <p className="text-xs text-gray-400 truncate">{creator.email}</p>
                      {creator.role === 'creator' && (
                        <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gradient-to-r from-primary/30 to-primary-light/30 text-white rounded-full font-semibold border border-primary/40">
                          {creator.creatorType || 'Creator'}
                        </span>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-500 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-800/20 to-gray-800/10 rounded-2xl border border-dashed border-gray-700/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">Not Following Anyone</h3>
                <p className="text-gray-500 text-sm mb-4">Discover amazing creators!</p>
                <button
                  onClick={() => router.push('/explore')}
                  className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-bold py-3 px-8 rounded-xl transition-all active:scale-95 shadow-lg"
                >
                  Discover Creators
                </button>
              </div>
            )}
          </div>
        )}

        {/* Recently Played Tab */}
        {activeTab === 'recentlyPlayed' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-black text-text-primary">{t('recentlyPlayed')}</h2>
                <p className="text-sm text-gray-400 mt-1">
                  {recentlyPlayed.length} {recentlyPlayed.length === 1 ? 'track' : 'tracks'}
                </p>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('recentlyPlayed')
                  setRecentlyPlayed([])
                }}
                disabled={recentlyPlayed.length === 0}
                className="text-xs text-[#EF4444] hover:text-[#EF4444]/80 font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear History
              </button>
            </div>
            
            {recentlyPlayed.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {recentlyPlayed.map((track, index) => (
                  <Link
                    key={`${track._id}-${index}`}
                    href={`/player?id=${track._id}`}
                    className="group rounded-xl overflow-hidden mx-surface"
                  >
                    <div className="aspect-square relative overflow-hidden">
                      <img
                        src={track.coverURL || '/default-cover.jpg'}
                        alt={track.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                        <span className="mx-card-play !static"><svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg></span>
                      </div>
                      <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-medium">
                        #{index + 1}
                      </div>
                    </div>
                    <div className="p-2">
                      <h3 className="font-semibold text-sm truncate text-text-primary">{track.title}</h3>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-gradient-to-br from-gray-800/20 to-gray-800/10 rounded-2xl border border-dashed border-gray-700/50">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold mb-2 text-text-primary">No Recently Played Tracks</h3>
                <p className="text-gray-500 text-sm mb-4">Start listening to build your history!</p>
                <button
                  onClick={() => router.push('/explore')}
                  className="mx-card-play !static pointer-events-auto hover:bg-primary-hover [&_svg]:w-4 [&_svg]:h-4"
                >
                  Discover Music
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button - Quick Actions */}
      <div className="fixed bottom-24 right-4 z-50 md:hidden">
        <button
          onClick={() => router.push('/upload')}
          className="w-14 h-14 bg-gradient-to-r from-primary to-primary-hover rounded-full shadow-lg shadow-primary/40 flex items-center justify-center active:scale-90 transition-transform border-2 border-white/20"
          aria-label="Upload Track"
        >
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Add extra padding at bottom for mobile to account for fixed nav */}
      <div className="h-20 md:hidden"></div>
    </div>
  )
}

