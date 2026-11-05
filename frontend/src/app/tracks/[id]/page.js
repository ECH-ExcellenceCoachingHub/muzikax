import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { notFound } from 'next/navigation';
import { fetchTrackById } from '../../../services/trackService';
import Script from 'next/script';
// Generate metadata for SEO
export async function generateMetadata({ params }) {
    const resolvedParams = await params;
    const trackId = resolvedParams.id;
    // Validate that we have a proper track ID
    if (!trackId || trackId === "undefined") {
        console.error("Invalid track ID for metadata generation:", trackId);
        return {
            title: "Track Not Found | MuzikaX",
            description: "The requested track could not be found."
        };
    }
    try {
        const fetchedTrack = await fetchTrackById(trackId);
        // Map the ITrack type to the Track interface used in this component
        const track = Object.assign(Object.assign({}, fetchedTrack), { id: fetchedTrack._id, artist: typeof fetchedTrack.creatorId === 'object' && fetchedTrack.creatorId !== null
                ? fetchedTrack.creatorId.name
                : 'Unknown Artist', coverImage: fetchedTrack.coverURL || '', creatorId: typeof fetchedTrack.creatorId === 'object' && fetchedTrack.creatorId !== null
                ? fetchedTrack.creatorId
                : { _id: '', name: 'Unknown Artist' } });
        return {
            metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
            title: `${track.title} by ${track.artist} | MuzikaX - Rwanda's Digital Music Ecosystem`,
            description: track.description || `Listen to ${track.title} by ${track.artist} on MuzikaX - Rwanda's premier music platform.`,
            keywords: [
                track.title,
                track.artist,
                track.genre || '',
                'Rwandan music',
                'Afrobeats',
                'African music',
                'Music streaming'
            ].filter(Boolean),
            openGraph: {
                title: `${track.title} by ${track.artist}`,
                description: track.description || `Listen to ${track.title} by ${track.artist}`,
                type: 'music.song',
                url: `/tracks/${track._id}`,
                images: [
                    {
                        url: track.coverURL || track.coverImage || '/default-cover.jpg',
                        width: 1200,
                        height: 630,
                        alt: `${track.title} cover art`,
                    },
                ],
                siteName: 'MuzikaX',
                locale: 'en_US',
                determiner: 'the',
            },
            twitter: {
                card: 'summary_large_image',
                title: `${track.title} by ${track.artist}`,
                description: track.description || `Listen to ${track.title} by ${track.artist}`,
                images: [track.coverURL || track.coverImage || '/default-cover.jpg'],
            },
            alternates: {
                canonical: `/tracks/${track._id}`,
            },
            robots: {
                index: true,
                follow: true,
                googleBot: {
                    index: true,
                    follow: true,
                    'max-video-preview': -1,
                    'max-image-preview': 'large',
                    'max-snippet': -1,
                },
            },
        };
    }
    catch (error) {
        console.error('Error fetching track for metadata:', error);
        return {
            title: 'Track Not Found | MuzikaX',
            description: 'The requested track could not be found.',
        };
    }
}
export default async function TrackDetailPage({ params }) {
    var _a, _b, _c, _d, _e;
    const resolvedParams = await params;
    const trackId = resolvedParams.id;
    // Validate that we have a proper track ID
    if (!trackId || trackId === "undefined") {
        console.error("Invalid track ID:", trackId);
        notFound();
    }
    let track;
    try {
        const fetchedTrack = await fetchTrackById(trackId);
        // Map the ITrack type to the Track interface used in this component
        track = Object.assign(Object.assign({}, fetchedTrack), { id: fetchedTrack._id, artist: typeof fetchedTrack.creatorId === 'object' && fetchedTrack.creatorId !== null
                ? fetchedTrack.creatorId.name
                : 'Unknown Artist', coverImage: fetchedTrack.coverURL || '', creatorId: typeof fetchedTrack.creatorId === 'object' && fetchedTrack.creatorId !== null
                ? fetchedTrack.creatorId
                : { _id: '', name: 'Unknown Artist' } });
    }
    catch (error) {
        console.error('Error fetching track:', error);
        notFound();
    }
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black py-8", children: [_jsx("div", { className: "container mx-auto px-4", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "flex flex-col md:flex-row gap-8 mb-12", children: [_jsx("div", { className: "md:w-1/3", children: _jsx("div", { className: "relative", children: track.coverURL || track.coverImage ? (_jsx("img", { src: track.coverURL || track.coverImage, alt: `${track.title} cover`, className: "w-full rounded-2xl shadow-2xl" })) : (_jsx("div", { className: "w-full aspect-square bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center", children: _jsx("svg", { className: "w-24 h-24 text-white", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { d: "M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" }) }) })) }) }), _jsx("div", { className: "md:w-2/3", children: _jsxs("div", { className: "flex flex-col justify-end h-full", children: [_jsx("p", { className: "text-primary-light text-sm uppercase tracking-wider mb-2", children: track.genre || 'Song' }), _jsx("h1", { className: "text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4", children: track.title }), _jsx("p", { className: "text-xl text-gray-300 mb-6", children: track.artist }), _jsxs("div", { className: "flex flex-wrap items-center gap-4 text-gray-400 mb-8", children: [_jsxs("span", { children: [((_a = track.plays) === null || _a === void 0 ? void 0 : _a.toLocaleString()) || '0', " plays"] }), _jsx("span", { children: "\u2022" }), _jsxs("span", { children: [((_b = track.likes) === null || _b === void 0 ? void 0 : _b.toLocaleString()) || '0', " likes"] }), _jsx("span", { children: "\u2022" }), _jsx("span", { children: track.duration || 'N/A' })] }), _jsx("div", { className: "flex gap-4", children: _jsxs("button", { className: "px-8 py-3 gradient-primary rounded-full text-white font-medium hover:opacity-90 transition-opacity flex items-center gap-2", children: [_jsx("svg", { className: "w-5 h-5", fill: "currentColor", viewBox: "0 0 20 20", xmlns: "http://www.w3.org/2000/svg", children: _jsx("path", { fillRule: "evenodd", d: "M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z", clipRule: "evenodd" }) }), "Play Track"] }) }), track.description && (_jsxs("div", { className: "mt-8", children: [_jsx("h3", { className: "text-lg font-semibold text-white mb-2", children: "About" }), _jsx("p", { className: "text-gray-400", children: track.description })] }))] }) })] }), _jsxs("div", { className: "card-bg rounded-2xl p-6", children: [_jsx("h2", { className: "text-2xl font-bold text-white mb-4", children: "Track Details" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-400", children: [_jsxs("div", { children: [_jsxs("p", { children: [_jsx("span", { className: "text-white", children: "Artist:" }), " ", ((_c = track.creatorId) === null || _c === void 0 ? void 0 : _c.name) || track.artist] }), _jsxs("p", { children: [_jsx("span", { className: "text-white", children: "Plays:" }), " ", ((_d = track.plays) === null || _d === void 0 ? void 0 : _d.toLocaleString()) || '0'] }), _jsxs("p", { children: [_jsx("span", { className: "text-white", children: "Likes:" }), " ", ((_e = track.likes) === null || _e === void 0 ? void 0 : _e.toLocaleString()) || '0'] })] }), _jsxs("div", { children: [_jsxs("p", { children: [_jsx("span", { className: "text-white", children: "Genre:" }), " ", track.genre || 'N/A'] }), _jsxs("p", { children: [_jsx("span", { className: "text-white", children: "Duration:" }), " ", track.duration || 'N/A'] }), _jsxs("p", { children: [_jsx("span", { className: "text-white", children: "Release Date:" }), " ", track.releaseDate || 'N/A'] })] })] })] })] }) }), _jsx(Script, { id: "track-structured-data", type: "application/ld+json", dangerouslySetInnerHTML: {
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'MusicRecording',
                        name: track.title,
                        description: track.description || `Listen to ${track.title} by ${track.artist}`,
                        image: track.coverURL || track.coverImage || '/default-cover.jpg',
                        url: `https://www.muzikax.com/tracks/${track._id}`,
                        datePublished: track.releaseDate,
                        duration: track.duration ? `PT${track.duration}` : undefined,
                        genre: track.genre,
                        track: {
                            '@type': 'MusicRecording',
                            name: track.title,
                            url: `https://www.muzikax.com/tracks/${track._id}`,
                        },
                        byArtist: {
                            '@type': 'MusicGroup',
                            name: track.artist,
                        },
                        album: track.album ? {
                            '@type': 'MusicAlbum',
                            name: track.album,
                        } : undefined,
                        offers: {
                            '@type': 'Offer',
                            availability: 'https://schema.org/InStock',
                            price: track.price?.toString() || '0',
                            priceCurrency: track.currency || 'RWF',
                        },
                    }),
                } })] }));
}
