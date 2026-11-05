'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'
import { fetchRecommendedTracks } from '@/services/recommendationService';
import { ITrack } from '@/types';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import AddToQueueButton from '@/components/AddToQueueButton';

interface Track {
  id: string
  title: string
  artist: string
  album?: string
  plays: number
  likes: number
  coverImage: string
  duration?: string
  category?: string
  audioUrl?: string
}

export default function ForYouPage() {
  const router = useRouter()
  const { playTrack } = useAudioPlayer();
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'alphabetical' | 'new_and_popular'>('new_and_popular')
  const [filterBy, setFilterBy] = useState<'music' | 'beats' | 'mixes' | 'all'>('music'); // Default to music
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Helper function to convert duration string to seconds
  const convertDurationToSeconds = (duration: string): number => {
    const [minutes, seconds] = duration.split(':').map(Number);
    return minutes * 60 + seconds;
  };
  
  useEffect(() => {
    const fetchTracks = async () => {
      try {
        setLoading(true);
        // Fetch tracks sorted by recent first (newest tracks)
        const recommendedTracks = await fetchRecommendedTracks(undefined, 12, 'recent');
        
        // Map the ITrack objects to our Track interface format
        const mappedTracks: Track[] = recommendedTracks.map(track => ({
          id: track._id,
          title: track.title,
          artist: (track as any).creatorId?.name || (track as any).creatorId,
          album: track.description,
          plays: track.plays,
          likes: track.likes,
          coverImage: track.coverURL,
          audioUrl: track.audioURL,
          duration: undefined, // Duration might not be available in ITrack
          category: track.type
        }));
        
        setTracks(mappedTracks);
      } catch (error) {
        console.error('Error fetching recommended tracks:', error);
        // Fallback to mock data if API call fails
        setTracks(mockTracks);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTracks();
  }, []);
  
  // Mock data for tracks with real image URLs - will be replaced with API call
  const mockTracks: Track[] = [
    {
      id: '1',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      plays: 12400,
      likes: 890,
      coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '3:45',
      category: 'song'
    },
    {
      id: '2',
      title: 'Afro Trap Beat',
      artist: 'Beat Master',
      plays: 14200,
      likes: 1100,
      coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '2:45',
      category: 'beats'
    },
    {
      id: '3',
      title: 'Levitating',
      artist: 'Dua Lipa',
      album: 'Future Nostalgia',
      plays: 15600,
      likes: 1200,
      coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '3:18',
      category: 'song'
    },
    {
      id: '4',
      title: 'Rwandan Mixtape',
      artist: 'DJ Rwanda',
      plays: 18700,
      likes: 1420,
      coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '45:32',
      category: 'mixes'
    },
    {
      id: '5',
      title: 'Good 4 U',
      artist: 'Olivia Rodrigo',
      album: 'SOUR',
      plays: 11200,
      likes: 950,
      coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '4:33',
      category: 'song'
    },
    {
      id: '6',
      title: 'Urban Beats Collection',
      artist: 'City Producer',
      plays: 3200,
      likes: 280,
      coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '3:47',
      category: 'beats'
    },
    {
      id: '7',
      title: 'Peaches',
      artist: 'Justin Bieber',
      album: 'Justice',
      plays: 1900,
      likes: 150,
      coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '4:12',
      category: 'song'
    },
    {
      id: '8',
      title: 'Kigali Mix Session',
      artist: 'DJ Kigali',
      plays: 4500,
      likes: 380,
      coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '32:15',
      category: 'mixes'
    },
    {
      id: '9',
      title: 'Butter',
      artist: 'BTS',
      album: 'Butter',
      plays: 1500,
      likes: 95,
      coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '5:22',
      category: 'song'
    },
    {
      id: '10',
      title: 'Heat Waves',
      artist: 'Glass Animals',
      album: 'Dreamland',
      plays: 8900,
      likes: 650,
      coverImage: 'https://images.unsplash.com/photo-1514320291841-38b60f8f72d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '3:28',
      category: 'song'
    },
    {
      id: '11',
      title: 'Industry Baby',
      artist: 'Lil Nas X, Jack Harlow',
      album: 'Montero',
      plays: 12300,
      likes: 980,
      coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '4:05',
      category: 'song'
    },
    {
      id: '12',
      title: 'Deja Vu',
      artist: 'Olivia Rodrigo',
      album: 'SOUR',
      plays: 7600,
      likes: 520,
      coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
      duration: '3:52',
      category: 'song'
    }
  ]

  // Filter and sort tracks based on selected options
  const filteredTracks = tracks.filter(track => {
    if (filterBy === 'all') return true;
    if (filterBy === 'music') return track.category === 'song';
    if (filterBy === 'beats') return track.category === 'beat';
    if (filterBy === 'mixes') return track.category === 'mix';
    return true;
  });
  
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'popular') {
      return b.plays - a.plays
    } else if (sortBy === 'recent') {
      return parseInt(b.id) - parseInt(a.id)
    } else if (sortBy === 'new_and_popular') {
      // Backend handles this sorting, but if needed locally, prioritize recency then plays
      return parseInt(b.id) - parseInt(a.id) || b.plays - a.plays;
    } else {
      return a.title.localeCompare(b.title)
    }
  })

  return (
    <div className="min-h-screen py-8 pt-14 md:pt-0 bg-background">
      {/* Mobile Header with Back Button */}
      <div className="md:hidden sticky top-0 z-50 bg-gray-900/95 backdrop-blur-lg border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="text-gray-400 hover:text-white transition-colors p-2 -ml-2"
              aria-label="Go back"
            >
              <FaArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-black text-text-primary">For You</h1>
              <p className="text-xs text-gray-400">Your recommendations</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-text-primary">For You</h1>
            <p className="text-gray-400">Personalized recommendations based on your listening habits</p>
          </div>
          
          <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Filter:</span>
            <div className="flex bg-gray-800 rounded-lg p-1">
              <button 
                onClick={() => setFilterBy('music')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${filterBy === 'music' ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'}`}
              >
                Music
              </button>
              <button 
                onClick={() => setFilterBy('beats')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${filterBy === 'beats' ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'}`}
              >
                Beats
              </button>
              <button 
                onClick={() => setFilterBy('mixes')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${filterBy === 'mixes' ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'}`}
              >
                Mixes
              </button>
              <button 
                onClick={() => setFilterBy('all')}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${filterBy === 'all' ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'}`}
              >
                All
              </button>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Sort by:</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="new_and_popular">New & Popular</option>
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedTracks.map((track) => (
              <div key={track.id} className="group card-bg rounded-xl overflow-hidden">
                <div className="relative">
                  <img 
                    src={track.coverImage} 
                    alt={track.title} 
                    className="w-full aspect-square object-cover"
                  />
                  <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (track.audioUrl) {
                          // Convert our Track to the format expected by AudioPlayerContext
                          const audioPlayerTrack = {
                            id: track.id,
                            title: track.title,
                            artist: track.artist,
                            coverImage: track.coverImage,
                            audioUrl: track.audioUrl,
                            duration: track.duration ? convertDurationToSeconds(track.duration) : undefined,
                            creatorId: track.artist, // Using artist as creatorId
                            albumId: track.album ? track.album : undefined,
                            plays: track.plays,
                            likes: track.likes,
                            type: ((track.category === 'song' || track.category === 'beat' || track.category === 'mix') ? track.category : 'song') as 'song' | 'beat' | 'mix',
                            creatorWhatsapp: undefined
                          };
                          playTrack(audioPlayerTrack);
                        }
                      }}
                      className="mx-card-play !static pointer-events-auto hover:bg-primary-hover [&_svg]:w-4 [&_svg]:h-4"
                    >
                      <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" clipRule="evenodd"></path>
                      </svg>
                    </button>
                    <AddToQueueButton 
                      track={{
                        id: track.id,
                        title: track.title,
                        artist: track.artist || 'Unknown Artist',
                        coverImage: track.coverImage || '',
                        audioUrl: track.audioUrl || '',
                        duration: track.duration ? convertDurationToSeconds(track.duration) : undefined,
                        creatorId: track.artist || '',
                        type: ((track.category === 'song' || track.category === 'beat' || track.category === 'mix') ? track.category : 'song') as 'song' | 'beat' | 'mix',
                        creatorWhatsapp: undefined
                      }}
                      size="md"
                      variant="secondary"
                      className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75"
                    />
                  </div>
                </div>
                
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-base truncate text-text-primary">{track.title}</h3>
                    {track.category && (
                      <span className="ml-2 px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full capitalize">
                        {track.category}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm truncate">{track.artist}</p>
                  {track.album && <p className="text-gray-500 text-xs mt-1 truncate">{track.album}</p>}
                  
                  <div className="flex justify-between items-center mt-3">
                    <span className="text-gray-500 text-xs">{track.plays.toLocaleString()} plays</span>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
                      </svg>
                      <span className="text-gray-500 text-xs">{track.likes}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
