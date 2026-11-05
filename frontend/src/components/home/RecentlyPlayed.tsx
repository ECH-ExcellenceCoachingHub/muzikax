"use client";

import React, { useState, useEffect, useRef } from "react";
import SectionHeader from "./SectionHeader";
import { useRouter } from "next/navigation";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import { useLanguage } from "../../contexts/LanguageContext";
import BeatCard from "./BeatCard";

interface Track {
  id: string;
  title: string;
  artist: string;
  plays: number;
  likes: number;
  coverImage: string;
  audioUrl: string;
  duration?: number;
  category?: string;
  creatorId?: string;
  type?: 'song' | 'beat' | 'mix';
}

/* ── Scroll Animation Hook ── */
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

/* ── Animated Section Wrapper ── */
function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { ref, isVisible } = useScrollAnimation();
  
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${className}`}
    >
      {children}
    </div>
  );
}


function HScrollRow({ children }: { children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
    >
      {children}
    </div>
  );
}

export default function RecentlyPlayed() {
  const router = useRouter();
  const { t } = useLanguage();
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist } = useAudioPlayer();
  const [recentTracks, setRecentTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('=== RecentlyPlayed Component MOUNTED ===');

  useEffect(() => {
    console.log('*** RecentlyPlayed useEffect RUNNING ***');
    
    const fetchRecentlyPlayed = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        console.log('RecentlyPlayed: Token exists:', !!token);
        
        if (!token) {
          console.log('RecentlyPlayed: No token found, exiting');
          setLoading(false);
          return;
        }

        console.log('RecentlyPlayed: Fetching from API...');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/recently-played?limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('RecentlyPlayed: API response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('RecentlyPlayed: Raw data object keys:', Object.keys(data));
          console.log('RecentlyPlayed: Full data object:', JSON.stringify(data, null, 2));
          console.log('RecentlyPlayed: data.tracks value:', data.tracks);
          
          // Check if data is an array or has a tracks property
          const tracksArray = Array.isArray(data) ? data : (data.tracks || []);
          console.log('RecentlyPlayed: Using tracks array:', tracksArray);
          
          const tracks: Track[] = tracksArray
            .filter((t: any) => t && (t.track || t._id)) // Filter out entries without a track or _id
            .map((t: any) => {
              // If the track has a nested 'track' property, use it; otherwise use the object itself
              const trackData = t.track || t;
              
              // Ensure audioURL has proper format (some backends return incomplete URLs)
              let audioUrlValue = trackData.audioURL || '';
              // If URL doesn't end with a file extension or proper format, you might need to append one
              // But first let's log to see what we're getting
              if (!audioUrlValue) {
                console.warn('RecentlyPlayed: Track missing audioURL:', trackData.title);
              }
              
              return {
                id: trackData._id || trackData.id,
                title: trackData.title,
                artist: typeof trackData.creatorId === "object" && trackData.creatorId !== null
                  ? trackData.creatorId.name
                  : "Unknown Artist",
                plays: trackData.plays || 0,
                likes: trackData.likes || 0,
                coverImage: trackData.coverURL || "",
                audioUrl: audioUrlValue,
                duration: trackData.duration || 0,
                category: trackData.type,
                type: (trackData.type as 'song' | 'beat' | 'mix') || 'song',
                playedAt: t.playedAt || trackData.playedAt,
                // Don't include paymentType or price for recently played tracks
              };
            });
          console.log('RecentlyPlayed: Processed tracks count:', tracks.length);
          setRecentTracks(tracks);
        } else {
          console.error('RecentlyPlayed: API error, status:', response.status);
        }
      } catch (error) {
        console.error('RecentlyPlayed: Error fetching recently played:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyPlayed();
  }, []); // Run once on mount

  const handlePlay = (track: Track) => {
    setCurrentPlaylist(recentTracks);
    playTrack(track);
  };

  console.log('RecentlyPlayed Render: loading=', loading, 'tracks count=', recentTracks.length);

  if (loading) {
    console.log('RecentlyPlayed: Showing loading state');
    return (
      <section className="space-y-3 sm:space-y-4">
        <SectionHeader title={t('continueListening' as any)} />
        <div className="lg:hidden">
          <HScrollRow>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="snap-start shrink-0 w-40 sm:w-44 md:w-48">
                <div className="animate-pulse aspect-square rounded-2xl bg-gradient-to-br from-surface-elevated to-surface border border-surface-elevated" />
              </div>
            ))}
          </HScrollRow>
        </div>
        <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-2xl bg-gradient-to-br from-surface-elevated to-surface border border-surface-elevated animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (recentTracks.length === 0) {
    console.log('RecentlyPlayed: No tracks, returning null');
    return null;
  }

  console.log('RecentlyPlayed: Rendering tracks');
  return (
    <AnimatedSection>
      <section className="space-y-3 sm:space-y-4">
        <SectionHeader 
          title={t('continueListening' as any)} 
          onSeeAll={() => router.push("/recently-played")}
        />
        
        {/* Mobile: Horizontal scroll */}
        <div className="lg:hidden">
          <HScrollRow>
            {recentTracks.slice(0, 10).map((track) => (
              <div
                key={track.id}
                className="snap-start shrink-0 w-40 sm:w-44 md:w-48"
              >
                <BeatCard
                  beat={track}
                  onPlay={() => handlePlay(track)}
                  isActive={currentTrack?.id === track.id && isPlaying}
                />
              </div>
            ))}
          </HScrollRow>
        </div>

        {/* Desktop: Grid layout */}
        <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {recentTracks.slice(0, 8).map((track) => (
            <BeatCard
              key={track.id}
              beat={track}
              onPlay={() => handlePlay(track)}
              isActive={currentTrack?.id === track.id && isPlaying}
            />
          ))}
        </div>
      </section>
    </AnimatedSection>
  );
}
