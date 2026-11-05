'use client'

import { useState, useEffect, useRef } from 'react'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'
import { useRouter } from 'next/navigation'
import { useLanguage } from '../contexts/LanguageContext'

interface PlaylistTrack {
  _id: string
  title: string
  creatorId: {
    name: string
  }
  plays: number
  coverURL?: string
  audioURL?: string  // Add audioURL field
}

interface Playlist {
  _id: string
  name: string
  description: string
  userId: {
    name: string
  }
  tracks: PlaylistTrack[]
  isPublic: boolean
  createdAt: string
}

interface RecommendedPlaylistsProps {
  className?: string
  titleClassName?: string
  titleSize?: 'sm' | 'md' | 'lg'
}

export default function RecommendedPlaylists({ 
  className = '', 
  titleClassName = '',
  titleSize = 'lg'
}: RecommendedPlaylistsProps) {
  const { t } = useLanguage()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { playTrack, setCurrentPlaylist } = useAudioPlayer()
  const router = useRouter()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  // Check scroll position and update button states
  const updateScrollButtons = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
    }
  }

  // Initial check and add event listener
  useEffect(() => {
    updateScrollButtons()
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener('scroll', updateScrollButtons)
      window.addEventListener('resize', updateScrollButtons)
      return () => {
        container.removeEventListener('scroll', updateScrollButtons)
        window.removeEventListener('resize', updateScrollButtons)
      }
    }
  }, [playlists])

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300 // Custom scroll amount for playlists
      scrollContainerRef.current.scrollBy({
        left: direction === 'right' ? scrollAmount : -scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  useEffect(() => {
    fetchRecommendedPlaylists()
  }, [])

  const fetchRecommendedPlaylists = async () => {
    try {
      setLoading(true)
      setError('')
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/playlists/recommended`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch recommended playlists')
      }
      
      const data = await response.json()
      
      // Combine all playlist types and take top 10
      const allPlaylists = [
        ...(data.popular || []),
        ...(data.recent || [])
      ]
      
      // Remove duplicates and limit to 10
      const uniquePlaylists = allPlaylists
        .filter((playlist: Playlist, index: number, self: Playlist[]) => 
          index === self.findIndex(p => p._id === playlist._id)
        )
        .slice(0, 10)
      
      setPlaylists(uniquePlaylists)
    } catch (err: any) {
      console.error('Error fetching recommended playlists:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks.length > 0) {
      // Convert tracks to the format expected by the audio player
      const playerTracks: any[] = playlist.tracks
        .filter(track => track && track.audioURL) // Ensure track exists and has audio URL
        .map(track => ({
          id: track._id,
          title: track.title,
          artist: playlist.userId?.name === 'admin' || playlist.userId?.name?.toLowerCase().includes('muzikax') ? 'MuzikaX' : track.creatorId?.name || 'MuzikaX', // Use 'MuzikaX' for admin playlists
          coverImage: track.coverURL || '',
          audioUrl: track.audioURL || '', // Use the correct field
          creatorId: (track.creatorId as any)?._id || '',
          type: 'song' as const
        }))
      
      if (playerTracks.length > 0) {
        // Set the current playlist
        setCurrentPlaylist(playerTracks)
        
        // Play the first track
        playTrack(playerTracks[0], playerTracks)
      }
    }
  }

  const handleViewAll = () => {
    router.push('/playlists')
  }

  if (loading) {
    const sectionPadding = className.includes('p-') || className.includes('px-') ? '' : 'px-4 md:px-8 py-8'
    return (
      <section className={`${sectionPadding} ${className}`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`font-bold ${
            titleSize === 'sm' ? 'text-base sm:text-lg' : 
            titleSize === 'md' ? 'text-xl' : 'text-2xl'
          } ${titleClassName} text-text-primary`}>{t('recommendedPlaylists')}</h2>
        </div>
        <div className="flex space-x-4 overflow-x-auto pb-4">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="flex-shrink-0 w-48 animate-pulse">
              <div className="bg-gray-800 rounded-xl h-48 mb-3"></div>
              <div className="bg-gray-800 rounded h-4 mb-2"></div>
              <div className="bg-gray-800 rounded h-3 w-3/4"></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || playlists.length === 0) {
    return null // Don't show anything if there's an error or no playlists
  }

  const sectionPadding = className.includes('p-') || className.includes('px-') ? '' : 'px-4 md:px-8 py-8'

  return (
    <section className={`${sectionPadding} ${className}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`font-bold ${
            titleSize === 'sm' ? 'text-base sm:text-lg' : 
            titleSize === 'md' ? 'text-xl' : 'text-xl sm:text-2xl'
          } ${titleClassName} text-text-primary`}>{t('recommendedPlaylists')}</h2>
        <button 
          onClick={handleViewAll}
          className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
        >
          {t('viewAll')}
        </button>
      </div>
      
      <div className="relative group">
        <div 
          ref={scrollContainerRef}
          className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide -mx-4 md:-mx-8 px-4 md:px-8 snap-x snap-mandatory scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {playlists.map((playlist) => (
            <div 
              key={playlist._id} 
              className="flex-shrink-0 w-48 group cursor-pointer snap-start"
              onClick={() => handlePlayPlaylist(playlist)}
            >
              {/* Playlist Cover */}
              <div className="relative mb-3 rounded-xl overflow-hidden bg-gray-800 aspect-square">
                {playlist.tracks.length > 0 && playlist.tracks[0]?.coverURL ? (
                  <img 
                    src={playlist.tracks[0].coverURL}
                    alt={playlist.name}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                    <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                    </svg>
                  </div>
                )}
                
                {/* Play Overlay */}
                <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                  <div className="mx-card-play !static [&_svg]:w-4 [&_svg]:h-4 [&_svg]:text-black">
                    <svg className="w-6 h-6 text-gray-900 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                
                {/* Track Count Badge */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                  {playlist.tracks.length} tracks
                </div>
              </div>
              
              {/* Playlist Info */}
              <h3 className="font-semibold truncate mb-1 group-hover:text-primary transition-colors text-text-primary">
                {playlist.name}
              </h3>
              <p className="text-gray-400 text-sm truncate">
                {playlist.userId?.name === 'admin' ? 'MuzikaX' : (playlist.userId?.name || 'MuzikaX')}
              </p>
              {playlist.description && (
                <p className="text-gray-500 text-xs mt-1 truncate">
                  {playlist.description}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Scroll Buttons */}
        <button 
          className="absolute left-2 md:left-3 top-[calc(50%-2rem)] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-800/80 backdrop-blur-lg flex items-center justify-center text-white shadow-xl hover:bg-gray-700/80 transition-all duration-300 hover:scale-110"
          onClick={() => scroll('left')}
          aria-label="Scroll left"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </button>
        
        <button 
          className="absolute right-2 md:right-3 top-[calc(50%-2rem)] -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-gray-800/80 backdrop-blur-lg flex items-center justify-center text-white shadow-xl hover:bg-gray-700/80 transition-all duration-300 hover:scale-110"
          onClick={() => scroll('right')}
          aria-label="Scroll right"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
        </button>
      </div>
    </section>
  )
}