'use client';

import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getAlbumById } from '../../../services/albumService';
import Script from 'next/script';
import AlbumDetailClient from '../../../components/AlbumDetailClient';
import { useState, useEffect } from 'react';

interface Creator {
  _id: string;
  name: string;
  avatar?: string;
}

interface AlbumTrack {
  _id: string;
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  coverURL?: string;
  duration?: string;
  audioUrl: string;
  audioURL: string;
  plays: number;
  likes: number;
  creatorId: string | Creator;
  type?: 'song' | 'beat' | 'mix'; // Add track type for WhatsApp functionality
  creatorWhatsapp?: string; // Add creator's WhatsApp contact
}

interface Album {
  _id: string;
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  coverURL?: string;
  year: number;
  tracks: AlbumTrack[];
  description?: string;
  genre?: string;
  creatorId: string | Creator;
  releaseDate?: string;
  createdAt: string;
  price?: number;
  currency?: string;
}

export default function AlbumDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [album, setAlbum] = useState<Album | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Unwrap the params Promise
  useEffect(() => {
    const unwrapParams = async () => {
      const { id } = await params;
      console.log('Album ID from params:', id);
      setAlbumId(id);
    };
    unwrapParams();
  }, [params]);
  
  useEffect(() => {
    const fetchAlbum = async () => {
      if (!albumId) return; // Wait for albumId to be set
      
      try {
        console.log('Fetching album with ID:', albumId);
        setLoading(true);
        const albumData: any = await getAlbumById(albumId);
        
        // Transform the album data to match our interface
        const transformedAlbum: Album = {
          _id: albumData._id || '',
          id: albumData._id || albumData.id || albumId,
          title: albumData.title,
          artist: (albumData.creatorId && typeof albumData.creatorId === "object" && albumData.creatorId !== null) 
            ? albumData.creatorId.name 
            : "Unknown Artist",
          coverImage: (albumData.coverURL || albumData.coverImage) || "",
          coverURL: albumData.coverURL,
          year: (albumData.releaseDate || albumData.createdAt) ? new Date(albumData.releaseDate || albumData.createdAt).getFullYear() : new Date().getFullYear(),
          tracks: (Array.isArray(albumData.tracks) ? albumData.tracks : []).map((track: any) => {
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
      } catch (err) {
        console.error('Error fetching album:', err);
        setError('Failed to load album. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAlbum();
  }, [albumId]);
  
  if (error) {
    return (
      <div className="min-h-screen py-8 sm:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="max-w-7xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Error Loading Album</h2>
            <p className="text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (loading || !album || !albumId) {
    return (
      <div className="min-h-screen py-8 sm:py-12 bg-background">
        <div className="container mx-auto px-4 sm:px-8">
          <div className="max-w-7xl mx-auto text-center py-12">
            <h2 className="text-2xl font-bold mb-4 text-text-primary">Loading Album...</h2>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-8 sm:py-12 overflow-hidden relative bg-background">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary-light/10 rounded-full blur-3xl -z-10"></div>
      
      <div className="container mx-auto px-4 sm:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <a 
            href="/albums"
            className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back
          </a>

          {/* Album Header */}
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8 mb-12">
            <div className="w-64 sm:w-80 md:w-1/3">
              <div className="relative aspect-square">
                {(album.coverURL || album.coverImage) && (album.coverURL || album.coverImage).trim() !== '' ? (
                  <img 
                    src={album.coverURL || album.coverImage} 
                    alt={album.title} 
                    className="w-full h-full object-cover rounded-2xl shadow-2xl"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary to-primary-light rounded-2xl flex items-center justify-center">
                    <svg className="w-24 h-24 text-white" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 3a1 1 0 00-1.196-.98l-10 2A1 1 0 006 5v9.114A4.369 4.369 0 005 14-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V7.82l8-1.6v5.894A4.37 4.37 0 0015 12c-1.657 0-3 .895-3 2s1.343 2 3 2 3-.895 3-2V3z" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-col justify-end h-full">
                <p className="text-primary-light text-sm uppercase tracking-wider mb-2">Album</p>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-text-primary">{album.title}</h1>
                <p className="text-xl sm:text-2xl text-gray-300 mb-6 font-medium">
                  <Link href={`/artist/${album.artist}`} className="hover:text-white transition-colors">
                    {album.artist}
                  </Link>
                </p>
                
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-gray-400 mb-2">
                  <span>{album.year}</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{album.tracks.length} songs</span>
                  <span className="hidden sm:inline">•</span>
                  <span>{album.genre}</span>
                </div>
                
                {album.description && (
                  <div className="mt-6 max-w-2xl">
                    <h3 className="text-lg font-semibold mb-2 text-text-primary">About</h3>
                    <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{album.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Album Detail Client (Buttons and Tracks) */}
          <AlbumDetailClient album={album} />
        </div>
      </div>
      
      {/* JSON-LD Structured Data for SEO */}
      <Script
        id="album-structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
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
        }}
      />
    </div>
  );
}