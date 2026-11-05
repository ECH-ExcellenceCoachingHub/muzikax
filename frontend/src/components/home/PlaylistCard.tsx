"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../contexts/LanguageContext";
import { getUserPlaylists } from "../../services/userService";

interface Track {
  _id: string;
  title: string;
  coverURL?: string;
  coverImage?: string;
}

interface PlaylistCardProps {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  tracks: number;
}

export default function PlaylistCard({ playlist }: { playlist: PlaylistCardProps }) {
  const router = useRouter();
  const { t } = useLanguage();
  const [playlistTracks, setPlaylistTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch playlist tracks to show multiple thumbnails
  useEffect(() => {
    const fetchPlaylistTracks = async () => {
      try {
        setLoading(true);
        const playlists = await getUserPlaylists();
        const foundPlaylist = playlists.find((p: any) => p._id === playlist.id);
        
        if (foundPlaylist && foundPlaylist.tracks) {
          // Get first 4 tracks for thumbnail display
          setPlaylistTracks(foundPlaylist.tracks.slice(0, 4));
        }
      } catch (error) {
        console.error('Error fetching playlist tracks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaylistTracks();
  }, [playlist.id]);

  const getTrackCover = (track: Track) => {
    return track.coverURL || track.coverImage || '';
  };

  return (
    <button
      onClick={() => router.push(`/playlists/${playlist.id}`)}
      className="mx-card mx-card-row group"
    >
      
      <div className="relative shrink-0">
        {/* Multiple track thumbnails grid */}
        <div className="mx-card-media w-16 h-16 grid grid-cols-2 grid-rows-2 gap-px rounded-lg">
          {playlistTracks.length > 0 ? (
            playlistTracks.map((track, idx) => (
              <div key={idx} className="relative overflow-hidden bg-gray-900">
                {getTrackCover(track) ? (
                  <img
                    src={getTrackCover(track)}
                    alt={`Track ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-surface flex items-center justify-center">
                    <svg className="w-3 h-3 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm4 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm4 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" />
                    </svg>
                  </div>
                )}
              </div>
            ))
          ) : (
            /* Fallback to single cover if no tracks loaded */
            <div className="col-span-2 row-span-2 relative overflow-hidden">
              {playlist.coverImage ? (
                <img
                  src={playlist.coverImage}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-surface-elevated to-surface border border-surface-elevated flex items-center justify-center">
                  <svg className="w-6 h-6 text-text-muted" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm4 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2zm4 0c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2-.9-2-2z" />
                  </svg>
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Track count badge with Modern Style */}
        {playlist.tracks > 0 && (
          <div className="absolute -bottom-1 -right-1 bg-surface-overlay text-text-primary text-[10px] font-semibold px-1.5 py-0.5 rounded-full ring-2 ring-surface min-w-[18px] text-center">
            {playlist.tracks}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="mx-card-title">
          {playlist.title}
        </p>
        <p className="mx-card-subtitle">
          {playlist.artist} · {t('tracksCount', { count: playlist.tracks })}
        </p>
      </div>
    </button>
  );
}
