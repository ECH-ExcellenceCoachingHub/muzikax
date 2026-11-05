'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { followCreator } from '@/services/trackService';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
// Separate component for the main content that uses useSearchParams
function SearchResultsContent() {
    var _a;
    const searchParams = useSearchParams();
    const query = searchParams.get('q') || '';
    const [searchQuery, setSearchQuery] = useState(query);
    const [activeTab, setActiveTab] = useState('tracks');
    const [selectedGenre, setSelectedGenre] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [artists, setArtists] = useState([]);
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [following, setFollowing] = useState({});
    const { isAuthenticated } = useAuth();
    const { playTrack } = useAudioPlayer();
    // Genre list for filtering
    const genres = [
        { id: 'afrobeat', name: 'Afrobeat' },
        { id: 'amapiano', name: 'Amapiano' },
        { id: 'gakondo', name: 'Gakondo' },
        { id: 'amapiyano', name: 'Amapiano' },
        { id: 'afro gako', name: 'Afro Gako' },
        { id: 'hiphop', name: 'Hip Hop' },
        { id: 'rnb', name: 'R&B' },
        { id: 'afropop', name: 'Afropop' },
        { id: 'gospel', name: 'Gospel' },
        { id: 'traditional', name: 'Traditional' },
        { id: 'dancehall', name: 'Dancehall' },
        { id: 'reggae', name: 'Reggae' },
        { id: 'soul', name: 'Soul' },
        { id: 'jazz', name: 'Jazz' },
        { id: 'blues', name: 'Blues' },
        { id: 'pop', name: 'Pop' },
        { id: 'rock', name: 'Rock' },
        { id: 'electronic', name: 'Electronic' },
        { id: 'house', name: 'House' },
        { id: 'techno', name: 'Techno' },
        { id: 'drill', name: 'Drill' },
        { id: 'trap', name: 'Trap' },
        { id: 'lofi', name: 'Lo-Fi' },
        { id: 'ambient', name: 'Ambient' }
    ];
    // Fetch search results from API
    const fetchSearchResults = async (searchTerm) => {
        if (!searchTerm.trim() && !selectedGenre)
            return;
        setLoading(true);
        setError(null);
        try {
            // Build query parameters
            const params = new URLSearchParams();
            if (searchTerm.trim()) {
                params.append('q', searchTerm.trim());
            }
            params.append('type', 'all');
            if (selectedGenre) {
                params.append('genre', selectedGenre);
            }
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/search?${params.toString()}`);
            if (!response.ok) {
                throw new Error('Failed to fetch search results');
            }
            const data = await response.json();
            setTracks(data.tracks || []);
            setArtists(data.artists || []);
            setAlbums(data.albums || []);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
            console.error('Search error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    // Fetch results when query or genre changes
    useEffect(() => {
        if (query || selectedGenre) {
            fetchSearchResults(query);
        }
    }, [query, selectedGenre]);
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Update URL with new search query
            window.history.pushState({}, '', `/search?q=${encodeURIComponent(searchQuery.trim())}`);
            fetchSearchResults(searchQuery.trim());
        }
    };
    // Handle following an artist
    const handleFollowArtist = async (artistId) => {
        if (!isAuthenticated) {
            // Redirect to login if not authenticated
            window.location.href = '/login';
            return;
        }
        try {
            // Call the follow creator service
            await followCreator(artistId);
            // Update the following state
            setFollowing(prev => (Object.assign(Object.assign({}, prev), { [artistId]: !prev[artistId] })));
            // Show success feedback
            console.log('Successfully followed creator');
        }
        catch (error) {
            console.error('Error following artist:', error);
            alert('Failed to follow creator. Please try again.');
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12", children: [_jsx("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "container mx-auto px-4 sm:px-8", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "text-center mb-8 sm:mb-12", children: [_jsx("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light mb-4", children: "Search Results" }), _jsx("form", { onSubmit: handleSearch, className: "max-w-2xl mx-auto", children: _jsxs("div", { className: "relative", children: [_jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search music, artists, albums...", className: "w-full px-4 py-3 sm:py-4 pl-12 pr-20 bg-gray-800/50 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm sm:text-base transition-all" }), _jsx("div", { className: "absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }), _jsx("button", { type: "submit", className: "absolute right-2 top-1/2 transform -translate-y-1/2 px-4 py-1.5 sm:py-2 bg-primary hover:bg-primary/80 text-white rounded-full text-sm font-medium transition-colors", children: "Search" })] }) }), _jsx("div", { className: "mt-6 max-w-4xl mx-auto", children: _jsxs("div", { className: "flex flex-wrap gap-2 justify-center", children: [_jsx("button", { className: `px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedGenre === null
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`, onClick: () => setSelectedGenre(null), children: "All Genres" }), genres.slice(0, 10).map((genre) => (_jsx("button", { className: `px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedGenre === genre.id
                                                    ? 'bg-primary text-white'
                                                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50'}`, onClick: () => setSelectedGenre(genre.id), children: genre.name }, genre.id))), _jsx("div", { className: "relative md:hidden", children: _jsxs("select", { value: selectedGenre || '', onChange: (e) => setSelectedGenre(e.target.value || null), className: "px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gray-800/50 text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "", children: "All Genres" }), genres.map((genre) => (_jsx("option", { value: genre.id, children: genre.name }, genre.id)))] }) }), _jsx("div", { className: "hidden md:block relative", children: genres.length > 10 && (_jsxs("details", { className: "group", children: [_jsx("summary", { className: "px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 cursor-pointer list-none", children: "More Genres" }), _jsx("div", { className: "absolute z-10 mt-2 p-2 bg-gray-800 rounded-lg shadow-lg grid grid-cols-2 sm:grid-cols-3 gap-2 w-64", children: genres.slice(10).map((genre) => (_jsx("button", { className: `px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedGenre === genre.id
                                                                    ? 'bg-primary text-white'
                                                                    : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`, onClick: () => {
                                                                    setSelectedGenre(genre.id);
                                                                    // Close the dropdown
                                                                    const details = document.querySelector('details');
                                                                    if (details)
                                                                        details.removeAttribute('open');
                                                                }, children: genre.name }, genre.id))) })] })) })] }) })] }), _jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6", children: [_jsx("p", { className: "text-gray-400", children: loading ? 'Searching...' : selectedGenre
                                        ? `Found ${tracks.length + artists.length + albums.length} results for "${query || 'all'}" in ${((_a = genres.find(g => g.id === selectedGenre)) === null || _a === void 0 ? void 0 : _a.name) || selectedGenre}`
                                        : `Found ${tracks.length + artists.length + albums.length} results for "${query}"` }), _jsxs("div", { className: "flex border-b border-gray-800", children: [_jsxs("button", { className: `py-2 px-4 font-medium text-sm sm:text-base transition-colors ${activeTab === 'tracks'
                                                ? 'text-primary border-b-2 border-primary'
                                                : 'text-gray-500 hover:text-gray-300'}`, onClick: () => setActiveTab('tracks'), children: ["Tracks (", tracks.length, ")"] }), _jsxs("button", { className: `py-2 px-4 font-medium text-sm sm:text-base transition-colors ${activeTab === 'artists'
                                                ? 'text-primary border-b-2 border-primary'
                                                : 'text-gray-500 hover:text-gray-300'}`, onClick: () => setActiveTab('artists'), children: ["Artists (", artists.length, ")"] }), _jsxs("button", { className: `py-2 px-4 font-medium text-sm sm:text-base transition-colors ${activeTab === 'albums'
                                                ? 'text-primary border-b-2 border-primary'
                                                : 'text-gray-500 hover:text-gray-300'}`, onClick: () => setActiveTab('albums'), children: ["Albums (", albums.length, ")"] })] })] }), loading ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" }), _jsxs("p", { className: "mt-4 text-gray-400", children: ["Searching for \"", query, "\"..."] })] })) : error ? (_jsxs("div", { className: "text-center py-12", children: [_jsx("svg", { className: "w-16 h-16 mx-auto text-red-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }), _jsx("h3", { className: "mt-4 text-lg font-medium text-white", children: "Error loading search results" }), _jsx("p", { className: "mt-2 text-gray-400", children: error }), _jsx("button", { onClick: () => fetchSearchResults(query), className: "mt-4 px-4 py-2 bg-primary hover:bg-primary/80 text-white rounded-full text-sm font-medium transition-colors", children: "Try Again" })] })) : searchQuery ? (_jsxs(_Fragment, { children: [activeTab === 'tracks' && (_jsx("div", { className: "space-y-4", children: tracks.length > 0 ? (tracks.map((track) => (_jsxs("div", { className: "flex items-center gap-4 p-4 card-bg rounded-xl hover:bg-gray-800/50 transition-colors group", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: track.coverImage || '/placeholder-track.png', alt: track.title, className: "w-16 h-16 rounded-lg object-cover" }), _jsx("div", { className: "absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx("button", { onClick: () => {
                                                                // Format the track to match the PlayerTrack interface in AudioPlayerContext
                                                                const formattedTrack = {
                                                                    id: track.id,
                                                                    title: track.title,
                                                                    artist: track.artist,
                                                                    coverImage: track.coverImage,
                                                                    audioUrl: track.audioURL, // Use the audioURL from the track
                                                                    duration: undefined, // Duration is optional
                                                                    creatorId: undefined, // Creator ID is optional for search results
                                                                    albumId: undefined, // Album ID is optional
                                                                    plays: track.plays,
                                                                    likes: track.likes,
                                                                    type: 'song', // Default to song for search results
                                                                    creatorWhatsapp: undefined // WhatsApp is optional
                                                                };
                                                                playTrack(formattedTrack);
                                                            }, className: "w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white", children: _jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-bold text-white truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-sm truncate", children: track.artist }), track.album && _jsx("p", { className: "text-gray-500 text-xs truncate", children: track.album })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-gray-500 text-xs sm:text-sm", children: [track.plays.toLocaleString(), " plays"] }), _jsxs("div", { className: "flex items-center gap-1 mt-1 justify-end", children: [_jsx("svg", { className: "w-4 h-4 text-gray-500", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("span", { className: "text-gray-500 text-xs sm:text-sm", children: track.likes })] })] })] }, track.id)))) : (_jsxs("div", { className: "text-center py-12", children: [_jsx("svg", { className: "w-16 h-16 mx-auto text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("h3", { className: "mt-4 text-lg font-medium text-white", children: "No tracks found" }), _jsx("p", { className: "mt-2 text-gray-400", children: "Try adjusting your search to find what you're looking for." })] })) })), activeTab === 'artists' && (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4", children: artists.length > 0 ? (artists.map((artist) => (_jsx(Link, { href: `/artists/${artist.id}`, className: "group card-bg rounded-xl p-4 transition-all duration-300 hover:border-primary-light/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary-light/10 block", children: _jsxs("div", { className: "flex flex-col items-center text-center", children: [_jsxs("div", { className: "relative mb-3", children: [_jsx("img", { src: artist.avatar || '/placeholder-avatar.png', alt: artist.name, className: "w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover mx-auto" }), artist.verified && (_jsx("div", { className: "absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary border-2 border-gray-900 flex items-center justify-center", children: _jsx("svg", { className: "w-3 h-3 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) }))] }), _jsx("h3", { className: "font-bold text-white text-sm sm:text-base truncate w-full", children: artist.name }), _jsx("p", { className: "text-primary-light text-xs sm:text-sm mb-2", children: artist.type }), _jsxs("p", { className: "text-gray-500 text-xs", children: [artist.followers.toLocaleString(), " followers"] }), _jsx("button", { onClick: (e) => {
                                                        e.preventDefault();
                                                        handleFollowArtist(artist.id);
                                                    }, disabled: !isAuthenticated, className: `mt-2 w-full px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${following[artist.id]
                                                        ? 'bg-primary text-white'
                                                        : isAuthenticated
                                                            ? 'bg-transparent border border-primary-light text-primary-light hover:bg-primary-light/10'
                                                            : 'bg-gray-700 text-gray-400 cursor-not-allowed'}`, children: following[artist.id]
                                                        ? 'Following'
                                                        : isAuthenticated
                                                            ? 'Follow'
                                                            : 'Login to Follow' })] }) }, artist.id)))) : (_jsxs("div", { className: "col-span-full text-center py-12", children: [_jsx("svg", { className: "w-16 h-16 mx-auto text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("h3", { className: "mt-4 text-lg font-medium text-white", children: "No artists found" }), _jsx("p", { className: "mt-2 text-gray-400", children: "Try adjusting your search to find what you're looking for." })] })) })), activeTab === 'albums' && (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4", children: albums.length > 0 ? (albums.map((album) => (_jsxs("div", { className: "group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary/10", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: album.coverImage || '/placeholder-album.png', alt: album.title, className: "w-full aspect-square object-cover" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("button", { className: "w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) }) })] }), _jsxs("div", { className: "p-3", children: [_jsx("h3", { className: "font-bold text-white text-sm sm:text-base mb-1 truncate", children: album.title }), _jsx("p", { className: "text-gray-400 text-xs sm:text-sm truncate", children: album.artist }), _jsxs("div", { className: "flex justify-between items-center mt-2", children: [_jsx("span", { className: "text-gray-500 text-xs", children: album.year }), _jsxs("span", { className: "text-gray-500 text-xs", children: [album.tracks, " tracks"] })] })] })] }, album.id)))) : (_jsxs("div", { className: "col-span-full text-center py-12", children: [_jsx("svg", { className: "w-16 h-16 mx-auto text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("h3", { className: "mt-4 text-lg font-medium text-white", children: "No albums found" }), _jsx("p", { className: "mt-2 text-gray-400", children: "Try adjusting your search to find what you're looking for." })] })) }))] })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx("svg", { className: "w-16 h-16 mx-auto text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }), _jsx("h3", { className: "mt-4 text-lg font-medium text-white", children: "Start searching" }), _jsx("p", { className: "mt-2 text-gray-400", children: "Enter a search term to find music, artists, and albums." })] }))] }) })] }));
}
// Loading fallback component
function SearchLoading() {
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black flex items-center justify-center", children: _jsx("div", { className: "text-white", children: "Loading search results..." }) }));
}
export default function SearchResults() {
    return (_jsx(Suspense, { fallback: _jsx(SearchLoading, {}), children: _jsx(SearchResultsContent, {}) }));
}
