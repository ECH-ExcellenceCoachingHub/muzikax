"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useLanguage } from "../../contexts/LanguageContext";
import { useTrendingTracks, usePopularCreators, useTracksByType, useRecommendations } from "../../hooks/useTracks";
import { useFollowedTracks } from "../../hooks/useFollowedTracks";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import { followCreator, unfollowCreator } from "../../services/trackService";
import AudioPlayerErrorBoundary from "./AudioPlayerErrorBoundary";
import PlaylistCard from "./PlaylistCard";
import BeatCard from "./BeatCard";
import RecentlyPlayed from "./RecentlyPlayed";
import SectionHeader from "./SectionHeader";
import TrendingVibesSection from "./TrendingVibesSection";
import MixesHorizontalScroll from "../MixesHorizontalScroll";

/* ─────────────────────── Types ─────────────────────── */
interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  plays: number;
  likes: number;
  coverImage: string;
  audioUrl: string;
  duration?: number;
  category?: string;
  creatorId?: string;
  type?: 'song' | 'beat' | 'mix';
}

interface Creator {
  id: string;
  name: string;
  type: string;
  followers: number;
  avatar: string;
  verified?: boolean;
}

interface Album {
  id: string;
  title: string;
  artist: string;
  coverImage: string;
  year: number;
  tracks: number;
}

/* ─────────────────────── Helpers ─────────────────────── */
function formatPlays(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
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

/* ─────────────────────── Sub-components ─────────────────────── */

/** Skeleton pulse block */
function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-white/5 ${className}`}
      aria-hidden
    />
  );
}

/** Cover image with graceful fallback */
function Cover({
  src,
  alt,
  className = "",
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  return err || !src ? (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-surface-elevated to-surface text-text-secondary text-xs font-semibold border border-surface-elevated ${className}`}
    >
      {initials(alt)}
    </div>
  ) : (
    <img
      src={src}
      alt={alt}
      onError={() => setErr(true)}
      className={`object-cover ${className}`}
    />
  );
}

/** Avatar with fallback */
function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src: string;
  name: string;
  size?: number;
  className?: string;
}) {
  const [err, setErr] = useState(false);
  const style = { width: size, height: size, minWidth: size };
  return err || !src ? (
    <div
      style={style}
      className={`rounded-full bg-gradient-to-br from-primary to-primary-light flex items-center justify-center text-black font-bold text-xs ${className}`}
    >
      {initials(name)}
    </div>
  ) : (
    <img
      src={src}
      alt={name}
      onError={() => setErr(true)}
      style={style}
      className={`rounded-full object-cover ${className}`}
    />
  );
}

/* ── Track Row (list item) ── */
function TrackRow({
  track,
  index,
  onPlay,
  isActive,
}: {
  track: Track;
  index: number;
  onPlay: () => void;
  isActive: boolean;
}) {
  return (
    <button onClick={onPlay} data-active={isActive} className="mx-row group">
      {/* Index, swapped for a play icon on hover */}
      <span className="relative w-6 shrink-0 flex items-center justify-center text-sm tabular-nums">
        <span className={`mx-row-index transition-opacity ${isActive ? "text-primary font-semibold" : "text-text-muted"}`}>
          {isActive ? "▶" : index + 1}
        </span>
        <svg className="mx-row-play absolute w-4 h-4 text-text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
          <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
        </svg>
      </span>

      <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-surface-elevated">
        <Cover src={track.coverImage} alt={track.title} className="w-full h-full" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="mx-card-title">{track.title}</p>
        <p className="mx-card-subtitle">{track.artist}</p>
      </div>

      <span className="text-xs text-text-muted shrink-0 hidden sm:block tabular-nums">
        {formatPlays(track.plays)}
      </span>
    </button>
  );
}

/* ── Track Card (grid) ── */
function TrackCard({
  track,
  onPlay,
  isActive,
  t,
}: {
  track: Track;
  onPlay: () => void;
  isActive: boolean;
  t: (key: any) => string;
}) {
  return (
    <button onClick={onPlay} data-active={isActive} className="mx-card group">
      <div className="mx-card-media aspect-square w-full">
        <Cover src={track.coverImage} alt={track.title} className="w-full h-full" />
        <span className="mx-card-play">
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </span>
        {isActive && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-black text-[10px] font-bold rounded-full">
            {t('nowPlaying')}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="mx-card-title">{track.title}</p>
        <p className="mx-card-subtitle">{track.artist}</p>
      </div>
    </button>
  );
}

/* ── Artist Card ── */
function ArtistCard({ creator }: { creator: Creator }) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(`/artists/${creator.id}`)} className="mx-card mx-card-center group">
      <div className="relative">
        <div className="mx-card-avatar">
          <Avatar src={creator.avatar} name={creator.name} size={64} />
        </div>
        {creator.verified && (
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center ring-2 ring-surface" aria-label="Verified">
              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
      </div>
      <div className="min-w-0 w-full">
        <p className="mx-card-title">{creator.name}</p>
        <p className="mx-card-subtitle">{formatPlays(creator.followers)} followers</p>
      </div>
    </button>
  );
}

/* ── Album Card ── */
function AlbumCard({ album }: { album: Album }) {
  const router = useRouter();
  return (
    <button onClick={() => router.push(`/album/${album.id}`)} className="mx-card group">
      <div className="mx-card-media aspect-square w-full">
        <Cover src={album.coverImage} alt={album.title} className="w-full h-full" />
        <span className="mx-card-play">
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </span>
        {album.tracks > 1 && (
          <span className="absolute top-2 left-2 px-2 py-0.5 bg-black/60 backdrop-blur-sm text-text-primary text-[10px] font-semibold rounded-full">
            {album.tracks} tracks
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="mx-card-title">{album.title}</p>
        <p className="mx-card-subtitle">{album.artist} · {album.year}</p>
      </div>
    </button>
  );
}

/* ── Horizontal Scroll Row ── */
function HScrollRow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
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

/* ─────────────────────── Hero Banner Slider ─────────────────────── */
function HeroBanner({
  tracks,
  isAuthenticated,
  onPlay,
  isActive,
  t,
}: {
  tracks?: Track[];
  isAuthenticated: boolean;
  onPlay: (index?: number) => void;
  isActive: boolean;
  t: (key: any) => string;
}) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const progressRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const SLIDE_DURATION = 4000; // 4 seconds per slide

  const featuredTracks = tracks?.slice(0, 5) || [];

  // Auto-advance slides
  useEffect(() => {
    if (isPaused || featuredTracks.length <= 1) return;

    const startProgress = () => {
      const startTime = Date.now() - progressRef.current;
      
      const animate = () => {
        progressRef.current = Date.now() - startTime;
        
        if (progressRef.current >= SLIDE_DURATION) {
          setCurrentIndex((prev) => (prev + 1) % featuredTracks.length);
          progressRef.current = 0;
        }
        
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    startProgress();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentIndex, isPaused, featuredTracks.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    progressRef.current = 0;
  };

  const currentTrack = featuredTracks[currentIndex];
  const isCurrentActive = currentTrack && isActive;
  const hasMultiple = featuredTracks.length > 1;

  // Touch swipe (mobile)
  const touchStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setIsPaused(true);
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartX.current;
    touchStartX.current = null;
    setIsPaused(false);
    if (start === null || !hasMultiple) return;
    const dx = e.changedTouches[0].clientX - start;
    if (Math.abs(dx) < 40) return;
    const n = featuredTracks.length;
    goToSlide(dx < 0 ? (currentIndex + 1) % n : (currentIndex - 1 + n) % n);
  };

  return (
    <div
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden h-[208px] sm:h-[280px] lg:h-[340px] bg-surface border border-border-light"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Slides (blurred artwork backdrop) */}
      {featuredTracks.map((track, index) => {
        const isCurrent = index === currentIndex;
        return (
          <div
            key={track.id}
            aria-hidden={!isCurrent}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${isCurrent ? "opacity-100" : "opacity-0"}`}
          >
            <div
              className="absolute inset-0 bg-cover bg-center scale-110"
              style={{
                backgroundImage: `url(${track.coverImage})`,
                filter: "blur(24px) saturate(1.3)",
              }}
            />
            {/* Scrims: bottom for text legibility, left for the cover/title column */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-transparent" />
          </div>
        );
      })}

      {/* Content: cover + text side by side on every screen size, pinned to the bottom */}
      {currentTrack && (
        <div className="absolute inset-0 z-10 flex items-end gap-4 sm:gap-6 p-4 sm:p-7 lg:p-9">
          <div
            key={`cover-${currentTrack.id}`}
            className="shrink-0 w-[104px] h-[104px] sm:w-36 sm:h-36 lg:w-48 lg:h-48 rounded-xl sm:rounded-2xl overflow-hidden bg-surface-elevated shadow-2xl shadow-black/60 ring-1 ring-white/10 animate-fade-in-up"
          >
            <Cover src={currentTrack.coverImage} alt={currentTrack.title} className="w-full h-full" />
          </div>

          <div
            key={`meta-${currentTrack.id}`}
            className="flex-1 min-w-0 pb-0.5 animate-fade-in-up"
            style={{ animationDelay: "0.08s" }}
          >
            <p className="text-[10px] sm:text-xs font-semibold text-primary uppercase tracking-[0.14em] mb-1 sm:mb-1.5">
              {t("featuredTrack")}
            </p>
            <h1
              className="text-lg leading-snug sm:text-3xl lg:text-[2.5rem] sm:leading-tight font-extrabold line-clamp-2 break-words text-text-primary"
              title={currentTrack.title}
            >
              {currentTrack.title}
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-0.5 sm:mt-1 truncate">
              {currentTrack.artist}
            </p>

            <div className="flex items-center gap-2 sm:gap-3 mt-3 sm:mt-5">
              <button
                onClick={() => onPlay(currentIndex)}
                className="inline-flex items-center gap-1.5 sm:gap-2 h-9 sm:h-11 px-4 sm:px-6 bg-primary hover:bg-primary-hover active:scale-95 text-black font-bold text-sm rounded-full transition-colors duration-150 shadow-lg shadow-black/40"
              >
                {isCurrentActive ? (
                  <span className="flex items-end gap-[2px] h-3.5" aria-hidden="true">
                    <span className="w-[3px] h-full bg-black rounded-sm animate-pulse" />
                    <span className="w-[3px] h-2/3 bg-black rounded-sm animate-pulse [animation-delay:150ms]" />
                    <span className="w-[3px] h-full bg-black rounded-sm animate-pulse [animation-delay:300ms]" />
                  </span>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
                  </svg>
                )}
                <span className="truncate">{isCurrentActive ? t("nowPlaying") : t("play")}</span>
              </button>
              {!isAuthenticated && (
                <button
                  onClick={() => router.push("/login")}
                  className="hidden sm:inline-flex items-center h-11 px-6 border border-white/20 hover:border-white/40 hover:bg-white/5 text-text-primary font-semibold text-sm rounded-full transition-colors duration-150"
                >
                  {t("signIn")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slide indicators: top-right so they never collide with the buttons.
          The active pill fills up as the progress indicator for the current slide. */}
      {hasMultiple && (
        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 flex items-center gap-1.5 px-2 py-1.5 rounded-full bg-black/30 backdrop-blur-md">
          {featuredTracks.map((_, index) => {
            const active = index === currentIndex;
            return (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={active}
                className={`relative overflow-hidden rounded-full transition-all duration-300 h-1.5 ${active ? "w-5 sm:w-7 bg-white/30" : "w-1.5 bg-white/40 hover:bg-white/70"}`}
              >
                {active && (
                  <span
                    key={currentIndex}
                    className="absolute inset-0 origin-left bg-white rounded-full"
                    style={{
                      animation: `heroProgress ${SLIDE_DURATION}ms linear forwards`,
                      animationPlayState: isPaused ? "paused" : "running",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Artist Card with Follow Button ── */
function ArtistCardWithFollow({ creator, t }: { creator: Creator; t: (key: any) => string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    try {
      if (isFollowing) {
        await unfollowCreator(creator.id);
      } else {
        await followCreator(creator.id);
      }
      setIsFollowing(!isFollowing);
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  return (
    <div className="mx-card mx-card-center group">
      {/* Whole card navigates; follow button sits above it */}
      <button
        onClick={() => router.push(`/artists/${creator.id}`)}
        className="absolute inset-0 w-full h-full rounded-2xl z-0"
        aria-label={`View ${creator.name}'s profile`}
      />
      <div className="relative z-10 flex flex-col items-center gap-3 w-full pointer-events-none">
        <div className="relative">
          <div className="mx-card-avatar">
            <Avatar src={creator.avatar} name={creator.name} size={64} />
          </div>
          {creator.verified && (
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-primary rounded-full flex items-center justify-center ring-2 ring-surface" aria-label="Verified">
              <svg className="w-3 h-3 text-black" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </div>
        <div className="min-w-0 w-full">
          <p className="mx-card-title">{creator.name}</p>
          <p className="mx-card-subtitle">{formatPlays(creator.followers)} followers</p>
        </div>
      </div>
      <button
        onClick={handleFollow}
        className={`relative z-10 w-full h-9 rounded-full text-xs sm:text-sm font-semibold transition-colors duration-150 ${
          isFollowing
            ? 'bg-transparent text-text-primary border border-border-strong hover:border-white/30'
            : 'bg-primary text-black hover:bg-primary-hover'
        }`}
      >
        {isFollowing ? t('unfollow') : t('follow')}
      </button>
    </div>
  );
}

/* ─────────────────────── Tabs ─────────────────────── */
const TABS = [
  { id: "trending", label: "Trending" },
  { id: "new", label: "New Releases" },
  { id: "popular", label: "Popular" },
  { id: "following", label: "Following" },
] as const;

type Tab = (typeof TABS)[number]["id"];

/* ─────────────────────── HomeContent ─────────────────────── */
function HomeContent() {
  const router = useRouter();
  const { isAuthenticated, user, userRole } = useAuth();
  const { t } = useLanguage();

  if (isAuthenticated && userRole === "admin") {
    router.replace("/admin");
    return null;
  }

  const [activeTab, setActiveTab] = useState<Tab>("trending");
  const { currentTrack, isPlaying, playTrack, setCurrentPlaylist } = useAudioPlayer();

  const { tracks: trendingTracksData, loading: trendingLoading } = useTrendingTracks(0);
  const { tracks: recommendedTracksData, loading: recommendationsLoading } = useRecommendations(20, isAuthenticated);
  const { creators: popularCreatorsData, loading: creatorsLoading } = usePopularCreators(10);
  const { tracks: beatsData, loading: beatsLoading } = useTracksByType('beat', 10);
  const { tracks: followedTracksData, loading: followedTracksLoading } = useFollowedTracks(20);

  const [popularAlbums, setPopularAlbums] = useState<Album[]>([]);
  const [albumsLoading, setAlbumsLoading] = useState(true);

  const [popularPlaylists, setPopularPlaylists] = useState<Album[]>([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(true);

  /* ── Transform tracks ── */
  const allTracks: Track[] = trendingTracksData.map((t) => ({
    id: t._id,
    title: t.title,
    artist:
      typeof t.creatorId === "object" && t.creatorId !== null
        ? (t.creatorId as any).name
        : "Unknown Artist",
    plays: t.plays,
    likes: t.likes,
    coverImage: t.coverURL || "",
    audioUrl: t.audioURL || "",
    duration: 0,
    category: t.type,
    type: (t.type as 'song' | 'beat' | 'mix') || 'song',
    creatorId:
      typeof t.creatorId === "object" && t.creatorId !== null
        ? (t.creatorId as any)._id
        : t.creatorId,
  }));

  // Transform recommended tracks
  const recommendedTracks: Track[] = recommendedTracksData.map((t) => ({
    id: t._id,
    title: t.title,
    artist:
      typeof t.creatorId === "object" && t.creatorId !== null
        ? (t.creatorId as any).name
        : "Unknown Artist",
    plays: t.plays,
    likes: t.likes,
    coverImage: t.coverURL || "",
    audioUrl: t.audioURL || "",
    duration: 0,
    category: t.type,
    type: (t.type as 'song' | 'beat' | 'mix') || 'song',
    creatorId:
      typeof t.creatorId === "object" && t.creatorId !== null
        ? (t.creatorId as any)._id
        : t.creatorId,
  }));

  const uniqueTracks: Track[] = Array.from(
    new Map(allTracks.map((t) => [t.id, t])).values()
  );
  const trendingTracks = uniqueTracks.filter((t) => t.category !== "beat");
  const newTracks = [...trendingTracks].sort((a, b) =>
    b.id.localeCompare(a.id)
  );

  // Transform followed tracks from the API
  const followingTracks: Track[] = followedTracksData.map((t) => ({
    id: t.id || t._id,
    title: t.title,
    artist: t.artist || "Unknown Artist",
    plays: t.plays || 0,
    likes: t.likes || 0,
    coverImage: t.coverImage || t.coverURL || "",
    audioUrl: t.audioUrl || t.audioURL || "",
    duration: t.duration || 0,
    category: t.category || t.type || "song",
    type: (t.type || t.category || 'song') as 'song' | 'beat' | 'mix',
    creatorId: t.creatorId,
  }));

  const popularCreators: Creator[] = popularCreatorsData.map((c) => ({
    id: c._id,
    name: c.name,
    type: c.creatorType || "Artist",
    followers: c.followersCount || 0,
    avatar: c.avatar || "",
    verified: true,
  }));

  // Filter out already followed artists
  const [followedArtists, setFollowedArtists] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!user?.following || popularCreators.length === 0) {
      return;
    }
    
    const followedMap: Record<string, boolean> = {};
    const followingIds = new Set(
      user.following.map((id: any) => 
        (typeof id === 'object' && id !== null ? (id._id || id.id) : id).toString()
      )
    );
    
    popularCreators.forEach(creator => {
      followedMap[creator.id] = followingIds.has(creator.id.toString());
    });
    
    // Only update if the data has actually changed
    setFollowedArtists(prev => {
      const prevString = JSON.stringify(prev);
      const newString = JSON.stringify(followedMap);
      return prevString === newString ? prev : followedMap;
    });
  }, [user?.following, popularCreators.length]);

  const unfollowedCreators = popularCreators.filter(creator => !followedArtists[creator.id]);

  const beats: Track[] = beatsData.map((t) => ({
    id: t._id,
    title: t.title,
    artist:
      typeof t.creatorId === "object" && t.creatorId !== null
        ? (t.creatorId as any).name
        : "Unknown Producer",
    plays: t.plays,
    likes: t.likes,
    coverImage: t.coverURL || "",
    audioUrl: t.audioURL || "",
    duration: 0,
    category: t.type,
    type: 'beat',
    paymentType: t.paymentType || 'free',
    price: t.price || 0,
    currency: t.currency || '$',
    creatorId:
      typeof t.creatorId === "object" && t.creatorId !== null
        ? (t.creatorId as any)._id
        : t.creatorId,
  }));

  /* ── Fetch albums ── */
  useEffect(() => {
    if (!trendingTracksData.length) return;
    const fetchAlbums = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/albums?page=1&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          setPopularAlbums(
            data.albums.map((a: any) => ({
              id: a._id,
              title: a.title,
              artist:
                typeof a.creatorId === "object" && a.creatorId !== null
                  ? a.creatorId.name
                  : "Unknown Artist",
              coverImage: a.coverURL || "",
              year: a.releaseDate
                ? new Date(a.releaseDate).getFullYear()
                : new Date().getFullYear(),
              tracks: a.tracks?.length || 0,
            }))
          );
        }
      } catch {
        setPopularAlbums([]);
      } finally {
        setAlbumsLoading(false);
      }
    };
    fetchAlbums();
  }, [trendingTracksData]);

  /* ── Fetch playlists ── */
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        // Use public endpoint for recommended playlists
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/public/playlists/recommended`
        );
        if (res.ok) {
          const data = await res.json();
          // Combine popular and recent playlists, prioritizing popular ones
          const allPlaylists = [
            ...(data.popular || []),
            ...(data.recent || [])
          ];
          
          // Remove duplicates and limit to 10
          const uniquePlaylists = Array.from(
            new Map(allPlaylists.map((p: any) => [p._id, p])).values()
          ).slice(0, 10);
          
          setPopularPlaylists(
            uniquePlaylists.map((p: any) => ({
              id: p._id,
              title: p.name,
              artist: p.userId?.name || p.creatorId?.name || "Unknown Creator",
              coverImage: p.coverImage || p.tracks?.[0]?.coverURL || "",
              year: p.createdAt
                ? new Date(p.createdAt).getFullYear()
                : new Date().getFullYear(),
              tracks: p.tracks?.length || 0,
            }))
          );
        } else {
          console.error('Failed to fetch playlists, status:', res.status);
          // Fallback: try alternative endpoint
          const res2 = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/public/playlists`
          );
          if (res2.ok) {
            const data2 = await res2.json();
            setPopularPlaylists(
              data2.playlists?.slice(0, 10).map((p: any) => ({
                id: p._id,
                title: p.name,
                artist: p.userId?.name || p.creatorId?.name || "Unknown Creator",
                coverImage: p.coverImage || p.tracks?.[0]?.coverURL || "",
                year: p.createdAt
                  ? new Date(p.createdAt).getFullYear()
                  : new Date().getFullYear(),
                tracks: p.tracks?.length || 0,
              })) || []
            );
          } else {
            console.error('Fallback playlist endpoint also failed');
          }
        }
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setPopularPlaylists([]);
      } finally {
        setPlaylistsLoading(false);
      }
    };
    fetchPlaylists();
  }, []);

  /* ── Listen for mobile category events ── */
  useEffect(() => {
    const handler = (e: CustomEvent) =>
      setActiveTab(e.detail.categoryId as Tab);
    window.addEventListener("categoryChange", handler as EventListener);
    return () => window.removeEventListener("categoryChange", handler as EventListener);
  }, []);

  const currentTabTracks =
    activeTab === "new"
      ? newTracks
      : activeTab === "popular"
      ? [...allTracks].filter((t) => t.category !== "beat").sort((a, b) => b.plays - a.plays) // Most played tracks
      : activeTab === "following"
      ? followingTracks
      : recommendedTracks.length > 0 ? recommendedTracks : trendingTracks; // Recommendations (fallback to trending)

  const featuredTrack = currentTabTracks[0];
  const isHeroActive =
    !!currentTrack && currentTrack.id === featuredTrack?.id && isPlaying;

  const handlePlay = (tracks: Track[], index = 0) => {
    setCurrentPlaylist(tracks);
    playTrack(tracks[index]);
  };

  // Quick Picks dedicated track list and handler - uses tracks from position 10-16 of current tab
  const quickPicksTracks = currentTabTracks.length > 10 ? currentTabTracks.slice(10, 16) : currentTabTracks.slice(0, Math.min(6, currentTabTracks.length));
  const handleQuickPickPlay = (index: number) => {
    setCurrentPlaylist(quickPicksTracks);
    playTrack(quickPicksTracks[index]);
  };

  /* ── Loading state ── */
  if (trendingLoading || (isAuthenticated && recommendationsLoading)) {
    return (
      <div className="flex flex-col gap-6 sm:gap-8 lg:gap-10 p-4 sm:p-6 lg:p-8 xl:p-10 animate-pulse">
        <Skeleton className="h-[220px] sm:h-[280px] lg:h-[340px] w-full rounded-3xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  /* ─────────────────── RENDER ─────────────────── */
  return (
    <div className="flex flex-col min-h-screen w-full text-white bg-background">

      {/* ── Background ambience ── */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      >
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-white/3 rounded-full blur-[120px]" />
      </div>

      <main className="flex-1 w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8 xl:px-10 pt-16 sm:pt-20 md:pt-16 lg:pt-8 pb-32 space-y-8 sm:space-y-10 lg:space-y-12">

        {/* ══ HERO ══ */}
        <HeroBanner
          tracks={currentTabTracks}
          isAuthenticated={isAuthenticated}
          onPlay={(index) => handlePlay(currentTabTracks, index || 0)}
          isActive={isHeroActive}
          t={t}
        />

        {/* ══ TABS ══ */}
        <div className="flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-full p-1 w-fit max-w-full overflow-x-auto scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? "bg-white/15 text-white shadow-md border border-white/20"
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ══ MAIN GRID ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">

          {/* ── LEFT / MAIN COLUMN ── */}
          <div className="lg:col-span-2 xl:col-span-3 space-y-6 sm:space-y-8 lg:space-y-10">

            {/* ── Trending Cards (horizontal scroll on mobile, grid on desktop) ── */}
            <AnimatedSection>
              <section className="space-y-3 sm:space-y-4">
                <SectionHeader
                  title={t('trendingNow' as any)}
                  onSeeAll={() => router.push("/tracks")}
                />
              {/* Mobile: horizontal scroll */}
              <div className="lg:hidden">
                {followedTracksLoading ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60"></div>
                    </div>
                    <p className="text-sm text-white/50">Loading tracks from artists you follow...</p>
                  </div>
                ) : activeTab === "following" && followingTracks.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-text-primary">{t('notFollowingAnyArtists' as any)}</h3>
                    <p className="text-sm text-white/50 mb-4">{t('followArtistsToSeeTracks' as any)}</p>
                    <button
                      onClick={() => router.push("/artists")}
                      className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-full transition-all shadow-lg border border-white/20"
                    >
                      {t('discoverArtists')}
                    </button>
                  </div>
                ) : (
                  <HScrollRow>
                    {currentTabTracks.slice(0, 10).map((track) => (
                      <div
                        key={track.id}
                        className="snap-start shrink-0 w-40 sm:w-44 md:w-48"
                      >
                        <TrackCard
                          track={track}
                          onPlay={() => handlePlay(currentTabTracks, currentTabTracks.indexOf(track))}
                          isActive={currentTrack?.id === track.id && isPlaying}
                          t={t}
                        />
                      </div>
                    ))}
                  </HScrollRow>
                )}
              </div>
              {/* Desktop: 4-col grid */}
              <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                {followedTracksLoading ? (
                  <div className="col-span-full text-center py-12 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/60"></div>
                    </div>
                    <p className="text-sm text-white/50">Loading tracks from artists you follow...</p>
                  </div>
                ) : activeTab === "following" && followingTracks.length === 0 ? (
                  <div className="col-span-full text-center py-12 px-4">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                      <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold mb-2 text-text-primary">{t('notFollowingAnyArtists' as any)}</h3>
                    <p className="text-sm text-white/50 mb-4">{t('followArtistsToSeeTracks' as any)}</p>
                    <button
                      onClick={() => router.push("/artists")}
                      className="inline-flex px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-sm rounded-full transition-all shadow-lg border border-white/20"
                    >
                      {t('discoverArtists')}
                    </button>
                  </div>
                ) : (
                  currentTabTracks.slice(0, 10).map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      onPlay={() => handlePlay(currentTabTracks, currentTabTracks.indexOf(track))}
                      isActive={currentTrack?.id === track.id && isPlaying}
                      t={t}
                    />
                  ))
                )}
              </div>
            </section>
            </AnimatedSection>

            {/* ── Recently Played (Only for logged-in users) ── */}
            {isAuthenticated && (
              <>
                {console.log('HomeClient: Rendering RecentlyPlayed, isAuthenticated=', isAuthenticated, 'userRole=', userRole)}
                <RecentlyPlayed />
              </>
            )}

            {/* ── Featured Playlists - Prominent Section ── */}
            <AnimatedSection>
              <section className="space-y-3 sm:space-y-4">
                <SectionHeader
                  title={t('featuredPlaylists')}
                  onSeeAll={() => router.push("/playlists")}
                />
              {playlistsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 rounded-xl" />
                  ))}
                </div>
              ) : popularPlaylists.length > 0 ? (
                <div className="rounded-2xl bg-gradient-to-br from-white/5 to-white/3 border border-white/10 divide-y divide-white/4 overflow-hidden p-3 sm:p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    {popularPlaylists.map((playlist) => (
                      <PlaylistCard key={playlist.id} playlist={playlist} />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/30 py-4">{t('noPlaylistsAvailable' as any)}</p>
              )}
            </section>
            </AnimatedSection>

            {/* ── Track List ── */}
            <section className="space-y-3 sm:space-y-4">
              <SectionHeader
                title={t('chartToppers' as any)}
                onSeeAll={() => router.push("/charts")}
              />
              <div className="rounded-2xl bg-white/3 border border-white/6 overflow-hidden divide-y divide-white/4 p-2 sm:p-3">
                {currentTabTracks.slice(0, 8).map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i}
                    onPlay={() => handlePlay(currentTabTracks, i)}
                    isActive={currentTrack?.id === track.id && isPlaying}
                  />
                ))}
              </div>
            </section>

            {/* ── Albums Section ── */}
            <AnimatedSection>
              <section className="space-y-3 sm:space-y-4">
                <SectionHeader
                  title={t('popularAlbums')}
                  onSeeAll={() => router.push("/albums")}
                />
              {albumsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-2xl" />
                  ))}
                </div>
              ) : popularAlbums.length > 0 ? (
                <>
                  {/* Mobile: scroll */}
                  <div className="lg:hidden">
                    <HScrollRow>
                      {popularAlbums.map((album) => (
                        <div key={album.id} className="snap-start shrink-0 w-40 sm:w-44 md:w-48">
                          <AlbumCard album={album} />
                        </div>
                      ))}
                    </HScrollRow>
                  </div>
                  {/* Desktop: grid */}
                  <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                    {popularAlbums.map((album) => (
                      <AlbumCard key={album.id} album={album} />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/30 py-4">{t('noAlbumsAvailable' as any)}</p>
              )}
            </section>
            </AnimatedSection>

            {/* ── Beats Section ── */}
            <AnimatedSection>
              <section className="space-y-3 sm:space-y-4">
                <SectionHeader
                  title={t('popularBeats')}
                  onSeeAll={() => router.push("/beats")}
                />
              {beatsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="aspect-square rounded-2xl" />
                  ))}
                </div>
              ) : beats.length > 0 ? (
                <>
                  {/* Mobile: scroll */}
                  <div className="lg:hidden">
                    <HScrollRow>
                      {beats.slice(0, 10).map((beat) => (
                        <div key={beat.id} className="snap-start shrink-0 w-40 sm:w-44 md:w-48">
                          <BeatCard
                            beat={beat}
                            onPlay={() => handlePlay(beats, beats.indexOf(beat))}
                            isActive={currentTrack?.id === beat.id && isPlaying}
                          />
                        </div>
                      ))}
                    </HScrollRow>
                  </div>
                  {/* Desktop: grid */}
                  <div className="hidden lg:grid grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                    {beats.slice(0, 10).map((beat) => (
                      <BeatCard
                        key={beat.id}
                        beat={beat}
                        onPlay={() => handlePlay(beats, beats.indexOf(beat))}
                        isActive={currentTrack?.id === beat.id && isPlaying}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-sm text-white/30 py-4">{t('noBeatsAvailable' as any)}</p>
              )}
            </section>
            </AnimatedSection>

            {/* ── Mixes Section ── */}
            <section className="space-y-3 sm:space-y-4">
              <MixesHorizontalScroll title={t('popularMixes')} viewAllLink="/mixes" />
            </section>

            {/* ── Trending Vibes Section ── */}
            <TrendingVibesSection limit={4} />
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="lg:col-span-1 space-y-6 sm:space-y-8 lg:space-y-10">

            {/* ── Browse Artists (Unfollowed only) ── */}
            <section className="space-y-3 sm:space-y-4">
              <SectionHeader
                title={t('browseArtists' as any)}
                onSeeAll={() => router.push("/artists")}
              />
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
                {unfollowedCreators.slice(0, 8).map((creator) => (
                  <ArtistCardWithFollow key={creator.id} creator={creator} t={t} />
                ))}
              </div>
            </section>

            {/* ── Quick Picks (small list) ── */}
            <section className="space-y-3 sm:space-y-4">
              <SectionHeader
                title={t('quickPicks' as any)}
                onSeeAll={() => router.push("/tracks")}
              />
              <div className="space-y-1 sm:space-y-2">
                {quickPicksTracks.map((track, i) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    index={i}
                    onPlay={() => handleQuickPickPlay(i)}
                    isActive={currentTrack?.id === track.id && isPlaying}
                  />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────── Export ─────────────────────── */
export default function HomeClient() {
  return (
    <AudioPlayerErrorBoundary>
      <HomeContent />
    </AudioPlayerErrorBoundary>
  );
}