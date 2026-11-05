'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
export default function Dashboard() {
    const [timeRange, setTimeRange] = useState('30d');
    const router = useRouter();
    const { isAuthenticated, userRole } = useAuth();
    // Check authentication and role on component mount
    useEffect(() => {
        if (!isAuthenticated) {
            // If not authenticated, redirect to login
            router.push('/login');
        }
        else if (userRole === 'admin') {
            // If authenticated as admin, redirect to admin dashboard
            router.push('/admin');
        }
        else if (userRole !== 'creator') {
            // If authenticated but not a creator, redirect to home
            router.push('/');
        }
    }, [isAuthenticated, userRole, router]);
    // Don't render the dashboard if not authenticated or not authorized
    if (!isAuthenticated || (userRole !== 'creator' && userRole !== 'admin')) {
        return null;
    }
    // If user is admin, don't show creator dashboard
    if (userRole === 'admin') {
        return null;
    }
    // Mock data
    const stats = [
        { title: 'Total Plays', value: '24.8K', change: '+12%', icon: 'play', color: 'from-primary to-primary' },
        { title: 'Total Likes', value: '3.2K', change: '+8%', icon: 'heart', color: 'from-primary-light to-primary-light' },
        { title: 'Followers', value: '1.5K', change: '+5%', icon: 'users', color: 'from-primary to-primary' },
        { title: 'Revenue', value: 'RWF 42.1K', change: '+18%', icon: 'currency', color: 'from-[#10B981] to-[#10B981]' }
    ];
    const recentTracks = [
        { id: '1', title: 'Rwandan Vibes', plays: 12400, likes: 890, date: '2023-06-15' },
        { id: '2', title: 'Mountain Echoes', plays: 9800, likes: 756, date: '2023-06-10' },
        { id: '3', title: 'City Lights', plays: 7600, likes: 620, date: '2023-06-05' },
        { id: '4', title: 'Sunset Dreams', plays: 5400, likes: 420, date: '2023-06-01' }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-6 sm:py-8", children: [_jsx("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsxs("div", { className: "container mx-auto px-4 sm:px-8", children: [_jsxs("div", { className: "mb-6 sm:mb-8", children: [_jsx("h1", { className: "text-xl sm:text-2xl md:text-3xl font-bold text-white", children: "Creator Dashboard" }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base", children: "Monitor your music performance and analytics" })] }), _jsx("div", { className: "flex justify-end mb-6 sm:mb-8", children: _jsx("div", { className: "inline-flex rounded-lg bg-gray-800/50 p-1", children: ['7d', '30d', '90d', '1y'].map((range) => (_jsx("button", { type: "button", className: `px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${timeRange === range
                                    ? 'bg-primary text-white'
                                    : 'text-gray-400 hover:text-white'}`, onClick: () => setTimeRange(range), children: range }, range))) }) }), _jsx("div", { className: "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8", children: stats.map((stat, index) => (_jsx("div", { className: "card-bg rounded-2xl p-4 sm:p-6 transition-all duration-300 hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary/10", children: _jsxs("div", { className: "flex justify-between items-start", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-400 text-xs sm:text-sm mb-1", children: stat.title }), _jsx("p", { className: "text-xl sm:text-2xl font-bold text-white", children: stat.value }), _jsxs("p", { className: "text-xs sm:text-sm text-green-500 mt-1", children: [stat.change, " from last period"] })] }), _jsx("div", { className: `w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`, children: _jsxs("div", { className: "text-white", children: [stat.icon === 'play' && (_jsxs("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" }), _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })] })), stat.icon === 'heart' && (_jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4 4 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) })), stat.icon === 'users' && (_jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" }) })), stat.icon === 'currency' && (_jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" }) }))] }) })] }) }, index))) }), _jsx("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8", children: _jsxs("div", { className: "lg:col-span-2 card-bg rounded-2xl p-4 sm:p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4 sm:mb-6", children: [_jsx("h2", { className: "text-lg sm:text-xl font-bold text-white", children: "Performance Overview" }), _jsx("button", { className: "text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors", children: "View Report" })] }), _jsx("div", { className: "h-64 sm:h-80 flex items-center justify-center bg-gray-800/30 rounded-xl border border-gray-700/50", children: _jsxs("div", { className: "text-center", children: [_jsx("div", { className: "w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4", children: _jsx("svg", { className: "w-6 h-6 sm:w-8 sm:h-8 text-primary", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }) }) }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base", children: "Performance chart visualization" }), _jsx("p", { className: "text-xs sm:text-sm text-gray-500 mt-1", children: "Interactive analytics dashboard" })] }) })] }) }), _jsxs("div", { className: "card-bg rounded-2xl p-4 sm:p-6", children: [_jsxs("div", { className: "flex justify-between items-center mb-4 sm:mb-6", children: [_jsx("h2", { className: "text-lg sm:text-xl font-bold text-white", children: "Recent Tracks" }), _jsx("button", { className: "text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors", children: "View All" })] }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "text-left text-gray-500 text-xs sm:text-sm border-b border-gray-800", children: [_jsx("th", { className: "pb-3 font-normal", children: "Track" }), _jsx("th", { className: "pb-3 font-normal", children: "Plays" }), _jsx("th", { className: "pb-3 font-normal", children: "Likes" }), _jsx("th", { className: "pb-3 font-normal", children: "Date" }), _jsx("th", { className: "pb-3 font-normal text-right", children: "Actions" })] }) }), _jsx("tbody", { className: "divide-y divide-gray-800", children: recentTracks.map((track) => (_jsxs("tr", { className: "hover:bg-gray-800/30 transition-colors", children: [_jsx("td", { className: "py-3 sm:py-4", children: _jsx("div", { className: "font-medium text-white text-sm sm:text-base", children: track.title }) }), _jsx("td", { className: "py-3 sm:py-4 text-gray-400 text-sm", children: track.plays.toLocaleString() }), _jsx("td", { className: "py-3 sm:py-4 text-gray-400 text-sm", children: track.likes.toLocaleString() }), _jsx("td", { className: "py-3 sm:py-4 text-gray-400 text-sm", children: track.date }), _jsx("td", { className: "py-3 sm:py-4 text-right", children: _jsx("button", { className: "text-gray-500 hover:text-white transition-colors", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" }) }) }) })] }, track.id))) })] }) })] })] })] }));
}
