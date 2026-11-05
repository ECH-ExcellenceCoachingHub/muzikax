'use client'

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getSoundEngine } from '../utils/soundEngine';
import { useRouter } from 'next/navigation';
import { fetchCommentsForTrack, addCommentToTrack, incrementTrackPlayCount } from '../services/trackService';
import { getUserFavorites, getUserPlaylists, addTrackToFavorites, removeTrackFromFavorites, addTrackToPlaylist as addTrackToPlaylistService, createPlaylist as createPlaylistService } from '../services/userService';
import { addRecentlyPlayed } from '../services/recentlyPlayedService';
import { fetchRecommendedTracks } from '../services/recommendationService';
import { reportInvalidTrack } from '../services/trackCleanupService';
import { shareContent } from '../utils/webShare'; // Import modern Web Share API

export type LoopMode = 'none' | 'one' | 'all';

interface Track {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  audioUrl: string;
  audioURL?: string; // Alternative property name for audio URL
  duration?: number; // in seconds
  creatorId?: string; // Add creator ID for linking to artist profile
  albumId?: string; // Add album ID for album playback logic
  plays?: number; // Add plays property to track play counts
  likes?: number; // Add likes property to track like counts
  type?: 'song' | 'beat' | 'mix'; // Add type field to distinguish beats
  paymentType?: 'free' | 'paid'; // Add payment type for beats
  price?: number; // Add price for paid beats
  currency?: string; // Add currency for paid beats
  creatorWhatsapp?: string; // Add creator's WhatsApp contact for beats
  description?: string; // Add track description
  collaborators?: string[]; // Add collaborators array
}
interface Playlist {
  id: string;
  name: string;
  tracks: Track[];
}

interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
}

interface AudioPlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  isMinimized: boolean;
  playlist: Track[];
  playlists: Playlist[];
  favorites: Track[];
  favoritesLoading: boolean;
  comments: Comment[];
  volume: number;
  playbackRate: number;
  queue: Track[]; // Queue for upcoming tracks
  currentPlaylistName: string; // Name of the current playlist being played
  setCurrentPlaylistName: (name: string) => void; // Function to set current playlist name
  playTrack: (track: Track, contextPlaylist?: Track[], albumContext?: { albumId: string, tracks: Track[] }) => void;
  playNextTrack: (isExplicit?: boolean) => Promise<void>;
  playPreviousTrack: (isExplicit?: boolean) => void;
  pauseTrack: () => void;
  stopTrack: () => void;
  togglePlayPause: () => void;
  toggleMinimize: () => void;
  minimizeAndGoBack: () => void;
  closePlayer: () => void;
  setProgress: (progress: number) => void;
  progress: number;
  duration: number;
  addToPlaylist: (track: Track) => void;
  removeFromPlaylist: (trackId: string) => void;
  createPlaylist: (name: string) => void;
  addToFavorites: (track: Track) => void;
  removeFromFavorites: (trackId: string) => void;
  setCurrentPlaylist: (tracks: Track[]) => void;
  shufflePlaylist: () => void; // Add shufflePlaylist function
  shuffleQueue: () => void; // Add shuffleQueue function
  toggleLoop: () => void;
  loopMode: LoopMode;
  currentTrackIndex: number;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  // Queue management functions
  addToQueue: (track: Track) => void;
  removeFromQueue: (trackId: string) => void;
  clearQueue: () => void;
  moveQueueItem: (fromIndex: number, toIndex: number) => void;
  playFromQueue: (trackId: string) => void;
  addAlbumToQueue: (albumTracks: Track[]) => void;
  addRecommendationsToQueue: (limit?: number) => Promise<number>;
  addComment: (comment: Omit<Comment, 'id' | 'timestamp'>) => void;
  removeComment: (commentId: string) => void;
  loadComments: (trackId: string) => void;
  setVolume: (volume: number) => void;
  setPlaybackRate: (rate: number) => void;
  shareTrack: (platform: string) => void;
  downloadTrack: () => void; // Add downloadTrack function
  markRedirectCompleted: () => void; // Add function to mark redirect as completed
  clearAllFavorites: () => void; // Add function to clear all favorites
  isSoloPlayerOpen: boolean; // Add isSoloPlayerOpen property
  setIsSoloPlayerOpen: (isOpen: boolean) => void; // Add setIsSoloPlayerOpen function
  // Music visualization properties
  audioAnalyser: AnalyserNode | null;
  audioContext: AudioContext | null;
  frequencyData: Uint8Array | null;
}
const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export const useAudioPlayer = () => {
  const context = useContext<AudioPlayerContextType | undefined>(AudioPlayerContext);
  if (!context) {
    throw new Error('useAudioPlayer must be used within an AudioPlayerProvider');
  }
  return context;
};

export const AudioPlayerProvider = ({ children }: { children: ReactNode }) => {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isSoloPlayerOpen, setIsSoloPlayerOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playlist, setPlaylist] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [favorites, setFavorites] = useState<Track[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loopMode, setLoopMode] = useState<LoopMode>('none');
  const [queue, setQueue] = useState<Track[]>([]); // Queue for upcoming tracks
  const [currentPlaylistName, setCurrentPlaylistName] = useState<string>(''); // Name of the current playlist being played
  const [hasReachedTimeLimit, setHasReachedTimeLimit] = useState<boolean>(false); // State to track if time limit has been reached for paid beats
  
  // Proxy URL for CloudFront and S3 audio (to bypass CORS)
  const AUDIO_PROXY_URL = process.env.NEXT_PUBLIC_AUDIO_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  
  // Helper function to get proxied URL for AWS/CloudFront resources
  const getProxiedUrl = (url: string): string => {
    // Use proxy for CloudFront and S3 URLs to bypass CORS
    if (url.includes('cloudfront.net') || url.includes('amazonaws.com')) {
      return `${AUDIO_PROXY_URL}/api/audio-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };
  
  // Initialize redirect status on context creation
  useEffect(() => {
    // Update last active time
    const currentTime = Date.now();
    localStorage.setItem('last_active_time', currentTime.toString());
  }, []);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasIncrementedPlayCount = useRef<Set<string>>(new Set());
  const router = useRouter();
  const currentPlaybackContext = useRef<{ 
    type: 'playlist' | 'album' | 'single'; 
    data?: any;
    albumId?: string; // Store album ID when in album context
    albumComplete?: boolean; // Flag to indicate if album has been completed
    playlistName?: string; // Store playlist name when in playlist context
  }>({ type: 'single' });
  
  // Audio visualization refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const frequencyDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Refs to hold current values for audio event handlers
  const currentTrackRef = useRef<Track | null>(null);
  const playlistRef = useRef<Track[]>([]);
  const currentTrackIndexRef = useRef<number>(0);
  const loopModeRef = useRef<LoopMode>('none');

  // Keep loopModeRef in sync with loopMode state
  useEffect(() => {
    loopModeRef.current = loopMode;
  }, [loopMode]);
  
  // Ref to store the original playlist when switching to single track context
  const originalPlaylistRef = useRef<Track[]>([]);
  
  // Initialize audio context and analyser for visualization
  useEffect(() => {
    // Only initialize if audio element exists and not already initialized
    if (audioRef.current && !audioContextRef.current) {
      try {
        const engine = getSoundEngine();
        engine.attach(audioRef.current);
        audioContextRef.current = engine.audioContext;
        analyserRef.current = engine.analyser;
        frequencyDataRef.current = engine.analyser ? new Uint8Array(engine.analyser.frequencyBinCount) : null;
      } catch (error) {
        console.error('❌ Failed to initialize audio context:', error);
      }
    }
    
    return () => {
      // Cleanup audio context on unmount
      // The audio context belongs to the shared sound engine: release refs, don't close it.
      if (audioContextRef.current) {
        audioContextRef.current = null;
        analyserRef.current = null;
        frequencyDataRef.current = null;
      }
    };
  }, [audioRef.current]);
  
  // Store the original playlist before switching to single track context
  const storeOriginalPlaylist = () => {
    if (currentPlaybackContext.current.type !== 'single' && playlistRef.current.length > 0) {
      originalPlaylistRef.current = [...playlistRef.current];
      console.log('Stored original playlist with', originalPlaylistRef.current.length, 'tracks');
    }
  };
  
  // Function to display time limit message for paid beats
  const timeLimitMessage = (track: Track) => {
    // For paid beats, trigger the payment modal instead of WhatsApp
    if (track.paymentType === 'paid' && track.price && track.price > 0) {
      const paymentEvent = new CustomEvent('requestTrackPayment', {
        detail: {
          trackId: track.id,
          trackTitle: track.title,
          price: track.price,
          audioUrl: track.audioUrl
        }
      });
      window.dispatchEvent(paymentEvent);
    } else {
      // Fallback for free beats or beats without price info
      const message = `You've reached the 40-second preview for "${track.title}". To get the full version, please contact the creator via WhatsApp.`;
      alert(message);
      
      // Open WhatsApp with pre-filled message
      if (track.creatorWhatsapp) {
        const whatsappMessage = `Hi, I'm interested in the full version of your beat "${track.title}" that I found on MuzikaX. I've listened to the 40-second preview and would like to purchase the full version.`;
        window.open(`https://wa.me/${track.creatorWhatsapp}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
      }
    }
    
    // Reset the time limit state to allow replaying or playing another track
    setHasReachedTimeLimit(false);
  };
  
  // Expose the playback context globally so it can be accessed from other components
  useEffect(() => {
    (window as any).audioPlayerContext = currentPlaybackContext;
    return () => {
      delete (window as any).audioPlayerContext;
    };
  }, []);

  // Load favorites and playlists from backend on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Check if user is authenticated by checking for access token
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken) {
          console.log('No access token found, skipping user data load');
          setFavoritesLoading(false);
          return;
        }
        
        // Load favorites
        const userFavorites = await getUserFavorites();
        setFavorites(userFavorites);
        setFavoritesLoading(false);
        
        // Dispatch a custom event to notify that favorites have been loaded
        window.dispatchEvent(new CustomEvent('favoritesLoaded'));
        
        // Load playlists
        const userPlaylists = await getUserPlaylists();
        // Map the playlists to ensure each has a unique id
        const mappedPlaylists = userPlaylists.map((playlist: any) => ({
          ...playlist,
          id: playlist._id || playlist.id, // Use _id if available, otherwise use id
          tracks: playlist.tracks?.map((track: any) => ({
            ...track,
            id: track._id || track.id // Use _id if available, otherwise use id
          })) || []
        }));
        setPlaylists(mappedPlaylists);
      } catch (error) {
        console.error('Error loading user data:', error);
        setFavoritesLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // Load comments when currentTrack changes
  useEffect(() => {
    const loadCommentsForTrack = async () => {
      if (currentTrack?.id) {
        try {
          const trackComments = await fetchCommentsForTrack(currentTrack.id);
          // Convert timestamp format if needed
          const formattedComments = trackComments.map((comment: any) => ({
            id: comment._id,
            userId: comment.userId._id || comment.userId,
            username: comment.userId.name || 'Unknown User',
            text: comment.text,
            timestamp: comment.createdAt
          }));
          setComments(formattedComments);
        } catch (error) {
          console.error('Error loading comments:', error);
          setComments([]);
        }
      } else {
        setComments([]);
      }
    };

    loadCommentsForTrack();
  }, [currentTrack?.id]);

  // Flag to track if the track was explicitly played by user
  const explicitlyPlayedRef = useRef(false);
  
  // Update audio playback rate when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);
  
  // Navigate to full player page when a track is played and not minimized
  // Only navigate when explicitly playing a new track, not when auto-playing next track
  useEffect(() => {
    console.log('Navigation useEffect triggered');
    console.log('currentTrack:', currentTrack);
    console.log('isMinimized:', isMinimized);
    console.log('explicitlyPlayedRef.current:', explicitlyPlayedRef.current);
    
    if (currentTrack && !isMinimized && explicitlyPlayedRef.current) {
      console.log('Navigating to /player');
      router.push('/player');
      // Reset the flag after navigation to prevent duplicate navigations
      explicitlyPlayedRef.current = false;
    } else {
      console.log('Not navigating to /player because:');
      if (!currentTrack) console.log('- No current track');
      if (isMinimized) console.log('- Player is minimized');
      if (!explicitlyPlayedRef.current) console.log('- Not explicitly played');
    }
  }, [currentTrack, isMinimized, router]);

  const playTrack = (track: Track, contextPlaylist?: Track[], albumContext?: { albumId: string, tracks: Track[] }, isCycling: boolean = false) => {
    // Open the external redirect link in a new tab every time play is clicked
    window.open('//djxh1.com/4/10541499?var=muzikax_play_button', '_blank');
    
    console.log('PLAY TRACK CALLED with track:', track);
    console.log('Current track before playTrack:', currentTrack);
    console.log('Current track index before playTrack:', currentTrackIndex);
    console.log('Explicitly played ref:', explicitlyPlayedRef.current);
    console.log('Current playback context before setting:', currentPlaybackContext.current);
    console.log('Is cycling:', isCycling);
    
    // Reset time limit state when playing a new track
    setHasReachedTimeLimit(false);
    
    // Validate that we have a valid audio URL
    if (!track.audioUrl || track.audioUrl.trim() === '') {
      console.error('Cannot play track: Invalid audio URL', track);
      return;
    }
    
    // If we're already playing this track, just resume
    if (currentTrack?.id === track.id && audioRef.current) {
      console.log('Resuming existing track');
      audioRef.current.play().catch(error => {
        console.error('Error resuming track:', error);
      });
      setIsPlaying(true);
      console.log('Track resumed successfully');
      return;
    }
    
    // Stop current track if playing
    if (audioRef.current) {
      console.log('Stopping current audio');
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clean up previous audio context
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    // Set the playback context
    if (albumContext) {
      console.log('Setting album context');
      currentPlaybackContext.current = { 
        type: 'album', 
        data: albumContext,
        albumId: albumContext.albumId,
        albumComplete: false // Reset album completion flag
      };
      // Set the playlist to the album tracks
      setPlaylist(albumContext.tracks);
      // Update ref synchronously
      playlistRef.current = albumContext.tracks;
      const index = albumContext.tracks.findIndex(t => t.id === track.id);
      console.log('Setting album track index to:', index);
      setCurrentTrackIndex(index >= 0 ? index : 0);
      // Update ref synchronously
      currentTrackIndexRef.current = index >= 0 ? index : 0;
      
      // Add remaining album tracks to queue (excluding the current track)
      const remainingAlbumTracks = albumContext.tracks
        .filter((t, i) => i > index) // Only tracks after the current one
        .filter(t => !queue.some(qt => qt.id === t.id)); // Avoid duplicates in queue
      if (remainingAlbumTracks.length > 0) {
        setQueue(prev => [...prev, ...remainingAlbumTracks]);
        console.log(`Added ${remainingAlbumTracks.length} remaining album tracks to queue`);
      }
    } else if (contextPlaylist && contextPlaylist.length > 0) {
      console.log('Setting playlist context with tracks:', contextPlaylist);
      // Extract playlist name from the contextPlaylist if it contains playlist info
      const playlistName = (contextPlaylist as any).name || (contextPlaylist as any).playlistName || 'Current Playlist';
      currentPlaybackContext.current = { 
        type: 'playlist', 
        data: contextPlaylist,
        playlistName: playlistName
      };
      setPlaylist(contextPlaylist);
      // Update ref synchronously
      playlistRef.current = contextPlaylist;
      // Only calculate the index if we're not cycling through tracks
      if (!isCycling) {
        const index = contextPlaylist.findIndex(t => t.id === track.id);
        console.log('Setting playlist track index to:', index);
        setCurrentTrackIndex(index >= 0 ? index : 0);
        // Update ref synchronously
        currentTrackIndexRef.current = index >= 0 ? index : 0;
        
        // Add remaining tracks in the playlist to the queue (excluding the current track)
        const remainingTracks = contextPlaylist
          .slice(index + 1) // Get tracks after the current one
          .filter(t => !queue.some(qt => qt.id === t.id)); // Avoid duplicates in queue
        if (remainingTracks.length > 0) {
          setQueue(prev => [...prev, ...remainingTracks]);
          console.log(`Added ${remainingTracks.length} remaining playlist tracks to queue`);
        }
      }
      // Set the playlist name if available
      setCurrentPlaylistName(playlistName);
    } else {
      console.log('Setting single track context');
      // Store the original playlist before switching to single track context
      storeOriginalPlaylist();
      currentPlaybackContext.current = { type: 'single' };
      // For For single track, create a playlist with just this track
      setPlaylist([track]);
      // Update ref synchronously
      playlistRef.current = [track];
      setCurrentTrackIndex(0);
      // Update ref synchronously
      currentTrackIndexRef.current = 0;
    }
    
    console.log('Current playback context after setting:', currentPlaybackContext.current);
    
    // Use proxy for CloudFront URLs to bypass CORS
    const audioUrl = getProxiedUrl(track.audioUrl);
    console.log('Playing audio URL:', audioUrl);
    
    // Create new audio element
    const audio = new Audio(audioUrl);
    // Add crossorigin attribute to allow Web Audio API to process cross-origin audio
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    // Route through the shared sound engine (EQ/effects persist across tracks)
    getSoundEngine().attach(audio);
    
    // Set initial volume
    audio.volume = volume;
    
    // Set initial playback rate
    audio.playbackRate = playbackRate;

    // Set up event listeners
    audio.onplay = () => {
      console.log('Audio started playing');
      setIsPlaying(true);
    };
    audio.onpause = () => {
      console.log('Audio paused');
      setIsPlaying(false);
    };
    audio.onended = handleAudioEnded;
    
    // Add seeked event listener to ensure playback continues after seeking
    audio.onseeked = () => {
      console.log('Audio seeked to:', audio.currentTime);
      // Ensure audio continues playing after seek if it was playing before
      if (isPlaying && audio.paused) {
        audio.play().catch(error => {
          // Ignore AbortError which occurs when play() is interrupted by pause()
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.error('Error resuming playback after seek:', error);
          }
        });
      }
    };
    
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime);
        setDuration(audio.duration);
        
        // Check if this is a paid beat and has reached the 40-second limit
        // Use the track variable instead of currentTrackRef.current since it's updated after this event
        if (track?.paymentType === 'paid' && audio.currentTime >= 40) {
          if (!hasReachedTimeLimit) {
            setHasReachedTimeLimit(true);
            audio.pause();
            timeLimitMessage(track);
          }
        }
      }
    };
    
    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
      // Initialize audio context and analyser for visualization
      if (!audioContextRef.current && audioRef.current) {
        setTimeout(() => {
          try {
            const engine = getSoundEngine();
            engine.attach(audioRef.current);
            audioContextRef.current = engine.audioContext;
            analyserRef.current = engine.analyser;
            frequencyDataRef.current = engine.analyser ? new Uint8Array(engine.analyser.frequencyBinCount) : null;
            console.log('✅ Audio context and analyser initialized in onloadedmetadata');
          } catch (error) {
            console.error('❌ Failed to initialize audio context:', error);
          }
        }, 100);
      }
    };
    
    audio.onerror = async (error) => {
      console.error('Audio error occurred:', error);
      
      // Report invalid track to backend for cleanup
      if (currentTrackRef.current) {
        console.log(`Reporting invalid track ${currentTrackRef.current.id} for cleanup`);
        try {
          const cleanupResult = await reportInvalidTrack(currentTrackRef.current.id);
          if (cleanupResult.success && cleanupResult.removed) {
            console.log(`Successfully removed invalid track: ${cleanupResult.trackTitle}`);
          } else if (cleanupResult.success) {
            console.log(`Track ${cleanupResult.trackTitle} validated as valid`);
          } else {
            console.error('Failed to process track cleanup:', cleanupResult.message);
          }
        } catch (cleanupError) {
          console.error('Error during track cleanup:', cleanupError);
        }
      }
    };
    
    // Set the current track and index immediately
    console.log('Setting current track to:', track);
    setCurrentTrack(track);
    // Update ref synchronously
    currentTrackRef.current = track;
    
    // Only expand player when new track starts if it was explicitly played by user
    // If it's an automatic playback (next track), preserve the current minimized state
    if (explicitlyPlayedRef.current) {
      setIsMinimized(false); // Expand player when explicitly played by user
    }
    // If explicitlyPlayedRef.current is false, we preserve the current isMinimized state
    
    // Mark this as an explicit play action if not cycling (auto-playing next)
    explicitlyPlayedRef.current = !isCycling;
    
    // Add to recently played (only for authenticated users)
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      addRecentlyPlayed(track.id)
        .then(() => {
          console.log(`Successfully added track ${track.id} to recently played`);
        })
        .catch((error: any) => {
          console.error(`Failed to add track ${track.id} to recently played:`, error);
        });
    }
    
    // Increment play count for this track (only once per session)
    if (!hasIncrementedPlayCount.current.has(track.id)) {
      hasIncrementedPlayCount.current.add(track.id);
      incrementTrackPlayCount(track.id)
        .then(() => {
          console.log(`Successfully incremented play count for track ${track.id}`);
        })
        .catch((error: any) => {
          console.error(`Failed to increment play count for track ${track.id}:`, error);
        });
    }
    
    // Start playing the audio with proper error handling
    audio.play().catch(error => {
      // Ignore AbortError as it just means the play request was cancelled by a subsequent play/pause call
      if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
        console.error('Error playing track:', error);
        // Check if this is a network/CORS error and suggest using backend proxy
        if (error.message.includes('network') || error.message.includes('CORS')) {
          console.warn('⚠️ Network or CORS error detected. Ensure backend server is running on port 5000 for audio proxy.');
        }
      }
      // Even if play fails, we still set the track so UI reflects the current state
      setIsPlaying(false);
    });
    console.log('Audio play initiated');
  };

  const playNextTrack = async (isExplicit: boolean = false) => {
    console.log('PLAY NEXT TRACK CALLED, isExplicit:', isExplicit);
    console.log('Current track:', currentTrackRef.current);
    console.log('Current track index:', currentTrackIndexRef.current);
    console.log('Playlist:', playlistRef.current);
    console.log('Playback context:', currentPlaybackContext.current);
    console.log('Playback context type:', currentPlaybackContext.current.type);
    console.log('Playback context data:', currentPlaybackContext.current.data);
    console.log('Queue:', queue);
    
    // Check if the player has been explicitly stopped
    // If currentTrack is null, it means the player was explicitly stopped
    if (currentTrackRef.current === null) {
      console.log('Player has been explicitly stopped, not playing next track');
      return;
    }
    
  // Check if we're in a playlist context and there are more tracks in the playlist
    if (currentPlaybackContext.current.type === 'playlist' && playlistRef.current.length > 0) {
      // Check if we're at the end of the playlist
      if (currentTrackIndexRef.current + 1 < playlistRef.current.length) {
        console.log('Playlist context, playing next track in playlist');
        const nextIndex = currentTrackIndexRef.current + 1;
        
        // Play the next track
        playTrackAtIndex(nextIndex, isExplicit);
        return;
      } else if (loopModeRef.current === 'all') {
        console.log('Playlist context, reaching end, looping back to start');
        playTrackAtIndex(0, isExplicit);
        return;
      }
    }
    
    // First, check if there are tracks in the queue and play the first one
    if (queue.length > 0) {
      console.log('Queue has tracks, playing first track in queue');
      
      // Play the first track in the queue
      const nextTrack = queue[0];
      
      // Remove the track from the queue
      setQueue(prev => prev.slice(1));
      
      // Play the track
      const contextToUse = playlistRef.current.length > 0 ? playlistRef.current : [nextTrack];
      playTrack(nextTrack, contextToUse, undefined, !isExplicit);
      return;
    }
    
    // Log the actual values being checked
    const contextType = currentPlaybackContext.current.type;
    console.log('Direct context type value:', contextType);
    console.log('Is context type equal to "single":', contextType === 'single');
    console.log('Is context type equal to "album":', contextType === 'album');
    console.log('Is context type equal to "playlist":', contextType === 'playlist');
    console.log('Playlist length:', playlistRef.current.length);
    
    // Add one more check to see if the context object itself has changed
    console.log('Context object keys:', Object.keys(currentPlaybackContext.current));
    console.log('Context object JSON:', JSON.stringify(currentPlaybackContext.current));
    
    // Check if we're in an album context
    if (currentPlaybackContext.current.type === 'album') {
      console.log('Album context, ensuring tracks play within album until completion');
      
      // Check if we have more tracks in the album
      if (currentTrackIndexRef.current + 1 < playlistRef.current.length) {
        // Play the next track in the album
        const nextIndex = currentTrackIndexRef.current + 1;
        console.log('Playing next track in album at index:', nextIndex);
        
        // Play the next track
        playTrackAtIndex(nextIndex, isExplicit);
        return;
      } else if (loopModeRef.current === 'all') {
        console.log('Album context, reaching end, looping back to start');
        playTrackAtIndex(0, isExplicit);
        return;
      } else {
        // We've reached the end of the album
        console.log('Reached end of album, marking album as complete');
        
        // Update the context to indicate album is complete
        currentPlaybackContext.current.albumComplete = true;
        
        // If user wants to continue after album completion, play recommendations
        // Otherwise, stop playback
        try {
          if (currentTrackRef.current) {
            const recommendedTracks = await fetchRecommendedTracks(currentTrackRef.current.id, 10);
            if (recommendedTracks && recommendedTracks.length > 0) {
              console.log('Got', recommendedTracks.length, 'recommended tracks after album completion');
              
              // Convert recommended tracks to our Track interface
              const newTracks: Track[] = recommendedTracks.map(nextTrack => ({
                id: nextTrack._id,
                title: nextTrack.title,
                artist: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
                  ? (nextTrack.creatorId as any).name 
                  : nextTrack.creatorId || 'Unknown Artist',
                coverImage: nextTrack.coverURL || '',
                audioUrl: nextTrack.audioURL || '',
                duration: 0, // Duration is not available in ITrack interface
                creatorId: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
                  ? (nextTrack.creatorId as any)._id 
                  : nextTrack.creatorId,
                likes: nextTrack.likes,
                type: nextTrack.type, // Include track type
                creatorWhatsapp: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
                  ? (nextTrack.creatorId as any).whatsappContact 
                  : undefined // Include creator's WhatsApp contact
              }));
              
              // Update the playlist to include recommended tracks
              const updatedPlaylist = [...playlistRef.current, ...newTracks];
              setPlaylist(updatedPlaylist);
              playlistRef.current = updatedPlaylist;
              
              // Play the first recommended track
              const nextIndex = playlistRef.current.length; // Start after the album tracks
              const nextTrack = updatedPlaylist[nextIndex];
              
              // Change context to playlist since we're now playing non-album tracks
              currentPlaybackContext.current.type = 'playlist';
              
              // Play the next track
              playTrackAtIndex(nextIndex, isExplicit);
              return;
            }
          }
        } catch (error) {
          console.error('Error fetching recommendations after album:', error);
        }
        
        // If no recommendations or error, stop playback
        console.log('No recommendations available, stopping playback after album completion');
        stopTrack();
        return;
      }
    }
    
    // Check if we're in a single track context
    if (contextType === 'single') {
      if (loopModeRef.current === 'all' && currentTrackRef.current) {
        console.log('Single track context, Loop ALL is enabled, replaying current track');
        playTrack(currentTrackRef.current, playlistRef.current, undefined, !isExplicit);
        return;
      }
      console.log('Single track context, fetching recommendations');
      // For single track, fetch recommendations and play the next recommended track
      try {
        if (currentTrackRef.current) {
          const recommendedTracks = await fetchRecommendedTracks(currentTrackRef.current.id, 10);
          if (recommendedTracks && recommendedTracks.length > 0) {
            const nextTrack = recommendedTracks[0];
            // Convert the recommended track to our Track interface
            const track: Track = {
              id: nextTrack._id,
              title: nextTrack.title,
              artist: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
                ? (nextTrack.creatorId as any).name 
                : nextTrack.creatorId || 'Unknown Artist',
              coverImage: nextTrack.coverURL || '',
              audioUrl: nextTrack.audioURL || '',
              duration: 0, // Duration is not available in ITrack interface
              creatorId: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
                ? (nextTrack.creatorId as any)._id 
                : nextTrack.creatorId,
              likes: nextTrack.likes,
              type: nextTrack.type, // Include track type
              creatorWhatsapp: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
                ? (nextTrack.creatorId as any).whatsappContact 
                : undefined // Include creator's WhatsApp contact
            };
            
            // Play the recommended track
            // For recommended tracks, we maintain the single track context but update the current track
            // We don't create a new playlist as that would break the user's original playlist context
            playTrack(track, playlistRef.current, undefined, !isExplicit);
            return;
          } else {
            console.log('No recommendations found, checking other songs');
            // If no recommendations found, check other songs from the original playlist
            if (originalPlaylistRef.current.length > 0) {
              // Find the next track in the original playlist
              const currentIndex = originalPlaylistRef.current.findIndex(t => t.id === currentTrackRef.current?.id);
              if (currentIndex !== -1) {
                // Calculate next track index with proper cycling
                const nextIndex = (currentIndex + 1) % originalPlaylistRef.current.length;
                console.log('Playing next track from original playlist at index:', nextIndex);
                const nextTrack = originalPlaylistRef.current[nextIndex];
                
                // Play the next track from the original playlist
                playTrack(nextTrack, originalPlaylistRef.current, undefined, !isExplicit);
                return;
              } else {
                // If current track is not in the original playlist, play the first track
                console.log('Current track not in original playlist, playing first track');
                const nextTrack = originalPlaylistRef.current[0];
                playTrack(nextTrack, originalPlaylistRef.current, undefined, !isExplicit);
                return;
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        // If recommendations failed, check other songs from the original playlist
        if (originalPlaylistRef.current.length > 0) {
          // Find the next track in the original playlist
          const currentIndex = originalPlaylistRef.current.findIndex(t => t.id === currentTrackRef.current?.id);
          if (currentIndex !== -1) {
            // Calculate next track index with proper cycling
            const nextIndex = (currentIndex + 1) % originalPlaylistRef.current.length;
            console.log('Playing next track from original playlist at index (after recommendation error):', nextIndex);
            const nextTrack = originalPlaylistRef.current[nextIndex];
            
            // Play the next track from the original playlist
            playTrack(nextTrack, originalPlaylistRef.current, undefined, !isExplicit);
            return;
          }
        }
      }
      
      // If we still can't find a track to play, stop playback
      console.log('No tracks found to play, stopping playback');
      stopTrack();
      return;
    }
    
    // Check if we have a playlist and it's not empty
    if (playlistRef.current.length === 0) {
      console.log('No playlist, stopping playback');
      stopTrack();
      return;
    }
    
    // Check if we're at the end of the playlist
    if (currentTrackIndexRef.current + 1 >= playlistRef.current.length) {
      if (loopModeRef.current === 'all') {
        console.log('Reached end of playlist, Loop ALL enabled, looping back to start');
        playTrackAtIndex(0, isExplicit);
        return;
      }
      console.log('Reached end of playlist, fetching more recommendations');
      // We've reached the end of the playlist, fetch more recommendations
      try {
        if (currentTrackRef.current) {
          // Fetch more recommended tracks
          const recommendedTracks = await fetchRecommendedTracks(currentTrackRef.current.id, 10); // Fetch 10 more tracks for better variety
          if (recommendedTracks && recommendedTracks.length > 0) {
            console.log('Got', recommendedTracks.length, 'new recommended tracks');
            
            // Convert recommended tracks to our Track interface
            const newTracks: Track[] = recommendedTracks.map(nextTrack => ({
              id: nextTrack._id,
              title: nextTrack.title,
              artist: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
                ? (nextTrack.creatorId as any).name 
                : nextTrack.creatorId || 'Unknown Artist',
              coverImage: nextTrack.coverURL || '',
              audioUrl: nextTrack.audioURL || '',
              duration: 0, // Duration is not available in ITrack interface
              creatorId: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
                ? (nextTrack.creatorId as any)._id 
                : nextTrack.creatorId,
              likes: nextTrack.likes,
              type: nextTrack.type, // Include track type
              creatorWhatsapp: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
                ? (nextTrack.creatorId as any).whatsappContact 
                : undefined // Include creator's WhatsApp contact
            }));
            
            // Add new tracks to the playlist
            const updatedPlaylist = [...playlistRef.current, ...newTracks];
            setPlaylist(updatedPlaylist);
            playlistRef.current = updatedPlaylist;
            
            // Play the first new track
            const nextIndex = currentTrackIndexRef.current + 1;
            console.log('Playing next track at index:', nextIndex);
            
            // Play the next track
            playTrackAtIndex(nextIndex, isExplicit);
            return;
          } else {
            console.log('No more recommendations available, stopping playback');
            stopTrack();
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching more recommendations:', error);
        // If recommendations failed, stop playback
        stopTrack();
        return;
      }
    }
    
    // Calculate next track index (normal case)
    const nextIndex = currentTrackIndexRef.current + 1;
    console.log('Next track index:', nextIndex);
    
    // Get next track
    const nextTrack = playlistRef.current[nextIndex];
    console.log('Next track:', nextTrack);
    
    if (nextTrack) {
      // Play the next track
      // Preserve the current playlist context when playing the next track
      // Pass the specific index to avoid recalculating it in playTrack
      playTrackAtIndex(nextIndex, isExplicit);
    } else {
      console.log('No next track found, stopping playback');
      stopTrack();
    }
  };

  const playPreviousTrack = (isExplicit: boolean = false) => {
    console.log('PLAY PREVIOUS TRACK CALLED, isExplicit:', isExplicit);
    console.log('Current track:', currentTrackRef.current);
    console.log('Current track index:', currentTrackIndexRef.current);
    console.log('Playlist:', playlistRef.current);
    
    // Check if the player has been explicitly stopped
    // If currentTrack is null, it means the player was explicitly stopped
    if (currentTrackRef.current === null) {
      console.log('Player has been explicitly stopped, not playing previous track');
      return;
    }
    
    // Check if we have a playlist and it's not empty
    if (playlistRef.current.length === 0 || !currentTrackRef.current) {
      console.log('No playlist or current track, cannot play previous');
      return;
    }
    
    // Calculate previous track index with wrapping
    let prevIndex = currentTrackIndexRef.current - 1;
    
    // Handle wrapping to the end of the playlist if we're at the beginning
    if (prevIndex < 0) {
      prevIndex = playlistRef.current.length - 1;
    }
    
    console.log('Previous track index:', prevIndex);
    
    // Get previous track
    const prevTrack = playlistRef.current[prevIndex];
    console.log('Previous track:', prevTrack);
    
    if (prevTrack) {
      // Play the previous track
      playTrackAtIndex(prevIndex, isExplicit);
    }
  };

  // Helper function to handle audio ended event
  const handleAudioEnded = async () => {
    console.log('AUDIO ONENDED EVENT TRIGGERED');
    console.log('Current track in onended:', currentTrackRef.current);
    console.log('Current track index in onended:', currentTrackIndexRef.current);
    console.log('Playlist in onended:', playlistRef.current);
    console.log('Playback context in onended:', currentPlaybackContext.current);
    console.log('Playback context type in onended:', currentPlaybackContext.current.type);
    console.log('Playback context data in onended:', currentPlaybackContext.current.data);
    console.log('Full context object in onended:', JSON.stringify(currentPlaybackContext.current));
    console.log('Loop mode:', loopModeRef.current);
    setIsPlaying(false);
    
    // Check if the player has been explicitly stopped
    // If currentTrack is null, it means the player was explicitly stopped
    if (currentTrackRef.current === null) {
      console.log('Player has been explicitly stopped, not playing next track');
      return;
    }
    
    // Check if loop is enabled
    if (loopModeRef.current === 'one') {
      console.log('Loop ONE is enabled, replaying current track');
      // If loop one is enabled, replay the current track
      if (currentTrackRef.current) {
        playTrack(currentTrackRef.current, playlistRef.current, undefined, true);
      }
      return;
    }
    
    // According to the specification, we should NOT set currentTrack to null at the end of playback
    // Instead, we should preserve the full track context including currentTrack, currentTrackIndex, and playback state
    // Call playNextTrack first to ensure the context and playlist information is still available
    await playNextTrack(false);
    // Removed the line that sets currentTrack to null to preserve context for seamless resumption
  };

  // Helper function to play a track at a specific index in the current playlist
  const playTrackAtIndex = (index: number, isExplicit: boolean = false) => {
    console.log('PLAY TRACK AT INDEX CALLED with index:', index, 'isExplicit:', isExplicit);
    if (index < 0 || index >= playlistRef.current.length) {
      console.error('Invalid index for playTrackAtIndex:', index);
      return;
    }
    
    const track = playlistRef.current[index];
    console.log('Playing track at index:', track);
    
    // Stop current track if playing
    if (audioRef.current) {
      console.log('Stopping current audio');
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clean up previous audio context
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    // Use proxy for CloudFront URLs to bypass CORS
    const audioUrl = getProxiedUrl(track.audioUrl);
    console.log('Playing audio URL (proxied):', audioUrl);
    
    // Create new audio element
    const audio = new Audio(audioUrl);
    // Add crossorigin attribute to allow Web Audio API to process cross-origin audio
    audio.crossOrigin = 'anonymous';
    audioRef.current = audio;
    // Route through the shared sound engine (EQ/effects persist across tracks)
    getSoundEngine().attach(audio);
    
    // Set up event listeners
    audio.onplay = () => {
      console.log('Audio started playing');
      setIsPlaying(true);
    };
    audio.onpause = () => {
      console.log('Audio paused');
      setIsPlaying(false);
    };
    audio.onended = handleAudioEnded;
    
    // Add seeked event listener to ensure playback continues after seeking
    audio.onseeked = () => {
      console.log('Audio seeked to:', audio.currentTime);
      // Ensure audio continues playing after seek if it was playing before
      if (isPlaying && audio.paused) {
        audio.play().catch(error => {
          // Ignore AbortError which occurs when play() is interrupted by pause()
          if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
            console.error('Error resuming playback after seek:', error);
          }
        });
      }
    };
    
    audio.ontimeupdate = () => {
      if (audio.duration) {
        setProgress(audio.currentTime);
        setDuration(audio.duration);
      }
    };
    
    audio.onloadedmetadata = () => {
      setDuration(audio.duration || 0);
    };
    
    // Set the current track and index immediately
    console.log('Setting current track to:', track);
    setCurrentTrack(track);
    // Update ref synchronously
    currentTrackRef.current = track;
    
    console.log('Setting current track index to:', index);
    setCurrentTrackIndex(index);
    // Update ref synchronously
    currentTrackIndexRef.current = index;
    
    // Only expand player when new track starts if it was explicitly played by user
    // If it's an automatic playback (next track), preserve the current minimized state
    if (isExplicit) {
      setIsMinimized(false); // Expand player when explicitly played by user
    }
    // If isExplicit is false, we preserve the current isMinimized state
    
    // Mark this as an explicit play action if requested
    explicitlyPlayedRef.current = isExplicit;
    
    // Add to recently played (only for authenticated users)
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      addRecentlyPlayed(track.id)
        .then(() => {
          console.log(`Successfully added track ${track.id} to recently played`);
        })
        .catch((error: any) => {
          console.error(`Failed to add track ${track.id} to recently played:`, error);
        });
    }
    
    // Increment play count for this track (only once per session)
    if (!hasIncrementedPlayCount.current.has(track.id)) {
      hasIncrementedPlayCount.current.add(track.id);
      incrementTrackPlayCount(track.id)
        .then(() => {
          console.log(`Successfully incremented play count for track ${track.id}`);
        })
        .catch((error: any) => {
          console.error(`Failed to increment play count for track ${track.id}:`, error);
        });
    }
    
    // Start playing the audio with proper error handling
    audio.play().catch(error => {
      // Ignore AbortError as it just means the play request was cancelled by a subsequent play/pause call
      if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
        console.error('Error playing track:', error);
        // Check if this is a network/CORS error and suggest using backend proxy
        if (error.message.includes('network') || error.message.includes('CORS')) {
          console.warn('⚠️ Network or CORS error detected. Ensure backend server is running on port 5000 for audio proxy.');
        }
      }
      // Even if play fails, we still set the track so UI reflects the current state
      setIsPlaying(false);
    });
  };

  const pauseTrack = () => {
    console.log('PAUSE TRACK CALLED');
    console.log('Current audioRef state:', audioRef.current);
    console.log('Current isPlaying state:', isPlaying);
    
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        setIsPlaying(false);
        console.log('Audio paused successfully');
      } catch (error) {
        console.error('Error pausing track:', error);
      }
    } else {
      console.log('No audio element to pause');
    }
  };

  const stopTrack = () => {
    console.log('STOP TRACK CALLED');
    if (audioRef.current) {
      console.log('Stopping and cleaning up audio element');
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Clean up audio visualization
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
    // According to the specification, at the end of playback, currentTrack should be set to null
    // but currentTrackIndex should retain its value
    // However, for normal playlist cycling, we should preserve the context
    // Only set currentTrack to null when explicitly stopping, not when cycling
    // For explicit stopping, we preserve the currentTrackIndex but set currentTrack to null
    setCurrentTrack(null);
    // Update ref synchronously
    currentTrackRef.current = null;
    // Note: We intentionally do NOT reset currentTrackIndex here to preserve playlist position
    console.log('STOP TRACK COMPLETED - currentTrack is now null');
  };

  const togglePlayPause = () => {
    console.log('TOGGLE PLAY PAUSE CALLED');
    console.log('Current track:', currentTrackRef.current);
    console.log('Is playing:', isPlaying);
    
    // Check if the player has been explicitly stopped
    // If currentTrack is null, it means the player was explicitly stopped
    if (currentTrackRef.current === null) {
      console.log('Player has been explicitly stopped, cannot toggle play/pause');
      return;
    }
    
    if (!currentTrackRef.current) {
      console.log('No current track, cannot toggle play/pause');
      return;
    }
    
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack(currentTrackRef.current, playlistRef.current);
    }
  };

  const toggleMinimize = () => {
    const willBeMinimized = !isMinimized;
    setIsMinimized(willBeMinimized);
  };
  
  const minimizeAndGoBack = () => {
    setIsMinimized(true);
    router.back();
  };

  const closePlayer = () => {
    console.log('CLOSE PLAYER CALLED');
    stopTrack();
    setIsMinimized(false);
    console.log('CLOSE PLAYER COMPLETED');
  };

  const addToPlaylist = (track: Track) => {
    // Check if track already exists in the main playlist
    const existsInMainPlaylist = playlist.some(t => t.id === track.id);
    
    if (!existsInMainPlaylist) {
      setPlaylist(prev => [...prev, track]);
    }
    
    // Also add to the first user playlist if it exists
    if (playlists.length > 0) {
      addTrackToPlaylistService(playlists[0].id, track.id)
        .then((result: any) => {
          if (result) {
            console.log('Track added to playlist');
          } else {
            console.log('Failed to add track to playlist - user may not be authenticated');
          }
        })
        .catch((error: any) => {
          console.error('Error adding track to playlist:', error);
        });
    }
  };

  const removeFromPlaylist = (trackId: string) => {
    setPlaylist(prev => prev.filter(track => track.id !== trackId));
  };

  const createPlaylist = async (name: string) => {
    try {
      const newPlaylist = await createPlaylistService(name);
      
      // Add the new playlist to the playlists array
      setPlaylists(prev => [...prev, newPlaylist]);
      
      // Dispatch a custom event to notify that a playlist has been created
      window.dispatchEvent(new CustomEvent('playlistCreated', { detail: newPlaylist }));
    } catch (error: any) {
      console.error('Error creating playlist:', error);
    }
  };

  const addToFavorites = (track: Track) => {
    // Check if track already exists in favorites
    const existsInFavorites = favorites.some(t => t.id === track.id);
    
    if (!existsInFavorites) {
      setFavorites(prev => [...prev, track]);
      
      // Also add to user's favorites in backend
      addTrackToFavorites(track.id)
        .then((result: any) => {
          if (result) {
            console.log('Track added to favorites');
            
            // Dispatch a custom event to notify that favorites have been updated
            window.dispatchEvent(new CustomEvent('favoritesUpdated'));
            
            // Also dispatch a specific event for analytics updates
            window.dispatchEvent(new CustomEvent('analyticsUpdated'));
          } else {
            console.log('Failed to add track to favorites - user may not be authenticated');
          }
        })
        .catch((error: any) => {
          console.error('Error adding track to favorites:', error);
        });
    }
  };

  const removeFromFavorites = (trackId: string) => {
    setFavorites(prev => prev.filter(track => track.id !== trackId));
    
    // Also remove from user's favorites in backend
    removeTrackFromFavorites(trackId)
      .then((result: any) => {
        if (result) {
          console.log('Track removed from favorites');
          
          // Dispatch a custom event to notify that favorites have been updated
          window.dispatchEvent(new CustomEvent('favoritesUpdated'));
          
          // Also dispatch a specific event for analytics updates
          window.dispatchEvent(new CustomEvent('analyticsUpdated'));
        } else {
          console.log('Failed to remove track from favorites - user may not be authenticated');
        }
      })
      .catch((error: any) => {
        console.error('Error removing track from favorites:', error);
      });
  };

  const setCurrentPlaylist = (tracks: Track[]) => {
    setPlaylist(tracks);
  };

  // Queue management functions
  const addToQueue = (track: Track) => {
    // Ensure the track has all necessary properties to play, especially for beats
    const normalizedTrack = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      coverImage: track.coverImage || '',
      audioUrl: track.audioUrl || track.audioURL || '',
      creatorId: track.creatorId,
      likes: track.likes || 0,
      plays: track.plays || 0,
      type: track.type || 'song',
      paymentType: track.paymentType || 'free', // Preserve payment type for beats
      price: track.price || 0, // Preserve price for paid beats
      currency: track.currency || 'RWF', // Preserve currency
      creatorWhatsapp: track.creatorWhatsapp, // Preserve WhatsApp contact for beats
    };
    
    setQueue(prev => {
      // Check if track is already in queue
      const exists = prev.some(t => t.id === normalizedTrack.id);
      if (!exists) {
        return [...prev, normalizedTrack];
      }
      return prev;
    });
  };

  // Add recommendations to queue
  const addRecommendationsToQueue = async (limit: number = 10) => {
    try {
      // Fetch recommendations based on the current track
      const recommendedTracks = await fetchRecommendedTracks(currentTrackRef.current?.id, limit);
      
      if (recommendedTracks && recommendedTracks.length > 0) {
        // Convert recommended tracks to our Track interface
        const tracksToAdd: Track[] = recommendedTracks.map(nextTrack => ({
          id: nextTrack._id,
          title: nextTrack.title,
          artist: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
            ? (nextTrack.creatorId as any).name 
            : nextTrack.creatorId || 'Unknown Artist',
          coverImage: nextTrack.coverURL || '',
          audioUrl: nextTrack.audioURL || '',
          duration: 0, // Duration is not available in ITrack interface
          creatorId: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
            ? (nextTrack.creatorId as any)._id 
            : nextTrack.creatorId,
          likes: nextTrack.likes,
          type: nextTrack.type, // Include track type
          creatorWhatsapp: (typeof nextTrack.creatorId === 'object' && nextTrack.creatorId !== null) 
            ? (nextTrack.creatorId as any).whatsappContact 
            : undefined // Include creator's WhatsApp contact
        }));
        
        // Add the recommended tracks to the queue
        setQueue(prev => {
          // Filter out tracks that are already in the queue
          const newTracks = tracksToAdd.filter(track => !prev.some(t => t.id === track.id));
          return [...prev, ...newTracks];
        });
        
        return tracksToAdd.length;
      }
    } catch (error) {
      console.error('Error adding recommendations to queue:', error);
    }
    
    return 0;
  };

  const removeFromQueue = (trackId: string) => {
    setQueue(prev => prev.filter(track => track.id !== trackId));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const moveQueueItem = (fromIndex: number, toIndex: number) => {
    setQueue(prev => {
      const newQueue = [...prev];
      const [movedItem] = newQueue.splice(fromIndex, 1);
      newQueue.splice(toIndex, 0, movedItem);
      return newQueue;
    });
  };

  const playFromQueue = (trackId: string) => {
    const trackIndex = queue.findIndex(track => track.id === trackId);
    if (trackIndex !== -1) {
      const track = queue[trackIndex];
      // Remove the track from the queue and play it
      setQueue(prev => prev.filter((_, idx) => idx !== trackIndex));
      // Play the track but maintain the current playlist context
      // If we're in a playlist/album context, continue using that context
      // Otherwise, use the current playlist or create a single track context
      const contextToUse = playlistRef.current.length > 0 ? playlistRef.current : [track];
      playTrack(track, contextToUse);
    }
  };

  // Function to add all tracks from an album to the queue
  const addAlbumToQueue = (albumTracks: Track[]) => {
    // Filter out tracks that are already in the queue to avoid duplicates
    const newTracks = albumTracks.filter(track => 
      !queue.some(queueTrack => queueTrack.id === track.id)
    );
    
    if (newTracks.length > 0) {
      setQueue(prev => [...prev, ...newTracks]);
      // Dispatch a toast notification
      const toastEvent = new CustomEvent('showToast', {
        detail: { message: `Added ${newTracks.length} tracks to queue`, type: 'success' }
      });
      window.dispatchEvent(toastEvent);
    }
  };

  // Add shufflePlaylist function
  const shufflePlaylist = () => {
    if (playlist.length <= 1) {
      // Dispatch event to notify UI that shuffle was attempted but playlist is too small
      window.dispatchEvent(new CustomEvent('shuffleAttempted', { 
        detail: { 
          success: false, 
          reason: 'Playlist has only one track or is empty',
          playlistLength: playlist.length
        } 
      }));
      return;
    }
    // Create a copy of the current playlist
    const shuffledPlaylist = [...playlist];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffledPlaylist.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledPlaylist[i], shuffledPlaylist[j]] = [shuffledPlaylist[j], shuffledPlaylist[i]];
    }
    
    // Check if the playlist actually changed order
    let playlistChanged = false;
    for (let i = 0; i < playlist.length; i++) {
      if (playlist[i].id !== shuffledPlaylist[i].id) {
        playlistChanged = true;
        break;
      }
    }
    
    // Update the playlist state
    setPlaylist(shuffledPlaylist);
    playlistRef.current = shuffledPlaylist;
    
    // If we have a current track, find its new index in the shuffled playlist
    let newIndex = -1;
    if (currentTrack) {
      newIndex = shuffledPlaylist.findIndex(track => track.id === currentTrack.id);
      if (newIndex !== -1) {
        setCurrentTrackIndex(newIndex);
        currentTrackIndexRef.current = newIndex;
      }
    }
    
    // Dispatch event to notify UI that shuffle was successful
    window.dispatchEvent(new CustomEvent('shuffleAttempted', { 
      detail: { 
        success: true, 
        playlistChanged,
        playlistLength: shuffledPlaylist.length,
        currentTrackNewIndex: newIndex
      } 
    }));
  };

  // Add shuffleQueue function
  const shuffleQueue = () => {
    if (queue.length <= 1) {
      window.dispatchEvent(new CustomEvent('playerToast', { 
        detail: { 
          message: 'Queue is too short to shuffle',
          type: 'error'
        } 
      }));
      return;
    }
    
    const shuffledQueue = [...queue];
    for (let i = shuffledQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledQueue[i], shuffledQueue[j]] = [shuffledQueue[j], shuffledQueue[i]];
    }
    
    setQueue(shuffledQueue);
    window.dispatchEvent(new CustomEvent('playerToast', { 
      detail: { 
        message: 'Queue shuffled!',
        type: 'success'
      } 
    }));
  };
  
  // Add toggleLoop function
  const toggleLoop = () => {
    setLoopMode(prev => {
      if (prev === 'none') return 'all';
      if (prev === 'all') return 'one';
      return 'none';
    });
    console.log('Loop toggled');
  };
  const addComment = async (comment: Omit<Comment, 'id' | 'timestamp'>) => {
    if (!currentTrack?.id) {
      console.error('Cannot add comment: No current track');
      return;
    }

    try {
      // Add comment to backend
      const newComment = await addCommentToTrack(currentTrack.id, comment.text);
      
      // Format the comment to match our frontend structure
      const formattedComment: Comment = {
        id: newComment._id,
        userId: newComment.userId._id || newComment.userId,
        username: newComment.userId.name || comment.username,
        text: newComment.text,
        timestamp: newComment.createdAt
      };
      
      // Update the comments state
      setComments(prev => [...prev, formattedComment]);
    } catch (error: any) {
      console.error('Error adding comment:', error);
      // Fallback to local-only comment if backend fails
      const fallbackComment: Comment = {
        id: Date.now().toString(),
        ...comment,
        timestamp: new Date().toISOString()
      };
      setComments(prev => [...prev, fallbackComment]);
    }
  };

  const removeComment = (commentId: string) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };
  
  // Function to clear all favorites (useful for removing mock/test data)
  const clearAllFavorites = async () => {
    // First clear the local state
    setFavorites([]);
    
    // Then remove all favorites from the backend
    try {
      // Get the current favorites to remove them individually
      const currentFavorites = [...favorites];
      
      // Remove each favorite track from the backend
      for (const track of currentFavorites) {
        await removeTrackFromFavorites(track.id);
      }
      
      console.log(`Removed ${currentFavorites.length} tracks from favorites`);
    } catch (error) {
      console.error('Error removing favorites from backend:', error);
      // If backend removal fails, at least we cleared the local state
    }
    
    // Also notify that favorites have been updated
    window.dispatchEvent(new CustomEvent('favoritesUpdated'));
  };

  // New function to load comments from backend
  const loadComments = async (trackId: string) => {
    try {
      const trackComments = await fetchCommentsForTrack(trackId);
      // Convert timestamp format if needed
      const formattedComments = trackComments.map((comment: any) => ({
        id: comment._id,
        userId: comment.userId._id || comment.userId,
        username: comment.userId.name || 'Unknown User',
        text: comment.text,
        timestamp: comment.createdAt
      }));
      setComments(formattedComments);
    } catch (error: any) {
      console.error('Error loading comments:', error);
      setComments([]);
    }
  };

  // Add setVolume function to update volume
  const updateVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Add shareTrack function using modern Web Share API
  const shareTrack = async (platform: string) => {
    if (!currentTrack) return;
    
    try {
      const trackUrl = `${window.location.origin}/tracks/${currentTrack.id}`;
      
      // Use the modern Web Share API utility
      const result = await shareContent(platform, currentTrack.title, trackUrl, currentTrack.coverImage);
      
      if (!result.success) {
        throw new Error('Share failed');
      }
      
      // Show appropriate message based on share method
      if (result.method === 'native') {
        console.log('✅ Shared via native Web Share API');
      } else if (result.method === 'copy') {
        console.log('✅ Link copied to clipboard');
      } else {
        console.log(`✅ Shared to ${platform}`);
      }
      
    } catch (error) {
      console.error('Error sharing track:', error);
      // Final fallback - just copy the URL
      try {
        const trackUrl = `${window.location.origin}/tracks/${currentTrack.id}`;
        await navigator.clipboard.writeText(trackUrl);
        console.log('✅ Fallback: Link copied to clipboard');
      } catch (clipboardError) {
        console.error('Failed to copy link:', clipboardError);
      }
    }
  };

  // Add downloadTrack function
  // Helper function to mark redirect as completed when user returns
  const markRedirectCompleted = () => {
    localStorage.setItem('download_redirect_completed', 'true');
    localStorage.removeItem('download_redirect_initiated');
  };

  const downloadTrack = async () => {
    if (!currentTrack) return;
    
    // Open the external redirect link in a new tab every time download is clicked
    window.open('https://otieu.com/4/10526535', '_blank');
    
    // Allow the download to proceed in the current tab
    
    // Check if the track is a beat
    const isBeat = currentTrack.type === 'beat' || 
                  (currentTrack.title && currentTrack.title.toLowerCase().includes('beat'));
    
    if (isBeat) {
      // For beats, check if it's free or paid - handle missing paymentType by defaulting to 'free'
      const paymentType = currentTrack.paymentType || 'free';
      if (paymentType === 'paid') {
        // For paid beats, we need to ensure we have the creator's WhatsApp number
        let creatorWhatsapp = currentTrack.creatorWhatsapp;
        
        // If we don't have the WhatsApp number, fetch it directly
        if (!creatorWhatsapp && currentTrack.creatorId) {
          const { fetchCreatorWhatsapp } = await import('@/services/trackService');
          const whatsappResult = await fetchCreatorWhatsapp(currentTrack.creatorId);
          if (whatsappResult) {
            creatorWhatsapp = whatsappResult;
          }
        }
        
        if (creatorWhatsapp) {
          // Open WhatsApp with pre-filled message
          const message = `Hi, I'm interested in your beat "${currentTrack.title}" that I found on MuzikaX.`;
          window.open(`https://wa.me/${creatorWhatsapp}?text=${encodeURIComponent(message)}`, '_blank');
        } else {
          // No WhatsApp contact available
          alert('This is a paid beat that requires contacting the creator via WhatsApp to obtain. Unfortunately, the creator has not provided their WhatsApp contact information.');
        }
      } else {
        // Free beat - allow download
        // Create a temporary link element
        const link = document.createElement('a');
        link.href = currentTrack.audioUrl;
        link.download = `${currentTrack.title.replace(/\s+/g, '_')}.mp3`; // Suggest a filename
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        

      }
      return;
    }
    
    // For non-beat tracks, proceed with normal download
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = currentTrack.audioUrl;
    link.download = `${currentTrack.title.replace(/\s+/g, '_')}.mp3`; // Suggest a filename
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        isMinimized,
        isSoloPlayerOpen,
        setIsSoloPlayerOpen,
        queue,
        currentPlaylistName,
        setCurrentPlaylistName,
        playTrack,
        playNextTrack,
        playPreviousTrack,
        pauseTrack,
        stopTrack,
        togglePlayPause,
        toggleMinimize,
        minimizeAndGoBack,
        closePlayer,
        progress,
        duration,
        setProgress,
        playlist,
        playlists,
        favorites,
        favoritesLoading,
        comments,
        addToPlaylist,
        removeFromPlaylist,
        createPlaylist,
        addToFavorites,
        removeFromFavorites,
        setCurrentPlaylist,
        shufflePlaylist, // Export shufflePlaylist function
        shuffleQueue, // Export shuffleQueue function
        toggleLoop,
        loopMode,
        currentTrackIndex,
        audioRef,
        addToQueue,
        removeFromQueue,
        clearQueue,
        moveQueueItem,
        playFromQueue,
        addAlbumToQueue, // Export addAlbumToQueue function
        addRecommendationsToQueue,
        addComment,
        removeComment,
        loadComments,
        volume,
        setVolume: updateVolume,
        playbackRate,
        setPlaybackRate,
        shareTrack,
        downloadTrack, // Export downloadTrack function
        markRedirectCompleted,
        clearAllFavorites,
        // Music visualization properties
        audioAnalyser: analyserRef.current,
        audioContext: audioContextRef.current,
        frequencyData: frequencyDataRef.current      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
};