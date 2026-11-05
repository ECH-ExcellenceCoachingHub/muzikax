'use client';

import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { usePayment } from '../../contexts/PaymentContext';
import { useOffline } from '../../contexts/OfflineContext';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import PlaylistSelectionModal from '../../components/PlaylistSelectionModal';
import ReportTrackModal from '../../components/ReportTrackModal';
import RecommendedPlaylists from '../../components/RecommendedPlaylists';
import SoloPlayer from '../../components/SoloPlayer';
import { fetchCreatorProfile, fetchTracksByCreatorPublic, fetchMonthlyPopularTracks } from '../../services/trackService';
import { offlineCacheService } from '../../services/offlineCacheService';

// Define comment interface with replies
interface CommentWithReplies {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: string;
  parentId?: string; // Reference to parent comment
  replies: CommentWithReplies[]; // Nested replies
}

const FullPagePlayer = () => {
  const {
    currentTrack,
    isPlaying,
    isSoloPlayerOpen,
    setIsSoloPlayerOpen,
    togglePlayPause,
    closePlayer,
    minimizeAndGoBack,
    progress,
    duration,
    setProgress,
    playNextTrack,
    playPreviousTrack,
    addToFavorites,
    removeFromFavorites,
    favorites,
    comments,
    addComment,
    audioRef,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    shareTrack,
    downloadTrack, // Add downloadTrack from context
    shufflePlaylist, // Add shufflePlaylist from context
    shuffleQueue, // Add shuffleQueue from context
    toggleLoop,
    loopMode,
    queue, // Add queue from context
    addToQueue, // Add addToQueue from context
    removeFromQueue, // Add removeFromQueue from context
    clearQueue, // Add clearQueue from context
    playFromQueue, // Add playFromQueue from context
    playTrack, // Add playTrack from context
    moveQueueItem, // Add moveQueueItem from context
    addRecommendationsToQueue, // Add addRecommendationsToQueue from context
    currentPlaylistName,
    frequencyData  } = useAudioPlayer();
  
  const { isOnline } = useOffline();
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { showPayment } = usePayment();

  const progressRef = useRef<HTMLDivElement>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [comment, setComment] = useState('');
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false); // Added state for modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false); // Added state for share modal
  const [isReportModalOpen, setIsReportModalOpen] = useState(false); // Added state for report modal
  
  // Collapse states for Queue and Popular
  const [isQueueExpanded, setIsQueueExpanded] = useState(false);
  const [isPopularExpanded, setIsPopularExpanded] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // Added state for creator profile and tracks
  const [creator, setCreator] = useState<any>(null);
  const [creatorTracks, setCreatorTracks] = useState<any[]>([]);
  const [popularTracks, setPopularTracks] = useState<any[]>([]);
  const [loadingCreator, setLoadingCreator] = useState(false);
  const [loadingPopular, setLoadingPopular] = useState(false);
  
  // Added state for comment replies
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  
  const hasAutoPlayedRef = useRef(false);
  
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMenuOpen && !target.closest('[data-menu-container]')) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen]);
  
  // Removed canvas refs as we're no longer using music visualization  
  // Process comments to create a threaded structure
  const processComments = (): CommentWithReplies[] => {
    // Convert existing comments to CommentWithReplies format
    const commentsWithReplies: CommentWithReplies[] = comments.map(comment => ({
      ...comment,
      replies: []
    }));
    
    // Separate top-level comments and replies
    const topLevelComments: CommentWithReplies[] = [];
    const replies: CommentWithReplies[] = [];
    
    commentsWithReplies.forEach(comment => {
      // Check if this is a reply (by looking for @mentions)
      const isReply = comment.text.startsWith('@');
      if (isReply) {
        replies.push(comment);
      } else {
        topLevelComments.push(comment);
      }
    });
    
    // Attach replies to their parent comments
    replies.forEach(reply => {
      // Extract the username being replied to (everything between @ and space)
      const match = reply.text.match(/^@(\w+)/);
      if (match) {
        const repliedToUsername = match[1];
        // Find the parent comment by username
        const parentComment = topLevelComments.find(comment => 
          comment.username === repliedToUsername
        );
        if (parentComment) {
          // Add parentId to reply
          reply.parentId = parentComment.id;
          // Add reply to parent's replies array
          parentComment.replies.push(reply);
        } else {
          // If parent not found, treat as top-level comment
          topLevelComments.push(reply);
        }
      } else {
        // If no match, treat as top-level comment
        topLevelComments.push(reply);
      }
    });
    
    return topLevelComments;
  };
  
  // Process comments whenever the comments array changes
  const [threadedComments, setThreadedComments] = useState<CommentWithReplies[]>([]);

  // Check if current track is in favorites
  useEffect(() => {
    if (currentTrack) {
      setIsFavorite(favorites.some(track => track.id === currentTrack.id));
    }
  }, [currentTrack, favorites]);

  // Process comments to create threaded structure
  useEffect(() => {
    setThreadedComments(processComments());
  }, [comments]);

  // Toast notification effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Listen for shuffle events to show appropriate notifications
  useEffect(() => {
    const handleShuffleAttempted = (event: CustomEvent) => {
      const { success, reason, playlistChanged, playlistLength } = event.detail;
      
      if (!success) {
        // Show message when shuffle couldn't be performed
        setToast({
          message: reason || 'Unable to shuffle playlist',
          type: 'error'
        });
      } else {
        // Show success message when shuffle was performed
        if (playlistChanged) {
          setToast({
            message: 'Playlist shuffled successfully!',
            type: 'success'
          });
        } else {
          setToast({
            message: 'Playlist order unchanged',
            type: 'success'
          });
        }
      }
    };

    // Add event listener
    window.addEventListener('shuffleAttempted', handleShuffleAttempted as EventListener);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('shuffleAttempted', handleShuffleAttempted as EventListener);
    };
  }, []);

  // Listen for general toast notifications from other pages
  useEffect(() => {
    const handlePlayerToast = (event: CustomEvent) => {
      const { message, type } = event.detail;
      setToast({ message, type });
    };

    // Add event listener
    window.addEventListener('playerToast', handlePlayerToast as EventListener);
    
    // Clean up event listener
    return () => {
      window.removeEventListener('playerToast', handlePlayerToast as EventListener);
    };
  }, []);

  // Fetch creator profile and tracks when currentTrack changes - use cache when offline
  useEffect(() => {
    const fetchCreatorData = async () => {
      if (!currentTrack || !currentTrack.creatorId) return;
      
      // If offline or currentTrack changed while offline, use cached data
      if (!isOnline) {
        console.log('📴 Using cached creator data for offline mode');
        
        // Try to get cached creator profile
        const cachedProfile = offlineCacheService.getCachedCreatorProfile(currentTrack.creatorId);
        if (cachedProfile) {
          setCreator(cachedProfile);
        } else {
          setCreator(null);
        }
        
        // Try to get cached creator tracks
        const cachedTracks = offlineCacheService.getCachedCreatorTracks(currentTrack.creatorId);
        if (cachedTracks) {
          const filteredTracks = cachedTracks
            .filter((track: any) => track._id !== currentTrack.id)
            .slice(0, 3);
          setCreatorTracks(filteredTracks);
        } else {
          setCreatorTracks([]);
        }
        
        setLoadingCreator(false);
        return;
      }
      
      setLoadingCreator(true);
      try {
        // Fetch creator profile
        const creatorData = await fetchCreatorProfile(currentTrack.creatorId);
        setCreator(creatorData);
        
        // Cache the profile
        offlineCacheService.cacheCreatorProfile(currentTrack.creatorId, creatorData);
        
        // Fetch creator's tracks
        const tracksData = await fetchTracksByCreatorPublic(currentTrack.creatorId);
        // Filter out the current track and limit to 3 tracks
        const filteredTracks = tracksData
          .filter((track: any) => track._id !== currentTrack.id)
          .slice(0, 3);
        setCreatorTracks(filteredTracks);
        
        // Cache the tracks
        offlineCacheService.cacheCreatorTracks(currentTrack.creatorId, tracksData);
        console.log('💾 Cached creator data for offline use');
      } catch (error) {
        console.error('Error fetching creator data:', error);
        
        // If fetch fails, try to use cached data as fallback
        const cachedProfile = offlineCacheService.getCachedCreatorProfile(currentTrack.creatorId);
        if (cachedProfile) {
          console.log('⚠️ API failed, using cached creator profile');
          setCreator(cachedProfile);
        } else {
          setCreator(null);
        }
        
        const cachedTracks = offlineCacheService.getCachedCreatorTracks(currentTrack.creatorId);
        if (cachedTracks) {
          console.log('⚠️ API failed, using cached creator tracks');
          const filteredTracks = cachedTracks
            .filter((track: any) => track._id !== currentTrack.id)
            .slice(0, 3);
          setCreatorTracks(filteredTracks);
        } else {
          setCreatorTracks([]);
        }
      } finally {
        setLoadingCreator(false);
      }
    };
    
    fetchCreatorData();
  }, [currentTrack, isOnline]);

  // Fetch popular tracks - ONLY when online, use cache when offline
  useEffect(() => {
    const fetchPopular = async () => {
      setLoadingPopular(true);
      
      // If offline, try to use cached data
      if (!isOnline) {
        console.log('📴 Using cached popular tracks for offline mode');
        const cachedTracks = offlineCacheService.getCachedMonthlyPopularTracks();
        if (cachedTracks) {
          setPopularTracks(cachedTracks);
        } else {
          setPopularTracks([]);
        }
        setLoadingPopular(false);
        return;
      }
      
      try {
        const data = await fetchMonthlyPopularTracks(10);
        setPopularTracks(data);
        
        // Cache the data for offline use
        offlineCacheService.cacheMonthlyPopularTracks(data);
        console.log('💾 Cached monthly popular tracks for offline use');
      } catch (error) {
        console.error('Error fetching popular tracks:', error);
        
        // If fetch fails, try to use cached data as fallback
        const cachedTracks = offlineCacheService.getCachedMonthlyPopularTracks();
        if (cachedTracks) {
          console.log('⚠️ API failed, using cached popular tracks');
          setPopularTracks(cachedTracks);
        } else {
          setPopularTracks([]);
        }
      } finally {
        setLoadingPopular(false);
      }
    };
    
    fetchPopular();
  }, [isOnline]);

  // Format time in MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !currentTrack || !duration) return;
    
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newProgress = percent * duration;
    
    // Update progress in context
    setProgress(newProgress);
    
    // Seek in audio element by accessing it through the context
    if (audioRef && audioRef.current) {
      audioRef.current.currentTime = newProgress;
    }
  };

  // Toggle favorite status
  const toggleFavorite = () => {
    if (!currentTrack) return;
    
    if (isFavorite) {
      // Remove from favorites
      removeFromFavorites(currentTrack.id);
      setToast({message: 'Removed from favorites!', type: 'success'});
    } else {
      // Add to favorites
      addToFavorites(currentTrack);
      setToast({message: 'Added to favorites!', type: 'success'});
    }
    setIsFavorite(!isFavorite);
  };

  // Handle adding comment
  const handleAddComment = () => {
    if (!comment.trim() || !currentTrack) return;
    
    if (!isAuthenticated) {
      setToast({message: 'Please log in to comment', type: 'error'});
      return;
    }
    
    addComment({
      userId: user?.id || 'anonymous',
      username: user?.name || 'Anonymous',
      text: comment
    });
    
    setComment('');
    setToast({message: 'Comment added!', type: 'success'});
  };

  // Handle adding reply
  const handleAddReply = (parentId: string, parentUsername: string) => {
    if (!replyText.trim() || !currentTrack) return;
    
    if (!isAuthenticated) {
      setToast({message: 'Please log in to reply', type: 'error'});
      return;
    }
    
    // Add the reply as a new comment with a mention
    addComment({
      userId: user?.id || 'anonymous',
      username: user?.name || 'Anonymous',
      text: `@${parentUsername} ${replyText}`
    });
    
    setReplyText('');
    setReplyingTo(null);
    setToast({message: 'Reply added!', type: 'success'});
  };

  // Handle adding to playlist
  const handleAddToPlaylist = () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    
    setIsPlaylistModalOpen(true);
  };

  // Handle track added to playlist
  const handleTrackAdded = () => {
    setToast({message: 'Added to playlist!', type: 'success'});
  };

  // Redirect to home page if there's no current track
  useEffect(() => {
    if (!currentTrack) {
      // Always redirect to home page when player is closed
      console.log('Redirecting to home page');
      router.push('/');
    }
  }, [currentTrack, router]);

  // Don't render if there's no current track
  if (!currentTrack) {
    return null;
  }

  // Function to generate avatar with first letter of name
  const generateAvatar = (name: string) => {
    const firstLetter = name.charAt(0).toUpperCase();
    return (
      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
        <span className="text-lg font-bold text-white">{firstLetter}</span>
      </div>
    );
  };

  // Recursive component to render comments and their replies
  const CommentItem = ({ comment, isReply = false }: { comment: CommentWithReplies; isReply?: boolean }) => (
    <div className={isReply ? "ml-6 mt-3 pl-4 border-l-2 border-gray-600" : ""}>
      <div className="bg-gray-700/50 rounded-lg p-4">
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-semibold">{comment.username}</h4>
            <p className="text-gray-300 text-sm mt-1">{comment.text}</p>
          </div>
          <span className="text-xs text-gray-400">
            {new Date(comment.timestamp).toLocaleDateString()}
          </span>
        </div>
        
        {/* Reply Button */}
        <div className="mt-2">
          <button
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
            className="text-xs text-primary hover:text-[#E67E00]"
          >
            {replyingTo === comment.id ? 'Cancel' : 'Reply'}
          </button>
        </div>
        
        {/* Reply Form */}
        {replyingTo === comment.id && (
          <div className="mt-3 pl-4 border-l-2 border-gray-600">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Reply to ${comment.username}...`}
              className="w-full bg-gray-700 text-white rounded-lg p-2 mb-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
            />
            <div className="flex space-x-2">
              <button
                onClick={() => handleAddReply(comment.id, comment.username)}
                disabled={!replyText.trim() || !isAuthenticated}
                className="bg-primary hover:bg-[#E67E00] text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                Post Reply
              </button>
              <button
                onClick={() => {
                  setReplyingTo(null);
                  setReplyText('');
                }}
                className="bg-gray-600 hover:bg-gray-500 text-white px-3 py-1 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map(reply => (
            <CommentItem key={reply.id} comment={reply} isReply={true} />
          ))}
        </div>
      )}
    </div>
  );

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
  };
  
  // Handle playback rate change
  const handlePlaybackRateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
  };
  
  // Get playback rate label for display
  const getPlaybackRateLabel = () => {
    return `${playbackRate}x`;
  };

  // Removed music visualization effect as requested
  return (
    <div className="min-h-screen text-white relative overflow-hidden pb-28 md:pb-0 bg-background">
      {/* Subtle animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-primary-light/5 z-0"></div>
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl z-0 animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl z-0 animate-pulse" style={{animationDelay: '1s'}}></div>      
      {/* Content Container */}
      <div className="relative z-10 w-full overflow-hidden">
        {/* Toast Notification */}
        {toast && (
          <div className={`fixed top-20 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}>
            {toast.message}
          </div>
        )}        
        {/* Playlist Selection Modal */}
        <PlaylistSelectionModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          onTrackAdded={handleTrackAdded}
        />
        
        
        {/* Header - Modern Top Bar */}
        <div className="flex justify-between items-center px-4 sm:px-6 py-3 border-b border-white/5 backdrop-blur-xl bg-white/5 sticky top-0 z-40">
          <button 
            onClick={minimizeAndGoBack}
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 touch-manipulation"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
          </button>
          
          <div className="flex flex-col items-center">
            <h1 className="text-sm font-semibold tracking-wide text-text-primary">NOW PLAYING</h1>
            <p className="text-[10px] text-gray-500 mt-0.5">{currentTrack.artist}</p>
          </div>

          <div className="relative flex items-center gap-1">
            <button
              onClick={() => router.push('/dj')}
              className="h-9 px-3 rounded-full flex items-center gap-1.5 text-xs font-bold text-text-primary bg-white/10 hover:bg-white/15 border border-white/10 transition-colors"
              title="Open DJ mode: two decks, mixer, Auto DJ, record and go live"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="8" cy="12" r="5" />
                <circle cx="8" cy="12" r="1.5" />
                <path strokeLinecap="round" d="M16 5v14M20 8v8M16 12h4" />
              </svg>
              DJ
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-all duration-200 touch-manipulation"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
              </svg>
            </button>
          </div>
        </div>
        
        {/* Menu Popup - Outside Player Layout */}
        {isMenuOpen && (
          <div 
            data-menu-container
            className="fixed top-16 right-4 sm:right-6 md:right-8 w-72 bg-gray-900/98 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 py-2 z-[100]"
            style={{animation: 'slideDown 0.2s ease-out'}}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsReportModalOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full px-5 py-3.5 text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"/>
                </svg>
              </div>
              <span className="font-medium">Report Track</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                router.push('/playlists?create=true');
                setIsMenuOpen(false);
              }}
              className="w-full px-5 py-3.5 text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/>
                </svg>
              </div>
              <span className="font-medium">Create Playlist</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsSoloPlayerOpen(true);
                setIsMenuOpen(false);
              }}
              className="w-full px-5 py-3.5 text-left text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"/>
                </svg>
              </div>
              <span className="font-medium">Full Screen Mode</span>
            </button>
            <div className="border-t border-white/10 my-2"></div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closePlayer();
                setIsMenuOpen(false);
              }}
              className="w-full px-5 py-3.5 text-left text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors flex items-center gap-4"
            >
              <div className="w-9 h-9 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
              <span className="font-medium">Close Player</span>
            </button>
          </div>
        )}
        
        <div className="container mx-auto px-2 sm:px-4 py-2 sm:py-4 md:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6 lg:gap-8">
            {/* Main Player Section */}
            <div className="lg:col-span-2 w-full max-w-full overflow-hidden">
              <div className="flex flex-col items-center w-full">
                {/* Album Art - Enhanced with rotation */}
                <button 
                  onClick={() => setIsSoloPlayerOpen(true)}
                  className={`relative mb-6 sm:mb-8 group transition-all duration-500 ${isPlaying ? 'animate-[spin_20s_linear_infinite]' : ''}`}
                >
                  {/* Glow effect */}
                  <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-tr from-primary/40 via-primary-light/30 to-primary-light/40 rounded-3xl blur-2xl opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
                  
                  {/* Shadow layer */}
                  <div className="absolute -inset-1 bg-black/40 rounded-3xl blur-xl"></div>
                  
                  {/* Main image */}
                  <img 
                    src={currentTrack.coverImage} 
                    alt={currentTrack.title} 
                    className="relative w-56 h-56 sm:w-64 sm:h-64 md:w-80 md:h-80 lg:w-96 lg:h-96 rounded-3xl object-cover shadow-2xl border border-white/10 group-hover:scale-[1.04] transition-transform duration-300"
                  />
                  
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent rounded-3xl pointer-events-none"></div>
                </button>
                
                {/* Track Info */}
                <div className="text-center mb-6 sm:mb-8 w-full px-4 overflow-hidden">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 drop-shadow-lg line-clamp-2 leading-tight text-text-primary">{currentTrack.title}</h2>
                  <Link 
                    href={`/artists/${(typeof currentTrack.creatorId === 'object' && currentTrack.creatorId !== null) 
                      ? (currentTrack.creatorId as any)._id 
                      : currentTrack.creatorId}`}
                    className="text-sm sm:text-base md:text-lg text-gray-300 hover:text-primary-light mt-1 inline-block font-medium max-w-full truncate transition-colors"
                  >
                    {currentTrack.artist}
                  </Link>
                  
                  {/* Beat-specific indicator */}
                  {(currentTrack.type === 'beat' || (currentTrack.title && currentTrack.title.toLowerCase().includes('beat'))) && (
                    <div className="mt-3 flex flex-wrap justify-center gap-2">
                      <span className="px-3 py-1 bg-purple-600 text-white text-sm font-bold rounded-full">
                        BEAT
                      </span>
                      {(() => {
                        // Handle missing or null paymentType by defaulting to 'free'
                        const paymentType = currentTrack.paymentType || 'free';
                        
                        return paymentType === 'paid' ? (
                          <span className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded-full">
                            PAID BEAT
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-blue-600 text-white text-sm font-bold rounded-full">
                            FREE BEAT
                          </span>
                        );
                      })()}
                    </div>
                  )}

                  
                  {/* Current Playlist Indicator */}
                  {currentPlaylistName && (
                    <div className="mt-2 flex flex-wrap justify-center gap-2">
                      <div className="px-3 py-1 bg-gradient-to-r from-primary to-primary-light text-white text-sm font-bold rounded-full flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                          <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                        </svg>
                        <span>Playing from: {currentPlaylistName}</span>
                      </div>
                    </div>
                  )}
                </div>                
                {/* Progress Bar - Smooth & Modern */}
                <div className="w-full max-w-2xl mb-6 px-4">
                  <div 
                    ref={progressRef}
                    onClick={handleProgressClick}
                    className="w-full h-1.5 bg-white/10 rounded-full cursor-pointer group touch-pan-x relative overflow-hidden"
                  >
                    {/* Progress fill with gradient */}
                    <div 
                      className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full relative transition-all duration-150 ease-linear"
                      style={{ width: `${duration > 0 ? (progress / duration) * 100 : 0}%` }}
                    >
                      {/* Glow on progress bar */}
                      <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary-light blur-sm opacity-50"></div>
                    </div>
                    
                    {/* Hover thumb */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
                      style={{ left: `${duration > 0 ? (progress / duration) * 100 : 0}%`, transform: `translateX(-50%) translateY(-50%)` }}
                    ></div>
                  </div>
                  
                  <div className="flex justify-between text-xs text-gray-400 mt-2 font-medium">
                    <span className="tabular-nums">{formatTime(progress)}</span>
                    <span className="tabular-nums">{formatTime(duration)}</span>
                  </div>
                </div>
                
                {/* Primary Controls - Centered */}
                <div className="flex justify-center items-center gap-4 sm:gap-6 md:gap-8 mb-6">
                  {/* Previous */}
                  <button
                    onClick={() => playPreviousTrack(true)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
                    </svg>
                  </button>
                  
                  {/* Play / Pause - Large Center Button */}
                  <button
                    onClick={togglePlayPause}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-white shadow-[0_8px_32px_rgba(255, 140, 0,0.5),0_0_60px_rgba(255, 140, 0,0.3)] hover:shadow-[0_12px_48px_rgba(255, 140, 0,0.7),0_0_80px_rgba(255, 140, 0,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 touch-manipulation relative overflow-hidden"
                  >
                    {/* Pulse animation when playing */}
                    {isPlaying && (
                      <span className="absolute inset-0 rounded-full bg-white/20 animate-ping"></span>
                    )}
                    {isPlaying ? (
                      <svg className="w-7 h-7 sm:w-9 sm:h-9 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
                      </svg>
                    ) : (
                      <svg className="w-7 h-7 sm:w-9 sm:h-9 ml-1 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </button>

                  {/* Next */}
                  <button
                    onClick={() => playNextTrack(true)}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 touch-manipulation"
                  >
                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
                    </svg>
                  </button>
                </div>
                
                {/* Action Buttons */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-5 max-w-full px-2 mb-2">
                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push('/login');
                        return;
                      }
                    
                      toggleFavorite();
                      // Show visual feedback
                      const isNowFavorite = !isFavorite;
                      const message = isNowFavorite ? 'Added to favorites!' : 'Removed from favorites!';
                      setToast({message, type: 'success'});
                    }}
                    className={`
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      ${isFavorite ? 'text-primary' : 'text-gray-400'}
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `}
                  >
                    <div
                      className="
                        w-11 h-11 sm:w-12 sm:h-12 rounded-full
                        bg-white/10 backdrop-blur-md
                        flex items-center justify-center
                        group-hover:bg-white/20
                        group-active:scale-95
                        transition-all
                      "
                    >
                      <svg className="w-5 h-5 sm:w-5 sm:h-5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                      </svg>
                    </div>
                    <span className="truncate font-medium">Like</span>
                  </button>

                  <button
                    onClick={() => {
                      if (!isAuthenticated) {
                        router.push('/login?redirect=/playlists?create=true');
                        return;
                      }
                      router.push('/playlists?create=true');
                    }}
                    className={`
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      text-gray-400
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `}
                  >
                    <div
                      className="
                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
                        bg-white/10 backdrop-blur-md
                        flex items-center justify-center
                        group-hover:bg-white/20
                        transition-all
                        touch-manipulation
                      "
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M3 5a2 2-0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd"></path>
                      </svg>
                    </div>
                    <span className="truncate">Create Playlist</span>
                  </button>

                  <button
                    onClick={async () => {
                      // Use modern Web Share API
                      const trackUrl = `${window.location.origin}/tracks/${currentTrack.id}`;
                      const text = `Check out "${currentTrack.title}" by ${currentTrack.artist} on MuzikaX`;
                      
                      try {
                        // Try to use Web Share API first for mobile devices
                        if (navigator.share && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                          await navigator.share({
                            title: currentTrack.title,
                            text: text,
                            url: trackUrl
                          });
                        } else {
                          // Fallback: copy link to clipboard
                          await navigator.clipboard.writeText(trackUrl);
                          setToast({message: 'Link copied to clipboard!', type: 'success'});
                        }
                      } catch (error: any) {
                        // User cancelled or error occurred
                        console.error('Error sharing track:', error);
                        // Fallback to copying link
                        try {
                          await navigator.clipboard.writeText(trackUrl);
                          setToast({message: 'Link copied to clipboard!', type: 'success'});
                        } catch (clipboardError) {
                          console.error('Failed to copy link:', clipboardError);
                          setToast({message: 'Failed to share', type: 'error'});
                        }
                      }
                    }}
                    className={`
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      text-gray-400
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `}
                  >
                    <div
                      className="
                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
                        bg-white/10 backdrop-blur-md
                        flex items-center justify-center
                        group-hover:bg-white/20
                        transition-all
                      "
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path>
                      </svg>
                    </div>
                    <span className="truncate">Share</span>
                  </button>
                  
                  {/* Shuffle Button */}
                  <button
                    onClick={shuffleQueue}
                    className={`
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      text-gray-400
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `}
                    title="Shuffle queue"
                  >
                    <div
                      className="
                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
                        bg-white/10 backdrop-blur-md
                        flex items-center justify-center
                        group-hover:bg-white/20
                        transition-all
                      "
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
                      </svg>
                    </div>
                    <span className="truncate">Shuffle</span>
                  </button>
                                    
                  {/* Loop Button */}
                  <button
                    onClick={toggleLoop}
                    className={`
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      ${loopMode !== 'none' ? 'text-primary' : 'text-gray-400'}
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `}
                    title={loopMode === 'one' ? 'Loop One' : loopMode === 'all' ? 'Loop All' : 'Loop Off'}
                  >
                    <div
                      className={`
                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
                        ${loopMode !== 'none' ? 'bg-primary/20' : 'bg-white/10'}
                        backdrop-blur-md
                        flex items-center justify-center
                        group-hover:bg-white/20
                        transition-all
                        relative
                      `}
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      {loopMode === 'one' && (
                        <span className="absolute text-[10px] font-bold">1</span>
                      )}
                    </div>
                    <span className="truncate">
                      {loopMode === 'one' ? 'One' : loopMode === 'all' ? 'All' : 'Loop'}
                    </span>
                  </button>
                                     
                  
                  
                  {/* Beat-specific Action Button */}
                  {(currentTrack.type === 'beat' || (currentTrack.title && currentTrack.title.toLowerCase().includes('beat'))) ? (
                    // For beats, show either WhatsApp button (for paid) or download button (for free)
                    (() => {
                      // Handle missing or null paymentType by defaulting to 'free'
                      const paymentType = currentTrack.paymentType || 'free';
                      
                      return paymentType === 'paid' ? (
                        // Buy button for paid beats
                        <button
                          onClick={() => {
                            if (!currentTrack.price || currentTrack.price <= 0) {
                              alert('Price not available for this beat');
                              return;
                            }
                            showPayment({
                              trackId: currentTrack.id,
                              trackTitle: currentTrack.title,
                              price: currentTrack.price,
                              audioUrl: currentTrack.audioUrl
                            });
                          }}
                          className={`
                            group flex flex-col items-center gap-1
                            text-sm
                            text-primary
                            hover:text-white
                            transition-all
                          `}
                        >
                          <div
                            className="
                              w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
                              gradient-primary border border-white/20 hover:scale-110
                              flex items-center justify-center
                              transition-all
                            "
                          >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                          </div>
                          <span className="font-medium">Buy Now</span>
                          <span className="text-xs opacity-75">Paid Beat</span>
                          {currentTrack.price && (
                            <span className="text-xs text-yellow-400 font-medium">
                              {currentTrack.price.toLocaleString()} {currentTrack.currency || 'RWF'}
                            </span>
                          )}
                        </button>
                      ) : (
                        // Direct download button for free beats
                        <button
                          onClick={downloadTrack}
                          className={`
                            group flex flex-col items-center gap-1
                            text-sm
                            text-blue-400
                            hover:text-white
                            transition-all
                          `}
                        >
                          <div
                            className="
                              w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
                              bg-blue-500/20 border border-blue-500/30 hover:bg-blue-500/30
                              flex items-center justify-center
                              transition-all
                            "
                          >
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                            </svg>
                          </div>
                          <span className="font-medium">Download</span>
                          <span className="text-xs opacity-75">Free Beat</span>
                        </button>
                      );
                    })()
                  ) : (
                    // Regular download button for non-beats
                    <button
                      onClick={downloadTrack}
                      className={`
                        group flex flex-col items-center gap-1
                        text-sm
                        text-gray-400
                        hover:text-white
                        transition-all
                      `}
                    >
                      <div
                        className="
                          w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
                          bg-white/10 backdrop-blur-md
                          flex items-center justify-center
                          group-hover:bg-white/20
                          transition-all
                        "
                      >
                        <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                        </svg>
                      </div>
                      <span className="font-medium">Download</span>
                    </button>
                  )}
                  
                  {/* Report Button */}
                  <button
                    onClick={() => setIsReportModalOpen(true)}
                    className={`
                      group flex flex-col items-center gap-1
                      text-xs sm:text-sm
                      text-gray-400
                      hover:text-white
                      transition-all
                      min-w-[60px]
                    `}
                    title="Report this track"
                  >
                    <div
                      className="
                        w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full
                        bg-white/10 backdrop-blur-md
                        flex items-center justify-center
                        group-hover:bg-white/20
                        transition-all
                        touch-manipulation
                      "
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <span className="truncate">Report</span>
                  </button>
                </div>
                
                {/* Album Indicator and Navigation Buttons */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">
                  {/* Album Indicator */}
                  {(window as any).audioPlayerContext?.current?.type === 'album' && (
                    <div className="px-3 py-2 bg-primary/20 rounded-lg text-sm flex items-center">
                      <svg className="w-4 h-4 mr-1 text-primary" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                      </svg>
                      <span>Album Mode</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => router.push('/favorites')}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors touch-manipulation"
                  >
                    View Favorites
                  </button>
                  <button 
                    onClick={() => router.push('/playlists')}
                    className="px-3 py-2 sm:px-4 sm:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors touch-manipulation"
                  >
                    View Playlist
                  </button>
                </div>
                
                {/* Queue Section */}
                <div className={`mt-6 sm:mt-8 bg-gray-800/70 backdrop-blur-sm rounded-2xl w-full max-w-2xl overflow-hidden transition-all duration-500 border border-white/10 shadow-xl ${isQueueExpanded ? 'p-4 sm:p-5 ring-1 ring-primary/20 shadow-lg shadow-primary/10' : 'p-3'}`}>
                  <div 
                    className={`flex justify-between items-center px-1 w-full gap-2 cursor-pointer transition-all duration-300 rounded-lg ${!isQueueExpanded ? 'hover:bg-white/10' : 'mb-3'}`}
                    onClick={() => setIsQueueExpanded(!isQueueExpanded)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isQueueExpanded ? 'bg-primary/20 text-primary' : 'bg-gray-700 text-gray-400'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-base sm:text-lg truncate text-text-primary">Up Next</h3>
                        {!isQueueExpanded && <span className="text-[10px] sm:text-xs text-gray-500">{queue?.length || 0} tracks in queue</span>}
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform duration-500 ${isQueueExpanded ? 'rotate-180' : ''}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {isQueueExpanded && (
                      <div className="flex gap-1 sm:gap-2" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={async () => {
                            // Add recommendations to queue
                            const addedCount = await addRecommendationsToQueue(10);
                            if (addedCount > 0) {
                              setToast({message: `Added ${addedCount} recommendations to queue!`, type: 'success'});
                            } else {
                              setToast({message: 'No recommendations available', type: 'error'});
                            }
                          }}
                          className="text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                        >
                          <span className="hidden sm:inline">Add Recommendations</span>
                          <span className="sm:hidden">+ Recs</span>
                        </button>
                        <button 
                          onClick={shuffleQueue}
                          className="text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1"
                          title="Shuffle Queue"
                        >
                          <span className="hidden sm:inline">Shuffle</span>
                          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                          </svg>
                        </button>
                        <button 
                          onClick={() => {
                            // Clear the queue
                            clearQueue();
                            setToast({message: 'Queue cleared!', type: 'success'});
                          }}
                          className="text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isQueueExpanded ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    {queue && queue.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {queue.map((queuedTrack, index) => (
                          <div 
                            key={`${queuedTrack.id}-${index}`} 
                            draggable="true"
                            onDragStart={(e) => {
                              e.dataTransfer.setData('index', index.toString());
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              const draggedIndex = parseInt(e.dataTransfer.getData('index'));
                              if (draggedIndex !== index) {
                                moveQueueItem(draggedIndex, index);
                              }
                            }}
                            className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-primary/10 cursor-pointer group bg-gray-700/30 w-full border-transparent mx-surface"
                            onClick={() => {
                              // Play this track from the queue
                              playFromQueue(queuedTrack.id);
                              setToast({message: `Playing ${queuedTrack.title}`, type: 'success'});
                            }}
                          >
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <span className="text-gray-500 text-xs sm:text-sm w-4 sm:w-5">{index + 1}</span>
                              <svg className="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 cursor-move group-hover:text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"></path>
                              </svg>
                            </div>
                            <img 
                              src={queuedTrack.coverImage} 
                              alt={queuedTrack.title} 
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-md object-cover flex-shrink-0 shadow-sm"
                            />
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="text-xs sm:text-sm font-medium truncate line-clamp-1 group-hover:text-primary transition-colors">{queuedTrack.title}</p>
                              <p className="text-[10px] sm:text-xs text-gray-400 truncate">{queuedTrack.artist}</p>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromQueue(queuedTrack.id);
                                setToast({message: 'Removed from queue', type: 'success'});
                              }}
                              className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4">
                        <p className="text-gray-400 text-center py-2 text-xs sm:text-sm italic">Queue is empty</p>
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            // Add recommendations to queue
                            const addedCount = await addRecommendationsToQueue(10);
                            if (addedCount > 0) {
                              setToast({message: `Added ${addedCount} recommendations to queue!`, type: 'success'});
                            } else {
                              setToast({message: 'No recommendations available', type: 'error'});
                            }
                          }}
                          className="w-full mt-2 py-2.5 bg-gradient-to-r from-primary to-primary-light hover:scale-[1.02] active:scale-[0.98] rounded-lg text-white text-sm sm:text-base font-medium transition-all shadow-lg shadow-primary/20 touch-manipulation"
                        >
                          Discover & Add Recommendations
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Popular Playlist Section */}
                <div className={`mt-6 sm:mt-8 bg-gray-800/70 backdrop-blur-sm rounded-2xl w-full max-w-2xl overflow-hidden transition-all duration-500 border border-white/10 shadow-xl ${isPopularExpanded ? 'p-4 sm:p-5 ring-1 ring-primary-light/20 shadow-lg shadow-primary-light/10' : 'p-3'}`}>
                  <div 
                    className={`flex justify-between items-center px-1 w-full gap-2 cursor-pointer transition-all duration-300 rounded-lg ${!isPopularExpanded ? 'hover:bg-white/10' : 'mb-3'}`}
                    onClick={() => setIsPopularExpanded(!isPopularExpanded)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${isPopularExpanded ? 'bg-primary-light/20 text-primary-light' : 'bg-gray-700 text-gray-400'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                      </div>
                      <div className="flex flex-col">
                        <h3 className="font-bold text-base sm:text-lg truncate text-text-primary">Popular This Month</h3>
                        {!isPopularExpanded && <span className="text-[10px] sm:text-xs text-gray-500">Trending tracks this month</span>}
                      </div>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform duration-500 ${isPopularExpanded ? 'rotate-180' : ''}`} 
                        fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                    
                    {isPopularExpanded && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const shuffled = [...popularTracks];
                          for (let i = shuffled.length - 1; i > 0; i--) {
                            const j = Math.floor(Math.random() * (i + 1));
                            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
                          }
                          setPopularTracks(shuffled);
                          setToast({message: 'Popular playlist shuffled!', type: 'success'});
                        }}
                        className="text-xs text-gray-400 hover:text-white bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded flex items-center gap-1"
                        title="Shuffle Popular"
                      >
                        <span className="hidden sm:inline">Shuffle</span>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isPopularExpanded ? 'max-h-[600px] opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                    {loadingPopular ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
                      </div>
                    ) : popularTracks.length > 0 ? (
                      <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {popularTracks.map((track, index) => (
                          <div 
                            key={track.id} 
                            className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg hover:bg-primary-light/10 cursor-pointer group bg-gray-700/30 w-full border-transparent mx-surface"
                            onClick={() => {
                              playTrack(track, popularTracks);
                              setToast({message: `Playing ${track.title}`, type: 'success'});
                            }}
                          >
                            <span className="text-gray-500 text-xs sm:text-sm w-4 sm:w-5 flex-shrink-0">{index + 1}</span>
                            <img 
                              src={track.coverImage} 
                              alt={track.title} 
                              className="w-8 h-8 sm:w-10 sm:h-10 rounded-md object-cover flex-shrink-0 shadow-sm"
                            />
                            <div className="flex-1 min-w-0 overflow-hidden">
                              <p className="text-xs sm:text-sm font-medium truncate line-clamp-1 group-hover:text-primary-light transition-colors">{track.title}</p>
                              <p className="text-[10px] sm:text-xs text-gray-400 truncate">{track.artist}</p>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                               <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    addToQueue(track);
                                    setToast({message: 'Added to queue', type: 'success'});
                                  }}
                                  className="p-1 sm:p-2 text-gray-400 hover:text-primary-light transition-colors touch-manipulation opacity-0 group-hover:opacity-100"
                                  title="Add to Queue"
                                >
                                  <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
                                  </svg>
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 text-center py-6 text-sm italic">No popular tracks found</p>
                    )}
                  </div>
                </div>

                {/* Recommended Playlists Section */}
                <div className="mt-6 sm:mt-8 bg-gray-800/70 backdrop-blur-sm rounded-2xl p-0 w-full max-w-2xl overflow-hidden border border-white/10 shadow-xl">
                   <RecommendedPlaylists className="px-3 sm:px-4 py-4" titleSize="sm" />
                </div>
              </div>
            </div>
            
            {/* Report Track Modal */}
            <ReportTrackModal 
              isOpen={isReportModalOpen} 
              onClose={() => setIsReportModalOpen(false)} 
              trackId={currentTrack.id}
            />
            
            {/* Comments and Creator Section */}
            <div className="lg:col-span-1 space-y-3 sm:space-y-4 md:space-y-6">
              {/* Uploaded By Section */}
              <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 md:p-6">
                <h3 className="text-xl font-bold mb-4 text-text-primary">Uploaded By</h3>
                
                {loadingCreator ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : creator ? (
                  <div className="space-y-4">
                    {/* Creator Info */}
                    <div className="flex items-center space-x-4">
                      {creator.avatar ? (
                        <img 
                          src={creator.avatar} 
                          alt={creator.name} 
                          className="w-12 h-12 sm:w-12 sm:h-12 rounded-full object-cover"
                        />
                      ) : (
                        generateAvatar(creator.name)
                      )}
                      <div>
                        <h4 className="font-semibold text-lg sm:text-lg">{creator.name}</h4>
                        <p className="text-gray-400 text-sm">
                          {creator.followersCount || 0} followers
                        </p>
                      </div>
                    </div>
                    
                    {/* Other Tracks by Creator */}
                    {creatorTracks.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-2">More from {creator.name}</h5>
                        <div className="space-y-2">
                          {creatorTracks.map((track: any) => (
                            <div 
                              key={track._id}
                              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-colors touch-manipulation"
                              onClick={() => {
                                // Play the track
                                const trackData = {
                                  id: track._id,
                                  title: track.title,
                                  artist: track.artist || creator.name,
                                  coverImage: track.coverArt || track.coverURL || currentTrack.coverImage,
                                  audioUrl: track.audioUrl || track.audioURL,
                                  duration: track.duration,
                                  creatorId: (typeof currentTrack.creatorId === 'object' && currentTrack.creatorId !== null) 
                                    ? (currentTrack.creatorId as any)._id 
                                    : currentTrack.creatorId
                                };
                                // Assuming there's a playTrack function available in context
                                // For now, we'll just navigate to the artist page
                                const artistId = (typeof currentTrack.creatorId === 'object' && currentTrack.creatorId !== null) 
                                  ? (currentTrack.creatorId as any)._id 
                                  : currentTrack.creatorId;
                                router.push(`/artists/${artistId}`);
                              }}
                            >
                              <img 
                                src={track.coverArt || track.coverURL || currentTrack.coverImage} 
                                alt={track.title} 
                                className="w-10 h-10 sm:w-10 sm:h-10 rounded object-cover flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-sm font-medium truncate line-clamp-1">{track.title}</p>
                                <p className="text-xs text-gray-400 truncate">{track.artist || creator.name}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* View Full Profile Button */}
                    <button
                      onClick={() => router.push(`/artists/${creator._id}`)}
                      className="w-full mt-4 py-2 bg-primary hover:bg-[#E67E00] rounded-lg text-white font-medium transition-colors"
                    >
                      View Full Profile
                    </button>
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4">Creator information not available</p>
                )}
              </div>
              
              {/* Track Description & Collaborators Section */}
              {(currentTrack.description || (currentTrack.collaborators && currentTrack.collaborators.length > 0)) && (
                <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 md:p-6">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-text-primary">
                    <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Track Info
                  </h3>
                  
                  {/* Track Description */}
                  {currentTrack.description && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">About This Track</h4>
                      <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">{currentTrack.description}</p>
                    </div>
                  )}
                  
                  {/* Collaborators */}
                  {currentTrack.collaborators && currentTrack.collaborators.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary-light" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                        </svg>
                        Collaborators
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {currentTrack.collaborators.map((collaborator: string, index: number) => (
                          <div
                            key={index}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary/20 to-primary-light/20 border border-primary/30 rounded-full text-sm hover:border-primary/50 hover:bg-purple-600/30 transition-all cursor-default group"
                          >
                            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full group-hover:bg-purple-300 transition-colors"></span>
                            <span className="text-purple-200 font-medium">{collaborator.trim()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Comments Section */}
              <div className="bg-gray-800/50 rounded-xl p-3 sm:p-4 md:p-6">
                <h3 className="text-xl font-bold mb-4 text-text-primary">Comments</h3>
                
                {/* Add Comment Form */}
                <div className="mb-6">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full bg-gray-700 text-white rounded-lg p-3 mb-2 focus:outline-none focus:ring-2 focus:ring-primary touch-pan-y"
                    rows={3}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!comment.trim() || !isAuthenticated}
                    className="bg-primary hover:bg-[#E67E00] text-white px-4 py-3 rounded-lg disabled:opacity-50 touch-manipulation w-full sm:w-auto"
                  >
                    Post Comment
                  </button>
                </div>
                
                {/* Comments List */}
                <div className="space-y-4 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2 touch-pan-y">
                  {threadedComments.length > 0 ? (
                    threadedComments.map(comment => (
                      <CommentItem key={comment.id} comment={comment} />
                    ))
                  ) : (
                    <p className="text-gray-400 text-center py-4">No comments yet. Be the first to comment!</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Solo Player Overlay */}
      {isSoloPlayerOpen && (
        <SoloPlayer onClose={() => setIsSoloPlayerOpen(false)} />
      )}
    </div>
  );
};

export default FullPagePlayer;
