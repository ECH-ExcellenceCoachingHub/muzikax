'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { fetchRecommendedTracks } from '@/services/recommendationService';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import AddToQueueButton from '@/components/AddToQueueButton';
export default function ForYouPage() {
    const { playTrack } = useAudioPlayer();
    const [sortBy, setSortBy] = useState('new_and_popular');
    const [filterBy, setFilterBy] = useState('music'); // Default to music
    const [tracks, setTracks] = useState([]);
    const [loading, setLoading] = useState(true);
    // Helper function to convert duration string to seconds
    const convertDurationToSeconds = (duration) => {
        const [minutes, seconds] = duration.split(':').map(Number);
        return minutes * 60 + seconds;
    };
    useEffect(() => {
        const fetchTracks = async () => {
            try {
                setLoading(true);
                // Fetch tracks sorted by recent first (newest tracks)
                const recommendedTracks = await fetchRecommendedTracks(undefined, 12, 'recent');
                // Map the ITrack objects to our Track interface format
                const mappedTracks = recommendedTracks.map(track => {
                    var _a;
                    return ({
                        id: track._id,
                        title: track.title,
                        artist: ((_a = track.creatorId) === null || _a === void 0 ? void 0 : _a.name) || track.creatorId,
                        album: track.description,
                        plays: track.plays,
                        likes: track.likes,
                        coverImage: track.coverURL,
                        audioUrl: track.audioURL,
                        duration: undefined, // Duration might not be available in ITrack
                        category: track.type
                    });
                });
                setTracks(mappedTracks);
            }
            catch (error) {
                console.error('Error fetching recommended tracks:', error);
                // Fallback to mock data if API call fails
                setTracks(mockTracks);
            }
            finally {
                setLoading(false);
            }
        };
        fetchTracks();
    }, []);
    // Mock data for tracks with real image URLs - will be replaced with API call
    const mockTracks = [
        {
            id: '1',
            title: 'Blinding Lights',
            artist: 'The Weeknd',
            album: 'After Hours',
            plays: 12400,
            likes: 890,
            coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '3:45',
            category: 'song'
        },
        {
            id: '2',
            title: 'Afro Trap Beat',
            artist: 'Beat Master',
            plays: 14200,
            likes: 1100,
            coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '2:45',
            category: 'beats'
        },
        {
            id: '3',
            title: 'Levitating',
            artist: 'Dua Lipa',
            album: 'Future Nostalgia',
            plays: 15600,
            likes: 1200,
            coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '3:18',
            category: 'song'
        },
        {
            id: '4',
            title: 'Rwandan Mixtape',
            artist: 'DJ Rwanda',
            plays: 18700,
            likes: 1420,
            coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '45:32',
            category: 'mixes'
        },
        {
            id: '5',
            title: 'Good 4 U',
            artist: 'Olivia Rodrigo',
            album: 'SOUR',
            plays: 11200,
            likes: 950,
            coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '4:33',
            category: 'song'
        },
        {
            id: '6',
            title: 'Urban Beats Collection',
            artist: 'City Producer',
            plays: 3200,
            likes: 280,
            coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '3:47',
            category: 'beats'
        },
        {
            id: '7',
            title: 'Peaches',
            artist: 'Justin Bieber',
            album: 'Justice',
            plays: 1900,
            likes: 150,
            coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '4:12',
            category: 'song'
        },
        {
            id: '8',
            title: 'Kigali Mix Session',
            artist: 'DJ Kigali',
            plays: 4500,
            likes: 380,
            coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '32:15',
            category: 'mixes'
        },
        {
            id: '9',
            title: 'Butter',
            artist: 'BTS',
            album: 'Butter',
            plays: 1500,
            likes: 95,
            coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '5:22',
            category: 'song'
        },
        {
            id: '10',
            title: 'Heat Waves',
            artist: 'Glass Animals',
            album: 'Dreamland',
            plays: 8900,
            likes: 650,
            coverImage: 'https://images.unsplash.com/photo-1514320291841-38b60f8f72d7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '3:28',
            category: 'song'
        },
        {
            id: '11',
            title: 'Industry Baby',
            artist: 'Lil Nas X, Jack Harlow',
            album: 'Montero',
            plays: 12300,
            likes: 980,
            coverImage: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '4:05',
            category: 'song'
        },
        {
            id: '12',
            title: 'Deja Vu',
            artist: 'Olivia Rodrigo',
            album: 'SOUR',
            plays: 7600,
            likes: 520,
            coverImage: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '3:52',
            category: 'song'
        }
    ];
    // Filter and sort tracks based on selected options
    const filteredTracks = tracks.filter(track => {
        if (filterBy === 'all')
            return true;
        if (filterBy === 'music')
            return track.category === 'song';
        if (filterBy === 'beats')
            return track.category === 'beat';
        if (filterBy === 'mixes')
            return track.category === 'mix';
        return true;
    });
    const sortedTracks = [...filteredTracks].sort((a, b) => {
        if (sortBy === 'popular') {
            return b.plays - a.plays;
        }
        else if (sortBy === 'recent') {
            return parseInt(b.id) - parseInt(a.id);
        }
        else if (sortBy === 'new_and_popular') {
            // Backend handles this sorting, but if needed locally, prioritize recency then plays
            return parseInt(b.id) - parseInt(a.id) || b.plays - a.plays;
        }
        else {
            return a.title.localeCompare(b.title);
        }
    });
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-white mb-2", children: "For You" }), _jsx("p", { className: "text-gray-400", children: "Personalized recommendations based on your listening habits" })] }), _jsxs("div", { className: "flex flex-wrap gap-4", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Filter:" }), _jsxs("div", { className: "flex bg-gray-800 rounded-lg p-1", children: [_jsx("button", { onClick: () => setFilterBy('music'), className: `px-3 py-1 rounded-md text-sm transition-colors ${filterBy === 'music' ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'}`, children: "Music" }), _jsx("button", { onClick: () => setFilterBy('beats'), className: `px-3 py-1 rounded-md text-sm transition-colors ${filterBy === 'beats' ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'}`, children: "Beats" }), _jsx("button", { onClick: () => setFilterBy('mixes'), className: `px-3 py-1 rounded-md text-sm transition-colors ${filterBy === 'mixes' ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'}`, children: "Mixes" }), _jsx("button", { onClick: () => setFilterBy('all'), className: `px-3 py-1 rounded-md text-sm transition-colors ${filterBy === 'all' ? 'bg-primary text-white' : 'text-gray-300 hover:text-white'}`, children: "All" })] })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-400 text-sm", children: "Sort by:" }), _jsxs("select", { value: sortBy, onChange: (e) => setSortBy(e.target.value), className: "bg-gray-800 text-white rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary", children: [_jsx("option", { value: "new_and_popular", children: "New & Popular" }), _jsx("option", { value: "popular", children: "Most Popular" }), _jsx("option", { value: "recent", children: "Most Recent" }), _jsx("option", { value: "alphabetical", children: "Alphabetical" })] })] })] })] }), loading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" }) })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: sortedTracks.map((track) => (_jsxs("div", { className: "group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary/10", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: track.coverImage, alt: track.title, className: "w-full aspect-square object-cover" }), _jsxs("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2", children: [_jsx("button", { onClick: (e) => {
                                                    e.stopPropagation();
                                                    if (track.audioUrl) {
                                                        // Convert our Track to the format expected by AudioPlayerContext
                                                        const audioPlayerTrack = {
                                                            id: track.id,
                                                            title: track.title,
                                                            artist: track.artist,
                                                            coverImage: track.coverImage,
                                                            audioUrl: track.audioUrl,
                                                            duration: track.duration ? convertDurationToSeconds(track.duration) : undefined,
                                                            creatorId: track.artist, // Using artist as creatorId
                                                            albumId: track.album ? track.album : undefined,
                                                            plays: track.plays,
                                                            likes: track.likes,
                                                            type: ((track.category === 'song' || track.category === 'beat' || track.category === 'mix') ? track.category : 'song'),
                                                            creatorWhatsapp: undefined
                                                        };
                                                        playTrack(audioPlayerTrack);
                                                    }
                                                }, className: "w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: _jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) }), _jsx(AddToQueueButton, { track: {
                                                    id: track.id,
                                                    title: track.title,
                                                    artist: track.artist || 'Unknown Artist',
                                                    coverImage: track.coverImage || '',
                                                    audioUrl: track.audioUrl || '',
                                                    duration: track.duration ? convertDurationToSeconds(track.duration) : undefined,
                                                    creatorId: track.artist || '',
                                                    type: ((track.category === 'song' || track.category === 'beat' || track.category === 'mix') ? track.category : 'song'),
                                                    creatorWhatsapp: undefined
                                                }, size: "md", variant: "secondary", className: "opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75" })] })] }), _jsxs("div", { className: "p-4", children: [_jsxs("div", { className: "flex justify-between items-start mb-2", children: [_jsx("h3", { className: "font-bold text-white text-base truncate", children: track.title }), track.category && (_jsx("span", { className: "ml-2 px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded-full capitalize", children: track.category }))] }), _jsx("p", { className: "text-gray-400 text-sm truncate", children: track.artist }), track.album && _jsx("p", { className: "text-gray-500 text-xs mt-1 truncate", children: track.album }), _jsxs("div", { className: "flex justify-between items-center mt-3", children: [_jsxs("span", { className: "text-gray-500 text-xs", children: [track.plays.toLocaleString(), " plays"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-4 h-4 text-red-500", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", clipRule: "evenodd" }) }), _jsx("span", { className: "text-gray-500 text-xs", children: track.likes })] })] })] })] }, track.id))) }))] }) }));
}
