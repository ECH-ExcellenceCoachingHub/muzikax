'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var AudioPlayerContext_1 = require("../contexts/AudioPlayerContext");
var react_1 = require("react");
var navigation_1 = require("next/navigation");
var AuthContext_1 = require("../contexts/AuthContext");
var PlaylistSelectionModal_1 = require("./PlaylistSelectionModal");
var ModernAudioPlayer = function () {
    var _a = (0, AudioPlayerContext_1.useAudioPlayer)(), currentTrack = _a.currentTrack, isPlaying = _a.isPlaying, isMinimized = _a.isMinimized, togglePlayPause = _a.togglePlayPause, toggleMinimize = _a.toggleMinimize, closePlayer = _a.closePlayer, progress = _a.progress, duration = _a.duration, setProgress = _a.setProgress, playNextTrack = _a.playNextTrack, playPreviousTrack = _a.playPreviousTrack, addToFavorites = _a.addToFavorites, removeFromFavorites = _a.removeFromFavorites, favorites = _a.favorites, audioRef = _a.audioRef, volume = _a.volume, setVolume = _a.setVolume, playbackRate = _a.playbackRate, setPlaybackRate = _a.setPlaybackRate, shareTrack = _a.shareTrack, downloadTrack = _a.downloadTrack, shufflePlaylist = _a.shufflePlaylist, toggleLoop = _a.toggleLoop, isLooping = _a.isLooping, currentPlaylistName = _a.currentPlaylistName;
    var router = (0, navigation_1.useRouter)();
    var isAuthenticated = (0, AuthContext_1.useAuth)().isAuthenticated;
    var progressRef = (0, react_1.useRef)(null);
    var _b = (0, react_1.useState)(false), isFavorite = _b[0], setIsFavorite = _b[1];
    var _c = (0, react_1.useState)(null), toast = _c[0], setToast = _c[1];
    var _d = (0, react_1.useState)(false), isPlaylistModalOpen = _d[0], setIsPlaylistModalOpen = _d[1];
    var _e = (0, react_1.useState)(false), isShareModalOpen = _e[0], setIsShareModalOpen = _e[1];
    var _f = (0, react_1.useState)(false), showReportModal = _f[0], setShowReportModal = _f[1];
    var _g = (0, react_1.useState)(false), isMobile = _g[0], setIsMobile = _g[1];
    // Check if device is mobile
    (0, react_1.useEffect)(function () {
        var checkIsMobile = function () {
            setIsMobile(typeof window !== 'undefined' && window.innerWidth < 768);
        };
        // Check on mount
        checkIsMobile();
        // Add resize listener
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', checkIsMobile);
            return function () { return window.removeEventListener('resize', checkIsMobile); };
        }
    }, []);
    // Check if current track is in favorites
    (0, react_1.useEffect)(function () {
        if (currentTrack) {
            setIsFavorite(favorites.some(function (track) { return track.id === currentTrack.id; }));
        }
    }, [currentTrack, favorites]);
    // Toast notification effect
    (0, react_1.useEffect)(function () {
        if (toast) {
            var timer_1 = setTimeout(function () {
                setToast(null);
            }, 3000);
            return function () { return clearTimeout(timer_1); };
        }
    }, [toast]);
    // Format time in MM:SS
    var formatTime = function (seconds) {
        var mins = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return "".concat(mins, ":").concat(secs < 10 ? '0' : '').concat(secs);
    };
    // Handle progress bar click
    var handleProgressClick = function (e) {
        if (!progressRef.current || !currentTrack || !duration)
            return;
        var rect = progressRef.current.getBoundingClientRect();
        var percent = (e.clientX - rect.left) / rect.width;
        var newProgress = percent * duration;
        // Update progress in context
        setProgress(newProgress);
        // Seek in audio element by accessing it through the context
        if (audioRef && audioRef.current) {
            audioRef.current.currentTime = newProgress;
        }
    };
    // Toggle favorite status
    var toggleFavorite = function () {
        if (!currentTrack)
            return;
        if (isFavorite) {
            // Remove from favorites
            removeFromFavorites(currentTrack.id);
            setToast({ message: 'Removed from favorites!', type: 'success' });
        }
        else {
            // Add to favorites
            addToFavorites(currentTrack);
            setToast({ message: 'Added to favorites!', type: 'success' });
        }
        setIsFavorite(!isFavorite);
    };
    // Navigate to full player page
    var goToFullPlayer = function () {
        router.push('/player');
    };
    // Handle adding to playlist
    var handleAddToPlaylist = function () {
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        setIsPlaylistModalOpen(true);
    };
    // Handle track added to playlist
    var handleTrackAdded = function () {
        setToast({ message: 'Added to playlist!', type: 'success' });
    };
    // No longer redirect to full player page automatically
    // The player will stay minimized and visible on all pages
    // Users can click the expand button to go to the full player page
    // Check if current track is a beat
    var isBeat = (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.type) === 'beat' ||
        ((currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.title) && currentTrack.title.toLowerCase().includes('beat'));
    // Don't render if there's no current track
    if (!currentTrack)
        return null;
    // Don't render minimized player on mobile devices (handled by MobileNavbar)
    if (isMinimized && isMobile) {
        return null;
    }
    // Handle volume change
    var handleVolumeChange = function (e) {
        var newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };
    return (<>
      {/* Toast Notification */}
      {toast && (<div className={"fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg ".concat(toast.type === 'success' ? 'bg-green-500' : 'bg-red-500', " text-white")}>
          {toast.message}
        </div>)}
      
      {/* Playlist Selection Modal */}
      <PlaylistSelectionModal_1.default isOpen={isPlaylistModalOpen} onClose={function () { return setIsPlaylistModalOpen(false); }} onTrackAdded={handleTrackAdded}/>
      
      {/* Share Modal */}
      {isShareModalOpen && (<div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">Share Track</h3>
              <button onClick={function () { return setIsShareModalOpen(false); }} className="text-gray-400 hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
            
            <div className="flex items-center mb-6 p-4 bg-gray-700 rounded-lg">
              <img src={currentTrack.coverImage} alt={currentTrack.title} className="w-16 h-16 rounded-lg object-cover"/>
              <div className="ml-4">
                <h4 className="font-bold truncate">{currentTrack.title}</h4>
                <p className="text-gray-400 text-sm">{currentTrack.artist}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 gap-4">
              <button onClick={function () {
                shareTrack('facebook');
                setIsShareModalOpen(false);
            }} className="flex flex-col items-center p-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12z"></path>
                </svg>
                <span className="text-xs mt-2">Facebook</span>
              </button>
              
              <button onClick={function () {
                shareTrack('twitter');
                setIsShareModalOpen(false);
            }} className="flex flex-col items-center p-3 bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"></path>
                </svg>
                <span className="text-xs mt-2">Twitter</span>
              </button>
              
              <button onClick={function () {
                shareTrack('whatsapp');
                setIsShareModalOpen(false);
            }} className="flex flex-col items-center p-3 bg-green-500 rounded-lg hover:bg-green-600 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
                </svg>
                <span className="text-xs mt-2">WhatsApp</span>
              </button>
              
              <button onClick={function () {
                shareTrack('linkedin');
                setIsShareModalOpen(false);
            }} className="flex flex-col items-center p-3 bg-blue-700 rounded-lg hover:bg-blue-800 transition-colors">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path>
                </svg>
                <span className="text-xs mt-2">LinkedIn</span>
              </button>
            </div>
            
            <button onClick={function () {
                shareTrack('copy');
                setToast({ message: 'Link copied to clipboard!', type: 'success' });
                setIsShareModalOpen(false);
            }} className="w-full mt-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
              Copy Link
            </button>
          </div>
        </div>)}
      
      {/* Minimized Player */}
      {isMinimized && (<div className={"\n          fixed bottom-20 sm:bottom-6 right-2 sm:right-6 \n          left-2 sm:left-auto\n          w-[calc(100vw-1rem)] sm:w-[".concat(isBeat ? '420px' : '380px', "] \n          max-w-[420px]\n          rounded-2xl \n          ").concat(isBeat ? 'bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20' : 'bg-black/70 backdrop-blur-xl border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.6)]', " \n          z-40 animate-[fadeInUp_0.3s_ease-out]\n          sm:z-50\n        ")}>
          {/* Beat-specific styling */}
          {isBeat && (<div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary-light/20 to-primary-light/20 rounded-2xl"></div>)}
          
          {/* Player Content */}
          <div className="relative z-10 flex items-center p-2 sm:p-3">
            <div className="relative shrink-0">
              <img src={currentTrack.coverImage} alt={currentTrack.title} className={"w-10 h-10 md:w-12 md:h-12 rounded-xl object-cover transition-transform duration-300 ".concat(isPlaying ? 'scale-105' : '', " ").concat(isBeat ? 'rounded-lg' : '')}/>
              {/* Beat-specific glow effect */}
              {isBeat && (<div className="absolute -inset-1 bg-primary rounded-lg blur opacity-30 animate-pulse"></div>)}
              {/* Regular glow effect for non-beats */}
              {!isBeat && (<div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-purple-500 blur opacity-30 rounded-xl"></div>)}
            </div>
            
            <div className="ml-2 sm:ml-3 flex-1 min-w-0 overflow-hidden">
              {isBeat ? (<>
                  <h4 className="text-white font-bold text-sm truncate">{currentTrack.title}</h4>
                  <p className="text-primary-light text-xs truncate">{currentTrack.artist}</p>
                  <div className="flex items-center gap-1 mt-1 flex-wrap">
                    <span className="text-primary text-xs font-medium">BEAT</span>
                    {(function () {
                    // Handle missing or null paymentType by defaulting to 'free'
                    var paymentType = currentTrack.paymentType || 'free';
                    return paymentType === "paid" ? (<span className="text-green-400 text-xs">• PAID</span>) : (<span className="text-blue-400 text-xs">• FREE</span>);
                })()}
                  </div>
                </>) : (<>
                  <h4 className="text-white font-medium text-sm truncate">{currentTrack.title}</h4>
                  <p className="text-gray-400 text-xs truncate">{currentTrack.artist}</p>
                </>)}
              
              
              {/* Current Playlist Indicator in Mini Player */}
              {currentPlaylistName && (<div className="flex items-center gap-1 mt-1">
                  <svg className="w-3 h-3 text-primary-light" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z"/>
                  </svg>
                  <p className="text-primary-light text-xs truncate">from {currentPlaylistName}</p>
                </div>)}
              
              {/* Mini Progress Bar */}
              <div ref={progressRef} onClick={handleProgressClick} className="mt-1 h-1.5 sm:h-1 w-full bg-white/10 rounded-full cursor-pointer touch-manipulation">
                <div className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all" style={{ width: "".concat((progress / duration) * 100 || 0, "%") }}/>
              </div>
            </div>
            
            <div className="flex items-center gap-0">
              {/* Play / Pause Button */}
              <button onClick={togglePlayPause} className="
                  w-10 h-10 sm:w-12 sm:h-12 rounded-full 
                  bg-white/10 hover:bg-white/20 
                  flex items-center justify-center
                  transition-all
                  min-w-[48px] min-h-[48px]
                  touch-manipulation
                  p-1
                  -ml-0.5
                ">
                {isPlaying ? (
            /* Pause Icon */
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="5" width="4" height="14" rx="1"/>
                    <rect x="14" y="5" width="4" height="14" rx="1"/>
                  </svg>) : (
            /* Play Icon */
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white ml-[1px]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>)}
              </button>
              
              {/* Shuffle Button */}
              <button onClick={shufflePlaylist} className="
                  w-9 h-9 rounded-full
                  bg-white/5 hover:bg-white/15
                  flex items-center justify-center
                  transition
                  min-w-[48px] min-h-[48px]
                  touch-manipulation
                  p-1
                " title="Shuffle playlist">
                <svg className="w-3 h-3 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
                </svg>
              </button>
              
              {/* Expand Button */}
              <button onClick={goToFullPlayer} className="
                  w-10 h-10 sm:w-11 sm:h-11 rounded-full
                  bg-white/5 hover:bg-white/15
                  flex items-center justify-center
                  transition
                  min-w-[48px] min-h-[48px]
                  touch-manipulation
                  p-1
                  ml-0.5
                " title="Open full player">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14"/>
                  <path d="M5 12l7-7 7 7"/>
                </svg>
              </button>
              
              {/* Speed Control */}
              <div className="flex items-center">
                <select value={playbackRate} onChange={function (e) { return setPlaybackRate(parseFloat(e.target.value)); }} className="bg-black/70 text-white text-xs rounded px-1 py-1 sm:px-2 sm:py-1 focus:outline-none focus:ring-1 focus:ring-primary min-w-[50px] appearance-none touch-manipulation">
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
              
              {/* Loop Button */}
              <button onClick={toggleLoop} className={"\n                  w-9 h-9 rounded-full\n                  flex items-center justify-center\n                  ".concat(isLooping ? 'text-primary' : 'text-gray-400', " hover:text-white\n                  hover:bg-white/10\n                  transition\n                  min-w-[48px] min-h-[48px]\n                  touch-manipulation\n                  p-1\n                ")} title="Loop track/playlist">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
              
              {/* Volume Control with Hidden Slider */}
              <div className="group relative">
                <button className="
                    w-9 h-9 rounded-full
                    flex items-center justify-center
                    text-gray-400 hover:text-white
                    hover:bg-white/10
                    transition
                    min-w-[48px] min-h-[48px]
                    touch-manipulation
                    p-1
                  " title="Adjust volume">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd"></path>
                  </svg>
                </button>
                
                {/* Hidden Volume Slider */}
                <input type="range" min="0" max="1" step="0.01" value={volume} onChange={handleVolumeChange} className="
                    absolute -top-12 sm:-top-12 right-0
                    w-20 sm:w-28 px-2 py-1
                    bg-black/70 rounded-lg
                    hidden group-hover:block
                    accent-primary
                    touch-manipulation
                  "/>
              </div>
              
              {/* Favorite/Save button for all tracks */}
              <button onClick={toggleFavorite} className={"\n                  w-9 h-9 rounded-full\n                  flex items-center justify-center\n                  transition-colors ".concat(isFavorite
                ? 'text-red-400 bg-red-500/20 border border-red-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-700/50', "\n                  min-w-[48px] min-h-[48px]\n                  touch-manipulation\n                  p-1\n                ")} title={isFavorite ? "Remove from favorites" : "Save track"}>
                <svg className="w-3.5 h-3.5" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                </svg>
              </button>
              

            </div>
          </div>
        </div>)}
      {/* Full Player - Only show when on the player page */}
      {!isMinimized && currentTrack && (<div className="hidden">
          {/* This div ensures the component renders but doesn't display anything */}
          {/* The actual full player is rendered on the /player page */}
        </div>)}
    </>);
};
exports.default = ModernAudioPlayer;
