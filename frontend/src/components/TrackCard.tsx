'use client';

 import { useState } from 'react';
 import { useAudioPlayer } from '../contexts/AudioPlayerContext';
 import { useLanguage } from '../contexts/LanguageContext';
 import { usePayment } from '../contexts/PaymentContext';
 import AddToQueueButton from './AddToQueueButton';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  plays?: number;
  likes?: number;
  duration?: string;
  category?: string;
  creatorId?: string;
  audioUrl?: string;
  type?: 'song' | 'beat' | 'mix';
  paymentType?: 'free' | 'paid';
  price?: number;
  currency?: string;
  creatorWhatsapp?: string;
}

interface TrackCardProps {
  track: Track;
  fullTrackData?: any; // Full track data with audioUrl and other properties
  showPlayButton?: boolean;
  showLikeButton?: boolean;
  showAddToQueueButton?: boolean;
}

export default function TrackCard({ 
  track, 
  fullTrackData, 
  showPlayButton = true, 
  showLikeButton = true,
  showAddToQueueButton = true
}: TrackCardProps) {
  const { t } = useLanguage();
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, addToFavorites, removeFromFavorites } = useAudioPlayer();
  const { showPayment } = usePayment();

  const handlePlay = () => {
    // Get audio URL from multiple possible field names
    const audioUrl = fullTrackData?.audioURL || fullTrackData?.audioUrl || track.audioUrl;
    
    if (fullTrackData && audioUrl) {
      playTrack({
        id: track.id,
        title: track.title,
        artist: track.artist,
        coverImage: track.coverImage,
        audioUrl: audioUrl,
        creatorId: typeof fullTrackData.creatorId === 'object' && fullTrackData.creatorId !== null 
          ? (fullTrackData.creatorId as any)._id 
          : fullTrackData.creatorId,
        type: fullTrackData.type,
        paymentType: fullTrackData.paymentType || track.paymentType, // Include payment type
        price: fullTrackData.price || track.price, // Include price
        creatorWhatsapp: (typeof fullTrackData.creatorId === 'object' && fullTrackData.creatorId !== null 
          ? (fullTrackData.creatorId as any).whatsappContact 
          : undefined)
      });

      // Set the current playlist to tracks from this section
      // We'll use the current track data for now
      const playlistTracks = [fullTrackData].filter((t: any) => t.audioURL || t.audioUrl).map((t: any) => ({
        id: t._id,
        title: t.title,
        artist: typeof t.creatorId === "object" && t.creatorId !== null 
          ? (t.creatorId as any).name 
          : "Unknown Artist",
        coverImage: t.coverURL || '',
        audioUrl: t.audioURL || t.audioUrl || '',
        creatorId: typeof t.creatorId === 'object' && t.creatorId !== null 
          ? (t.creatorId as any)._id 
          : t.creatorId,
        type: t.type,
        paymentType: t.paymentType, // Include payment type
        price: t.price, // Include price
        creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null 
          ? (t.creatorId as any).whatsappContact 
          : undefined)
      }));
      setCurrentPlaylist(playlistTracks);
    }
  };

  const toggleFavorite = () => {
    if (fullTrackData) {
      const isFavorite = favorites.some(fav => fav.id === track.id);
      if (isFavorite) {
        removeFromFavorites(track.id);
      } else {
        addToFavorites({
          id: track.id,
          title: track.title,
          artist: track.artist,
          coverImage: track.coverImage || '',
          audioUrl: track.audioUrl || '',
          creatorId: track.creatorId,
          type: track.type as 'song' | 'beat' | 'mix' | undefined,
          creatorWhatsapp: track.creatorWhatsapp
        });
      }
    }
  };

  const isFavorite = favorites.some(fav => fav.id === track.id);

  return (
    <div className="flex-shrink-0 w-40 sm:w-44 md:w-44 lg:w-48 group card-bg rounded-xl overflow-hidden">
      <div className="relative">
        <div className="w-full aspect-square relative">
          <img
            src={track.coverImage && track.coverImage.trim() !== '' ? track.coverImage : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNGRjRENDciLz4KICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZGQ0IyQiIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZ3JhZCkiLz4KICA8dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIj4KICAgIHsgdHJhY2sudGl0bGUgJiYgdHJhY2sudGl0bGUudHJpbSgpLmxlbmd0aCA+IDAgPyB0cmFjay50aXRsZS50cmltKCkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgOiAnPycgfQogIDwvdGV4dD4KPC9zdmc+'}
            alt={track.title}
            className="w-full aspect-square object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+CiAgPGxpbmVhckdyYWRpZW50IGlkPSJncmFkIiB4MT0iMCIgeTE9IjAiIHgyPSIxIiB5Mj0iMSI+CiAgICA8c3RvcCBvZmZzZXQ9IjAiIHN0b3AtY29sb3I9IiNGRjRENDciLz4KICAgIDxzdG9wIG9mZnNldD0iMSIgc3RvcC1jb2xvcj0iI0ZGQ0IyQiIvPgogIDwvbGluZWFyR3JhZGllbnQ+CiAgPHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InVybCgjZ3JhZCkiLz4KICA8dGV4dCB4PSI1MCIgeT0iNTAiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIzNSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iIGZpbGw9IndoaXRlIj4KICAgIHsgdHJhY2sudGl0bGUgJiYgdHJhY2sudGl0bGUudHJpbSgpLmxlbmd0aCA+IDAgPyB0cmFjay50aXRsZS50cmltKCkuY2hhckF0KDApLnRvVXBwZXJDYXNlKCkgOiAnPycgfQogIDwvdGV4dD4KPC9zdmc+'; // Fallback to SVG with text
            }}
          />
          {/* Overlay badges for beats */}
          {track.type === 'beat' && (
            <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none">
              <span className="px-1.5 py-0.5 bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded shadow-lg">
                {t('beat')}
              </span>
              {(() => {
                const paymentType = track.paymentType || fullTrackData?.paymentType || 'free';
                return (
                  <span className={`px-1.5 py-0.5 ${paymentType === 'paid' ? 'bg-green-600/90' : 'bg-blue-600/90'} backdrop-blur-sm text-white text-[10px] font-bold rounded shadow-lg`}>
                    {paymentType === 'paid' ? t('paid') : t('free')}
                  </span>
                );
              })()}
            </div>
          )}
          {/* Price overlay for paid beats */}
          {track.type === 'beat' && (track.paymentType === 'paid' || fullTrackData?.paymentType === 'paid') && (track.price || fullTrackData?.price) && (
            <div className="absolute top-2 right-2 z-10 pointer-events-none">
              <span className="px-1.5 py-0.5 bg-yellow-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded shadow-lg">
                {(track.price || fullTrackData?.price)?.toLocaleString()} RWF
              </span>
            </div>
          )}
        </div>
        {showPlayButton && (
          <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
            <button
              onClick={handlePlay}
              className="mx-card-play !static pointer-events-auto hover:bg-primary-hover [&_svg]:w-4 [&_svg]:h-4"
            >
              {currentTrack?.id === track.id && isPlaying ? (
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                    clipRule="evenodd"
                  ></path>
                </svg>
              )}
            </button>
            {showLikeButton && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite();
                }}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110"
              >
                <svg 
                  className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${isFavorite ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`}
                  fill={isFavorite ? "currentColor" : "none"}
                  stroke="currentColor"
                  viewBox="0 0 24 24" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </button>
            )}
            {showAddToQueueButton && (
              <AddToQueueButton
                track={{
                  id: track.id,
                  title: track.title,
                  artist: track.artist,
                  coverImage: track.coverImage || '',
                  audioUrl: fullTrackData?.audioURL || fullTrackData?.audioUrl || track.audioUrl || '',
                  duration: fullTrackData?.duration ? (fullTrackData.duration.includes(':') ? 
                    (() => {
                      const [mins, secs] = fullTrackData.duration.split(':').map(Number);
                      return mins * 60 + secs;
                    })() : Number(fullTrackData.duration)
                  ) : track.duration ? (track.duration.includes(':') ? 
                    (() => {
                      const [mins, secs] = track.duration.split(':').map(Number);
                      return mins * 60 + secs;
                    })() : Number(track.duration)
                  ) : undefined,
                  creatorId: typeof fullTrackData?.creatorId === 'object' && fullTrackData?.creatorId !== null 
                    ? (fullTrackData.creatorId as any)._id 
                    : fullTrackData?.creatorId || track.creatorId,
                  type: fullTrackData?.type || track.type,
                  creatorWhatsapp: (typeof fullTrackData?.creatorId === 'object' && fullTrackData?.creatorId !== null 
                    ? (fullTrackData.creatorId as any).whatsappContact 
                    : undefined) || track.creatorWhatsapp,
                  paymentType: fullTrackData?.paymentType || track.paymentType,
                  price: fullTrackData?.price || track.price
                }}
                size="sm"
                variant="secondary"
                className="opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75"
              />
            )}
        </div>
        )}
      </div>

      <div className="p-3">
        <div className="mb-1">
          <h3 className="font-bold text-sm sm:text-base truncate text-text-primary">
            {track.title}
          </h3>
          <p className="text-gray-400 text-xs sm:text-sm truncate">
            {track.artist}
          </p>
        </div>
        
        {/* Compact Action Button for beats */}
        {track.type === 'beat' && (
          <div className="mt-2 h-8">
            {(track.paymentType === 'paid' || fullTrackData?.paymentType === 'paid') ? (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const price = track.price || fullTrackData?.price;
                  if (!price || price <= 0) {
                    alert('Price not available');
                    return;
                  }
                  showPayment({
                    trackId: track.id,
                    trackTitle: track.title,
                    price: price,
                    audioUrl: fullTrackData?.audioURL || fullTrackData?.audioUrl
                  });
                }}
                className="w-full h-full btn-primary text-white rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
                {t('buyNow')}
              </button>
            ) : (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  const downloadUrl = fullTrackData?.audioURL || fullTrackData?.audioUrl;
                  if (fullTrackData && downloadUrl) {
                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = `${track.title}.mp3`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  } else {
                    alert('Download link not available');
                  }
                }}
                className="w-full h-full btn-secondary text-white rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                </svg>
                {t('freeDownload')}
              </button>
            )}
          </div>
        )}
        
        {/* Placeholder for non-beat tracks to maintain consistent height if needed */}
        {track.type !== 'beat' && <div className="mt-2 h-8 hidden sm:block"></div>}
        
        <div className="flex justify-between items-center text-[10px] sm:text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800/50">
          <span className="flex items-center gap-1">
            <svg className="w-3 h-3 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {track.plays?.toLocaleString() || '0'} {t('plays')}
          </span>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <svg className={`w-3 h-3 ${isFavorite ? 'text-red-500 fill-current' : 'opacity-70'}`} fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              {track.likes || 0}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
