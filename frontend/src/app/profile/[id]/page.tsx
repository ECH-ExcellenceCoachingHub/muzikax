'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../contexts/AuthContext'
import Link from 'next/link'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

interface UserProfile {
  _id: string
  name: string
  avatar?: string
  bio?: string
  followers?: number
  followersCount?: number
  following?: number
  followingCount?: number
  creatorType?: string
  role?: string
  genres?: string[]
  whatsappContact?: string
  createdAt?: string
}

interface Track {
  _id: string
  id?: string
  title: string
  artist: string
  coverURL?: string
  plays?: number
  likes?: number
  creatorId: string
}

interface RecentlyPlayedTrack extends Track {
  playedAt: string
}

type ExpandedSection = 'about' | 'genres' | 'contact' | null

export default function UserProfile() {
  const params = useParams()
  const userId = params?.id as string
  const router = useRouter()
  const { user } = useAuth()
  
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [tracks, setTracks] = useState<Track[]>([])
  const [recentlyPlayed, setRecentlyPlayed] = useState<RecentlyPlayedTrack[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scrollY, setScrollY] = useState(0)
  const [expandedSection, setExpandedSection] = useState<ExpandedSection>(null)
  const [showBioFull, setShowBioFull] = useState(false)

  // Track scroll position for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) return

      try {
        setLoading(true)
        
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

        const response = await fetch(`${API_BASE_URL}/api/public/user/${userId}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          }
        })
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('User not found')
            return
          }
          setError('Failed to load user profile')
          return
        }

        const data = await response.json()
        
        // Set profile for ALL users (not just creators)
        setProfile(data)

        const tracksResponse = await fetch(
          `${API_BASE_URL}/api/tracks?creatorId=${userId}&limit=50`
        )
        if (tracksResponse.ok) {
          const tracksData = await tracksResponse.json()
          setTracks(tracksData.tracks || [])
        }

        // Fetch recently played tracks for this user
        const recentlyPlayedResponse = await fetch(
          `${API_BASE_URL}/api/recently-played?userId=${userId}&limit=10`,
          {
            headers: {
              'Authorization': token ? `Bearer ${token}` : ''
            }
          }
        )
        if (recentlyPlayedResponse.ok) {
          const recentlyPlayedData = await recentlyPlayedResponse.json()
          setRecentlyPlayed(recentlyPlayedData.tracks || [])
        }
      } catch (err) {
        console.error('Error fetching user profile:', err)
        setError('Failed to load user profile')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: profile?.name || 'User Profile',
          text: `Check out ${profile?.name}'s profile on MuzikaX`,
          url: window.location.href
        })
      } catch (err) {
        console.error('Error sharing:', err)
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      alert('Profile link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-400">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4 text-text-primary">User Not Found</h2>
          <p className="text-gray-400 mb-6">{error || 'The user you are looking for does not exist.'}</p>
          <Link href="/" className="inline-block bg-primary hover:bg-primary/80 text-white py-2 px-6 rounded-lg transition-colors">
            Back Home
          </Link>
        </div>
      </div>
    )
  }

  const followerCount = profile.followersCount || profile.followers || 0
  const followingCount = profile.followingCount || profile.following || 0
  const isCompact = scrollY > 200

  return (
    <div className="min-h-screen pt-14 md:pt-0 bg-background">
      {/* Sticky Profile Header */}
      <div className={`sticky top-0 z-50 transition-all duration-300 ${isCompact ? 'bg-gray-900/95 backdrop-blur-lg shadow-lg' : ''}`}>
        <div className="container mx-auto px-4 pt-4 pb-3">
          {/* Back Button */}
          <Link href="/community" className="text-gray-400 hover:text-primary text-xs font-bold uppercase tracking-widest mb-4 inline-flex items-center gap-2 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>

          {/* Profile Info - Shrinks on scroll */}
          <div className={`transition-all duration-300 ${isCompact ? 'flex items-center gap-4' : ''}`}>
            {/* Avatar */}
            <div className={`relative group transition-all duration-300 ${isCompact ? 'w-16 h-16 flex-shrink-0' : 'w-24 h-24 md:w-32 md:h-32'}`}>
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-light rounded-full blur opacity-25"></div>
              <div className="relative rounded-full border-2 border-gray-900 overflow-hidden shadow-xl bg-gray-800">
                {profile.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                    <span className={`${isCompact ? 'text-2xl' : 'text-3xl md:text-4xl'} font-black text-white`}>
                      {profile.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Name & Stats */}
            <div className={`flex-1 ${isCompact ? 'py-2' : 'mt-4 md:mt-6'}`}>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`${isCompact ? 'text-xl' : 'text-3xl md:text-4xl'} font-black tracking-tight transition-all duration-300 text-text-primary`}>
                  {profile.name}
                </h1>
                {profile.role === 'creator' && profile.creatorType && (
                  <span className="px-2 py-1 bg-gradient-to-r from-primary to-primary-light text-white text-xs font-bold rounded-full uppercase tracking-wide">
                    {profile.creatorType}
                  </span>
                )}
              </div>
              
              {!isCompact && (
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-400">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base">{tracks.length}</span>
                    <span className="text-[10px] uppercase tracking-widest font-medium">Tracks</span>
                  </div>
                  <div className="w-px h-8 bg-gray-700"></div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base">{followerCount.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-widest font-medium">Followers</span>
                  </div>
                  <div className="w-px h-8 bg-gray-700"></div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-base">{followingCount.toLocaleString()}</span>
                    <span className="text-[10px] uppercase tracking-widest font-medium">Following</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-12">
        {/* Action Row */}
        <div className="flex gap-3 my-6">
          <button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-95 shadow-lg shadow-primary/20">
            Follow
          </button>
          <button className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-95 border border-gray-700">
            Message
          </button>
          <button 
            onClick={handleShare}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3.5 px-6 rounded-2xl transition-all active:scale-95 border border-gray-700"
          >
            Share
          </button>
        </div>

        {/* Collapsible Info Cards */}
        <div className="space-y-3 mb-10">
          {/* About Section */}
          <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'about' ? null : 'about')}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-bold text-white">About</span>
              </div>
              <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSection === 'about' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {expandedSection === 'about' && (
              <div className="px-5 pb-5 pt-0 border-t border-gray-700/30">
                {profile.bio ? (
                  <>
                    <p className={`text-gray-400 leading-relaxed mt-4 text-sm ${!showBioFull && 'line-clamp-3'}`}>
                      "{profile.bio}"
                    </p>
                    {profile.bio.length > 150 && (
                      <button
                        onClick={() => setShowBioFull(!showBioFull)}
                        className="text-primary text-sm font-bold mt-2 hover:underline"
                      >
                        {showBioFull ? 'Show less' : 'Read more'}
                      </button>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500 italic text-sm mt-4">No bio added yet.</p>
                )}
              </div>
            )}
          </div>

          {/* Genres Section */}
          {profile.genres && profile.genres.length > 0 && (
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'genres' ? null : 'genres')}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                  <span className="font-bold text-white">Genres</span>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSection === 'genres' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedSection === 'genres' && (
                <div className="px-5 pb-5 pt-0 border-t border-gray-700/30">
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile.genres.map((genre, idx) => (
                      <span key={idx} className="bg-gray-800 text-gray-300 text-xs px-3 py-1.5 rounded-xl border border-gray-700/50 font-medium">
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Contact Section */}
          {profile.whatsappContact && (
            <div className="bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700/30 overflow-hidden">
              <button
                onClick={() => setExpandedSection(expandedSection === 'contact' ? null : 'contact')}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-800/40 transition-all"
              >
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82l.303.18c1.524.909 3.284 1.389 5.083 1.391 5.646.003 10.243-4.591 10.246-10.238.002-2.737-1.065-5.307-3.001-7.245-1.936-1.938-4.505-3.007-7.244-3.008-5.647 0-10.243 4.595-10.246 10.242-.001 1.93.52 3.811 1.507 5.435l.165.271-1.084 3.957 4.074-1.065zm10.59-6.345c-.277-.139-1.638-.809-1.892-.901-.254-.093-.439-.139-.624.139-.185.277-.717.901-.878 1.086-.161.185-.323.208-.6.069-.277-.139-1.17-.431-2.228-1.374-.824-.735-1.38-1.644-1.542-1.921-.162-.277-.017-.427.121-.565.125-.124.277-.323.416-.485.139-.161.185-.277.277-.462.093-.185.046-.347-.023-.485-.069-.139-.624-1.503-.855-2.057-.225-.541-.45-.467-.624-.476-.161-.008-.347-.01-.532-.01-.185 0-.485.069-.739.347-.254.277-.971.948-.971 2.312 0 1.364.993 2.682 1.132 2.867.139.185 1.953 2.982 4.731 4.183.661.286 1.177.457 1.579.585.663.211 1.267.181 1.744.11.533-.08 1.638-.67 1.869-1.318.231-.647.231-1.202.162-1.318-.069-.116-.254-.185-.531-.324z" />
                  </svg>
                  <span className="font-bold text-white">Contact</span>
                </div>
                <svg className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${expandedSection === 'contact' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {expandedSection === 'contact' && (
                <div className="px-5 pb-5 pt-0 border-t border-gray-700/30">
                  <a
                    href={`https://wa.me/${profile.whatsappContact.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3.5 rounded-xl mt-4 transition-all duration-300 shadow-xl shadow-green-900/20 active:scale-95"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.246 2.248 3.484 5.232 3.484 8.412-.003 6.557-5.338 11.892-11.893 11.892-1.997-.001-3.951-.5-5.688-1.448l-6.309 1.656zm6.224-3.82l.303.18c1.524.909 3.284 1.389 5.083 1.391 5.646.003 10.243-4.591 10.246-10.238.002-2.737-1.065-5.307-3.001-7.245-1.936-1.938-4.505-3.007-7.244-3.008-5.647 0-10.243 4.595-10.246 10.242-.001 1.93.52 3.811 1.507 5.435l.165.271-1.084 3.957 4.074-1.065zm10.59-6.345c-.277-.139-1.638-.809-1.892-.901-.254-.093-.439-.139-.624.139-.185.277-.717.901-.878 1.086-.161.185-.323.208-.6.069-.277-.139-1.17-.431-2.228-1.374-.824-.735-1.38-1.644-1.542-1.921-.162-.277-.017-.427.121-.565.125-.124.277-.323.416-.485.139-.161.185-.277.277-.462.093-.185.046-.347-.023-.485-.069-.139-.624-1.503-.855-2.057-.225-.541-.45-.467-.624-.476-.161-.008-.347-.01-.532-.01-.185 0-.485.069-.739.347-.254.277-.971.948-.971 2.312 0 1.364.993 2.682 1.132 2.867.139.185 1.953 2.982 4.731 4.183.661.286 1.177.457 1.579.585.663.211 1.267.181 1.744.11.533-.08 1.638-.67 1.869-1.318.231-.647.231-1.202.162-1.318-.069-.116-.254-.185-.531-.324z" />
                    </svg>
                    Message on WhatsApp
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recently Played - Horizontal Scroll */}
        {recentlyPlayed.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-black tracking-tight mb-6 flex items-center gap-2 text-text-primary">
              <svg className="w-6 h-6 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Recently Played
            </h2>

            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {recentlyPlayed.slice(0, 10).map((track) => (
                <Link
                  key={track._id}
                  href={`/tracks/${track._id}`}
                  className="flex-shrink-0 w-40 group rounded-2xl overflow-hidden mx-surface"
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
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-gray-400 text-[10px]">
                        {new Date(track.playedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold group-hover:text-primary transition-colors truncate text-sm text-text-primary">
                      {track.title}
                    </h3>
                    <p className="text-gray-400 text-xs truncate">{track.artist}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Uploaded Tracks Grid */}
        <div>
          <h2 className="text-xl font-black tracking-tight mb-6 text-text-primary">
            {recentlyPlayed.length > 0 ? 'Uploaded Tracks' : 'Recent Activity'}
          </h2>

          {tracks.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tracks.map((track) => (
                <Link
                  key={track._id || track.id}
                  href={`/tracks/${track._id || track.id}`}
                  className="group flex flex-col rounded-2xl overflow-hidden mx-surface"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={track.coverURL || '/placeholder-cover.jpg'}
                      alt={track.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.src = '/placeholder-cover.jpg'
                      }}
                    />
                    <div className="absolute bottom-3 left-3 flex gap-1">
                      <span className="px-2 py-0.5 bg-primary text-[9px] font-black text-white uppercase rounded">Track</span>
                    </div>
                  </div>
                  <div className="p-4 flex-1">
                    <h3 className="font-bold group-hover:text-primary transition-colors mb-1 truncate text-sm text-text-primary">
                      {track.title}
                    </h3>
                    <p className="text-gray-400 text-xs truncate mb-4">{track.artist}</p>
                    
                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold uppercase tracking-widest pt-3 border-t border-gray-700/50">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                          {track.plays || 0}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                          </svg>
                          {track.likes || 0}
                        </span>
                      </div>
                      <span className="text-primary">Play →</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-800/10 rounded-2xl border border-dashed border-gray-700/50">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-full flex items-center justify-center text-gray-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <h3 className="text-lg font-bold mb-2 text-text-primary">No active tracks</h3>
              <p className="text-gray-500 text-sm max-w-xs mx-auto">This user hasn't uploaded any music or activity is currently hidden.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
