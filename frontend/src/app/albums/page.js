'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
export default function AlbumsPage() {
    const [albums, setAlbums] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('popular');
    const { isAuthenticated } = useAuth();
    const { currentTrack, isPlaying, playTrack, setCurrentPlaylist } = useAudioPlayer();
    const router = useRouter();
    // Fetch albums from API
    useEffect(() => {
        const fetchAlbums = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/albums?page=1&limit=24`);
                if (response.ok) {
                    const data = await response.json();
                    const albumsData = data.albums.map((album) => {
                        var _a;
                        return ({
                            id: album._id,
                            title: album.title,
                            artist: typeof album.creatorId === "object" && album.creatorId !== null
                                ? album.creatorId.name
                                : "Unknown Artist",
                            coverImage: album.coverURL || "",
                            year: album.releaseDate ? new Date(album.releaseDate).getFullYear() : new Date().getFullYear(),
                            tracks: ((_a = album.tracks) === null || _a === void 0 ? void 0 : _a.length) || 0,
                            duration: "00:00" // Placeholder, would need to calculate from tracks
                        });
                    });
                    setAlbums(albumsData);
                }
            }
            catch (error) {
                console.error('Error fetching albums:', error);
            }
            finally {
                setLoading(false);
            }
        };
        fetchAlbums();
    }, []);
    // Sort albums based on selected option
    const sortedAlbums = [...albums].sort((a, b) => {
        if (sortBy === 'popular') {
            return b.tracks - a.tracks; // Sort by track count as a proxy for popularity
        }
        else if (sortBy === 'recent') {
            return b.year - a.year;
        }
        else {
            return a.title.localeCompare(b.title);
        }
    });
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12", children: [_jsx("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "container mx-auto px-4 sm:px-8", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("div", { className: "mb-8 sm:mb-12", children: [_jsx("h1", { className: "text-2xl sm:text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light mb-3 sm:mb-4", children: "Albums" }), _jsx("p", { className: "text-gray-400 max-w-2xl", children: "Discover the latest albums from talented creators across Rwanda and beyond." })] }), _jsx("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8", children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Sort by:" }), _jsxs("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "popular", children: "Most Popular" }), _jsx("option", { value: "recent", children: "Most Recent" }), _jsx("option", { value: "alphabetical", children: "Alphabetical" })] })] }) }), loading ? (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6", children: Array.from({ length: 12 }).map((_, index) => (_jsxs("div", { className: "group card-bg rounded-xl overflow-hidden transition-all duration-300", children: [_jsx("div", { className: "relative", children: _jsx("div", { className: "w-full aspect-square bg-gray-700 animate-pulse" }) }), _jsxs("div", { className: "p-4", children: [_jsx("div", { className: "h-4 bg-gray-700 rounded mb-2 animate-pulse" }), _jsx("div", { className: "h-3 bg-gray-700 rounded w-3/4 animate-pulse" }), _jsxs("div", { className: "flex justify-between items-center mt-3", children: [_jsx("div", { className: "h-3 bg-gray-700 rounded w-1/3 animate-pulse" }), _jsx("div", { className: "h-3 bg-gray-700 rounded w-1/3 animate-pulse" })] })] })] }, index))) })) : sortedAlbums.length > 0 ? (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6", children: sortedAlbums.map((album) => (_jsxs("div", { className: "group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary/10 cursor-pointer", onClick: () => router.push(`/album/${album.id}`), children: [_jsxs("div", { className: "relative", children: [album.coverImage && album.coverImage.trim() !== '' ? (_jsx("img", { src: album.coverImage, alt: album.title, className: "w-full aspect-square object-cover" })) : (_jsx("div", { className: "w-full aspect-square bg-gradient-to-br from-primary to-primary-light flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("button", { className: "w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: _jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) }) })] }), _jsxs("div", { className: "p-4", children: [_jsx("h3", { className: "font-bold text-white text-base mb-1 truncate", children: album.title }), _jsx("p", { className: "text-gray-400 text-sm truncate", children: album.artist }), _jsxs("div", { className: "flex justify-between items-center mt-3 text-xs text-gray-500", children: [_jsx("span", { children: album.year }), _jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { children: [album.tracks, " tracks"] }) })] })] })] }, album.id))) })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx("svg", { className: "w-16 h-16 mx-auto text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("h3", { className: "mt-4 text-lg font-medium text-white", children: "No albums found" }), _jsx("p", { className: "mt-2 text-gray-400", children: "Check back later for new releases." })] }))] }) })] }));
}
