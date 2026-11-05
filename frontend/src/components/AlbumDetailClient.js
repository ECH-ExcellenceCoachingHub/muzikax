'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { useAudioPlayer } from '@/contexts/AudioPlayerContext';
import AddToQueueButton from './AddToQueueButton';
const AlbumDetailClient = ({ album }) => {
    const { playTrack, addAlbumToQueue } = useAudioPlayer();
    const [isPlayingAlbum, setIsPlayingAlbum] = useState(false);
    const handlePlayAlbum = () => {
        setIsPlayingAlbum(true);
        if (album.tracks.length > 0) {
            // Play the first track of the album
            const firstTrack = {
                id: album.tracks[0]._id || album.tracks[0].id,
                title: album.tracks[0].title,
                artist: typeof album.tracks[0].creatorId === 'object' && album.tracks[0].creatorId !== null
                    ? album.tracks[0].creatorId.name
                    : album.tracks[0].artist || 'Unknown Artist',
                coverImage: album.tracks[0].coverURL || album.tracks[0].coverImage || '',
                audioUrl: album.tracks[0].audioURL || album.tracks[0].audioUrl || '',
                duration: 0, // Duration is not available in ITrack interface
                creatorId: typeof album.tracks[0].creatorId === 'object' && album.tracks[0].creatorId !== null
                    ? album.tracks[0].creatorId._id
                    : album.tracks[0].creatorId,
                type: album.tracks[0].type || 'song',
                creatorWhatsapp: typeof album.tracks[0].creatorId === 'object' && album.tracks[0].creatorId !== null
                    ? album.tracks[0].creatorId.whatsappContact
                    : album.tracks[0].creatorWhatsapp
            };
            // Convert album tracks to the format expected by the audio player
            const convertedAlbumTracks = album.tracks.map(track => ({
                id: track._id || track.id,
                title: track.title,
                artist: typeof track.creatorId === 'object' && track.creatorId !== null
                    ? track.creatorId.name
                    : track.artist || 'Unknown Artist',
                coverImage: track.coverURL || track.coverImage || '',
                audioUrl: track.audioURL || track.audioUrl || '',
                duration: 0, // Duration is not available in ITrack interface
                creatorId: typeof track.creatorId === 'object' && track.creatorId !== null
                    ? track.creatorId._id
                    : track.creatorId,
                type: track.type || 'song',
                creatorWhatsapp: typeof track.creatorId === 'object' && track.creatorId !== null
                    ? track.creatorId.whatsappContact
                    : track.creatorWhatsapp
            }));
            playTrack(firstTrack, convertedAlbumTracks, {
                albumId: album._id || album.id,
                tracks: convertedAlbumTracks
            });
        }
    };
    const handleAddAlbumToQueue = () => {
        // Convert album tracks to the format expected by addAlbumToQueue
        const convertedTracks = album.tracks.map(track => ({
            id: track._id || track.id,
            title: track.title,
            artist: typeof track.creatorId === 'object' && track.creatorId !== null
                ? track.creatorId.name
                : track.artist || 'Unknown Artist',
            coverImage: track.coverURL || track.coverImage || '',
            audioUrl: track.audioURL || track.audioUrl || '',
            duration: 0, // Duration is not available in ITrack interface
            creatorId: typeof track.creatorId === 'object' && track.creatorId !== null
                ? track.creatorId._id
                : track.creatorId,
            type: track.type || 'song',
            creatorWhatsapp: typeof track.creatorId === 'object' && track.creatorId !== null
                ? track.creatorId.whatsappContact
                : track.creatorWhatsapp
        }));
        addAlbumToQueue(convertedTracks);
    };
    return (_jsxs(_Fragment, { children: [_jsxs("div", { className: "flex gap-4", children: [_jsxs("button", { className: "px-8 py-3 gradient-primary rounded-full text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2", onClick: handlePlayAlbum, children: [_jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }), isPlayingAlbum ? (_jsxs(_Fragment, { children: [_jsxs("svg", { className: "w-4 h-4 sm:w-5 sm:h-5 animate-spin", fill: "none", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), "Playing..."] })) : ('Play Album')] }), _jsxs("button", { className: "px-8 py-3 bg-gray-800 hover:bg-gray-700 rounded-full text-white font-medium transition-colors flex items-center gap-2", onClick: handleAddAlbumToQueue, children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M12 6v6m0 0v6m0-6h6m-6 0H6" }) }), "Add All to Queue"] })] }), _jsxs("div", { className: "card-bg rounded-2xl p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-6", children: "Tracks" }), _jsx("div", { className: "space-y-2", children: album.tracks.map((track, index) => (_jsxs("div", { className: "flex items-center gap-4 p-3 rounded-lg hover:bg-gray-800/50 transition-colors", children: [_jsx("div", { className: "w-12 h-12 flex-shrink-0", children: (track.coverURL || track.coverImage) && (track.coverURL || track.coverImage).trim() !== '' ? (_jsx("img", { src: track.coverURL || track.coverImage, alt: track.title, className: "w-full h-full rounded object-cover" })) : (_jsx("div", { className: "w-full h-full bg-gradient-to-br from-primary to-primary-light rounded flex items-center justify-center", children: _jsx("svg", { className: "w-4 h-4 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })) }), _jsx("div", { className: "w-8 text-center text-gray-500", children: _jsx("span", { className: "text-sm", children: index + 1 }) }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsx("h3", { className: "font-medium text-white truncate", children: track.title }), _jsx("p", { className: "text-sm text-gray-400 truncate", children: typeof track.creatorId === 'object' && track.creatorId !== null
                                                ? track.creatorId.name
                                                : typeof track.creatorId === 'string'
                                                    ? track.creatorId
                                                    : 'Unknown Artist' })] }), _jsxs("div", { className: "flex items-center gap-4", children: [_jsxs("div", { className: "flex items-center gap-1 text-gray-500", children: [_jsxs("svg", { className: "w-4 h-4", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: [_jsx("path", { d: "M10 12a2 2 0 100-4 2 2 0 000 4z" }), _jsx("path", { fillRule: "evenodd", d: "M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z", clipRule: "evenodd" })] }), _jsx("span", { className: "text-xs", children: track.plays })] }), _jsx(AddToQueueButton, { track: {
                                                id: track._id || track.id,
                                                title: track.title,
                                                artist: typeof track.creatorId === 'object' && track.creatorId !== null
                                                    ? track.creatorId.name
                                                    : track.artist || 'Unknown Artist',
                                                coverImage: track.coverURL || track.coverImage || '',
                                                audioUrl: track.audioURL || track.audioUrl || '',
                                                duration: 0, // Duration is not available in ITrack interface
                                                creatorId: typeof track.creatorId === 'object' && track.creatorId !== null
                                                    ? track.creatorId._id
                                                    : track.creatorId,
                                                type: track.type || 'song',
                                                creatorWhatsapp: typeof track.creatorId === 'object' && track.creatorId !== null
                                                    ? track.creatorId.whatsappContact
                                                    : track.creatorWhatsapp
                                            }, size: "sm", variant: "secondary" }), _jsx("button", { className: "text-gray-500 hover:text-white", children: _jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" }) }) })] })] }, track._id || track.id))) })] })] }));
};
export default AlbumDetailClient;
