'use client';

import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  plays?: number;
  likes?: number;
  duration?: string;
  creatorId?: string;
  audioUrl?: string;
  paymentType?: 'free' | 'paid';
  price?: number;
}

interface ListCardProps {
  track: Track;
  fullTrackData?: any;
  index: number;
}

export default function ListCard({ track, fullTrackData, index }: ListCardProps) {
  const { t } = useLanguage();
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist } = useAudioPlayer();

  const handlePlay = () => {
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
        paymentType: fullTrackData.paymentType || track.paymentType,
        price: fullTrackData.price || track.price,
      });

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
        paymentType: t.paymentType,
        price: t.price,
      }));
      setCurrentPlaylist(playlistTracks);
    }
  };

  return (
    <div className="w-full mb-2">
      <div 
        className="group relative flex items-center gap-2 p-2 rounded-xl active:scale-[0.98] cursor-pointer mx-surface"
        onClick={handlePlay}
      >
        {/* Track Number */}
        <div className="w-6 text-center text-gray-400 text-xs font-bold">
          {currentTrack?.id === track.id && isPlaying ? (
            <div className="flex items-end justify-center gap-0.5 h-4">
              <div className="w-1 bg-primary animate-[musicBar_0.6s_ease-in-out_infinite]"></div>
              <div className="w-1 bg-primary animate-[musicBar_0.8s_ease-in-out_infinite_0.2s]"></div>
              <div className="w-1 bg-primary animate-[musicBar_0.5s_ease-in-out_infinite_0.1s]"></div>
            </div>
          ) : (
            <span>{index + 1}</span>
          )}
        </div>

        {/* Track Cover */}
        <div className="relative w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden">
          {track.coverImage && track.coverImage.trim() !== '' ? (
            <img
              src={track.coverImage}
              alt={track.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
            </div>
          )}
          {/* Play Button Overlay */}
          <button
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Track Info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-xs sm:text-sm truncate tracking-wide drop-shadow-md text-text-primary">
            {track.title}
          </h3>
          <p className="text-gray-300 text-xs truncate font-medium">
            {track.artist}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2">
          {track.plays !== undefined && (
            <div className="hidden sm:flex items-center gap-1">
              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
              <span className="text-gray-400 text-xs font-semibold">{track.plays.toLocaleString()}</span>
            </div>
          )}
          {track.likes !== undefined && (
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3 text-primary-light" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd"></path>
              </svg>
              <span className="text-gray-400 text-xs font-semibold">{track.likes}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
