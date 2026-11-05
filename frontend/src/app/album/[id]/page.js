'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Link from 'next/link';
import { getAlbumById } from '../../../services/albumService';
import Script from 'next/script';
import AlbumDetailClient from '../../../components/AlbumDetailClient';
import { useState, useEffect } from 'react';
export default function AlbumDetailPage({ params }) {
    const albumId = params.id;
    const [album, setAlbum] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchAlbum = async () => {
            try {
                setLoading(true);
                const albumData = await getAlbumById(albumId);
                // Transform the album data to match our interface
                const transformedAlbum = {
                    _id: albumData._id || '',
                    id: albumData._id || albumData.id || albumId,
                    title: albumData.title,
                    artist: (albumData.creatorId && typeof albumData.creatorId === "object" && albumData.creatorId !== null)
                        ? albumData.creatorId.name
                        : "Unknown Artist",
                    coverImage: (albumData.coverURL || albumData.coverImage) || "",
                    coverURL: albumData.coverURL,
                    year: (albumData.releaseDate || albumData.createdAt) ? new Date(albumData.releaseDate || albumData.createdAt).getFullYear() : new Date().getFullYear(),
                    tracks: (Array.isArray(albumData.tracks) ? albumData.tracks : []).map((track) => {
                        const artist = (track.creatorId && typeof track.creatorId === "object" && track.creatorId !== null)
                            ? (track.creatorId.name || "Unknown Artist")
                            : (typeof track.creatorId === "string")
                                ? track.creatorId
                                : "Unknown Artist";
                        return {
                            _id: track._id || '',
                            id: track._id || track.id || '',
                            title: track.title,
                            artist: artist,
                            coverImage: (track.coverURL || track.coverImage) || "",
                            coverURL: track.coverURL,
                            duration: track.duration || "3:45", // Placeholder
                            audioUrl: track.audioURL,
                            audioURL: track.audioURL,
                            plays: track.plays || 0,
                            likes: track.likes || 0,
                            creatorId: track.creatorId || '',
                            type: track.type || 'song', // Include track type for WhatsApp functionality
                            creatorWhatsapp: (track.creatorId && typeof track.creatorId === 'object' && track.creatorId !== null)
                                ? track.creatorId.whatsappContact
                                : undefined // Include creator's WhatsApp contact
                        };
                    }),
                    description: albumData.description,
                    genre: albumData.genre,
                    creatorId: albumData.creatorId || '',
                    releaseDate: albumData.releaseDate,
                    createdAt: albumData.createdAt
                };
                setAlbum(transformedAlbum);
            }
            catch (err) {
                console.error('Error fetching album:', err);
                setError('Failed to load album. Please try again later.');
            }
            finally {
                setLoading(false);
            }
        };
        fetchAlbum();
    }, [albumId]);
    if (error) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12", children: _jsx("div", { className: "container mx-auto px-4 sm:px-8", children: _jsxs("div", { className: "max-w-7xl mx-auto text-center py-12", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "Error Loading Album" }), _jsx("p", { className: "text-gray-400", children: error })] }) }) }));
    }
    if (loading || !album) {
        return (_jsx("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12", children: _jsx("div", { className: "container mx-auto px-4 sm:px-8", children: _jsx("div", { className: "max-w-7xl mx-auto text-center py-12", children: _jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "Loading Album..." }) }) }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8 sm:py-12", children: [_jsx("div", { className: "absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10" }), _jsx("div", { className: "container mx-auto px-4 sm:px-8", children: _jsxs("div", { className: "max-w-7xl mx-auto", children: [_jsxs("a", { href: "/albums", className: "flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors", children: [_jsx("svg", { className: "w-5 h-5", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M15 19l-7-7 7-7" }) }), "Back"] }), _jsxs("div", { className: "flex flex-col md:flex-row gap-8 mb-12", children: [_jsx("div", { className: "md:w-1/3", children: _jsx("div", { className: "relative", children: (album.coverURL || album.coverImage) && (album.coverURL || album.coverImage).trim() !== '' ? (_jsx("img", { src: album.coverURL || album.coverImage, alt: album.title, className: "w-full rounded-2xl shadow-2xl" })) : (_jsx("div", { className: "w-full aspect-square bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center", children: _jsx("svg", { className: "w-24 h-24 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })) }) }), _jsx("div", { className: "md:w-2/3", children: _jsxs("div", { className: "flex flex-col justify-end h-full", children: [_jsx("p", { className: "text-primary-light text-sm uppercase tracking-wider mb-2", children: "Album" }), _jsx("h1", { className: "text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4", children: album.title }), _jsx("p", { className: "text-xl text-gray-300 mb-6", children: _jsx(Link, { href: `/artist/${album.artist}`, className: "hover:text-white transition-colors", children: album.artist }) }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-gray-400 mb-8", children: [_jsx("span", { children: album.year }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [album.tracks.length, " songs"] }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: album.genre })] }), _jsx(AlbumDetailClient, { album: album }), album.description && (_jsxs("div", { className: "mt-8", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: "About" }), _jsx("p", { className: "text-gray-400", children: album.description })] }))] }) })] })] }) }), _jsx(Script, { id: "album-structured-data", type: "application/ld+json", dangerouslySetInnerHTML: {
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'MusicAlbum',
                        name: album.title,
                        description: album.description || `Listen to ${album.title} by ${album.artist}`,
                        image: album.coverURL || album.coverImage || '/default-cover.jpg',
                        url: `https://www.muzikax.com/album/${album._id}`,
                        datePublished: album.releaseDate,
                        genre: album.genre,
                        byArtist: {
                            '@type': 'MusicGroup',
                            name: album.artist,
                        },
                        track: album.tracks.map(track => ({
                            '@type': 'MusicRecording',
                            name: track.title,
                            url: `https://www.muzikax.com/tracks/${track._id}`,
                            duration: track.duration ? `PT${track.duration}` : undefined,
                        })),
                        offers: {
                            '@type': 'Offer',
                            availability: 'https://schema.org/InStock',
                            price: album.price?.toString() || '0',
                            priceCurrency: album.currency || 'RWF',
                        },
                    }),
                } })] }));
}
