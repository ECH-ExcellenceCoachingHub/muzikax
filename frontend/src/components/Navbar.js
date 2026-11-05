'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../contexts/AuthContext';
export default function Navbar() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isAuthenticated, userRole, logout } = useAuth();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState(''); // Add search state
    const [showCategories, setShowCategories] = useState(false);
    const categoriesRef = useRef(null);
    // App-like categories similar to Spotify/Apple Music
    const categories = [
        { id: 'home', name: 'Home', icon: '🏠' },
        { id: 'beats', name: 'Beats', icon: '🎵' },
        { id: 'mixes', name: 'Mixes', icon: '🎧' },
        { id: 'afrobeat', name: 'Afrobeat', icon: '🌍' },
        { id: 'hiphop', name: 'Hip Hop', icon: '🎤' },
        { id: 'rnb', name: 'R&B', icon: '🎷' },
        { id: 'afropop', name: 'Afropop', icon: '🎸' },
        { id: 'gospel', name: 'Gospel', icon: '⛪' },
        { id: 'dancehall', name: 'Dancehall', icon: '💃' },
        { id: 'reggae', name: 'Reggae', icon: '🇯🇲' },
        { id: 'pop', name: 'Pop', icon: '✨' },
        { id: 'rock', name: 'Rock', icon: '🎸' },
        { id: 'electronic', name: 'Electronic', icon: '⚡' },
        { id: 'house', name: 'House', icon: '🏠' },
        { id: 'jazz', name: 'Jazz', icon: '🎹' },
        { id: 'soul', name: 'Soul', icon: '❤️' },
        { id: 'community', name: 'Community', icon: '👥' },
    ];
    // Handle category selection
    const handleCategorySelect = (categoryId) => {
        // Navigate to appropriate pages
        switch (categoryId) {
            case 'home':
                router.push('/');
                break;
            case 'beats':
            case 'mixes':
                router.push(`/explore?type=${categoryId}`);
                break;
            case 'community':
                router.push('/community');
                break;
            default:
                // For genre categories, go to explore with filter
                router.push(`/explore?genre=${categoryId}`);
        }
    };
    const handleSearch = (e) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            // Navigate to search results page with query parameter
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    };
    // Auto-hide categories when scrolling
    useEffect(() => {
        const handleScroll = () => {
            if (showCategories && categoriesRef.current) {
                const rect = categoriesRef.current.getBoundingClientRect();
                if (rect.bottom < 0 || rect.top > window.innerHeight) {
                    setShowCategories(false);
                }
            }
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [showCategories]);
    return (_jsxs("nav", { className: "bg-gray-900/80 backdrop-blur-lg border-b border-gray-800 sticky top-0 z-40", children: [_jsx("div", { ref: categoriesRef, className: `bg-gray-900/95 backdrop-blur-lg border-b border-gray-800 transition-all duration-300 overflow-hidden ${showCategories ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'} md:hidden`, children: _jsx("div", { className: "px-4 py-3", children: _jsx("div", { className: "flex space-x-3 overflow-x-auto scrollbar-hide pb-2", style: { scrollbarWidth: 'none', msOverflowStyle: 'none' }, children: categories.map((category) => (_jsxs("button", { onClick: () => {
                                handleCategorySelect(category.id);
                                setShowCategories(false); // Close categories after selection
                            }, className: `flex flex-col items-center px-3 py-2 rounded-xl transition-all duration-200 whitespace-nowrap flex-shrink-0 ${'bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 hover:text-white'}`, children: [_jsx("span", { className: "text-lg mb-1", children: category.icon }), _jsx("span", { className: "text-xs font-medium", children: category.name })] }, category.id))) }) }) }), _jsx("div", { className: "max-w-7xl mx-auto px-1 sm:px-2 lg:px-3", children: _jsxs("div", { className: "flex items-center justify-between h-16 w-full", children: [_jsx("div", { className: "flex-shrink-0 flex items-center", children: _jsxs(Link, { href: "/", className: "flex items-center", children: [_jsx("img", { src: "/muzikax.png", alt: "MuzikaX Logo", className: "h-8 w-auto" }), _jsx("span", { className: "ml-3 text-xl font-bold text-white", children: "MuzikaX" })] }) }), _jsx("div", { className: "hidden md:block", children: _jsxs("div", { className: "flex items-center space-x-2 sm:space-x-3 mx-2", children: [_jsx(Link, { href: "/", className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base", children: "Home" }), _jsx(Link, { href: "/explore", className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base", children: "Explore" }), _jsx(Link, { href: "/beats", className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base", children: "Beats" }), _jsx(Link, { href: "/community", className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base", children: "Community" }), _jsxs("div", { className: "relative group hidden lg:block", children: [_jsxs("button", { className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base flex items-center", children: ["More", _jsx("svg", { className: "ml-1 w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }) })] }), _jsxs("div", { className: "absolute left-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50", children: [_jsx(Link, { href: "/about", className: "block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700", children: "About Us" }), _jsx(Link, { href: "/faq", className: "block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700", children: "FAQ" }), _jsx(Link, { href: "/contact", className: "block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700", children: "Contact" }), _jsx("div", { className: "border-t border-gray-700 my-1" }), _jsx(Link, { href: "/terms", className: "block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700", children: "Terms of Use" }), _jsx(Link, { href: "/privacy", className: "block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700", children: "Privacy Policy" }), _jsx(Link, { href: "/copyright", className: "block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700", children: "Copyright" })] })] }), _jsxs("form", { onSubmit: handleSearch, className: "relative", children: [_jsx("input", { type: "text", value: searchQuery, onChange: (e) => setSearchQuery(e.target.value), placeholder: "Search music, artists, albums...", className: "w-32 sm:w-48 md:w-56 px-3 py-1.5 sm:py-2 bg-gray-800/50 border border-gray-700 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm transition-all" }), _jsx("button", { type: "submit", className: "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white", children: _jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) })] }), _jsx("button", { onClick: () => {
                                            if (!isAuthenticated) {
                                                // If not authenticated, go to login
                                                router.push('/login');
                                            }
                                            else if (userRole === 'creator') {
                                                // If already a creator, go to upload
                                                router.push('/upload');
                                            }
                                            else {
                                                // If authenticated but not a creator, go to upload to upgrade
                                                router.push('/upload');
                                            }
                                        }, className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base bg-transparent border-none cursor-pointer", children: "Upload" })] }) }), _jsx("div", { className: "hidden md:block", children: _jsx("div", { className: "flex items-center space-x-2 sm:space-x-3", children: isAuthenticated ? (_jsxs(_Fragment, { children: [_jsx(Link, { href: "/profile", className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base", children: "Profile" }), userRole === 'admin' && (_jsx(Link, { href: "/admin", className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base", children: "Admin Dashboard" })), _jsx("button", { onClick: () => {
                                                logout();
                                                router.push('/');
                                            }, className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base bg-transparent border-none cursor-pointer", children: "Logout" })] })) : (_jsxs(_Fragment, { children: [_jsx(Link, { href: "/login", className: "text-gray-300 hover:text-white transition-colors text-sm sm:text-base", children: "Login" }), _jsx(Link, { href: "/login", className: "px-3 py-1.5 sm:px-4 sm:py-2 btn-primary text-sm", children: "Sign Up" })] })) }) }), _jsxs("div", { className: "md:hidden flex items-center space-x-1", children: [_jsx("button", { onClick: () => setShowCategories(!showCategories), className: "inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none", children: _jsx("svg", { className: `h-6 w-6 transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`, fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M19 9l-7 7-7-7" }) }) }), _jsx("button", { onClick: () => router.push('/search'), className: "inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none", children: _jsx("svg", { className: "h-6 w-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" }) }) }), _jsxs("button", { onClick: () => setIsMenuOpen(!isMenuOpen), className: "inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white focus:outline-none", children: [_jsx("svg", { className: `${isMenuOpen ? 'hidden' : 'block'} h-6 w-6`, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 6h16M4 12h16M4 18h16" }) }), _jsx("svg", { className: `${isMenuOpen ? 'block' : 'hidden'} h-6 w-6`, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) })] })] })] }) }), _jsx("div", { className: `${isMenuOpen ? 'block' : 'hidden'} md:hidden`, children: _jsxs("div", { className: "px-0 pt-2 pb-3 space-y-1 sm:px-1", children: [_jsx(Link, { href: "/", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800", children: "Home" }), _jsx(Link, { href: "/explore", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800", children: "Explore" }), _jsx(Link, { href: "/beats", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800", children: "Beats" }), _jsxs("div", { className: "px-3 py-2", children: [_jsx("div", { className: "text-xs uppercase tracking-wide text-gray-500 mb-2", children: "Information" }), _jsx(Link, { href: "/about", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800", children: "About Us" }), _jsx(Link, { href: "/faq", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800", children: "FAQ" }), _jsx(Link, { href: "/contact", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800", children: "Contact" })] }), _jsxs("div", { className: "px-3 py-2", children: [_jsx("div", { className: "text-xs uppercase tracking-wide text-gray-500 mb-2", children: "Legal" }), _jsx(Link, { href: "/terms", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800", children: "Terms of Use" }), _jsx(Link, { href: "/privacy", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800", children: "Privacy Policy" }), _jsx(Link, { href: "/copyright", className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800", children: "Copyright" })] }), _jsx("button", { onClick: () => {
                                if (!isAuthenticated) {
                                    // If not authenticated, go to login
                                    router.push('/login');
                                }
                                else if (userRole === 'creator') {
                                    // If already a creator, go to upload
                                    router.push('/upload');
                                }
                                else {
                                    // If authenticated but not a creator, go to upload to upgrade
                                    router.push('/upload');
                                }
                            }, className: "block px-3 py-2 rounded-md text-base font-medium text-gray-300 hover:text-white hover:bg-gray-800 w-full text-left bg-transparent border-none cursor-pointer", children: "Upload" }), _jsx("div", { className: "pt-4 pb-3 border-t border-gray-800", children: _jsx("div", { className: "flex items-center px-5", children: isAuthenticated ? (_jsxs(_Fragment, { children: [_jsx(Link, { href: "/profile", className: "w-full text-center px-4 py-2 text-base font-medium text-gray-300 hover:text-white", children: "Profile" }), userRole === 'admin' && (_jsx(Link, { href: "/admin", className: "w-full text-center px-4 py-2 text-base font-medium text-gray-300 hover:text-white", children: "Admin Dashboard" })), _jsx("button", { onClick: () => {
                                                logout();
                                                router.push('/');
                                            }, className: "w-full text-center px-4 py-2 text-base font-medium text-gray-300 hover:text-white bg-transparent border-none cursor-pointer", children: "Logout" })] })) : (_jsxs(_Fragment, { children: [_jsx(Link, { href: "/login", className: "w-full text-center px-4 py-2 text-base font-medium text-gray-300 hover:text-white", children: "Login" }), _jsx(Link, { href: "/login", className: "w-full text-center ml-3 px-4 py-2 btn-primary", children: "Sign Up" })] })) }) })] }) })] }));
}
