'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useTrendingTracks, usePopularCreators } from '@/hooks/useTracks';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import { Suspense } from 'react';
import { followCreator, unfollowCreator, checkFollowStatus } from '@/services/trackService';
const categories = [
    { id: 'afrobeat', name: 'Afrobeat' },
    { id: 'amapiano', name: 'Amapiano' },
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
    { id: 'ambient', name: 'Ambient' },
    { id: 'beats', name: 'Beats' },
    { id: 'mixes', name: 'Mixes' }
];
// Separate component for the main content that uses useSearchParams
function ExploreContent() {
    const [activeTab, setActiveTab] = useState('tracks');
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const searchParams = useSearchParams();
    const router = useRouter();
    const { tracks: trendingTracksData, loading: trendingLoading, refresh: refreshTrendingTracks } = useTrendingTracks(0); // 0 means no limit
    const { creators: popularCreatorsData, loading: creatorsLoading, refresh: refreshCreators } = usePopularCreators(20);
    const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, favoritesLoading, addToFavorites, removeFromFavorites, addToQueue } = useAudioPlayer();
    // State for tracking which tracks are favorited
    const [favoriteStatus, setFavoriteStatus] = useState({});
    // State for tracking follow status for creators
    const [followStatus, setFollowStatus] = useState({});
    // Define categories array
    const categories = [
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
        { id: 'ambient', name: 'Ambient' },
        { id: 'beats', name: 'Beats' },
        { id: 'mixes', name: 'Mixes' }
    ];
    // Update favorite status when favorites change or when favorites are loaded
    useEffect(() => {
        if (!favoritesLoading) {
            const status = {};
            favorites.forEach(track => {
                status[track.id] = true;
            });
            setFavoriteStatus(status);
        }
    }, [favorites, favoritesLoading]);
    // Update follow status for creators when they are loaded
    useEffect(() => {
        const loadFollowStatus = async () => {
            if (popularCreatorsData && popularCreatorsData.length > 0) {
                const status = {};
                // Check follow status for each creator
                for (const creator of popularCreatorsData) {
                    try {
                        const isFollowing = await checkFollowStatus(creator._id);
                        status[creator._id] = isFollowing;
                    }
                    catch (error) {
                        console.error(`Error checking follow status for creator ${creator._id}:`, error);
                        status[creator._id] = false; // Default to not following
                    }
                }
                setFollowStatus(status);
            }
        };
        loadFollowStatus();
    }, [popularCreatorsData]);
    // Listen for favorites loaded event to update favorite status
    useEffect(() => {
        const handleFavoritesLoaded = () => {
            const status = {};
            favorites.forEach(track => {
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
    }, [favorites]);
    // Toggle favorite status for a track
    const toggleFavorite = (trackId, track) => {
        const isCurrentlyFavorite = favoriteStatus[trackId];
        if (isCurrentlyFavorite) {
            // Remove from favorites
            removeFromFavorites(trackId);
            // Optimistically update UI
            setFavoriteStatus(prev => (Object.assign(Object.assign({}, prev), { [trackId]: false })));
        }
        else {
            // Add to favorites
            addToFavorites({
                id: track._id,
                title: track.title,
                artist: typeof track.creatorId === 'object' && track.creatorId !== null
                    ? track.creatorId.name
                    : 'Unknown Artist',
                coverImage: track.coverURL || '',
                audioUrl: track.audioURL || '',
                creatorId: typeof track.creatorId === 'object' && track.creatorId !== null
                    ? track.creatorId._id
                    : track.creatorId
            });
            // Optimistically update UI
            setFavoriteStatus(prev => (Object.assign(Object.assign({}, prev), { [trackId]: true })));
        }
        // Dispatch event to notify other components
        const event = new CustomEvent('trackUpdated', {
            detail: {
                trackId: trackId,
                isFavorite: !isCurrentlyFavorite
            }
        });
        window.dispatchEvent(event);
    };
    // Listen for track updates (when favorites are added/removed)
    useEffect(() => {
        const handleTrackUpdate = (event) => {
            const detail = event.detail;
            if (detail && detail.trackId) {
                // Update favorite status if provided
                if (detail.isFavorite !== undefined) {
                    setFavoriteStatus(prev => (Object.assign(Object.assign({}, prev), { [detail.trackId]: detail.isFavorite })));
                }
                // Refresh trending tracks to update like counts
                refreshTrendingTracks();
            }
        };
        // Add event listener
        window.addEventListener('trackUpdated', handleTrackUpdate);
        // Clean up event listener
        return () => {
            window.removeEventListener('trackUpdated', handleTrackUpdate);
        };
    }, [refreshTrendingTracks]);
    // Listen for toast notifications and forward them to player
    useEffect(() => {
        const handleShowToast = (event) => {
            const { message, type } = event.detail;
            // Dispatch a custom event that the player page can listen to
            const playerToastEvent = new CustomEvent('playerToast', {
                detail: { message, type }
            });
            window.dispatchEvent(playerToastEvent);
        };
        // Add event listener
        window.addEventListener('showToast', handleShowToast);
        // Clean up event listener
        return () => {
            window.removeEventListener('showToast', handleShowToast);
        };
    }, []);
    // Get category from URL params
    const categoryParam = searchParams.get('category');
    useEffect(() => {
        if (categoryParam) {
            setSelectedCategory(categoryParam);
        }
    }, [categoryParam]);
    // Transform real tracks data to match existing interface
    const allTracks = trendingTracksData.map(track => ({
        _id: track._id,
        id: track._id, // Use the same ID for consistency
        title: track.title,
        artist: typeof track.creatorId === 'object' && track.creatorId !== null ? track.creatorId.name : 'Unknown Artist',
        plays: track.plays,
        likes: track.likes,
        coverImage: track.coverURL || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        coverURL: track.coverURL,
        category: track.genre || 'afrobeat',
        duration: ''
    }));
    // Transform real creators data to match existing interface
    const allCreators = popularCreatorsData.map(creator => ({
        _id: creator._id,
        id: creator._id || 'unknown',
        name: creator.name,
        creatorType: creator.creatorType || 'artist',
        followersCount: creator.followersCount || 0,
        avatar: creator.avatar || 'https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
        verified: true // Assuming all creators from backend are verified for now
    }));
    // Filter tracks based on selected category and search term
    const filteredTracks = allTracks.filter(track => {
        // Apply category filter if selected
        const categoryMatch = selectedCategory ? track.category === selectedCategory : true;
        // Apply search filter if search term exists
        const searchMatch = searchTerm
            ? track.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                track.artist.toLowerCase().includes(searchTerm.toLowerCase())
            : true;
        return categoryMatch && searchMatch;
    });
    // Filter creators based on search term
    const filteredCreators = allCreators.filter(creator => {
        return searchTerm
            ? creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                creator.creatorType.toLowerCase().includes(searchTerm.toLowerCase())
            : true; // Show all creators if no search term
    });
    const handleCategoryClick = (categoryId) => {
        if (selectedCategory === categoryId || (categoryId === '' && selectedCategory === null)) {
            // If clicking the same category or clicking 'All Categories' when already showing all
            setSelectedCategory(null);
            router.push('/explore');
        }
        else {
            // Set the new category filter
            if (categoryId === '') {
                setSelectedCategory(null);
                router.push('/explore');
            }
            else {
                setSelectedCategory(categoryId);
                router.push(`/explore?category=${categoryId}`);
            }
        }
    };
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black", children: [_jsxs("div", { className: "relative py-8 sm:py-12 lg:py-16 overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0", children: [_jsx("div", { className: "absolute inset-0 bg-cover bg-center", style: { backgroundImage: 'url(https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)' } }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-gray-900/60" })] }), _jsx("div", { className: "absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-20 -right-20 w-64 h-64 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "container mx-auto px-4 sm:px-8 relative z-10", children: _jsxs("div", { className: "max-w-3xl mx-auto text-center", children: [_jsx("h1", { className: "text-3xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light mb-3 sm:mb-4", children: "Explore Rwandan Music" }), _jsx("p", { className: "text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-8", children: "Discover trending tracks and talented creators from Rwanda's vibrant music scene" }), _jsxs("div", { className: "relative max-w-xl mx-auto", children: [_jsx("input", { type: "text", placeholder: "Search tracks, artists, albums...", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value), className: "w-full py-2.5 sm:py-3 px-4 sm:px-6 pl-10 sm:pl-12 bg-gray-800/70 backdrop-blur-sm border border-gray-700/50 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm sm:text-base shadow-lg" }), _jsx("div", { className: "absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) })] })] }) })] }), _jsx("div", { className: "container mx-auto px-4 sm:px-8 py-4", children: _jsxs("div", { className: "flex flex-wrap gap-1.5 xs:gap-2 justify-center max-w-full overflow-x-auto pb-2", children: [_jsx("button", { className: `px-2.5 py-1.5 xs:px-3 xs:py-2 rounded-full text-xs xs:text-sm font-medium transition-colors flex-shrink-0 ${selectedCategory === null
                                ? 'bg-gradient-to-r from-primary to-primary-hover text-white shadow-lg shadow-primary/20'
                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50'}`, onClick: () => handleCategoryClick(''), children: "All" }), categories.slice(0, 5).map((category) => (_jsx("button", { className: `px-2.5 py-1.5 xs:px-3 xs:py-2 rounded-full text-xs xs:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0 ${selectedCategory === category.id
                                ? 'bg-gradient-to-r from-primary-light to-primary-hover text-gray-900 shadow-lg shadow-primary-light/30 scale-105 ring-2 ring-primary-light/40'
                                : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 hover:scale-105 hover:text-white hover:shadow-md'}`, onClick: () => handleCategoryClick(category.id), children: category.name }, category.id))), _jsx("div", { className: "flex items-center flex-shrink-0 relative", children: _jsxs("details", { className: "group", children: [_jsxs("summary", { className: "px-2.5 py-1.5 xs:px-3 xs:py-2 rounded-full text-xs xs:text-sm font-medium bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50 cursor-pointer list-none flex items-center gap-1", children: [_jsx("span", { children: "More" }), _jsx("svg", { className: "w-3 h-3 ml-1 transition-transform duration-300 group-open:rotate-180", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }) })] }), _jsx("div", { className: "fixed z-50 inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8", onClick: (e) => e.stopPropagation(), children: _jsxs("div", { className: "bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl shadow-primary/50 border border-gray-700/50 max-h-[80vh] w-full max-w-md overflow-hidden", children: [_jsxs("div", { className: "p-4 border-b border-gray-700/50 flex justify-between items-center", children: [_jsx("h3", { className: "text-lg font-bold text-white", children: "More Genres" }), _jsx("button", { onClick: () => {
                                                                const details = document.querySelector('details');
                                                                if (details)
                                                                    details.removeAttribute('open');
                                                            }, className: "text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) }) })] }), _jsx("div", { className: "p-4 max-h-[60vh] overflow-y-auto", children: _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-2", children: categories.slice(5).map((category) => (_jsx("button", { className: `px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 whitespace-nowrap ${selectedCategory === category.id
                                                                ? 'bg-gradient-to-r from-primary-light to-primary-hover text-gray-900 shadow-lg shadow-primary-light/20'
                                                                : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'}`, onClick: () => {
                                                                handleCategoryClick(category.id);
                                                                // Close the dropdown
                                                                const details = document.querySelector('details');
                                                                if (details)
                                                                    details.removeAttribute('open');
                                                            }, children: category.name }, category.id))) }) })] }) })] }) })] }) }), _jsxs("div", { className: "container mx-auto px-4 sm:px-8 py-8 sm:py-12 md:py-16 pb-32 flex-1", children: [_jsxs("div", { className: "flex border-b border-gray-800 mb-8 sm:mb-10", children: [_jsx("button", { className: `py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors ${activeTab === 'tracks'
                                    ? 'text-primary border-b-2 border-primary'
                                    : 'text-gray-500 hover:text-gray-300'}`, onClick: () => setActiveTab('tracks'), children: "Trending Tracks" }), _jsx("button", { className: `py-3 px-4 sm:px-6 font-medium text-sm sm:text-base transition-colors ${activeTab === 'creators'
                                    ? 'text-primary-light border-b-2 border-primary-light'
                                    : 'text-gray-500 hover:text-gray-300'}`, onClick: () => setActiveTab('creators'), children: "Top Creators" })] }), activeTab === 'tracks' && (_jsx(_Fragment, { children: trendingLoading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "text-white", children: "Loading tracks..." }) })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8", children: filteredTracks.map((track) => (_jsxs("div", { className: "group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary/10", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: track.coverImage || track.coverURL || '/placeholder-track.png', alt: track.title, className: "w-full h-40 sm:h-48 md:h-56 object-cover", onError: (e) => {
                                                    // Handle broken images gracefully
                                                    const target = e.target;
                                                    target.src = '/placeholder-track.png';
                                                } }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("button", { onClick: () => {
                                                        // Find the full track object to get the audioURL
                                                        const fullTrack = trendingTracksData.find(t => t._id === track._id);
                                                        if (fullTrack && fullTrack.audioURL) {
                                                            playTrack({
                                                                id: track.id,
                                                                title: track.title,
                                                                artist: track.artist,
                                                                coverImage: track.coverImage || track.coverURL || '/placeholder-track.png',
                                                                audioUrl: fullTrack.audioURL,
                                                                plays: fullTrack.plays || 0,
                                                                likes: fullTrack.likes || 0,
                                                                creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? fullTrack.creatorId._id : fullTrack.creatorId,
                                                                type: fullTrack.type, // Include track type for WhatsApp functionality
                                                                creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null
                                                                    ? fullTrack.creatorId.whatsappContact
                                                                    : undefined) // Include creator's WhatsApp contact
                                                            });
                                                            // Set the current playlist to all trending tracks
                                                            const playlistTracks = trendingTracksData
                                                                .filter(t => t.audioURL) // Only tracks with audio
                                                                .map(t => ({
                                                                id: t._id || 'unknown',
                                                                title: t.title,
                                                                artist: typeof t.creatorId === 'object' && t.creatorId !== null ? t.creatorId.name : 'Unknown Artist',
                                                                coverImage: t.coverURL || 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
                                                                audioUrl: t.audioURL,
                                                                plays: t.plays || 0,
                                                                likes: t.likes || 0,
                                                                creatorId: typeof t.creatorId === 'object' && t.creatorId !== null ? t.creatorId._id : t.creatorId,
                                                                type: t.type, // Include track type for WhatsApp functionality
                                                                creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null
                                                                    ? t.creatorId.whatsappContact
                                                                    : undefined) // Include creator's WhatsApp contact
                                                            }));
                                                            setCurrentPlaylist(playlistTracks);
                                                        }
                                                    }, className: "w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-lg hover:bg-[#E67E00] hover:scale-105", children: (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id && isPlaying ? (_jsx("svg", { className: "w-6 h-6 sm:w-7 sm:h-7", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-6 h-6 sm:w-7 sm:h-7 ml-1", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })) }) }), _jsxs("div", { className: "absolute top-3 right-3 sm:top-4 sm:right-4 flex flex-col gap-2", children: [_jsx("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            // Find the full track object
                                                            const fullTrack = trendingTracksData.find(t => t._id === track._id);
                                                            if (fullTrack) {
                                                                toggleFavorite(track.id, fullTrack);
                                                            }
                                                        }, className: "p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md", children: _jsx("svg", { className: `w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${favoriteStatus[track.id] ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`, fill: favoriteStatus[track.id] ? "currentColor" : "none", stroke: "currentColor", strokeWidth: "1.5", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M4.318 6.318a4 4 0 000 6.364L12 20.364l7.682-7.682a4 4 0 00-6.364-6.364L12 7.636l-1.318-1.318a4 4 0 000-5.656z" }) }) }), _jsx("button", { onClick: (e) => {
                                                            e.stopPropagation();
                                                            // Add to queue functionality
                                                            const fullTrack = trendingTracksData.find(t => t._id === track._id);
                                                            if (fullTrack && fullTrack.audioURL) {
                                                                try {
                                                                    addToQueue({
                                                                        id: track._id || track.id || 'unknown', // Use _id or fallback to id
                                                                        title: track.title,
                                                                        artist: track.artist,
                                                                        coverImage: track.coverImage || track.coverURL || '/placeholder-track.png',
                                                                        audioUrl: fullTrack.audioURL,
                                                                        duration: fullTrack.duration ? (fullTrack.duration.includes(':') ?
                                                                            (() => {
                                                                                const [mins, secs] = fullTrack.duration.split(':').map(Number);
                                                                                return mins * 60 + secs;
                                                                            })() : Number(fullTrack.duration)) : undefined,
                                                                        creatorId: typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null ? fullTrack.creatorId._id : fullTrack.creatorId,
                                                                        type: fullTrack.type,
                                                                        creatorWhatsapp: (typeof fullTrack.creatorId === 'object' && fullTrack.creatorId !== null
                                                                            ? fullTrack.creatorId.whatsappContact
                                                                            : undefined)
                                                                    });
                                                                    // Show toast notification
                                                                    const toastEvent = new CustomEvent('showToast', {
                                                                        detail: {
                                                                            message: `Added ${track.title} to queue!`,
                                                                            type: 'success'
                                                                        }
                                                                    });
                                                                    window.dispatchEvent(toastEvent);
                                                                }
                                                                catch (error) {
                                                                    console.error('Error adding to queue:', error);
                                                                    // Show error notification
                                                                    const toastEvent = new CustomEvent('showToast', {
                                                                        detail: {
                                                                            message: `Failed to add ${track.title} to queue`,
                                                                            type: 'error'
                                                                        }
                                                                    });
                                                                    window.dispatchEvent(toastEvent);
                                                                }
                                                            }
                                                            else {
                                                                // Show error if track not found or no audio
                                                                const toastEvent = new CustomEvent('showToast', {
                                                                    detail: {
                                                                        message: `Cannot add ${track.title} to queue - audio not available`,
                                                                        type: 'error'
                                                                    }
                                                                });
                                                                window.dispatchEvent(toastEvent);
                                                            }
                                                        }, className: "p-2 sm:p-2.5 rounded-full bg-black/40 backdrop-blur-md text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:bg-black/60 shadow-md", title: `Add ${track.title} to queue`, children: _jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" }) }) })] })] }), _jsxs("div", { className: "p-4 sm:p-5", children: [_jsx("h3", { className: "font-bold text-white text-lg mb-1 truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base mb-3 sm:mb-4", children: track.artist }), _jsxs("div", { className: "flex justify-between text-xs sm:text-sm text-gray-500", children: [_jsxs("span", { children: [track.plays.toLocaleString(), " plays"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-3 h-3 sm:w-4 sm:h-4", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", clipRule: "evenodd" }) }), _jsx("span", { children: track.likes })] })] })] })] }, track.id))) })) })), activeTab === 'creators' && (_jsx(_Fragment, { children: creatorsLoading ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "text-white", children: "Loading creators..." }) })) : (_jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6", children: filteredCreators.map((creator) => (_jsxs("div", { className: "group card-bg rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-primary-light/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary-light/10 cursor-pointer", onClick: () => {
                                    // Navigate to the creator's profile page
                                    router.push(`/artists/${creator.id}`);
                                }, children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: creator.avatar, alt: creator.name, className: "w-16 h-16 rounded-full object-cover" }), creator.verified && (_jsx("div", { className: "absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center", children: _jsx("svg", { className: "w-3 h-3 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" }) }) }))] }), _jsxs("div", { children: [_jsx("h3", { className: "font-bold text-white text-lg", children: creator.name }), _jsx("p", { className: "text-gray-400 text-sm", children: creator.creatorType })] })] }), _jsx("div", { className: "flex justify-between text-sm text-gray-500 mb-4", children: _jsxs("span", { children: [creator.followersCount.toLocaleString(), " followers"] }) }), _jsx("button", { className: `w-full py-3 sm:py-3.5 rounded-lg font-bold hover:opacity-90 transition-all duration-300 text-sm sm:text-base shadow-md hover:shadow-lg transform hover:-translate-y-0.5 ${followStatus[creator.id] ? 'bg-gray-600 text-white' : 'bg-gradient-to-r from-primary-light to-primary-hover text-gray-900'}`, onClick: async (e) => {
                                            // Prevent the click from propagating to the parent div (which would navigate to the profile)
                                            e.stopPropagation();
                                            try {
                                                // Determine current follow status based on current state
                                                const currentFollowStatus = followStatus[creator.id];
                                                if (currentFollowStatus) {
                                                    // Unfollow the creator
                                                    await unfollowCreator(creator.id);
                                                    // Update the follow status
                                                    setFollowStatus(prev => (Object.assign(Object.assign({}, prev), { [creator.id]: false })));
                                                }
                                                else {
                                                    // Follow the creator
                                                    await followCreator(creator.id);
                                                    // Update the follow status
                                                    setFollowStatus(prev => (Object.assign(Object.assign({}, prev), { [creator.id]: true })));
                                                }
                                                // Show success feedback
                                                console.log(`Successfully ${currentFollowStatus ? 'unfollowed' : 'followed'} creator`);
                                                // Refresh creators to update follower counts
                                                refreshCreators();
                                            }
                                            catch (error) {
                                                console.error(`Failed to ${followStatus[creator.id] ? 'unfollow' : 'follow'} creator:`, error);
                                                alert(`Failed to ${followStatus[creator.id] ? 'unfollow' : 'follow'} creator. Please try again.`);
                                            }
                                        }, children: followStatus[creator.id] ? 'Following' : 'Follow' })] }, creator.id))) })) }))] })] }));
}
export default function Explore() {
    return (_jsx(Suspense, { fallback: _jsx("div", { children: "Loading..." }), children: _jsx(ExploreContent, {}) }));
}
