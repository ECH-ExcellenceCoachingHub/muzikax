import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAudioPlayer } from '../contexts/AudioPlayerContext';
import AddToQueueButton from './AddToQueueButton';

export default function TrackCard({ track, fullTrackData, showPlayButton = true, showLikeButton = true, showAddToQueueButton = true }) {
    var _a;
    const { currentTrack, isPlaying, playTrack, setCurrentPlaylist, favorites, addToFavorites, removeFromFavorites } = useAudioPlayer();
    
    const handlePlay = () => {
        const audioUrl = (fullTrackData === null || fullTrackData === void 0 ? void 0 : fullTrackData.audioURL) || (fullTrackData === null || fullTrackData === void 0 ? void 0 : fullTrackData.audioUrl) || track.audioUrl;
        if (audioUrl) {
            playTrack({
                id: track.id,
                title: track.title,
                artist: track.artist,
                coverImage: track.coverImage,
                audioUrl: audioUrl,
                creatorId: typeof (fullTrackData === null || fullTrackData === void 0 ? void 0 : fullTrackData.creatorId) === 'object' && fullTrackData.creatorId !== null
                    ? fullTrackData.creatorId._id
                    : (fullTrackData === null || fullTrackData === void 0 ? void 0 : fullTrackData.creatorId) || track.creatorId,
                type: (fullTrackData === null || fullTrackData === void 0 ? void 0 : fullTrackData.type) || track.type,
                paymentType: (fullTrackData === null || fullTrackData === void 0 ? void 0 : fullTrackData.paymentType) || track.paymentType,
                price: (fullTrackData === null || fullTrackData === void 0 ? void 0 : fullTrackData.price) || track.price,
                creatorWhatsapp: (typeof (fullTrackData === null || fullTrackData === void 0 ? void 0 : fullTrackData.creatorId) === 'object' && fullTrackData.creatorId !== null
                    ? fullTrackData.creatorId.whatsappContact
                    : undefined) || track.creatorWhatsapp
            });
            const playlistTracks = [fullTrackData || track].filter((t) => t.audioURL || t.audioUrl).map((t) => ({
                id: t._id || t.id,
                title: t.title,
                artist: typeof t.creatorId === "object" && t.creatorId !== null
                    ? t.creatorId.name
                    : t.artist || "Unknown Artist",
                coverImage: t.coverURL || t.coverImage || '',
                audioUrl: t.audioURL || t.audioUrl,
                creatorId: typeof t.creatorId === 'object' && t.creatorId !== null
                    ? t.creatorId._id
                    : t.creatorId,
                type: t.type,
                paymentType: t.paymentType,
                price: t.price,
                creatorWhatsapp: (typeof t.creatorId === 'object' && t.creatorId !== null
                    ? t.creatorId.whatsappContact
                    : undefined) || t.creatorWhatsapp
            }));
            setCurrentPlaylist(playlistTracks);
        }
    };

    const toggleFavorite = () => {
        const isFavorite = favorites.some(fav => fav.id === track.id);
        if (isFavorite) {
            removeFromFavorites(track.id);
        }
        else {
            addToFavorites({
                id: track.id,
                title: track.title,
                artist: track.artist,
                coverImage: track.coverImage || '',
                audioUrl: track.audioUrl || '',
                creatorId: track.creatorId,
                type: track.type,
                creatorWhatsapp: track.creatorWhatsapp
            });
        }
    };

    const isFavorite = favorites.some(fav => fav.id === track.id);

    return (_jsxs("div", { className: "flex-shrink-0 w-40 sm:w-44 md:w-44 lg:w-48 group card-bg rounded-xl overflow-hidden transition-all duration-300 hover:border-primary/50 hover:bg-gradient-to-br hover:from-gray-900/70 hover:to-gray-900/50 hover:shadow-xl hover:shadow-primary/10", children: [_jsxs("div", { className: "relative", children: [
        track.coverImage && track.coverImage.trim() !== '' ? (_jsx("img", { src: track.coverImage, alt: track.title, className: "w-full aspect-square object-cover" })) : (_jsx("div", { className: "w-full aspect-square bg-gradient-to-br from-primary to-primary-light flex items-center justify-center", children: _jsx("svg", { className: "w-8 h-8 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })),
        track.type === 'beat' && (_jsxs("div", { className: "absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none", children: [
            _jsx("span", { className: "px-1.5 py-0.5 bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded shadow-lg", children: "BEAT" }),
            _jsx("span", { className: `px-1.5 py-0.5 ${track.paymentType === 'paid' ? 'bg-green-600/90' : 'bg-blue-600/90'} backdrop-blur-sm text-white text-[10px] font-bold rounded shadow-lg`, children: track.paymentType === 'paid' ? 'PAID' : 'FREE' })
        ] })),
        track.type === 'beat' && track.paymentType === 'paid' && track.price && (_jsx("div", { className: "absolute top-2 right-2 z-10 pointer-events-none", children: _jsxs("span", { className: "px-1.5 py-0.5 bg-yellow-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded shadow-lg", children: [track.price.toLocaleString(), " RWF"] }) })),
        showPlayButton && (_jsxs("div", { className: "absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2", children: [_jsx("button", { onClick: handlePlay, className: "w-10 h-10 sm:w-12 sm:h-12 rounded-full gradient-primary flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300", children: (currentTrack === null || currentTrack === void 0 ? void 0 : currentTrack.id) === track.id && isPlaying ? (_jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z", clipRule: "evenodd" }) })) : (_jsx("svg", { className: "w-4 h-4 sm:w-5 sm:h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) })) }), _jsx("button", { onClick: (e) => {
                                    e.stopPropagation();
                                    toggleFavorite();
                                }, className: "w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 hover:scale-110", children: _jsx("svg", { className: `w-4 h-4 sm:w-5 sm:h-5 transition-all duration-200 ${isFavorite ? 'text-red-500 fill-current scale-110' : 'stroke-current'}`, fill: isFavorite ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }) }), showAddToQueueButton && (_jsx(AddToQueueButton, { track: {
                                    id: track.id,
                                    title: track.title,
                                    artist: track.artist,
                                    coverImage: track.coverImage || '',
                                    audioUrl: track.audioUrl || '',
                                    duration: track.duration ? (track.duration.includes(':') ?
                                        (() => {
                                            const [mins, secs] = track.duration.split(':').map(Number);
                                            return mins * 60 + secs;
                                        })() : Number(track.duration)) : undefined,
                                    creatorId: track.creatorId,
                                    type: track.type,
                                    creatorWhatsapp: track.creatorWhatsapp
                                }, size: "sm", variant: "secondary", className: "opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75" }))] }))] }), _jsxs("div", { className: "p-3", children: [
        _jsxs("div", { className: "mb-1", children: [
            _jsx("h3", { className: "font-bold text-white text-sm sm:text-base truncate", children: track.title }),
            _jsx("p", { className: "text-gray-400 text-xs sm:text-sm truncate", children: track.artist })
        ] }),
        track.type === 'beat' && (_jsx("div", { className: "mt-2 h-8", children: track.paymentType === 'paid' ? (_jsxs("button", { onClick: (e) => {
                                e.stopPropagation();
                                const price = track.price;
                                if (!price || price <= 0) {
                                    alert('Price not available');
                                    return;
                                }
                                const message = `Hi, I'm interested in your beat "${track.title}" (RWF ${price.toLocaleString()}) that I found on MuzikaX.`;
                                window.open(`https://wa.me/${track.creatorWhatsapp}?text=${encodeURIComponent(message)}`, '_blank');
                            }, className: "w-full h-full btn-primary text-white rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200", children: [_jsx("svg", { className: "w-3 h-3", fill: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { d: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" }) }), "BUY NOW"] })) : (_jsxs("button", { onClick: (e) => {
                                e.stopPropagation();
                                if (track.audioUrl) {
                                    const link = document.createElement('a');
                                    link.href = track.audioUrl;
                                    link.download = `${track.title}.mp3`;
                                    link.target = '_blank';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                }
                                else {
                                    alert('Download link not available');
                                }
                            }, className: "w-full h-full bg-blue-600/20 hover:bg-blue-600/40 text-blue-400 border border-blue-600/30 rounded-lg text-[10px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all duration-200", children: [_jsx("svg", { className: "w-3 h-3", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap="round" strokeLinejoin="round" strokeWidth="2", d: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" }) }), "FREE DOWNLOAD"] })) })),
        track.type !== 'beat' && _jsx("div", { className: "mt-2 h-8 hidden sm:block" }),
        _jsxs("div", { className: "flex justify-between items-center text-[10px] sm:text-xs text-gray-500 mt-2 pt-2 border-t border-gray-800/50", children: [
            _jsxs("span", { className: "flex items-center gap-1", children: [
                _jsxs("svg", { className: "w-3 h-3 opacity-70", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: [
                    _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" }),
                    _jsx("path", { strokeLinecap: "round", strokeLinejoin="round", strokeWidth: "2", d: "M21 12a9 9 0 11-18 0 9 9 0 0118 0z" })
                ] }),
                ((_a = track.plays) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || '0'
            ] }),
            _jsx("div", { className: "flex items-center gap-2", children: _jsxs("span", { className: "flex items-center gap-1", children: [
                    _jsx("svg", { className: `w-3 h-3 ${isFavorite ? 'text-red-500 fill-current' : 'opacity-70'}`, fill: isFavorite ? "currentColor" : "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" }) }),
                    track.likes || 0
                ] }) })
        ] })
    ] })] }));
}
