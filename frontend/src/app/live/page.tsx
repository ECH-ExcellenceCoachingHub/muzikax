'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../contexts/AuthContext';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import {
  getLiveSet,
  joinLive,
  leaveLive,
  listLiveSets,
  liveSocket,
  liveStreamUrl,
  sendChat,
  sendReaction,
  type LiveChat,
  type LiveSet,
} from '../../services/djService';

const REACTIONS: { kind: string; glyph: string; label: string }[] = [
  { kind: 'fire', glyph: '🔥', label: 'Fire' },
  { kind: 'clap', glyph: '👏', label: 'Applause' },
  { kind: 'heart', glyph: '❤️', label: 'Love' },
  { kind: 'hands', glyph: '🙌', label: 'Hands up' },
  { kind: 'wow', glyph: '😮', label: 'Wow' },
];

const since = (iso: string) => {
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}h ${m}m` : `${m}m`;
};

function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold tracking-wider">
      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> LIVE
    </span>
  );
}

/* ───────────── list ───────────── */

function LiveList() {
  const [sets, setSets] = useState<LiveSet[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => listLiveSets().then((s) => alive && setSets(s)).catch(() => alive && setSets([]));
    load();
    const t = setInterval(load, 15000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-20 md:pt-8 pb-28">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">MuzikaX Live</p>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-text-primary">Live DJ sets</h1>
          <p className="text-sm text-text-secondary mt-1">Tune in to DJs mixing right now, chat and react with the crowd.</p>
        </div>
        <Link href="/dj" className="h-10 px-5 inline-flex items-center rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-bold">
          Open DJ mode
        </Link>
      </header>

      {sets === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-56 rounded-2xl bg-surface border border-border-light animate-pulse" />
          ))}
        </div>
      ) : sets.length === 0 ? (
        <div className="rounded-2xl border border-border-light bg-surface py-16 px-6 text-center">
          <p className="text-text-primary font-semibold">Nobody is live right now</p>
          <p className="text-sm text-text-secondary mt-1 max-w-sm mx-auto">Creators can start a live set from DJ mode. This page updates automatically.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sets.map((s) => (
            <Link key={s.id} href={`/live?set=${s.id}`} className="mx-surface group block rounded-2xl overflow-hidden">
              <div className="relative aspect-[16/9] bg-surface-elevated overflow-hidden">
                {(s.nowPlaying?.cover || s.host.avatar) && (
                  <img src={s.nowPlaying?.cover || s.host.avatar} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70 transition-transform duration-500 group-hover:scale-[1.04]" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute top-3 left-3"><LiveBadge /></div>
                <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-black/60 text-[11px] font-semibold text-text-primary tabular-nums">
                  {s.listeners} listening
                </span>
                {s.nowPlaying && (
                  <p className="absolute bottom-3 left-3 right-3 truncate text-xs text-text-secondary">
                    Now: <span className="text-text-primary">{s.nowPlaying.title}</span>
                  </p>
                )}
              </div>
              <div className="p-4">
                <p className="mx-card-title">{s.title}</p>
                <p className="mx-card-subtitle">{s.host.name} · live for {since(s.startedAt)}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ───────────── room ───────────── */

function LiveRoom({ id }: { id: string }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const { pauseTrack, isPlaying: globalPlaying } = useAudioPlayer();
  const [state, setState] = useState<LiveSet | null>(null);
  const [ended, setEnded] = useState(false);
  const [hostAway, setHostAway] = useState(false);
  const [chat, setChat] = useState<LiveChat[]>([]);
  const [text, setText] = useState('');
  const [chatError, setChatError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [floaters, setFloaters] = useState<{ id: number; glyph: string; x: number }[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const [, tick] = useState(0);

  useEffect(() => {
    let alive = true;
    getLiveSet(id)
      .then((s) => alive && setState(s))
      .catch(() => alive && setEnded(true));
    joinLive(id)
      .then((r) => {
        if (!alive) return;
        if (r.ok && r.state) {
          setState(r.state);
          setChat(r.chat || []);
        } else setEnded(true);
      })
      .catch(() => {});

    const s = liveSocket();
    const onMeta = (d: { id: string; nowPlaying: LiveSet['nowPlaying'] }) => d.id === id && setState((st) => (st ? { ...st, nowPlaying: d.nowPlaying } : st));
    const onCount = (d: { id: string; listeners: number }) => d.id === id && setState((st) => (st ? { ...st, listeners: d.listeners } : st));
    const onChat = (m: LiveChat) => setChat((c) => [...c.slice(-100), m]);
    const onReact = (d: { kind: string }) => {
      const r = REACTIONS.find((x) => x.kind === d.kind);
      if (!r) return;
      const f = { id: Math.random(), glyph: r.glyph, x: 10 + Math.random() * 80 };
      setFloaters((fs) => [...fs.slice(-30), f]);
      setTimeout(() => setFloaters((fs) => fs.filter((x) => x.id !== f.id)), 2600);
    };
    const onEnded = (d: { id: string }) => {
      if (d.id !== id) return;
      setEnded(true);
      audioRef.current?.pause();
    };
    const onAway = (d: { id: string }) => d.id === id && setHostAway(true);
    const onRejoin = () => joinLive(id).catch(() => {});
    s.on('live:meta', onMeta);
    s.on('live:listeners', onCount);
    s.on('live:chat', onChat);
    s.on('live:react', onReact);
    s.on('live:ended', onEnded);
    s.on('live:host-reconnecting', onAway);
    s.on('connect', onRejoin);
    const t = setInterval(() => tick((x) => x + 1), 30000);
    return () => {
      alive = false;
      clearInterval(t);
      leaveLive(id);
      s.off('live:meta', onMeta);
      s.off('live:listeners', onCount);
      s.off('live:chat', onChat);
      s.off('live:react', onReact);
      s.off('live:ended', onEnded);
      s.off('live:host-reconnecting', onAway);
      s.off('connect', onRejoin);
    };
  }, [id]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ block: 'end' });
  }, [chat.length]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  const listen = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (listening) {
      a.pause();
      a.removeAttribute('src');
      a.load();
      setListening(false);
      return;
    }
    if (globalPlaying) pauseTrack();
    a.src = `${liveStreamUrl(id)}?t=${Date.now()}`; // fresh connection = live edge
    setBuffering(true);
    try {
      await a.play();
      setListening(true);
    } catch {
      setBuffering(false);
    }
  };

  if (ended) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-28 pb-28 text-center">
        <p className="text-xl font-bold text-text-primary">This live set has ended</p>
        <p className="text-sm text-text-secondary mt-1">Thanks for tuning in.</p>
        <button onClick={() => router.push('/live')} className="mt-6 h-10 px-5 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-bold">
          See who's live
        </button>
      </div>
    );
  }

  const cover = state?.nowPlaying?.cover || state?.host.avatar;

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 pt-20 md:pt-8 pb-28 grid lg:grid-cols-[minmax(0,1fr)_22rem] gap-4">
      {/* Stage */}
      <section className="relative rounded-3xl overflow-hidden border border-border-light bg-surface min-h-[420px] flex flex-col">
        {cover && <div className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-40" style={{ backgroundImage: `url(${cover})` }} />}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />

        {/* floating reactions */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {floaters.map((f) => (
            <span key={f.id} className="absolute bottom-24 text-3xl mx-float" style={{ left: `${f.x}%` }}>
              {f.glyph}
            </span>
          ))}
        </div>

        <div className="relative flex items-center justify-between p-4 sm:p-6">
          <button onClick={() => router.push('/live')} className="h-9 px-3 rounded-full bg-black/30 text-sm font-semibold text-text-secondary hover:text-text-primary">
            ← All live sets
          </button>
          <div className="flex items-center gap-2">
            <LiveBadge />
            <span className="px-2 py-0.5 rounded-full bg-black/40 text-xs font-semibold text-text-primary tabular-nums">{state?.listeners ?? 0} listening</span>
          </div>
        </div>

        <div className="relative mt-auto p-5 sm:p-8 flex flex-col sm:flex-row sm:items-end gap-5">
          <div className="w-28 h-28 sm:w-40 sm:h-40 rounded-2xl overflow-hidden bg-surface-elevated ring-1 ring-white/10 shadow-2xl shrink-0">
            {cover && <img src={cover} alt="" className="w-full h-full object-cover" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">{state?.host.name ?? 'DJ'} · live {state ? `for ${since(state.startedAt)}` : ''}</p>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-text-primary line-clamp-2">{state?.title ?? 'Loading…'}</h1>
            <p className="text-sm text-text-secondary mt-1 truncate">
              {state?.nowPlaying ? (
                <>Now playing <span className="text-text-primary">{state.nowPlaying.title}</span> · {state.nowPlaying.artist}</>
              ) : (
                'Mixing live'
              )}
            </p>
            {hostAway && <p className="text-xs text-amber-300 mt-1">The DJ's connection dropped — reconnecting…</p>}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button onClick={listen} className="h-12 px-7 rounded-full bg-primary hover:bg-primary-hover text-black font-bold inline-flex items-center gap-2">
                {listening ? (
                  <>
                    <span className="flex items-end gap-[2px] h-4" aria-hidden="true">
                      <span className="w-[3px] h-full bg-black rounded-sm animate-pulse" />
                      <span className="w-[3px] h-2/3 bg-black rounded-sm animate-pulse [animation-delay:150ms]" />
                      <span className="w-[3px] h-full bg-black rounded-sm animate-pulse [animation-delay:300ms]" />
                    </span>
                    {buffering ? 'Connecting…' : 'Stop listening'}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
                    Listen live
                  </>
                )}
              </button>
              <label className="flex items-center gap-2 text-xs text-text-secondary">
                <span className="sr-only">Volume</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5L6 9H2v6h4l5 4V5zM15.5 8.5a5 5 0 010 7" /></svg>
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="mx-range w-28" style={{ ['--pct' as any]: `${volume * 100}%` }} aria-label="Volume" />
              </label>
            </div>
            <audio
              ref={audioRef}
              preload="none"
              onWaiting={() => setBuffering(true)}
              onPlaying={() => setBuffering(false)}
              onError={() => {
                if (listening) setBuffering(true);
              }}
            />
          </div>
        </div>

        {/* reactions */}
        <div className="relative flex justify-center gap-2 p-4 border-t border-border-light bg-black/20">
          {REACTIONS.map((r) => (
            <button
              key={r.kind}
              onClick={() => sendReaction(id, r.kind)}
              className="w-11 h-11 rounded-full bg-surface-overlay hover:bg-white/15 text-xl transition-transform active:scale-90"
              aria-label={r.label}
              title={r.label}
            >
              {r.glyph}
            </button>
          ))}
        </div>
      </section>

      {/* Chat */}
      <aside className="rounded-3xl border border-border-light bg-surface flex flex-col h-[560px] lg:h-auto lg:max-h-[calc(100vh-6rem)]">
        <div className="px-4 py-3 border-b border-border-light">
          <p className="text-sm font-bold text-text-primary">Live chat</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
          {chat.length === 0 ? (
            <p className="text-xs text-text-muted text-center mt-8">Say hi to the DJ and the crowd.</p>
          ) : (
            chat.map((m) => (
              <div key={m.id} className="flex gap-2.5">
                <div className="w-7 h-7 rounded-full bg-surface-overlay overflow-hidden shrink-0">
                  {m.user.avatar && <img src={m.user.avatar} alt="" className="w-full h-full object-cover" />}
                </div>
                <p className="text-sm leading-snug min-w-0">
                  <span className={`font-semibold ${m.isHost ? 'text-primary' : 'text-text-primary'}`}>
                    {m.user.name}
                    {m.isHost && <span className="ml-1 text-[9px] font-bold uppercase tracking-wider">DJ</span>}
                  </span>{' '}
                  <span className="text-text-secondary break-words">{m.text}</span>
                </p>
              </div>
            ))
          )}
          <div ref={chatEnd} />
        </div>
        {isAuthenticated ? (
          <form
            className="p-3 border-t border-border-light"
            onSubmit={async (e) => {
              e.preventDefault();
              const t = text.trim();
              if (!t) return;
              setText('');
              const r = await sendChat(id, t).catch(() => null);
              setChatError(r && !r.ok ? r.message || 'Message not sent' : null);
            }}
          >
            <div className="flex gap-2">
              <input value={text} onChange={(e) => setText(e.target.value)} maxLength={300} placeholder="Send a message" className="flex-1 min-w-0 h-10 px-3.5 rounded-full bg-background border border-border-light text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary" />
              <button type="submit" className="h-10 px-4 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-bold">Send</button>
            </div>
            {chatError && <p className="mt-1.5 text-xs text-red-400">{chatError}</p>}
          </form>
        ) : (
          <div className="p-4 border-t border-border-light text-center">
            <Link href="/login" className="text-sm font-semibold text-primary hover:underline">Log in to chat</Link>
          </div>
        )}
      </aside>
    </div>
  );
}

function LivePageInner() {
  const params = useSearchParams();
  const id = params.get('set');
  return <div className="min-h-screen bg-background">{id ? <LiveRoom id={id} /> : <LiveList />}</div>;
}

export default function LivePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LivePageInner />
    </Suspense>
  );
}
