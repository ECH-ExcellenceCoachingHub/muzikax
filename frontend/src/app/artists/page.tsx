'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { fetchPopularCreators, followCreator } from '@/services/trackService'
import { useAuth } from '@/contexts/AuthContext'

interface Creator {
  _id: string
  name: string
  creatorType: string
  followersCount: number
  avatar: string
}

// Function to generate avatar with first letter of name
const generateAvatar = (name: string) => {
  const firstLetter = name.charAt(0).toUpperCase()
  return (
    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto">
      <span className="text-3xl font-bold text-white">{firstLetter}</span>
    </div>
  )
}

export default function ArtistsPage() {
  const [sortBy, setSortBy] = useState<'popular' | 'alphabetical'>('popular')
  const [searchTerm, setSearchTerm] = useState('')
  const [creators, setCreators] = useState<Creator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [followedArtists, setFollowedArtists] = useState<Record<string, boolean>>({})
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  
  // Fetch artists on component mount
  useEffect(() => {
    const getArtists = async () => {
      try {
        setLoading(true)
        const data = await fetchPopularCreators(50) // Fetch up to 50 creators
        setCreators(data || [])
        setError(null)
      } catch (err) {
        console.error('Error fetching artists:', err)
        setError('Failed to load artists. Please try again later.')
      } finally {
        setLoading(false)
      }
    }
    
    getArtists()
  }, [])
  
  // Update followedArtists when user or creators change
  useEffect(() => {
    if (user && user.following && creators.length > 0) {
      const followedMap: Record<string, boolean> = {}
      const followingIds = user.following.map((id: any) => 
        (typeof id === 'object' && id !== null ? (id._id || id.id) : id).toString()
      )
      
      creators.forEach(creator => {
        followedMap[creator._id] = followingIds.includes(creator._id.toString())
      })
      setFollowedArtists(followedMap)
    }
  }, [user, creators])
  
  // Filter and sort creators
  const filteredAndSortedCreators = useMemo(() => {
    // Filter creators based on search term
    const filtered = creators.filter(creator => 
      creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (creator.creatorType && creator.creatorType.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    
    // Sort creators based on selected option
    return [...filtered].sort((a, b) => {
      if (sortBy === 'popular') {
        return b.followersCount - a.followersCount
      } else {
        return a.name.localeCompare(b.name)
      }
    })
  }, [creators, searchTerm, sortBy])
  
  const handleArtistClick = (creatorId: string) => {
    router.push(`/artists/${creatorId}`)
  }
  
  const handleFollowClick = async (creatorId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    // Check if user is authenticated
    if (!isAuthenticated) {
      // Redirect to login page
      router.push('/login')
      return
    }
    
    const isFollowing = followedArtists[creatorId]
    
    try {
      if (isFollowing) {
        // Call unfollow creator service
        const { unfollowCreator } = await import('@/services/trackService')
        await unfollowCreator(creatorId)
        
        // Update the followers count and following state in the UI
        setCreators(prevCreators => 
          prevCreators.map(creator => 
            creator._id === creatorId 
              ? { ...creator, followersCount: Math.max(0, creator.followersCount - 1) } 
              : creator
          )
        )
        setFollowedArtists(prev => ({ ...prev, [creatorId]: false }))
        console.log('Successfully unfollowed creator')
      } else {
        // Call the follow creator service
        await followCreator(creatorId)
        
        // Update the followers count and following state in the UI
        setCreators(prevCreators => 
          prevCreators.map(creator => 
            creator._id === creatorId 
              ? { ...creator, followersCount: creator.followersCount + 1 } 
              : creator
          )
        )
        setFollowedArtists(prev => ({ ...prev, [creatorId]: true }))
        console.log('Successfully followed creator')
      }
    } catch (error) {
      console.error(`Failed to ${isFollowing ? 'unfollow' : 'follow'} creator:`, error)
      alert(`Failed to ${isFollowing ? 'unfollow' : 'follow'} creator. Please try again.`)
    }
  }
  
  if (loading) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-white">Loading artists...</div>
          </div>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen py-8 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex justify-center items-center h-64">
            <div className="text-red-500">{error}</div>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen py-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-text-primary">Artists</h1>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search artists..."
              className="px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            
            <select
              className="px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'alphabetical')}
            >
              <option value="popular">Most Popular</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
        
        {filteredAndSortedCreators.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-white text-center">
              <p className="mb-2">No artists found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
            {filteredAndSortedCreators.map((creator) => (
              <div 
                key={creator._id} 
                className="bg-gray-800/50 hover:bg-gray-800 rounded-2xl p-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-1"
                onClick={() => handleArtistClick(creator._id)}
              >
                <div className="flex flex-col items-center">
                  <div className="relative mb-4">
                    {creator.avatar && creator.avatar.trim() !== '' ? (
                      <img 
                        src={creator.avatar} 
                        alt={creator.name} 
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover mx-auto"
                      />
                    ) : (
                      generateAvatar(creator.name)
                    )}
                  </div>
                  <h3 className="font-bold text-base truncate w-full text-text-primary">{creator.name}</h3>
                  <p className="text-primary-light text-sm mb-3 capitalize">
                    {creator.creatorType || 'Artist'}
                  </p>
                  <p className="text-gray-500 text-xs mb-4">
                    {creator.followersCount?.toLocaleString() || 0} followers
                  </p>
                  <button 
                    className={`w-full px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      followedArtists[creator._id]
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-transparent border border-primary-light text-primary-light hover:bg-primary-light/10'
                    }`}
                    onClick={(e) => handleFollowClick(creator._id, e)}
                  >
                    {followedArtists[creator._id] ? 'Following' : 'Follow'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
