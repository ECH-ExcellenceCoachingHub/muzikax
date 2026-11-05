'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export default function PopularMixes() {
    // Mock data for mixes
    const mixTracks = [
        {
            id: '1',
            title: 'Rwandan Mixtape',
            artist: 'DJ Rwanda',
            plays: 18700,
            likes: 1420,
            coverImage: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '45:32',
            category: 'mixes'
        },
        {
            id: '2',
            title: 'Kigali Mix Session',
            artist: 'DJ Kigali',
            plays: 14500,
            likes: 1180,
            coverImage: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '32:15',
            category: 'mixes'
        },
        {
            id: '3',
            title: 'Afro Beats Mix',
            artist: 'Afro DJ',
            plays: 12400,
            likes: 950,
            coverImage: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '38:42',
            category: 'mixes'
        },
        {
            id: '4',
            title: 'Urban Mix Collection',
            artist: 'City Sounds',
            plays: 9800,
            likes: 760,
            coverImage: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '42:18',
            category: 'mixes'
        },
        {
            id: '5',
            title: 'Traditional Fusion Mix',
            artist: 'Culture Blend',
            plays: 8700,
            likes: 680,
            coverImage: 'https://images.unsplash.com/photo-1494293246127-b93bfbafe4f4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '35:27',
            category: 'mixes'
        },
        {
            id: '6',
            title: 'Nightlife Mix',
            artist: 'Club Sounds',
            plays: 11200,
            likes: 890,
            coverImage: 'https://images.unsplash.com/photo-1516280440080-0adbb0e4e070?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=500&q=80',
            duration: '40:05',
            category: 'mixes'
        }
    ];
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black", children: [_jsxs("div", { className: "relative py-8 sm:py-12 lg:py-16 overflow-hidden", children: [_jsxs("div", { className: "absolute inset-0", children: [_jsx("div", { className: "absolute inset-0 bg-cover bg-center", style: { backgroundImage: 'url(https://images.unsplash.com/photo-1470225620780-dba8ba36b745?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80)' } }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-900/80 to-gray-900/60" })] }), _jsx("div", { className: "absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-20 -right-20 w-64 h-64 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "container mx-auto px-4 sm:px-8 relative z-10", children: _jsxs("div", { className: "max-w-3xl mx-auto text-center", children: [_jsx("h1", { className: "text-3xl sm:text-4xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-light mb-3 sm:mb-4", children: "Popular Mixes" }), _jsx("p", { className: "text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-6 sm:mb-8", children: "Discover the best mixes from Rwandan DJs and music curators" })] }) })] }), _jsx("div", { className: "container mx-auto px-4 sm:px-8 py-8 sm:py-12", children: _jsx("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", children: mixTracks.map((track) => (_jsxs("div", { className: "group card-bg rounded-2xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary/10", children: [_jsxs("div", { className: "relative", children: [_jsx("img", { src: track.coverImage, alt: track.title, className: "w-full h-48 object-cover" }), _jsx("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center", children: _jsx("button", { className: "w-12 h-12 sm:w-14 sm:h-14 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: _jsx("svg", { className: "w-5 h-5 sm:w-6 sm:h-6", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }) }) }), _jsx("div", { className: "absolute top-2 right-2 sm:top-3 sm:right-3", children: _jsx("button", { className: "p-1.5 sm:p-2 rounded-full bg-black/30 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity", children: _jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) }) })] }), _jsxs("div", { className: "p-4 sm:p-5", children: [_jsx("h3", { className: "font-bold text-white text-lg mb-1 truncate", children: track.title }), _jsx("p", { className: "text-gray-400 text-sm sm:text-base mb-1 truncate", children: track.artist }), track.album && _jsx("p", { className: "text-gray-500 text-xs sm:text-sm mb-3 truncate", children: track.album }), _jsxs("div", { className: "flex justify-between text-xs sm:text-sm text-gray-500", children: [_jsxs("span", { children: [track.plays.toLocaleString(), " plays"] }), _jsxs("div", { className: "flex items-center gap-1", children: [_jsx("svg", { className: "w-3 h-3 sm:w-4 sm:h-4", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z", clipRule: "evenodd" }) }), _jsx("span", { children: track.likes })] })] })] })] }, track.id))) }) })] }));
}
