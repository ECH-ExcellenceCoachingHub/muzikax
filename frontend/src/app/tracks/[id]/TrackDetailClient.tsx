'use client';

import { useAudioPlayer } from '../../../contexts/AudioPlayerContext';
import { usePayment } from '../../../contexts/PaymentContext';
import AddToQueueButton from '../../../components/AddToQueueButton';
import { useState, useEffect } from 'react';

interface Track {
  _id: string;
  id: string;
  title: string;
  artist: string;
  album?: string;
  plays: number;
  likes: number;
  coverImage: string;
  coverURL?: string;
  audioURL: string;
  duration?: string;
  genre?: string;
  type?: 'song' | 'beat' | 'mix';
  releaseDate?: string;
  createdAt?: string;
  description?: string;
  paymentType?: 'free' | 'paid';
  price?: number;
  currency?: string;
  creatorId: {
    _id: string;
    name: string;
    avatar?: string;
    whatsappContact?: string;
  };
}

interface TrackDetailClientProps {
  track: Track;
}

export default function TrackDetailClient({ track }: TrackDetailClientProps) {
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    setCurrentPlaylist, 
    favorites, 
    addToFavorites, 
    removeFromFavorites,
    togglePlayPause 
  } = useAudioPlayer();
  
  const { showPayment } = usePayment();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    setIsFavorite(favorites.some(fav => fav.id === track.id));
  }, [favorites, track.id]);

  const handlePlay = () => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      const trackToPlay = {
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverImage: track.coverURL || track.coverImage,
        audioUrl: track.audioURL,
        creatorId: track.creatorId?._id,
        type: track.type || 'song',
        paymentType: track.paymentType,
        price: track.price,
        currency: track.currency,
        creatorWhatsapp: track.creatorId?.whatsappContact
      };

      playTrack(trackToPlay);
      setCurrentPlaylist([trackToPlay]);
    }
  };

  const toggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorites(track.id);
    } else {
      addToFavorites({
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverImage: track.coverURL || track.coverImage || '',
        audioUrl: track.audioURL || '',
        creatorId: track.creatorId?._id,
        type: track.type || 'song',
        creatorWhatsapp: track.creatorId?.whatsappContact
      });
    }
  };

  const isCurrentTrack = currentTrack?.id === track.id;

  return (
    <div className="flex flex-col md:flex-row gap-8 mb-12">
      <div className="md:w-1/3">
        <div className="relative group">
          {track.coverURL || track.coverImage ? (
            <img
              src={track.coverURL || track.coverImage}
              alt={`${track.title} cover`}
              className="w-full rounded-2xl shadow-2xl"
            />
          ) : (
            <div className="w-full aspect-square bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center">
              <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          )}
          
          <button 
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"
          >
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-white transform scale-90 group-hover:scale-100 transition-transform">
              {isCurrentTrack && isPlaying ? (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </button>
        </div>
      </div>

      <div className="md:w-2/3">
        <div className="flex flex-col justify-end h-full">
          <p className="text-primary-light text-sm uppercase tracking-wider mb-2">
            {track.genre || 'Song'}
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 text-text-primary">
            {track.title}
          </h1>
          <p className="text-xl text-gray-300 mb-6">
            {track.artist}
          </p>

          <div className="flex flex-wrap items-center gap-4 text-gray-400 mb-8">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {track.plays?.toLocaleString() || '0'} plays
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className={`w-4 h-4 ${isFavorite ? 'text-red-500 fill-current' : ''}`} fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {track.likes?.toLocaleString() || '0'} likes
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {track.duration || 'N/A'}
            </span>
            {track.paymentType === 'paid' && track.price && (
              <>
                <span>•</span>
                <span className="text-green-400 font-semibold px-2 py-1 bg-green-400/10 rounded-lg">
                  {track.price.toLocaleString()} {track.currency || 'RWF'}
                </span>
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-4">
            <button 
              onClick={handlePlay}
              className="px-8 py-3 gradient-primary rounded-full text-white font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
            >
              {isCurrentTrack && isPlaying ? (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Play Track
                </>
              )}
            </button>
            
            <button 
              onClick={toggleFavorite}
              className={`w-12 h-12 rounded-full border ${isFavorite ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-gray-700 text-gray-400'} flex items-center justify-center hover:border-red-500 hover:text-red-500 transition-all active:scale-90`}
              title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            >
              <svg className={`w-6 h-6 ${isFavorite ? 'fill-current' : 'none'}`} fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            <AddToQueueButton
              track={{
                id: track.id,
                title: track.title,
                artist: track.artist,
                coverImage: track.coverURL || track.coverImage || '',
                audioUrl: track.audioURL || '',
                creatorId: track.creatorId?._id,
                type: track.type || 'song',
                paymentType: track.paymentType,
                price: track.price,
                creatorWhatsapp: track.creatorId?.whatsappContact
              }}
              size="lg"
              className="rounded-full w-12 h-12 flex items-center justify-center p-0 border border-gray-700 text-gray-400 hover:border-primary hover:text-primary transition-all"
            />

            {track.paymentType === 'paid' && (
              <button 
                onClick={() => showPayment({
                  trackId: track.id,
                  trackTitle: track.title,
                  price: track.price || 0,
                  audioUrl: track.audioURL
                })}
                className="px-6 py-3 bg-green-500/20 border border-green-500/50 text-green-400 rounded-full font-medium hover:bg-green-500/30 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Buy Full Track
              </button>
            )}
          </div>

          {track.description && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-2 text-text-primary">About</h3>
              <p className="text-gray-400 leading-relaxed">{track.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
