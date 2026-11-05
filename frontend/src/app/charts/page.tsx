"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAudioPlayer } from "../../contexts/AudioPlayerContext";
import {
  getGlobalCharts,
  getCountryCharts,
  getGenreCharts,
  getTrendingTracks,
  type ChartTrack,
  type TimeWindow,
} from "../../services/chartService";
import ChartTrackCard from "../../components/ChartTrackCard";
import { useWebSocket } from "../../hooks/useWebSocket";

type ChartType = "global" | "country" | "genre" | "trending";
type CountryCode = "RW" | "US" | "KE" | "TZ" | "UG" | "NG" | "GH" | "ZA";

const CHART_TYPES: { id: ChartType; label: string; blurb: string }[] = [
  { id: "global", label: "Top 50", blurb: "The most played tracks on MuzikaX" },
  { id: "country", label: "Country", blurb: "What listeners in one country are playing" },
  { id: "genre", label: "Genre", blurb: "The top tracks in a single genre" },
  { id: "trending", label: "Trending", blurb: "Fastest rising: plays this week vs last week" },
];

const WINDOWS: { id: TimeWindow; label: string; period: string }[] = [
  { id: "daily", label: "Today", period: "today" },
  { id: "weekly", label: "This week", period: "this week" },
  { id: "monthly", label: "This month", period: "this month" },
];

const COUNTRIES: { code: CountryCode; name: string }[] = [
  { code: "RW", name: "Rwanda" },
  { code: "KE", name: "Kenya" },
  { code: "TZ", name: "Tanzania" },
  { code: "UG", name: "Uganda" },
  { code: "NG", name: "Nigeria" },
  { code: "GH", name: "Ghana" },
  { code: "ZA", name: "South Africa" },
  { code: "US", name: "United States" },
];

const GENRES = ["Afrobeat", "Hip Hop", "R&B", "Amapiano", "Dancehall", "Afropop", "Gospel", "Traditional"];

const AUTO_REFRESH_MS = 60_000;

function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = "md",
}: {
  options: { id: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="tablist"
      className="flex items-center gap-1 bg-surface border border-border-light rounded-full p-1 w-fit max-w-full overflow-x-auto scrollbar-hide"
    >
      {options.map((o) => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.id)}
            className={`whitespace-nowrap rounded-full font-semibold transition-colors duration-150 ${
              size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm"
            } ${active ? "bg-surface-overlay text-text-primary" : "text-text-secondary hover:text-text-primary"}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  label: string;
}) {
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none h-9 pl-4 pr-9 rounded-full bg-surface border border-border-light text-sm font-semibold text-text-primary hover:border-border-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface-elevated">
            {o.label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3 w-3.5 h-3.5 text-text-secondary"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </label>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-1" aria-hidden="true">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-3 py-2 animate-pulse">
          <div className="w-9 h-6 rounded bg-surface-elevated" />
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-md bg-surface-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-2/5 rounded bg-surface-elevated" />
            <div className="h-3 w-1/4 rounded bg-surface-elevated" />
          </div>
          <div className="hidden md:block h-3.5 w-14 rounded bg-surface-elevated" />
        </div>
      ))}
    </div>
  );
}

export default function ChartsPage() {
  const [chartType, setChartType] = useState<ChartType>("global");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("weekly");
  const [country, setCountry] = useState<CountryCode>("RW");
  const [genre, setGenre] = useState(GENRES[0]);
  const [charts, setCharts] = useState<ChartTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const { playTrack, setCurrentPlaylist, currentTrack, isPlaying } = useAudioPlayer();
  const { latestUpdate } = useWebSocket(chartType);
  const requestId = useRef(0);

  const windowInfo = chartType === "trending" ? WINDOWS[1] : WINDOWS.find((w) => w.id === timeWindow)!;
  const typeInfo = CHART_TYPES.find((c) => c.id === chartType)!;

  const fetchCharts = useCallback(
    async (silent = false) => {
      const id = ++requestId.current; // ignore responses from superseded requests
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const response =
          chartType === "global"
            ? await getGlobalCharts(timeWindow, 50)
            : chartType === "country"
            ? await getCountryCharts(country, timeWindow, 50)
            : chartType === "genre"
            ? await getGenreCharts(genre, timeWindow, 50)
            : await getTrendingTracks(50);
        if (id !== requestId.current) return;
        setCharts((response.charts || []) as ChartTrack[]);
        const stamp = "updatedAt" in response && response.updatedAt ? new Date(response.updatedAt as any) : new Date();
        setUpdatedAt(isNaN(stamp.getTime()) ? new Date() : stamp);
      } catch (err) {
        if (id !== requestId.current) return;
        if (!silent) setError(err instanceof Error ? err.message : "Couldn't load charts.");
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [chartType, timeWindow, country, genre]
  );

  useEffect(() => {
    fetchCharts();
  }, [fetchCharts]);

  // Quiet background refresh
  useEffect(() => {
    const t = setInterval(() => fetchCharts(true), AUTO_REFRESH_MS);
    return () => clearInterval(t);
  }, [fetchCharts]);

  // Real-time push from the server: refresh silently
  useEffect(() => {
    if (latestUpdate) fetchCharts(true);
  }, [latestUpdate, fetchCharts]);

  const toPlayerTrack = (t: ChartTrack) => ({
    id: t._id,
    title: t.title,
    artist: typeof t.creatorId === "object" && t.creatorId ? t.creatorId.name : t.artist || "Unknown Artist",
    coverImage: t.coverURL || "/placeholder-playlist.png",
    audioUrl: t.audioURL,
    creatorId: typeof t.creatorId === "object" && t.creatorId ? t.creatorId._id : undefined,
  });

  const handlePlay = (track: ChartTrack) => {
    playTrack(toPlayerTrack(track));
    setCurrentPlaylist(charts.filter((t) => t.audioURL).map(toPlayerTrack));
  };

  const firstInactive = charts.findIndex((t) => t.activeInPeriod === false);
  const activeCount = firstInactive === -1 ? charts.length : firstInactive;
  const periodPlaysTotal = charts
    .slice(0, activeCount)
    .reduce((sum, t) => sum + (t.metrics?.periodPlays || 0), 0);

  const scopeLabel =
    chartType === "country"
      ? COUNTRIES.find((c) => c.code === country)?.name
      : chartType === "genre"
      ? genre
      : chartType === "trending"
      ? "Trending"
      : "Global";

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-12">
      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-20 md:pt-8">
        {/* Header */}
        <header className="flex flex-col gap-1 mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">MuzikaX Charts</p>
          <div className="flex items-end justify-between gap-4">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">
              {chartType === "global" ? "Top 50" : scopeLabel}
            </h1>
            <button
              onClick={() => fetchCharts(true)}
              disabled={refreshing || loading}
              className="shrink-0 inline-flex items-center gap-2 h-9 px-3.5 rounded-full border border-border-light text-sm font-semibold text-text-secondary hover:text-text-primary hover:border-border-medium transition-colors disabled:opacity-60"
              aria-label="Refresh charts"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15a7 7 0 0011.8 2.4M18.4 9A7 7 0 006.6 6.6" />
              </svg>
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          <p className="text-sm text-text-secondary">
            {typeInfo.blurb}
            {chartType !== "trending" && <> · {windowInfo.label}</>}
            {updatedAt && (
              <span className="text-text-muted">
                {" "}
                · Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
          </p>
        </header>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
          <Segmented options={CHART_TYPES} value={chartType} onChange={setChartType} />
          <div className="flex items-center gap-3 flex-wrap">
            {chartType !== "trending" && (
              <Segmented options={WINDOWS} value={timeWindow} onChange={setTimeWindow} size="sm" />
            )}
            {chartType === "country" && (
              <Select
                label="Country"
                value={country}
                onChange={(v) => setCountry(v as CountryCode)}
                options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))}
              />
            )}
            {chartType === "genre" && (
              <Select label="Genre" value={genre} onChange={setGenre} options={GENRES.map((g) => ({ value: g, label: g }))} />
            )}
          </div>
        </div>

        {/* Summary */}
        {!loading && !error && charts.length > 0 && (
          <p className="text-xs text-text-muted mb-3">
            {activeCount > 0
              ? `${activeCount} ${activeCount === 1 ? "track" : "tracks"} played ${windowInfo.period} · ${periodPlaysTotal.toLocaleString()} ${
                  periodPlaysTotal === 1 ? "play" : "plays"
                }`
              : `No plays ${windowInfo.period} yet. Showing the most popular tracks of all time.`}
          </p>
        )}

        {/* Table */}
        <section className="rounded-2xl border border-border-light bg-surface p-2 md:p-3">
          {/* Column headers */}
          <div className="hidden md:grid grid-cols-[3rem_minmax(0,1fr)_9rem_7rem_7rem_2.5rem] gap-4 px-3 pb-2 mb-1 border-b border-border-light text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            <span className="text-center">#</span>
            <span>Title</span>
            <span>Genre</span>
            <span className="text-right">{chartType === "trending" ? "Plays this week" : `Plays ${windowInfo.period}`}</span>
            <span className="text-right">All time</span>
            <span />
          </div>

          {loading ? (
            <SkeletonRows />
          ) : error ? (
            <div className="py-16 text-center">
              <p className="text-text-primary font-semibold">Couldn&apos;t load charts</p>
              <p className="text-sm text-text-secondary mt-1">{error}</p>
              <button
                onClick={() => fetchCharts()}
                className="mt-5 h-10 px-6 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-bold transition-colors"
              >
                Try again
              </button>
            </div>
          ) : charts.length === 0 ? (
            <div className="py-16 px-4 text-center">
              <div className="mx-auto mb-4 w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center">
                <svg className="w-5 h-5 text-text-secondary" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
                </svg>
              </div>
              <p className="text-text-primary font-semibold">
                {chartType === "country"
                  ? `No plays from ${scopeLabel} ${windowInfo.period} yet`
                  : chartType === "genre"
                  ? `No ${genre} tracks yet`
                  : chartType === "trending"
                  ? "Nothing is trending this week yet"
                  : "No chart data yet"}
              </p>
              <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">
                Charts are built from real plays. Check back as listeners discover new music.
              </p>
            </div>
          ) : (
            <ol className="space-y-0.5">
              {charts.map((track, i) => (
                <li key={track._id}>
                  {i === firstInactive && firstInactive > 0 && (
                    <div className="flex items-center gap-3 px-3 pt-4 pb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted whitespace-nowrap">
                        Not played {windowInfo.period} · ranked by all-time popularity
                      </span>
                      <span className="h-px flex-1 bg-border-light" />
                    </div>
                  )}
                  <ChartTrackCard
                    track={track}
                    onPlay={() => handlePlay(track)}
                    isCurrent={currentTrack?.id === track._id}
                    isPlaying={isPlaying}
                    periodLabel={windowInfo.period}
                  />
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="mt-4 text-xs text-text-muted">
          Rankings use plays, unique listeners, likes and shares inside the selected period. Movement compares with the
          previous period once enough history exists.
        </p>
      </div>
    </div>
  );
}
