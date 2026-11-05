import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { fetchTrackById, fetchTracksByCreatorPublic } from '../../../services/trackService';
import Script from 'next/script';
import TrackDetailClient from './TrackDetailClient';
import TrackCard from '../../../components/TrackCard';

interface Track {
  _id: string;
  id: string;
  title: string;
  artist: string;
  album?: string;
  plays: number;
  likes: number;
  coverImage: string;
  coverURL?: string;
  audioURL: string;
  duration?: string;
  genre?: string;
  type?: 'song' | 'beat' | 'mix';
  releaseDate?: string;
  createdAt?: string;
  description?: string;
  paymentType?: 'free' | 'paid';
  price?: number;
  currency?: string;
  creatorId: {
    _id: string;
    name: string;
    avatar?: string;
    whatsappContact?: string;
  };
}

// Generate metadata for SEO
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
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
    const track: Track = {
      ...fetchedTrack,
      id: fetchedTrack._id,
      artist: typeof fetchedTrack.creatorId === 'object' && fetchedTrack.creatorId !== null
        ? (fetchedTrack.creatorId as any).name
        : 'Unknown Artist',
      coverImage: fetchedTrack.coverURL || '',
      creatorId: typeof fetchedTrack.creatorId === 'object' && fetchedTrack.creatorId !== null
        ? fetchedTrack.creatorId as any
        : { _id: '', name: 'Unknown Artist' },
    };
    
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
  } catch (error) {
    console.error('Error fetching track for metadata:', error);
    return {
      title: 'Track Not Found | MuzikaX',
      description: 'The requested track could not be found.',
    };
  }
}

export default async function TrackDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const trackId = resolvedParams.id;
  
  // Validate that we have a proper track ID
  if (!trackId || trackId === "undefined") {
    console.error("Invalid track ID:", trackId);
    notFound();
  }
  
  let track: Track;
  let artistTracks: any[] = [];
  
  try {
    const fetchedTrack = await fetchTrackById(trackId);
    // Map the ITrack type to the Track interface used in this component
    track = {
      ...fetchedTrack,
      id: fetchedTrack._id,
      artist: typeof fetchedTrack.creatorId === 'object' && fetchedTrack.creatorId !== null
        ? (fetchedTrack.creatorId as any).name
        : 'Unknown Artist',
      coverImage: fetchedTrack.coverURL || '',
      creatorId: typeof fetchedTrack.creatorId === 'object' && fetchedTrack.creatorId !== null
        ? fetchedTrack.creatorId as any
        : { _id: '', name: 'Unknown Artist' },
    };

    // Fetch other tracks by the same creator
    if (track.creatorId?._id) {
      const allArtistTracks = await fetchTracksByCreatorPublic(track.creatorId._id);
      // Filter out the current track and limit to 6
      artistTracks = allArtistTracks
        .filter((t: any) => (t._id || t.id) !== trackId)
        .slice(0, 6);
    }
  } catch (error) {
    console.error('Error fetching track data:', error);
    notFound();
  }

  const formattedDate = track.releaseDate 
    ? new Date(track.releaseDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : track.createdAt 
      ? new Date(track.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'N/A';

  return (
    <div className="min-h-screen py-8 pt-14 md:pt-8 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Track Detail Client (Header + Playback) */}
          <TrackDetailClient track={track} />

          {/* More from Artist Section */}
          {artistTracks.length > 0 && (
            <div className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-text-primary">More from {track.artist}</h2>
              </div>
              <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
                {artistTracks.map((t: any) => (
                  <TrackCard 
                    key={t._id || t.id}
                    track={{
                      id: t._id || t.id,
                      title: t.title,
                      artist: track.artist,
                      coverImage: t.coverURL || t.coverImage || '',
                      plays: t.plays,
                      likes: t.likes,
                      duration: t.duration,
                      type: t.type,
                      paymentType: t.paymentType,
                      price: t.price
                    }}
                    fullTrackData={t}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Additional track info */}
          <div className="card-bg rounded-2xl p-6 border border-gray-800/50">
            <h2 className="text-2xl font-bold mb-6 text-text-primary">Track Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-400">
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500">Artist</span>
                  <span className="text-white font-medium">{track.creatorId?.name || track.artist}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500">Plays</span>
                  <span className="text-white font-medium">{track.plays?.toLocaleString() || '0'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500">Likes</span>
                  <span className="text-white font-medium">{track.likes?.toLocaleString() || '0'}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500">Genre</span>
                  <span className="text-white font-medium">{track.genre || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500">Duration</span>
                  <span className="text-white font-medium">{track.duration || 'N/A'}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-800/50">
                  <span className="text-gray-500">Release Date</span>
                  <span className="text-white font-medium">{formattedDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* JSON-LD Structured Data for SEO */}
      <Script
        id="track-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
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
        }}
      />
    </div>
  );
}
