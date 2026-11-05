'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { fetchPopularCreators, followCreator } from '@/services/trackService';
import { useAuth } from '@/contexts/AuthContext';
// Function to generate avatar with first letter of name
const generateAvatar = (name) => {
    const firstLetter = name.charAt(0).toUpperCase();
    return (_jsx("div", { className: "w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center mx-auto", children: _jsx("span", { className: "text-3xl font-bold text-white", children: firstLetter }) }));
};
export default function ArtistsPage() {
    const [sortBy, setSortBy] = useState('popular');
    const [searchTerm, setSearchTerm] = useState('');
    const [creators, setCreators] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { isAuthenticated } = useAuth();
    useEffect(() => {
        const loadCreators = async () => {
            try {
                setLoading(true);
                const fetchedCreators = await fetchPopularCreators(100); // Fetch more creators
                setCreators(fetchedCreators);
                setError(null);
            }
            catch (err) {
                console.error('Failed to fetch creators:', err);
                setError('Failed to load artists. Please try again later.');
            }
            finally {
                setLoading(false);
            }
        };
        loadCreators();
    }, []);
    // Filter and sort creators
    const filteredAndSortedCreators = useMemo(() => {
        // Filter creators based on search term
        const filtered = creators.filter(creator => creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (creator.creatorType && creator.creatorType.toLowerCase().includes(searchTerm.toLowerCase())));
        // Sort creators based on selected option
        return [...filtered].sort((a, b) => {
            if (sortBy === 'popular') {
                return b.followersCount - a.followersCount;
            }
            else {
                return a.name.localeCompare(b.name);
            }
        });
    }, [creators, searchTerm, sortBy]);
    const handleArtistClick = (creatorId) => {
        router.push(`/artists/${creatorId}`);
    };
    const handleFollowClick = async (creatorId, e) => {
        e.stopPropagation();
        // Check if user is authenticated
        if (!isAuthenticated) {
            // Redirect to login page
            router.push('/login');
            return;
        }
        try {
            // Call the follow creator service
            await followCreator(creatorId);
            // Update the followers count in the UI
            setCreators(prevCreators => prevCreators.map(creator => creator._id === creatorId
                ? Object.assign(Object.assign({}, creator), { followersCount: creator.followersCount + 1 }) : creator));
            // Show success feedback (you might want to add a toast notification here)
            console.log('Successfully followed creator');
        }
        catch (error) {
            console.error('Failed to follow creator:', error);
            // Show error feedback (you might want to add a toast notification here)
            alert('Failed to follow creator. Please try again.');
        }
    };
    if (loading) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "text-white", children: "Loading artists..." }) }) }) }));
    }
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8", children: _jsx("div", { className: "container mx-auto px-4", children: _jsx("div", { className: "flex justify-center items-center h-64", children: _jsx("div", { className: "text-red-500", children: error }) }) }) }));
    }
    return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8", children: _jsxs("div", { className: "container mx-auto px-4", children: [_jsxs("div", { className: "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8", children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-bold text-white", children: "Artists" }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-3 w-full sm:w-auto", children: [_jsx("input", { type: "text", placeholder: "Search artists...", className: "px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }), _jsxs("select", { className: "px-4 py-2 bg-gray-800 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary", value: sortBy, onChange: (e) => setSortBy(e.target.value), children: [_jsx("option", { value: "popular", children: "Most Popular" }), _jsx("option", { value: "alphabetical", children: "Alphabetical" })] })] })] }), filteredAndSortedCreators.length === 0 ? (_jsx("div", { className: "flex justify-center items-center h-64", children: _jsxs("div", { className: "text-white text-center", children: [_jsx("p", { className: "mb-2", children: "No artists found" }), _jsx("p", { className: "text-gray-400 text-sm", children: "Try adjusting your search or filter criteria" })] }) })) : (_jsx("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6", children: filteredAndSortedCreators.map((creator) => {
                        var _a;
                        return (_jsx("div", { className: "bg-gray-800/50 hover:bg-gray-800 rounded-2xl p-4 cursor-pointer transition-all duration-300 transform hover:-translate-y-1", onClick: () => handleArtistClick(creator._id), children: _jsxs("div", { className: "flex flex-col items-center", children: [_jsx("div", { className: "relative mb-4", children: creator.avatar && creator.avatar.trim() !== '' ? (_jsx("img", { src: creator.avatar, alt: creator.name, className: "w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover mx-auto" })) : (generateAvatar(creator.name)) }), _jsx("h3", { className: "font-bold text-white text-base truncate w-full", children: creator.name }), _jsx("p", { className: "text-primary-light text-sm mb-3 capitalize", children: creator.creatorType || 'Artist' }), _jsxs("p", { className: "text-gray-500 text-xs mb-4", children: [((_a = creator.followersCount) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || 0, " followers"] }), _jsx("button", { className: "w-full px-4 py-2 bg-transparent border border-primary-light text-primary-light hover:bg-primary-light/10 rounded-full text-sm font-medium transition-colors", onClick: (e) => handleFollowClick(creator._id, e), children: "Follow" })] }) }, creator._id));
                    }) }))] }) }));
}
