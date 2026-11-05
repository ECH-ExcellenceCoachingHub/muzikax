'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTracksByCreatorPublic, followCreator, unfollowCreator, checkFollowStatus } from '@/services/trackService';
import { getAlbumsByCreator, getAlbumById } from '@/services/albumService';
// Function to generate avatar with first letter of name
const generateAvatar = (name) => {
    const firstLetter = name.charAt(0).toUpperCase();
    return (_jsx("div", { className: "w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center", children: _jsx("span", { className: "text-4xl font-bold text-white", children: firstLetter }) }));
};
// Format duration from seconds to MM:SS
const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};
// Format large numbers (e.g., 1.2K, 3.4M)
const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
};
export default function ArtistProfilePage() {
    var _a;
    const [creator, setCreator] = useState(null);
    const [tracks, setTracks] = useState([]);
    const [albums, setAlbums] = useState([]); // Added for storing albums
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('tracks'); // Added for tab switching
    const [searchFilter, setSearchFilter] = useState(''); // Added for search filtering
    const [isFollowing, setIsFollowing] = useState(false); // Added to track follow status
    const params = useParams();
    const router = useRouter();
    const { playTrack, setCurrentPlaylist } = useAudioPlayer();
    const { user } = useAuth();
    const creatorId = params.id;
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch creator data
                const creatorResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/creators/${creatorId}`);
                if (!creatorResponse.ok) {
                    throw new Error(`Failed to fetch creator: ${creatorResponse.status} ${creatorResponse.statusText}`);
                }
                const creatorData = await creatorResponse.json();
                setCreator(creatorData);
                // Fetch creator's tracks using the new public function
                try {
                    const tracksData = await fetchTracksByCreatorPublic(creatorId);
                    setTracks(tracksData);
                }
                catch (tracksError) {
                    console.error('Failed to fetch tracks:', tracksError);
                    setTracks([]);
                }
                // Fetch creator's albums
                try {
                    const albumsData = await getAlbumsByCreator(creatorId);
                    // Transform albums to match our interface
                    const transformedAlbums = albumsData.map((album) => {
                        var _a;
                        return ({
                            id: album._id || album.id,
                            title: album.title,
                            artist: ((_a = album.creatorId) === null || _a === void 0 ? void 0 : _a.name) || creatorData.name || 'Unknown Artist',
                            coverImage: album.coverURL || '',
                            year: album.releaseDate ? new Date(album.releaseDate).getFullYear() : new Date().getFullYear(),
                            tracks: Array.isArray(album.tracks) ? album.tracks.length : 0,
                            createdAt: album.createdAt || new Date().toISOString()
                        });
                    });
                    setAlbums(transformedAlbums);
                }
                catch (albumsError) {
                    console.error('Failed to fetch albums:', albumsError);
                    setAlbums([]);
                }
                // Fetch creator stats
                const statsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/public/creators/${creatorId}/stats`);
                if (statsResponse.ok) {
                    const statsData = await statsResponse.json();
                    setStats(statsData);
                }
                // Check if user is following this creator
                if (user) {
                    try {
                        const isFollowingStatus = await checkFollowStatus(creatorId);
                        setIsFollowing(isFollowingStatus);
                    }
                    catch (followCheckError) {
                        console.error('Error checking follow status:', followCheckError);
                        setIsFollowing(false);
                    }
                }
                setError(null);
            }
            catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to load artist profile. Please try again later.');
            }
            finally {
                setLoading(false);
            }
        };
        if (creatorId) {
            fetchData();
        }
    }, [creatorId, user]);
    const handlePlayTrack = (track) => {
        // Validate that we have a valid audio URL
        if (!track.audioUrl || track.audioUrl.trim() === '') {
            console.error('Invalid audio URL for track:', track);
            return;
        }
        // Convert track to the format expected by the audio player
        const playerTrack = {
            id: track._id,
            title: track.title,
            artist: track.artist,
            coverImage: track.coverArt || '', // This is handled in the audio player component
            audioUrl: track.audioUrl,
            plays: track.plays || 0,
            likes: track.likes || 0,
            duration: track.duration,
            creatorId: creatorId, // The current artist's ID
            type: track.type || 'song', // Include track type for WhatsApp functionality
            creatorWhatsapp: track.creatorWhatsapp // Include creator's WhatsApp contact
        };
        playTrack(playerTrack);
    };
    const handlePlayAlbum = async (albumId) => {
        try {
            // Fetch the full album data
            const albumData = await getAlbumById(albumId);
            // Transform tracks to match player format
            const tracks = (Array.isArray(albumData.tracks) ? albumData.tracks : []).map((track) => ({
                id: track._id || track.id,
                title: track.title,
                artist: (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null)
                    ? (track.creatorId.name || "Unknown Artist")
                    : "Unknown Artist",
                coverImage: (track.coverURL || track.coverImage) || "",
                audioUrl: track.audioURL,
                plays: track.plays || 0,
                likes: track.likes || 0,
                creatorId: (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null)
                    ? track.creatorId._id
                    : track.creatorId,
                type: track.type || 'song', // Include track type for WhatsApp functionality
                creatorWhatsapp: (track.creatorId && typeof track.creatorId === 'object' && track.creatorId !== null)
                    ? track.creatorId.whatsappContact
                    : undefined // Include creator's WhatsApp contact
            }));
            // Set the current playlist to the album tracks
            setCurrentPlaylist(tracks);
            // Play the first track of the album
            if (tracks.length > 0) {
                playTrack(tracks[0], tracks, { albumId, tracks });
            }
        }
        catch (error) {
            console.error('Error playing album:', error);
        }
    };
    // Filter tracks to separate singles from album tracks
    const getSingles = () => {
        return tracks.filter(track => !track.albumId || track.albumId.trim() === '');
    };
    // Filter tracks based on search filter
    const getFilteredTracks = () => {
        const singles = getSingles();
        if (!searchFilter)
            return singles;
        return singles.filter(track => track.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
            track.artist.toLowerCase().includes(searchFilter.toLowerCase()));
    };
    // Filter albums based on search filter
    const getFilteredAlbums = () => {
        if (!searchFilter)
            return albums;
        return albums.filter(album => album.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
            album.artist.toLowerCase().includes(searchFilter.toLowerCase()));
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "text-white", children: "Loading artist profile..." }) }) }) }));
    }
    if (error || !creator) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "text-red-500", children: error || 'Artist not found' }) }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("button", { onClick: () => router.back(), className: "flex items-center text-gray-400 hover:text-white mb-6 transition-colors", children: [_jsx("svg", { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M15 19l-7-7 7-7" }) }), "Back to Artists"] }), _jsx("div", { className: "bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 md:p-8 mb-8", children: _jsxs("div", { className: "flex flex-col md:flex-row items-center md:items-start gap-6", children: [_jsx("div", { className: "flex-shrink-0", children: creator.avatar && creator.avatar.trim() !== '' ? (_jsx("img", { src: creator.avatar, alt: creator.name, className: "w-32 h-32 rounded-full object-cover" })) : (generateAvatar(creator.name)) }), _jsxs("div", { className: "text-center md:text-left flex-1", children: [_jsx("h1", { className: "text-3xl md:text-4xl font-bold text-white mb-2", children: creator.name }), _jsx("p", { className: "text-primary-light text-lg mb-4 capitalize", children: creator.creatorType || 'Artist' }), _jsxs("div", { className: "flex flex-wrap justify-center md:justify-start gap-4 mb-6", children: [_jsxs("div", { className: "bg-gray-800 rounded-lg px-4 py-2", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Followers" }), _jsx("p", { className: "text-white font-bold", children: ((_a = creator.followersCount) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || 0 })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg px-4 py-2", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Tracks" }), _jsx("p", { className: "text-white font-bold", children: (stats === null || stats === void 0 ? void 0 : stats.totalTracks) || tracks.length })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg px-4 py-2", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Total Plays" }), _jsx("p", { className: "text-white font-bold", children: formatNumber((stats === null || stats === void 0 ? void 0 : stats.totalPlays) || 0) })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg px-4 py-2", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Monthly Plays" }), _jsx("p", { className: "text-white font-bold", children: formatNumber((stats === null || stats === void 0 ? void 0 : stats.monthlyPlays) || 0) })] }), _jsxs("div", { className: "bg-gray-800 rounded-lg px-4 py-2", children: [_jsx("p", { className: "text-gray-400 text-sm", children: "Member Since" }), _jsx("p", { className: "text-white font-bold", children: new Date(creator.createdAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'long'
                                                        }) })] })] }), _jsx("button", { className: `px-6 py-3 ${isFollowing ? 'bg-gray-600 hover:bg-gray-700' : 'bg-primary hover:bg-primary/90'} text-white rounded-full font-medium transition-colors`, onClick: async () => {
                                            // Handle follow/unfollow action here
                                            if (!user) {
                                                router.push('/login');
                                            }
                                            else {
                                                try {
                                                    if (isFollowing) {
                                                        // Unfollow the creator
                                                        await unfollowCreator(creator._id);
                                                        // Update the followers count in the UI
                                                        setCreator(prev => prev ? Object.assign(Object.assign({}, prev), { followersCount: Math.max(0, prev.followersCount - 1) // Prevent negative counts
                                                         }) : null);
                                                        // Update the follow status
                                                        setIsFollowing(false);
                                                        // Show success feedback
                                                        console.log('Successfully unfollowed creator');
                                                    }
                                                    else {
                                                        // Follow the creator
                                                        await followCreator(creator._id);
                                                        // Update the followers count in the UI
                                                        setCreator(prev => prev ? Object.assign(Object.assign({}, prev), { followersCount: prev.followersCount + 1 }) : null);
                                                        // Update the follow status
                                                        setIsFollowing(true);
                                                        // Show success feedback
                                                        console.log('Successfully followed creator');
                                                    }
                                                }
                                                catch (error) {
                                                    console.error('Failed to follow/unfollow creator:', error);
                                                    alert('Failed to follow/unfollow creator. Please try again.');
                                                }
                                            }
                                        }, children: isFollowing ? 'Unfollow' : 'Follow' }), "            "] })] }) }), _jsxs("div", { className: "bg-gray-800/50 rounded-2xl p-6 mb-8", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "About" }), _jsx("p", { className: "text-gray-300", children: creator.bio || `${creator.name} is a talented ${creator.creatorType || 'artist'} on MuzikaX. Stay tuned for their upcoming releases!` }), creator.genres && creator.genres.length > 0 && (_jsxs("div", { className: "mt-4", children: [_jsx("h3", { className: "text-gray-400 text-sm mb-2", children: "Genres" }), _jsx("div", { className: "flex flex-wrap gap-2", children: creator.genres.map((genre, index) => (_jsx("span", { className: "px-3 py-1 bg-gray-700 text-gray-300 text-xs rounded-full", children: genre }, index))) })] }))] }), _jsx("div", { className: "mb-6", children: _jsxs("div", { className: "relative max-w-md mx-auto", children: [_jsx("input", { type: "text", value: searchFilter, onChange: (e) => setSearchFilter(e.target.value), placeholder: "Search tracks or albums...", className: "w-full px-4 py-2 pl-10 bg-gray-800 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" }), _jsx("div", { className: "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) })] }) }), _jsxs("div", { className: "flex border-b border-gray-700 mb-6", children: [_jsxs("button", { className: `py-2 px-4 font-medium ${activeTab === 'tracks' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`, onClick: () => setActiveTab('tracks'), children: ["Singles (", getSingles().length, ")"] }), _jsxs("button", { className: `py-2 px-4 font-medium ${activeTab === 'albums' ? 'text-primary border-b-2 border-primary' : 'text-gray-400 hover:text-white'}`, onClick: () => setActiveTab('albums'), children: ["Albums (", albums.length, ")"] })] }), activeTab === 'tracks' ? (_jsx(_Fragment, { children: getFilteredTracks().length > 0 ? (_jsx("div", { className: "grid grid-cols-1 gap-4", children: getFilteredTracks().map((track) => (_jsxs("div", { className: "flex items-center gap-4 p-4 card-bg rounded-xl hover:bg-gray-800/50 transition-colors group", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: track.coverArt || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80', alt: track.title, className: "w-16 h-16 rounded-lg object-cover" }), _jsx("div", { className: "absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx("button", { onClick: () => handlePlayTrack(track), className: "w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-white", children: _jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) }) })] }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-bold text-white truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-sm truncate", children: track.artist }), track.album && _jsx("p", { className: "text-gray-500 text-xs truncate", children: track.album })] }), _jsxs("div", { className: "text-right", children: [_jsxs("p", { className: "text-gray-500 text-xs sm:text-sm", children: [track.plays.toLocaleString(), " plays"] }), _jsxs("div", { className: "flex items-center gap-1 mt-1 justify-end", children: [_jsx("svg", { className: "w-4 h-4 text-gray-500", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", clipRule: "evenodd" }) }), _jsx("span", { className: "text-gray-500 text-xs sm:text-sm", children: track.likes })] })] }), _jsx("div", { className: "text-gray-500 text-sm hidden sm:block", children: formatDuration(track.duration) })] }, track._id))) })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx("svg", { className: "w-16 h-16 mx-auto text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("h3", { className: "mt-4 text-lg font-medium text-white", children: "No tracks found" }), _jsx("p", { className: "mt-2 text-gray-400", children: "Try adjusting your search to find what you're looking for." })] })) })) : (_jsx(_Fragment, { children: getFilteredAlbums().length > 0 ? (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4", children: getFilteredAlbums().map((album) => (_jsxs("div", { className: "group card-bg rounded-xl p-4 transition-all duration-300 hover:border-primary-light/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary-light/10", children: [_jsxs("div", { className: "relative mb-3", children: [_jsx("img", { src: album.coverImage || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80', alt: album.title, className: "w-full aspect-square rounded-lg object-cover" }), _jsx("div", { className: "absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    handlePlayAlbum(album.id);
                                                }, className: "w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-white", children: _jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) }) })] }), _jsx("h3", { className: "font-bold text-white text-sm truncate", children: album.title }), _jsx("p", { className: "text-gray-400 text-xs truncate", children: album.artist }), _jsxs("p", { className: "text-gray-500 text-xs mt-1", children: [album.year, " \u2022 ", album.tracks, " tracks"] })] }, album.id))) })) : (_jsxs("div", { className: "text-center py-12", children: [_jsx("svg", { className: "w-16 h-16 mx-auto text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }), _jsx("h3", { className: "mt-4 text-lg font-medium text-white", children: "No albums found" }), _jsx("p", { className: "mt-2 text-gray-400", children: "Try adjusting your search to find what you're looking for." })] })) }))] }) }));
}
