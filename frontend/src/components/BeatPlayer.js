'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
const BeatPlayer = ({ className = '' }) => {
    const { currentTrack, isPlaying, isMinimized, togglePlayPause, closePlayer, progress, duration, setProgress, volume, setVolume, playbackRate, setPlaybackRate, downloadTrack, favorites, addToFavorites, removeFromFavorites } = useAudioPlayer();
    const router = useRouter();
    const progressRef = useRef(null);
    const [isFavorite, setIsFavorite] = useState(false);
    const [showVolumeSlider, setShowVolumeSlider] = useState(false);
    // Check if current track is a beat
    const isBeat = (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.type) === 'beat' ||
        ((currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.title) && currentTrack.title.toLowerCase().includes('beat'));
    // Check if current track is in favorites
    useEffect(() => {
        if (currentTrack) {
            setIsFavorite(favorites.some(track => track.id === currentTrack.id));
        }
    }, [currentTrack, favorites]);
    // Format time in MM:SS
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };
    // Handle progress bar click
    const handleProgressClick = (e) => {
        if (!progressRef.current || !currentTrack || !duration)
            return;
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const newProgress = percent * duration;
        setProgress(newProgress);
    };
    // Toggle favorite status
    const toggleFavorite = () => {
        if (!currentTrack)
            return;
        if (isFavorite) {
            removeFromFavorites(currentTrack.id);
        }
        else {
            addToFavorites(currentTrack);
        }
    };
    // Handle volume change
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
    };
    // Don't render if there's no current track or if it's not a beat
    if (!currentTrack || !isBeat)
        return null;
    return (_jsxs("div", { className: `fixed bottom-4 right-4 w-[380px] rounded-2xl bg-gradient-to-br from-gray-900 to-black backdrop-blur-xl border border-primary/30 shadow-2xl shadow-primary/20 z-50 animate-[fadeInUp_0.3s_ease-out] ${className}`, children: [_jsx("div", { className: "px-4 py-3 border-b border-gray-800/50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0 flex-1", children: [_jsxs("div", { className: "relative flex-shrink-0", children: [_jsx("div", { className: "absolute -inset-1 bg-primary rounded-lg blur opacity-30 animate-pulse" }), _jsx("img", { src: currentTrack.coverImage, alt: currentTrack.title, className: `w-12 h-12 rounded-lg object-cover relative z-10 transition-transform duration-300 ${isPlaying ? 'scale-105' : ''}` })] }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("h4", { className: "text-white font-bold text-sm truncate max-w-[160px]", children: currentTrack.title }), _jsx("p", { className: "text-primary-light text-xs truncate max-w-[140px]", children: currentTrack.artist }), _jsxs("div", { className: "flex items-center gap-1 mt-1", children: [_jsx("span", { className: "text-primary text-xs font-medium whitespace-nowrap", children: "BEAT" }), currentTrack.paymentType === 'paid' ? (_jsx("span", { className: "text-green-400 text-xs whitespace-nowrap", children: "\u2022 PAID" })) : (_jsx("span", { className: "text-blue-400 text-xs whitespace-nowrap", children: "\u2022 FREE" }))] })] })] }), _jsx("button", { onClick: closePlayer, className: "text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M6 18L18 6M6 6l12 12" }) }) })] }) }), _jsxs("div", { className: "px-4 py-3", children: [_jsx("div", { ref: progressRef, onClick: handleProgressClick, className: "h-1.5 w-full bg-gray-800 rounded-full cursor-pointer group", children: _jsx("div", { className: "h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all group-hover:h-2", style: { width: `${(progress / duration) * 100 || 0}%` } }) }), _jsxs("div", { className: "flex justify-between text-xs text-gray-400 mt-1", children: [_jsx("span", { children: formatTime(progress) }), _jsx("span", { children: formatTime(duration) })] })] }), _jsxs("div", { className: "px-4 py-3", children: [_jsxs("div", { className: "flex items-center justify-center gap-4 mb-4", children: [_jsx("button", { className: "text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z", clipRule: "evenodd" }) }) }), _jsx("button", { onClick: togglePlayPause, className: "w-12 h-12 rounded-full bg-gradient-to-r from-primary to-primary-light flex items-center justify-center text-white hover:scale-105 transition-transform shadow-lg", children: isPlaying ? (_jsx("svg", { className: "w-6 h-6", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-6 h-6 ml-1", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })) }), _jsx("button", { className: "text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z", clipRule: "evenodd" }) }) })] }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("button", { onClick: toggleFavorite, className: `flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${isFavorite
                                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                                    : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'}`, children: [_jsx("svg", { className: "w-4 h-4", fill: isFavorite ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }), _jsx("span", { className: "text-xs font-medium", children: "Save" })] }), _jsx("button", { onClick: downloadTrack, className: `flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${currentTrack.paymentType === 'paid'
                                    ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                                    : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'}`, children: currentTrack.paymentType === 'paid' ? (_jsxs(_Fragment, { children: [_jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" }) }), _jsx("span", { className: "text-xs font-medium", children: "WhatsApp" })] })) : (_jsxs(_Fragment, { children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }) }), _jsx("span", { className: "text-xs font-medium", children: "Download" })] })) })] })] }), _jsx("div", { className: "px-4 py-2 border-t border-gray-800/50", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-gray-400 text-xs", children: "Speed:" }), _jsxs("select", { value: playbackRate, onChange: (e) => setPlaybackRate(parseFloat(e.target.value)), className: "bg-gray-800/50 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary", children: [_jsx("option", { value: "0.5", children: "0.5x" }), _jsx("option", { value: "0.75", children: "0.75x" }), _jsx("option", { value: "1", children: "1x" }), _jsx("option", { value: "1.25", children: "1.25x" }), _jsx("option", { value: "1.5", children: "1.5x" }), _jsx("option", { value: "2", children: "2x" })] })] }), _jsxs("div", { className: "relative", children: [_jsx("button", { onClick: () => setShowVolumeSlider(!showVolumeSlider), className: "text-gray-400 hover:text-white transition-colors", children: _jsx("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", children: _jsx("path", { fillRule: "evenodd", d: "M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z", clipRule: "evenodd" }) }) }), showVolumeSlider && (_jsx("div", { className: "absolute bottom-6 right-0 bg-gray-900/90 backdrop-blur-lg rounded-lg p-2 border border-gray-700", children: _jsx("input", { type: "range", min: "0", max: "1", step: "0.01", value: volume, onChange: handleVolumeChange, className: "w-20 accent-primary" }) }))] })] }) })] }));
};
export default BeatPlayer;
