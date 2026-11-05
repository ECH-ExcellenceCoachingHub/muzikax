'use client';

import React, { useState } from 'react';
import { trackShare, type ChartTrack } from '../services/chartService';
import { shareContent } from '../utils/webShare';

/** 1234 -> "1,234", 15300 -> "15.3K" — never "0.0K". */
export function formatCount(n: number | null | undefined): string {
  const v = Number(n) || 0;
  if (v < 10000) return v.toLocaleString();
  return new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(v);
}

export function formatGenre(genre?: string): string {
  if (!genre) return '';
  const special: Record<string, string> = { 'r&b': 'R&B', rnb: 'R&B', hiphop: 'Hip Hop', 'hip-hop': 'Hip Hop', lofi: 'Lo-Fi' };
  return special[genre.toLowerCase()] ?? genre.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function Movement({ track }: { track: ChartTrack }) {
  if (track.activeInPeriod === false) {
    return <span className="text-text-muted" aria-label="Not ranked this period">–</span>;
  }
  if (track.isNew) {
    return (
      <span className="text-[10px] font-bold tracking-wide text-primary" aria-label="New entry">
        NEW
      </span>
    );
  }
  const change = track.rankChange;
  if (change == null || change === 0) {
    return (
      <span className="text-text-muted" aria-label={change === 0 ? 'No change' : 'No previous rank'}>
        –
      </span>
    );
  }
  const up = change > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums ${up ? 'text-emerald-400' : 'text-red-400'}`}
      aria-label={`${up ? 'Up' : 'Down'} ${Math.abs(change)}`}
    >
      <svg className="w-2.5 h-2.5" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
        {up ? <path d="M5 1l4 6H1z" /> : <path d="M5 9L1 3h8z" />}
      </svg>
      {Math.abs(change)}
    </span>
  );
}

interface ChartRowProps {
  track: ChartTrack;
  onPlay: () => void;
  isCurrent: boolean;
  isPlaying: boolean;
  periodLabel: string; // e.g. "this week"
}

export default function ChartTrackCard({ track, onPlay, isCurrent, isPlaying, periodLabel }: ChartRowProps) {
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const artistName =
    typeof track.creatorId === 'object' && track.creatorId !== null ? track.creatorId.name : track.artist || 'Unknown Artist';
  const periodPlays = track.metrics?.periodPlays ?? 0;
  const totalPlays = track.metrics?.totalPlays ?? track.plays ?? 0;
  const inactive = track.activeInPeriod === false;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sharing) return;
    setSharing(true);
    try {
      const url = `${window.location.origin}/tracks/${track._id}`;
      const result = await shareContent('copy', track.title, url, track.coverURL);
      if (result.success) {
        trackShare(track._id, result.method === 'native' ? 'web_share' : 'copy').catch(() => {});
        if (result.method !== 'native') {
          setCopied(true);
          setTimeout(() => setCopied(false), 1800);
        }
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onPlay();
        }
      }}
      data-active={isCurrent}
      className="mx-row group cursor-pointer !py-2 md:grid md:grid-cols-[3rem_minmax(0,1fr)_9rem_7rem_7rem_2.5rem] md:gap-4"
    >
      {/* Rank + movement */}
      <div className="w-9 md:w-auto shrink-0 flex flex-col items-center justify-center leading-none gap-1">
        <span
          className={`text-base md:text-lg font-bold tabular-nums ${
            isCurrent ? 'text-primary' : inactive ? 'text-text-muted' : 'text-text-primary'
          }`}
        >
          {track.rank}
        </span>
        <Movement track={track} />
      </div>

      {/* Track */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="relative w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-md overflow-hidden bg-surface-elevated">
          {track.coverURL ? (
            <img src={track.coverURL} alt="" className="w-full h-full object-cover" loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-muted text-xs font-semibold">
              {track.title.slice(0, 2).toUpperCase()}
            </div>
          )}
          <span
            className={`absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-150 ${
              isCurrent ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'
            }`}
            aria-hidden="true"
          >
            {isCurrent && isPlaying ? (
              <span className="flex items-end gap-[2px] h-4">
                <span className="w-[3px] h-full bg-primary rounded-sm animate-pulse" />
                <span className="w-[3px] h-2/3 bg-primary rounded-sm animate-pulse [animation-delay:150ms]" />
                <span className="w-[3px] h-full bg-primary rounded-sm animate-pulse [animation-delay:300ms]" />
              </span>
            ) : (
              <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            )}
          </span>
        </div>
        <div className="min-w-0">
          <p className="mx-card-title" title={track.title}>
            {track.title}
          </p>
          <p className="mx-card-subtitle">
            {artistName}
            {/* On mobile the stats columns are hidden, so show the period plays inline */}
            <span className="md:hidden">
              {' · '}
              {inactive
                ? `${formatCount(totalPlays)} ${totalPlays === 1 ? 'play' : 'plays'} total`
                : `${formatCount(periodPlays)} ${periodPlays === 1 ? 'play' : 'plays'} ${periodLabel}`}
            </span>
          </p>
        </div>
      </div>

      {/* Genre */}
      <div className="hidden md:block text-sm text-text-secondary truncate">{formatGenre(track.genre)}</div>

      {/* Plays in period */}
      <div className="hidden md:block text-right text-sm tabular-nums">
        {inactive ? (
          <span className="text-text-muted">—</span>
        ) : (
          <span className="text-text-primary font-medium">{formatCount(periodPlays)}</span>
        )}
      </div>

      {/* All-time plays */}
      <div className="hidden md:block text-right text-sm tabular-nums text-text-secondary">{formatCount(totalPlays)}</div>

      {/* Share */}
      <div className="shrink-0 flex justify-end">
        <button
          type="button"
          onClick={handleShare}
          disabled={sharing}
          title={copied ? 'Link copied' : 'Share'}
          aria-label={copied ? 'Link copied' : `Share ${track.title}`}
          className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100 disabled:opacity-50"
        >
          {copied ? (
            <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v14" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
