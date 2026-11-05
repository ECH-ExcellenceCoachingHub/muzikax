'use client';
// Renders from the DJ engine's mutable state, so opt out of React Compiler auto-memoisation.
'use no memo';

import { memo, useEffect, useMemo, useState } from 'react';
import type { DJTrack } from './djEngine';
import { getCachedBpm } from './analysis';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function toDJTrack(t: any): DJTrack | null {
  if (!t?.audioURL) return null;
  return {
    id: t._id || t.id,
    title: t.title || 'Untitled',
    artist: (typeof t.creatorId === 'object' && t.creatorId?.name) || t.artist || 'Unknown artist',
    cover: t.coverURL || t.coverImage || '',
    audioUrl: t.audioURL,
    genre: t.genre,
  };
}

/** Loads the playable catalogue once (used by the library and as Auto DJ's pool) */
export function useCatalogue() {
  const [tracks, setTracks] = useState<DJTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const all: DJTrack[] = [];
        for (let page = 1; page <= 5; page++) {
          const res = await fetch(`${API}/api/tracks?page=${page}&limit=100`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          for (const t of data.tracks || []) {
            const d = toDJTrack(t);
            if (d) all.push(d);
          }
          if (page >= (data.pages || 1)) break;
        }
        if (alive) setTracks(all);
      } catch (e) {
        if (alive) setError("Couldn't load the music library.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);
  return { tracks, loading, error };
}

type Tab = 'library' | 'queue';

function Library({
  tracks,
  loading,
  error,
  queue,
  onLoad,
  onQueue,
  onRemoveFromQueue,
  loadedIds,
}: {
  tracks: DJTrack[];
  loading: boolean;
  error: string | null;
  queue: DJTrack[];
  onLoad: (deck: 0 | 1, t: DJTrack) => void;
  onQueue: (t: DJTrack) => void;
  onRemoveFromQueue: (id: string) => void;
  loadedIds: (string | undefined)[];
}) {
  const [tab, setTab] = useState<Tab>('library');
  const [q, setQ] = useState('');
  const [genre, setGenre] = useState('all');
  const [, refresh] = useState(0);

  // BPMs appear once a track has been analysed on a deck
  useEffect(() => {
    const t = setInterval(() => refresh((x) => x + 1), 4000);
    return () => clearInterval(t);
  }, []);

  const genres = useMemo(() => {
    const g = new Set<string>();
    tracks.forEach((t) => t.genre && g.add(t.genre.toLowerCase()));
    return ['all', ...[...g].sort()];
  }, [tracks]);

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = tab === 'queue' ? queue : tracks;
    return list.filter(
      (t) =>
        (genre === 'all' || tab === 'queue' || t.genre?.toLowerCase() === genre) &&
        (!needle || t.title.toLowerCase().includes(needle) || t.artist.toLowerCase().includes(needle))
    );
  }, [tracks, queue, q, genre, tab]);

  return (
    <section className="rounded-2xl border border-border-light bg-surface flex flex-col min-h-0" aria-label="Library">
      <div className="flex flex-wrap items-center gap-2 p-3 border-b border-border-light">
        <div className="flex gap-1 p-1 rounded-full bg-background border border-border-light">
          {(['library', 'queue'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1 rounded-full text-xs font-semibold ${tab === t ? 'bg-surface-overlay text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {t === 'library' ? `Library (${tracks.length})` : `Auto DJ queue (${queue.length})`}
            </button>
          ))}
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tracks or artists"
          className="flex-1 min-w-[10rem] h-8 px-3 rounded-full bg-background border border-border-light text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
        />
        {tab === 'library' && (
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="h-8 px-3 rounded-full bg-background border border-border-light text-xs font-semibold text-text-primary focus:outline-none"
            aria-label="Filter by genre"
          >
            {genres.map((g) => (
              <option key={g} value={g} className="bg-surface-elevated">
                {g === 'all' ? 'All genres' : g.replace(/\b\w/g, (c) => c.toUpperCase())}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="overflow-y-auto max-h-[55vh] lg:max-h-[30vh]">
        {loading ? (
          <p className="p-6 text-sm text-text-secondary text-center">Loading library…</p>
        ) : error ? (
          <p className="p-6 text-sm text-red-400 text-center">{error}</p>
        ) : shown.length === 0 ? (
          <p className="p-6 text-sm text-text-secondary text-center">
            {tab === 'queue' ? 'Queue is empty — Auto DJ picks tracks from the library automatically.' : 'No tracks match.'}
          </p>
        ) : (
          <table className="w-full table-fixed text-sm" /* fixed layout: long titles truncate instead of pushing buttons off-screen */>
            <thead className="sticky top-0 bg-surface text-[10px] uppercase tracking-wider text-text-muted">
              <tr>
                <th className="text-left font-semibold px-3 py-2">Title</th>
                <th className="text-left font-semibold px-3 py-2 hidden md:table-cell w-36">Genre</th>
                <th className="text-right font-semibold px-3 py-2 w-16 hidden sm:table-cell">BPM</th>
                <th className="w-[9.25rem] sm:w-[11.5rem]"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {shown.map((t) => {
                const bpm = getCachedBpm(t.id);
                const onDeck = loadedIds.indexOf(t.id);
                return (
                  <tr
                    key={t.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('application/x-muzikax-track', JSON.stringify(t))}
                    className="border-t border-border-light hover:bg-white/[0.03] cursor-grab"
                  >
                    <td className="px-3 py-1.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded bg-surface-overlay overflow-hidden shrink-0">
                          {t.cover && <img src={t.cover} alt="" className="w-full h-full object-cover" loading="lazy" />}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-text-primary">{t.title}</p>
                          <p className="truncate text-xs text-text-secondary">{t.artist}</p>
                        </div>
                        {onDeck >= 0 && <span className="shrink-0 text-[10px] font-bold text-primary">ON {onDeck === 0 ? 'A' : 'B'}</span>}
                      </div>
                    </td>
                    <td className="px-3 py-1.5 hidden md:table-cell text-text-secondary capitalize truncate">{t.genre}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-text-secondary hidden sm:table-cell">{bpm ? bpm.toFixed(0) : '—'}</td>
                    <td className="pl-1 pr-2 sm:px-3 py-1.5">
                      <div className="flex justify-end items-center gap-1.5 flex-nowrap">
                        {tab === 'queue' ? (
                          <button onClick={() => onRemoveFromQueue(t.id)} className="dj-pad h-10 sm:h-7 px-2.5 rounded-md text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-overlay">
                            Remove
                          </button>
                        ) : (
                          <>
                            <button onClick={() => onLoad(0, t)} className="dj-pad h-10 w-10 sm:h-7 sm:w-8 rounded-md border border-border-medium text-xs font-bold text-text-primary hover:bg-surface-overlay" title="Load on deck A">A</button>
                            <button onClick={() => onLoad(1, t)} className="dj-pad h-10 w-10 sm:h-7 sm:w-8 rounded-md border border-border-medium text-xs font-bold text-text-primary hover:bg-surface-overlay" title="Load on deck B">B</button>
                            <button
                              onClick={() => onQueue(t)}
                              disabled={queue.some((x) => x.id === t.id)}
                              className="dj-pad inline-flex items-center justify-center gap-1 h-10 w-10 sm:h-7 sm:w-auto sm:px-2.5 shrink-0 whitespace-nowrap rounded-md border border-border-medium text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-overlay disabled:opacity-40"
                              title={queue.some((x) => x.id === t.id) ? "In the Auto DJ queue" : "Add to Auto DJ queue"}
                              aria-label="Add to Auto DJ queue"
                            >
                              {queue.some((x) => x.id === t.id) ? (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                              ) : (
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" d="M12 5v14M5 12h14" /></svg>
                              )}
                              <span className="hidden sm:inline">{queue.some((x) => x.id === t.id) ? "Queued" : "Queue"}</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

// Re-render only when the library's own data changes, not on every engine event
const same = (a: Parameters<typeof Library>[0], b: Parameters<typeof Library>[0]) =>
  a.tracks === b.tracks &&
  a.loading === b.loading &&
  a.error === b.error &&
  a.queue.map((q) => q.id).join() === b.queue.map((q) => q.id).join() &&
  a.loadedIds.join() === b.loadedIds.join();

export default memo(Library, same);
