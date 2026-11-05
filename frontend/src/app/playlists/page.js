'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPlaylists } from '@/services/userService';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext'; // Added import
export default function Playlists() {
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { isAuthenticated, isLoading } = useAuth();
    const { currentTrack, isPlaying, playTrack, setCurrentPlaylist } = useAudioPlayer(); // Added destructuring
    // Load playlists from backend
    useEffect(() => {
        const loadPlaylists = async () => {
            if (isAuthenticated && !isLoading) {
                try {
                    const userPlaylists = await getUserPlaylists();
                    // Map the playlists to ensure each has a unique id
                    const mappedPlaylists = userPlaylists.map((playlist) => (Object.assign(Object.assign({}, playlist), { id: playlist._id || playlist.id, tracks: playlist.tracks.map((track) => (Object.assign(Object.assign({}, track), { id: track._id || track.id, audioUrl: track.audioURL || track.audioUrl || '', coverImage: track.coverImage || track.coverURL || '', type: track.type || 'song', creatorWhatsapp: track.creatorWhatsapp // Include creator's WhatsApp contact
                         }))) })));
                    setPlaylists(mappedPlaylists);
                }
                catch (error) {
                    console.error('Error loading playlists:', error);
                }
                finally {
                    setLoading(false);
                }
            }
        };
        loadPlaylists();
    }, [isAuthenticated, isLoading]);
    // Check authentication on component mount
    useEffect(() => {
        // Don't redirect while loading
        if (!isLoading && !isAuthenticated) {
            // If not authenticated, redirect to login
            router.push('/login');
        }
    }, [isAuthenticated, router, isLoading]);
    // Function to play a playlist
    const handlePlayPlaylist = (playlist) => {
        if (playlist.tracks.length > 0) {
            // Convert tracks to the format expected by the audio player
            const playerTracks = playlist.tracks
                .filter(track => track.audioUrl) // Only include tracks with audio URLs
                .map(track => ({
                id: track.id,
                title: track.title,
                artist: track.artist,
                coverImage: track.coverImage || '',
                audioUrl: track.audioUrl || '',
                creatorId: track.creatorId || '',
                type: track.type || 'song', // Include track type for WhatsApp functionality
                creatorWhatsapp: track.creatorWhatsapp // Include creator's WhatsApp contact
            }));
            // Only play if we have tracks with audio
            if (playerTracks.length > 0) {
                // Set the current playlist
                setCurrentPlaylist(playerTracks);
                // Play the first track with playlist context
                playTrack(playerTracks[0], playerTracks);
            }
        }
    };
    // Show loading state while checking auth
    if (isLoading || loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center", children: _jsx("div", { className: "text-white", children: "Loading..." }) }));
    }
    // Don't render the playlists if not authenticated
    if (!isAuthenticated) {
        return null;
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12", children: [_jsx("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "container mx-auto px-4 sm:px-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex items-center justify-between mb-8 sm:mb-12", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light mb-2", children: "Your Playlists" }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base", children: "All your custom playlists in one place" })] }), _jsx("button", { onClick: () => router.push('/explore'), className: "px-3 py-1.5 sm:px-4 sm:py-2 bg-transparent border border-primary text-primary hover:bg-primary/10 rounded-full text-xs sm:text-sm font-medium transition-colors", children: "Add More" })] }), playlists.length === 0 ? (
                        // Empty State
                        _jsxs("div", { className: "card-bg rounded-2xl p-8 sm:p-12 text-center border border-gray-700/50", children: [_jsx("div", { className: "mx-auto w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center mb-6", children: _jsx("svg", { className: "w-8 h-8 text-gray-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" }) }) }), _jsx("h3", { className: "text-xl sm:text-2xl font-bold text-white mb-3", children: "No playlists yet" }), _jsx("p", { className: "text-gray-500 mb-6 max-w-md mx-auto", children: "Start creating playlists and adding your favorite tracks to see them here" }), _jsx("button", { onClick: () => router.push('/explore'), className: "px-5 py-2.5 sm:px-6 sm:py-3 gradient-primary rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-sm sm:text-base", children: "Explore Music" })] })) : (
                        // Playlists List
                        _jsx("div", { className: "space-y-4", children: playlists.map((playlist) => (_jsxs("div", { className: "card-bg rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50", children: [_jsx("div", { className: "relative", children: playlist.tracks.length > 0 ? (_jsx("img", { src: playlist.tracks[0].coverImage || playlist.tracks[0].coverURL || '/placeholder-track.png', alt: playlist.name, className: "w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover", onError: (e) => {
                                                // Handle broken images gracefully
                                                const target = e.target;
                                                target.src = '/placeholder-track.png';
                                            } })) : (_jsx("div", { className: "w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gray-800 flex items-center justify-center", children: _jsx("svg", { className: "w-6 h-6 text-gray-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" }) }) })) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-bold text-white text-sm sm:text-base truncate", children: playlist.name }), _jsxs("p", { className: "text-gray-400 text-xs sm:text-sm", children: [playlist.tracks.length, " ", playlist.tracks.length === 1 ? 'track' : 'tracks'] })] }), _jsx("div", { className: "flex items-center gap-3", children: _jsx("button", { onClick: () => handlePlayPlaylist(playlist), className: "p-1.5 sm:p-2 rounded-full hover:bg-gray-800/50 transition-colors", title: "Play playlist", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) }) })] }, playlist.id || playlist._id))) }))] }) })] }));
}
