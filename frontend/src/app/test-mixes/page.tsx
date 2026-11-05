'use client'

import { useState, useEffect } from 'react'

export default function TestMixes() {
  const [tracks, setTracks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchMixes = async () => {
      try {
        setLoading(true)
        console.log('Fetching mixes from:', `${process.env.NEXT_PUBLIC_API_URL}/api/tracks/type?type=mix&limit=24`)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tracks/type?type=mix&limit=24`)
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          
          // Filter out tracks without audio URLs
          const filteredData = data.filter((track: any) => 
            track.audioURL && track.audioURL.trim() !== ''
          );
          
          console.log('Data received:', filteredData.length, 'tracks')
          console.log('Sample track:', filteredData[0])
          setTracks(filteredData)
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
      } catch (err: any) {
        console.error('Fetch error:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchMixes()
  }, [])

  if (loading) {
    return <div className="p-8">Loading mixes...</div>
  }

  if (error) {
    return <div className="p-8 text-red-500">Error: {error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4 text-text-primary">Mix Tracks Test</h1>
      <p className="mb-4">Found {tracks.length} mix tracks</p>
      
      {tracks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track) => (
            <div key={track._id} className="border p-4 rounded">
              <h2 className="font-semibold text-text-primary">{track.title}</h2>
              <p className="text-sm text-gray-600">
                Artist: {typeof track.creatorId === 'object' ? track.creatorId.name : 'Unknown'}
              </p>
              <p className="text-sm text-gray-600">Type: {track.type}</p>
              <p className="text-sm text-gray-600">Plays: {track.plays}</p>
            </div>
          ))}
        </div>
      ) : (
        <p>No tracks found</p>
      )}
    </div>
  )
}
