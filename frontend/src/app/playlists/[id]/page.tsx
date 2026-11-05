'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAudioPlayer } from '../../../contexts/AudioPlayerContext';
import { useAuth } from '../../../contexts/AuthContext';
import { getUserPlaylists, getPublicPlaylist } from '../../../services/userService';
import { FaPlay, FaPause, FaHeart, FaShareAlt } from 'react-icons/fa';
import { MdShuffle } from 'react-icons/md';

interface PlaylistTrack {
  _id: string;
  title: string;
  creatorId: {
    _id: string;
    name: string;
  } | string;
  plays: number;
  coverURL?: string;
  audioURL?: string;
  audioUrl?: string;
  coverImage?: string;
  likes?: number;
  duration?: number;
}

interface Playlist {
  _id: string;
  name: string;
  description: string;
  userId: {
    _id: string;
    name: string;
  };
  tracks: PlaylistTrack[];
  isPublic: boolean;
  createdAt: string;
  coverImage?: string;
}

export default function PlaylistDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { 
    currentTrack, 
    isPlaying, 
    playTrack, 
    setCurrentPlaylist, 
    favorites, 
    addToFavorites, 
    removeFromFavorites, 
    setCurrentPlaylistName,
    shufflePlaylist 
  } = useAudioPlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredTrack, setHoveredTrack] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        // Try to get user's playlists first
        const playlists = await getUserPlaylists();
        let foundPlaylist = playlists.find((p: Playlist) => p._id === id);
        
        // If not found in user's playlists, try to fetch as public playlist
        if (!foundPlaylist && id) {
          foundPlaylist = await getPublicPlaylist(id as string);
        }

        if (!foundPlaylist) {
          setError('Playlist not found');
          return;
        }

        setPlaylist(foundPlaylist);
      } catch (err: any) {
        console.error('Error fetching playlist:', err);
        setError(err.message || 'Failed to load playlist');
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylist();
  }, [id]);

  // Play entire playlist
  const handlePlayPlaylist = () => {
    if (!playlist || playlist.tracks.length === 0) return;

    const playlistTracks = playlist.tracks
      .filter((track) => track.audioURL || track.audioUrl)
      .map((track) => ({
        id: track._id,
        title: track.title,
        artist: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any).name 
          : 'Unknown Artist',
        coverImage: track.coverURL || track.coverImage || '',
        audioUrl: track.audioURL || track.audioUrl || '',
        creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any)._id 
          : track.creatorId,
        duration: track.duration,
        plays: track.plays,
        likes: track.likes,
        type: 'song' as const,
      }));

    if (playlistTracks.length > 0) {
      setCurrentPlaylistName(playlist.name);
      setCurrentPlaylist(playlistTracks);
      playTrack(playlistTracks[0], playlistTracks);
    }
  };

  // Play specific track
  const handlePlayTrack = (track: PlaylistTrack, index: number) => {
    const trackToPlay = {
      id: track._id,
      title: track.title,
      artist: typeof track.creatorId === 'object' && track.creatorId !== null 
        ? (track.creatorId as any).name 
        : 'Unknown Artist',
      coverImage: track.coverURL || track.coverImage || '',
      audioUrl: track.audioURL || track.audioUrl || '',
      creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
        ? (track.creatorId as any)._id 
        : track.creatorId,
      type: 'song' as const,
    };

    const playlistTracks = playlist!.tracks
      .filter((t) => t.audioURL || t.audioUrl)
      .map((t) => ({
        id: t._id,
        title: t.title,
        artist: typeof t.creatorId === 'object' && t.creatorId !== null 
          ? (t.creatorId as any).name 
          : 'Unknown Artist',
        coverImage: t.coverURL || t.coverImage || '',
        audioUrl: t.audioURL || t.audioUrl || '',
        creatorId: typeof t.creatorId === 'object' && t.creatorId !== null 
          ? (t.creatorId as any)._id 
          : t.creatorId,
        type: 'song' as const,
      }));

    setCurrentPlaylistName(playlist!.name);
    setCurrentPlaylist(playlistTracks);
    playTrack(trackToPlay, playlistTracks);
  };

  // Toggle favorite
  const toggleFavorite = (track: PlaylistTrack) => {
    const isFavorite = favorites.some(fav => fav.id === track._id);
    
    if (isFavorite) {
      removeFromFavorites(track._id);
    } else {
      addToFavorites({
        id: track._id,
        title: track.title,
        artist: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any).name 
          : 'Unknown Artist',
        coverImage: track.coverURL || track.coverImage || '',
        audioUrl: track.audioURL || track.audioUrl || '',
        creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any)._id 
          : track.creatorId,
      });
    }
  };

  // Get playlist cover image (use first track's cover or playlist cover)
  const getPlaylistCover = () => {
    if (playlist?.coverImage) return playlist.coverImage;
    if (playlist?.tracks && playlist.tracks.length > 0 && playlist.tracks[0].coverURL) {
      return playlist.tracks[0].coverURL;
    }
    return '';
  };

  // Check if track is favorite
  const isTrackFavorite = (trackId: string) => {
    return favorites.some(fav => fav.id === trackId);
  };

  // Check if track is currently playing
  const isCurrentTrack = (trackId: string) => {
    return currentTrack?.id === trackId;
  };

  // Shuffle playlist
  const handleShufflePlaylist = () => {
    if (!playlist || playlist.tracks.length === 0) return;

    const playlistTracks = playlist.tracks
      .filter((track) => track.audioURL || track.audioUrl)
      .map((track) => ({
        id: track._id,
        title: track.title,
        artist: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any).name 
          : 'Unknown Artist',
        coverImage: track.coverURL || track.coverImage || '',
        audioUrl: track.audioURL || track.audioUrl || '',
        creatorId: typeof track.creatorId === 'object' && track.creatorId !== null 
          ? (track.creatorId as any)._id 
          : track.creatorId,
        duration: track.duration,
        plays: track.plays,
        likes: track.likes,
        type: 'song' as const,
      }));

    if (playlistTracks.length > 0) {
      // Shuffle the tracks
      const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
      setCurrentPlaylistName(`${playlist.name} (Shuffled)`);
      setCurrentPlaylist(shuffled);
      playTrack(shuffled[0], shuffled);
      setIsShuffled(true);
    }
  };

  // Share playlist
  const handleSharePlaylist = async () => {
    if (!playlist) return;

    const playlistUrl = `${window.location.origin}/playlists/${playlist._id}`;
    const shareData = {
      title: `🎵 ${playlist.name}`,
      text: `Check out "${playlist.name}" on MuzikaX - ${playlist.tracks.length} tracks 🎶`,
      url: playlistUrl,
    };

    try {
      // Try native Web Share API first
      if (navigator.share) {
        await navigator.share(shareData);
        console.log('✅ Playlist shared successfully');
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(playlistUrl);
        alert('Playlist link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing playlist:', error);
      // Final fallback
      try {
        await navigator.clipboard.writeText(playlistUrl);
        alert('Playlist link copied to clipboard!');
      } catch (clipboardError) {
        console.error('Failed to copy link:', clipboardError);
        alert('Could not share playlist. Please try again.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen py-8 sm:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !playlist) {
    return (
      <div className="min-h-screen py-8 sm:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="text-center py-12">
            <div className="text-red-500 text-xl mb-4">{error || 'Playlist not found'}</div>
            <button 
              onClick={() => router.push('/playlists')}
              className="px-6 py-3 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-colors"
            >
              Back to Playlists
            </button>
          </div>
        </div>
      </div>
    );
  }

  const totalDuration = playlist.tracks.reduce((acc, track) => acc + (track.duration || 0), 0);
  const totalTracks = playlist.tracks.length;

  return (
    <div className="min-h-screen pb-24 relative overflow-hidden pt-16 sm:pt-0 bg-background">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-primary/10 via-primary-light/5 to-transparent -z-10"></div>
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse"></div>
      <div className="absolute top-40 left-0 w-72 h-72 bg-primary-light/5 rounded-full blur-3xl -z-10 animate-pulse delay-1000"></div>
      
      <div className="container mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-6 mb-6 sm:mb-8 p-4 sm:p-6 lg:p-8 bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-white/10 shadow-2xl">
          {/* Playlist Cover */}
          <div className="relative group">
            <div className="w-40 h-40 sm:w-52 sm:h-52 lg:w-64 lg:h-64 shadow-2xl overflow-hidden rounded-xl sm:rounded-2xl ring-4 ring-white/10 group-hover:ring-primary/50 transition-all duration-500">
              {getPlaylistCover() ? (
                <img
                  src={getPlaylistCover()}
                  alt={playlist.name}
                  className="w-full h-full object-cover transform group-hover:scale-[1.04] transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary via-primary-light to-primary-light flex items-center justify-center">
                  <span className="text-5xl sm:text-6xl font-black text-white drop-shadow-lg">
                    {playlist.name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            {/* Hover overlay with play button */}
            <div className="absolute inset-0 flex items-end justify-end p-2 sm:p-3 pointer-events-none">
              <button
                onClick={handlePlayPlaylist}
                className="mx-card-play !static pointer-events-auto hover:bg-primary-hover [&_svg]:w-4 [&_svg]:h-4"
              >
                <FaPlay className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 ml-1" />
              </button>
            </div>
          </div>

          {/* Playlist Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-primary/20 to-primary-light/20 rounded-full mb-2 sm:mb-3 border border-primary/30">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
              </svg>
              <p className="text-[10px] sm:text-xs font-bold text-primary uppercase tracking-wider">Playlist</p>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black mb-3 sm:mb-4 leading-tight break-words text-text-primary">
              {playlist.name}
            </h1>
            {playlist.description && (
              <p className="text-xs sm:text-sm text-gray-300 mb-3 sm:mb-4 max-w-2xl leading-relaxed line-clamp-2 sm:line-clamp-none">
                {playlist.description}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 sm:gap-3 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 rounded-full border border-white/10">
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-r from-primary to-primary-light flex items-center justify-center">
                  <span className="text-[10px] sm:text-xs font-bold text-white">
                    {(typeof playlist.userId === 'object' ? playlist.userId.name : 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="font-semibold text-white truncate max-w-[100px] sm:max-w-none">
                  {typeof playlist.userId === 'object' ? playlist.userId.name : 'Unknown User'}
                </span>
              </div>
              <span className="text-gray-500 hidden xs:inline">•</span>
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 rounded-full border border-white/10">
                <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary-light" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-300">{totalTracks} {totalTracks === 1 ? 'track' : 'tracks'}</span>
              </div>
              {totalDuration > 0 && (
                <>
                  <span className="text-gray-500 hidden xs:inline">•</span>
                  <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/5 rounded-full border border-white/10">
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-primary-light" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-300">{Math.floor(totalDuration / 60)} min</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center md:justify-start gap-2 sm:gap-3 mb-6 sm:mb-8">
          <button
            onClick={handlePlayPlaylist}
            className="group relative px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-primary-light hover:from-primary/90 hover:to-primary-light/90 text-white font-bold rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg shadow-primary/30 flex items-center gap-2 overflow-hidden text-sm sm:text-base"
          >
            <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></span>
            {isPlaying && playlist.tracks.some(t => isCurrentTrack(t._id)) ? (
              <>
                <FaPause className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                <span className="relative z-10">Pause</span>
              </>
            ) : (
              <>
                <FaPlay className="w-4 h-4 sm:w-5 sm:h-5 relative z-10" />
                <span className="relative z-10">Play All</span>
              </>
            )}
          </button>
          
          <button 
            onClick={handleShufflePlaylist}
            className={`group p-2.5 sm:p-3 lg:p-3.5 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 ${
              isShuffled 
                ? 'bg-gradient-to-r from-primary to-primary-light shadow-lg shadow-primary/30' 
                : 'bg-white/5 hover:bg-white/10 hover:shadow-lg'
            }`}
            title="Shuffle Playlist"
          >
            <MdShuffle className={`w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-colors ${
              isShuffled ? 'text-white' : 'text-gray-300 group-hover:text-white'
            }`} />
          </button>
          
          <button 
            onClick={handleSharePlaylist}
            className="group p-2.5 sm:p-3 lg:p-3.5 bg-white/5 hover:bg-white/10 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-95 hover:shadow-lg"
            title="Share Playlist"
          >
            <FaShareAlt className="w-5 h-5 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-gray-300 group-hover:text-white transition-colors" />
          </button>
        </div>

        {/* Tracks List */}
        <div className="bg-white/5 backdrop-blur-xl rounded-2xl sm:rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
          {/* Table Header - Hidden on mobile, shown on tablet+ */}
          <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto] gap-4 px-4 lg:px-6 py-4 border-b border-white/10 text-xs text-gray-400 font-semibold uppercase tracking-wider bg-white/5">
            <div className="w-12 text-center">#</div>
            <div>Title</div>
            <div><FaHeart className="w-4 h-4" /></div>
          </div>

          {/* Tracks */}
          <div className="divide-y divide-white/5">
            {playlist.tracks.map((track, index) => {
              const isFavorite = isTrackFavorite(track._id);
              const isCurrent = isCurrentTrack(track._id);
              const isHovered = hoveredTrack === track._id;

              return (
                <div
                  key={track._id}
                  className={`group relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 transition-all duration-300 cursor-pointer active:scale-[0.98] ${
                    isCurrent 
                      ? 'bg-gradient-to-r from-primary/15 via-primary-light/10 to-transparent border-l-4 border-primary' 
                      : 'hover:bg-gradient-to-r hover:from-white/8 hover:to-transparent'
                  }`}
                  onMouseEnter={() => setHoveredTrack(track._id)}
                  onMouseLeave={() => setHoveredTrack(null)}
                  onClick={() => handlePlayTrack(track, index)}
                >
                  {/* Track Number / Play Icon */}
                  <div className="w-8 sm:w-12 text-center flex-shrink-0">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-center justify-center gap-0.5">
                        <span className="w-0.5 sm:w-1 h-3 sm:h-4 bg-primary animate-pulse"></span>
                        <span className="w-0.5 sm:w-1 h-2 sm:h-3 bg-primary animate-pulse delay-75"></span>
                        <span className="w-0.5 sm:w-1 h-4 sm:h-5 bg-primary animate-pulse delay-150"></span>
                      </div>
                    ) : (
                      <span className={`text-xs sm:text-sm font-medium transition-colors ${
                        isHovered || isCurrent ? 'text-primary' : 'text-gray-500 group-hover:text-white'
                      }`}>
                        {isHovered || isCurrent ? (
                          <FaPlay className="w-3 h-3 sm:w-4 sm:h-4 mx-auto" />
                        ) : (
                          index + 1
                        )}
                      </span>
                    )}
                  </div>

                  {/* Track Cover & Info */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Album Art */}
                    <div className="relative w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 flex-shrink-0 overflow-hidden rounded-lg sm:rounded-xl shadow-md group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                      {track.coverURL || track.coverImage ? (
                        <>
                          <img
                            src={track.coverURL || track.coverImage}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                          {/* Gradient overlay on hover */}
                          <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity duration-300 ${
                            isHovered || isCurrent ? 'opacity-100' : 'opacity-0'
                          }`}></div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary via-primary-light to-primary-light flex items-center justify-center">
                          <span className="text-sm sm:text-base lg:text-lg font-black text-white drop-shadow-lg">
                            {track.title.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      
                      {/* Play overlay icon */}
                      {(isHovered || isCurrent) && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center transform scale-0 group-hover:scale-100 transition-transform duration-300">
                            {isCurrent && isPlaying ? (
                              <div className="flex items-center gap-0.5">
                                <span className="w-0.5 h-3 bg-white animate-pulse"></span>
                                <span className="w-0.5 h-2 bg-white animate-pulse delay-75"></span>
                                <span className="w-0.5 h-4 bg-white animate-pulse delay-150"></span>
                              </div>
                            ) : (
                              <FaPlay className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-0.5" />
                            )}
                          </div>
                        </div>
                      )}
                      
                      {/* Current track indicator */}
                      {isCurrent && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary-light"></div>
                      )}
                    </div>

                    {/* Track Details */}
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold truncate transition-colors mb-0.5 text-sm sm:text-base ${
                        isCurrent ? 'text-primary' : 'text-white group-hover:text-primary'
                      }`}>
                        {track.title}
                      </p>
                      <p className="text-[11px] sm:text-xs text-gray-400 truncate group-hover:text-gray-300 transition-colors">
                        {typeof track.creatorId === 'object' && track.creatorId !== null 
                          ? (track.creatorId as any).name 
                          : 'Unknown Artist'}
                      </p>
                      {/* Mobile-only plays count */}
                      <div className="sm:hidden flex items-center gap-1 mt-1">
                        <svg className="w-3 h-3 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-[10px] text-gray-500">{(track.plays || 0).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Desktop plays count */}
                    <div className="hidden sm:flex items-center gap-1.5 text-xs text-gray-400 group-hover:text-gray-300 transition-colors">
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      <span>{(track.plays || 0).toLocaleString()}</span>
                    </div>

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(track);
                      }}
                      className="p-2 sm:p-2.5 hover:bg-white/10 rounded-full transition-all duration-300 transform hover:scale-110 active:scale-90 touch-manipulation"
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <FaHeart 
                        className={`w-4 h-4 sm:w-4 sm:h-4 transition-all duration-300 ${
                          isFavorite 
                            ? 'text-red-500 fill-current scale-110 drop-shadow-lg' 
                            : 'text-gray-500 group-hover:text-red-400'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {playlist.tracks.length === 0 && (
            <div className="text-center py-12 sm:py-16 px-4">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center border border-white/10">
                <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <p className="text-gray-400 text-base sm:text-lg mb-2 font-medium">This playlist is empty</p>
              <p className="text-gray-500 text-xs sm:text-sm mb-6">Discover amazing tracks to add to your collection</p>
              <button
                onClick={() => router.push('/tracks')}
                className="inline-flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-primary to-primary-light hover:from-primary/90 hover:to-primary-light/90 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-lg shadow-primary/25 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Find Music to Add
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
