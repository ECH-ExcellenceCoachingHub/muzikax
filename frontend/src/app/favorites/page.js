'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserFavorites } from '@/services/userService';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
export default function FavoritesPage() {
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    const { isAuthenticated, isLoading } = useAuth();
    const { removeFromFavorites, favorites, favoritesLoading, playTrack, setCurrentPlaylist } = useAudioPlayer();
    const router = useRouter();
    // State for tracking which tracks are favorited
    const [favoriteStatus, setFavoriteStatus] = useState({});
    // Update favorite status when favorites change or when favorites are loaded
    useEffect(() => {
        if (!favoritesLoading) {
            const status = {};
            tracks.forEach(track => {
                status[track.id] = true;
            });
            setFavoriteStatus(status);
        }
    }, [tracks, favoritesLoading]);
    // Listen for favorites loaded event to update favorite status
    useEffect(() => {
        const handleFavoritesLoaded = () => {
            const status = {};
            tracks.forEach(track => {
                status[track.id] = true;
            });
            setFavoriteStatus(status);
        };
        // Add event listener
        window.addEventListener('favoritesLoaded', handleFavoritesLoaded);
        // Clean up event listener
        return () => {
            window.removeEventListener('favoritesLoaded', handleFavoritesLoaded);
        };
    }, [tracks]);
    // Toggle favorite status for a track
    const toggleFavorite = (trackId) => {
        // Remove from favorites
        removeFromFavorites(trackId);
        // Update local state
        setTracks(prev => prev.filter(track => track.id !== trackId));
    };
    // Convert backend track to audio player track format
    const convertToAudioPlayerTrack = (track) => {
        return {
            id: track.id || track._id,
            title: track.title,
            artist: track.artist,
            coverImage: track.coverImage || track.coverURL || '/placeholder-track.png',
            audioUrl: track.audioUrl || track.audioURL || '',
            duration: typeof track.duration === 'string' ? parseInt(track.duration) : track.duration,
            plays: track.plays || 0,
            likes: track.likes || 0,
            type: track.type || 'song', // Include track type for WhatsApp functionality
            creatorWhatsapp: track.creatorWhatsapp // Include creator's WhatsApp contact
        };
    };
    // Play a track
    const handlePlayTrack = (track) => {
        // Set the current playlist to all favorites for continuous playback
        const audioPlayerTracks = tracks.map(convertToAudioPlayerTrack);
        setCurrentPlaylist(audioPlayerTracks);
        // Play the selected track
        playTrack(convertToAudioPlayerTrack(track));
    };
    // Load favorites from backend
    const loadFavorites = async () => {
        if (isAuthenticated && !isLoading) {
            try {
                const favorites = await getUserFavorites();
                // Map the favorites to ensure each track has a unique id and proper structure
                const mappedTracks = favorites.map((track) => (Object.assign(Object.assign({}, track), { id: track._id || track.id, coverImage: track.coverImage || track.coverURL || '', audioUrl: track.audioUrl || track.audioURL || '', duration: track.duration, plays: track.plays || 0, likes: track.likes || 0, type: track.type || 'song', creatorWhatsapp: track.creatorWhatsapp // Include creator's WhatsApp contact
                 })));
                setTracks(mappedTracks);
            }
            catch (error) {
                console.error('Error loading favorites:', error);
            }
            finally {
                setLoading(false);
            }
        }
    };
    // Load favorites from backend
    useEffect(() => {
        loadFavorites();
    }, [isAuthenticated, isLoading]);
    // Listen for track updates (when favorites are added/removed)
    useEffect(() => {
        const handleTrackUpdate = (event) => {
            const detail = event.detail;
            if (detail && detail.trackId) {
                // Update favorite status if provided
                if (detail.isFavorite !== undefined && !detail.isFavorite) {
                    // If a track was unfavorited, remove it from the local list
                    setTracks(prev => prev.filter(track => track.id !== detail.trackId));
                }
                // Reload favorites to update like counts
                loadFavorites();
            }
        };
        // Add event listener
        window.addEventListener('trackUpdated', handleTrackUpdate);
        // Clean up event listener
        return () => {
            window.removeEventListener('trackUpdated', handleTrackUpdate);
        };
    }, [loadFavorites]);
    // Check authentication on component mount
    useEffect(() => {
        // Don't redirect while loading
        if (!isLoading && !isAuthenticated) {
            // If not authenticated, redirect to login
            router.push('/login');
        }
    }, [isAuthenticated, router, isLoading]); // Add isLoading to dependency array
    // Show loading state while checking auth
    if (isLoading || loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center", children: _jsx("div", { className: "text-white", children: "Loading..." }) }));
    }
    // Don't render the favorites if not authenticated
    if (!isAuthenticated) {
        return null;
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12", children: [_jsx("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "container mx-auto px-4 sm:px-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8 sm:mb-12", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light mb-2", children: "Your Favorites" }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base", children: "All your saved tracks in one place" })] }), _jsx("button", { onClick: () => router.push('/explore'), className: "px-3 py-1.5 sm:px-4 sm:py-2 bg-transparent border border-primary text-primary hover:bg-primary/10 rounded-full text-xs sm:text-sm font-medium transition-colors", children: "Add More" })] }), tracks.length === 0 ? (
                        // Empty State
                        _jsxs("div", { className: "card-bg rounded-2xl p-8 sm:p-12 text-center border border-gray-700/50", children: [_jsx("div", { className: "mx-auto w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-6", children: _jsx("svg", { className: "w-8 h-8 text-gray-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) }), _jsx("h3", { className: "text-xl sm:text-2xl font-bold text-white mb-3", children: "No favorites yet" }), _jsx("p", { className: "text-gray-500 mb-6 max-w-md mx-auto", children: "Start exploring music and save your favorite tracks to see them here" }), _jsx("button", { onClick: () => router.push('/explore'), className: "px-5 py-2.5 sm:px-6 sm:py-3 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base", children: "Explore Music" })] })) : (
                        // Favorites List
                        _jsx("div", { className: "space-y-4", children: tracks.map((track) => (_jsxs("div", { className: "card-bg rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: track.coverImage || track.coverURL || '/placeholder-track.png', alt: track.title, className: "w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover", onError: (e) => {
                                                    // Handle broken images gracefully
                                                    const target = e.target;
                                                    target.src = '/placeholder-track.png';
                                                } }), _jsx("button", { onClick: () => handlePlayTrack(track), className: "absolute inset-0 w-full h-full rounded-lg bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity", children: _jsx("svg", { className: "w-5 h-5 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-bold text-white text-sm sm:text-base truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-xs sm:text-sm truncate", children: track.artist })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("span", { className: "text-gray-500 text-xs sm:text-sm hidden sm:block", children: track.duration || '3:45' }), _jsx("button", { onClick: () => toggleFavorite(track.id || track._id), className: "p-1.5 sm:p-2 rounded-full hover:bg-gray-800/50 transition-all duration-300 hover:scale-110", children: _jsx("svg", { className: `w-4 h-4 sm:w-5 sm:h-5 text-red-500 fill-current transition-all duration-200 scale-110`, fill: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) })] })] }, track.id || track._id))) }))] }) })] }));
}
