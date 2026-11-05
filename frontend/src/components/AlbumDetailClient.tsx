'use client';

import { useState, useEffect } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import AddToQueueButton from './AddToQueueButton';

interface Creator {
  _id: string;
  name: string;
  avatar?: string;
}

interface AlbumTrack {
  _id: string;
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  coverURL?: string;
  duration?: string;
  audioUrl: string;
  audioURL: string;
  plays: number;
  likes: number;
  creatorId: string | Creator;
  type?: 'song' | 'beat' | 'mix';
  creatorWhatsapp?: string;
}

interface Album {
  _id: string;
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  coverURL?: string;
  year: number;
  tracks: AlbumTrack[];
  description?: string;
  genre?: string;
  creatorId: string | Creator;
  releaseDate?: string;
  createdAt: string;
}

interface AlbumDetailClientProps {
  album: Album;
}

const AlbumDetailClient = ({ album }: AlbumDetailClientProps) => {
  const { playTrack, addAlbumToQueue } = useAudioPlayer();
  const [isPlayingAlbum, setIsPlayingAlbum] = useState(false);

  const handlePlayAlbum = () => {
    console.log('🎵 Playing album:', album.title);
    setIsPlayingAlbum(true);
    if (album.tracks.length > 0) {
      // Play the first track of the album
      const firstTrack = {
        id: album.tracks[0]._id || album.tracks[0].id,
        title: album.tracks[0].title,
        artist: typeof album.tracks[0].creatorId === 'object' && album.tracks[0].creatorId !== null
          ? (album.tracks[0].creatorId as any).name
          : album.tracks[0].artist || 'Unknown Artist',
        coverImage: album.tracks[0].coverURL || album.tracks[0].coverImage || '',
        audioUrl: album.tracks[0].audioURL || album.tracks[0].audioUrl || '',
        duration: 0, // Duration is not available in ITrack interface
        creatorId: typeof album.tracks[0].creatorId === 'object' && album.tracks[0].creatorId !== null
          ? (album.tracks[0].creatorId as any)._id
          : album.tracks[0].creatorId,
        type: album.tracks[0].type || 'song',
        creatorWhatsapp: typeof album.tracks[0].creatorId === 'object' && album.tracks[0].creatorId !== null
          ? (album.tracks[0].creatorId as any).whatsappContact
          : album.tracks[0].creatorWhatsapp
      };

      // Convert album tracks to the format expected by the audio player
      const convertedAlbumTracks = album.tracks.map(track => ({
        id: track._id || track.id,
        title: track.title,
        artist: typeof track.creatorId === 'object' && track.creatorId !== null
          ? (track.creatorId as any).name
          : track.artist || 'Unknown Artist',
        coverImage: track.coverURL || track.coverImage || '',
        audioUrl: track.audioURL || track.audioUrl || '',
        duration: 0, // Duration is not available in ITrack interface
        creatorId: typeof track.creatorId === 'object' && track.creatorId !== null
          ? (track.creatorId as any)._id
          : track.creatorId,
        type: track.type || 'song',
        creatorWhatsapp: typeof track.creatorId === 'object' && track.creatorId !== null
          ? (track.creatorId as any).whatsappContact
          : track.creatorWhatsapp
      }));
      
      console.log('Calling playTrack with album context');
      playTrack(firstTrack, convertedAlbumTracks, { 
        albumId: album._id || album.id, 
        tracks: convertedAlbumTracks
      });
      console.log('playTrack call completed');
    }
  };

  const handleAddAlbumToQueue = () => {
    // Convert album tracks to the format expected by addAlbumToQueue
    const convertedTracks = album.tracks.map(track => ({
      id: track._id || track.id,
      title: track.title,
      artist: typeof track.creatorId === 'object' && track.creatorId !== null
        ? (track.creatorId as any).name
        : track.artist || 'Unknown Artist',
      coverImage: track.coverURL || track.coverImage || '',
      audioUrl: track.audioURL || track.audioUrl || '',
      duration: 0, // Duration is not available in ITrack interface
      creatorId: typeof track.creatorId === 'object' && track.creatorId !== null
        ? (track.creatorId as any)._id
        : track.creatorId,
      type: track.type || 'song',
      creatorWhatsapp: typeof track.creatorId === 'object' && track.creatorId !== null
        ? (track.creatorId as any).whatsappContact
        : track.creatorWhatsapp
    }));

    addAlbumToQueue(convertedTracks);
  };

  return (
    <>
      {/* Album Header Controls */}
      <div className="flex flex-wrap gap-4 mb-8">
        <button 
          className="flex-1 sm:flex-none px-6 sm:px-8 py-3 gradient-primary rounded-full text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
          onClick={handlePlayAlbum}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"></path>
          </svg>
          {isPlayingAlbum ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Playing...
            </>
          ) : (
            'Play Album'
          )}
        </button>
        
        <button 
          className="flex-1 sm:flex-none px-6 sm:px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-full text-white font-medium transition-colors flex items-center justify-center gap-2"
          onClick={handleAddAlbumToQueue}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Add All to Queue
        </button>
      </div>
      
      {/* Track List */}
      <div className="card-bg rounded-2xl p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-6 text-text-primary">Tracks</h2>
        
        <div className="space-y-2">
          {album.tracks.map((track, index) => (
            <div 
              key={track._id || track.id}
              className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 rounded-lg group mx-surface"
            >
              {/* Track Cover Image */}
              <div className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                {(track.coverURL || track.coverImage) && (track.coverURL || track.coverImage).trim() !== '' ? (
                  <img 
                    src={track.coverURL || track.coverImage} 
                    alt={track.title} 
                    className="w-full h-full rounded object-cover shadow-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light rounded flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="hidden sm:block w-8 text-center text-gray-500">
                <span className="text-sm">{index + 1}</span>
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm sm:text-base truncate group-hover:text-primary-light transition-colors text-text-primary">{track.title}</h3>
                <p className="text-xs sm:text-sm text-gray-400 truncate">
                  {typeof track.creatorId === 'object' && track.creatorId !== null 
                    ? (track.creatorId as any).name 
                    : typeof track.creatorId === 'string' 
                    ? track.creatorId 
                    : 'Unknown Artist'}
                </p>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden md:flex items-center gap-1 text-gray-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path>
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path>
                  </svg>
                  <span className="text-xs">{track.plays}</span>
                </div>
                
                <AddToQueueButton
                  track={{
                    id: track._id || track.id,
                    title: track.title,
                    artist: typeof track.creatorId === 'object' && track.creatorId !== null
                      ? (track.creatorId as any).name
                      : track.artist || 'Unknown Artist',
                    coverImage: track.coverURL || track.coverImage || '',
                    audioUrl: track.audioURL || track.audioUrl || '',
                    duration: 0, // Duration is not available in ITrack interface
                    creatorId: typeof track.creatorId === 'object' && track.creatorId !== null
                      ? (track.creatorId as any)._id
                      : track.creatorId,
                    type: track.type || 'song',
                    creatorWhatsapp: typeof track.creatorId === 'object' && track.creatorId !== null
                      ? (track.creatorId as any).whatsappContact
                      : track.creatorWhatsapp
                  }}
                  size="sm"
                  variant="secondary"
                />
                
                <button className="text-gray-500 hover:text-white p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"></path>
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AlbumDetailClient;