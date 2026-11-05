'use client';
// Renders from the DJ engine's mutable state, so opt out of React Compiler auto-memoisation.
'use no memo';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DJEngine, type DJTrack } from '../../components/dj/djEngine';
import { AutoDJ, type AutoDjStyle } from '../../components/dj/autoDj';
import DeckPanel, { DeckHeader, FxUnit, HotCues, JogWheel, Loops, Perform, TempoFader, Transport } from '../../components/dj/DeckPanel';
import SamplerPanel from '../../components/dj/SamplerPanel';
import { SHORTCUTS, useDJKeyboard } from '../../components/dj/useDJKeyboard';
import MixerPanel, { Crossfader } from '../../components/dj/MixerPanel';
import Library, { useCatalogue } from '../../components/dj/Library';
import { OverviewWaveform, ZoomWaveform } from '../../components/dj/Waveform';
import { PadButton, fmtTime, useDJ, useFrame } from '../../components/dj/controls';
import { useAudioPlayer } from '../../contexts/AudioPlayerContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  deleteMix,
  getMyMixes,
  liveSocket,
  publishMix,
  resumeLive,
  sendChat,
  sendLiveChunk,
  sendNowPlaying,
  startLive,
  stopLive,
  uploadMix,
  type DjMix,
  type LiveChat,
} from '../../services/djService';

/* ───────────── small UI pieces ───────────── */

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} max-h-[90dvh] overflow-y-auto bg-surface-elevated border border-border-medium rounded-t-3xl sm:rounded-2xl shadow-2xl shadow-black/60`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-light">
          <h2 className="text-base font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-overlay">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function RecTimer({ engine }: { engine: DJEngine }) {
  const ref = useRef<HTMLSpanElement>(null);
  useFrame(() => {
    if (ref.current) ref.current.textContent = fmtTime((Date.now() - engine.recordStartedAt) / 1000);
  }, engine.recording);
  return <span ref={ref} className="tabular-nums">0:00</span>;
}

type MobileTool = 'pads' | 'loops' | 'fx' | 'tempo' | 'mixer' | 'sampler' | 'tracks';
const MOBILE_TOOLS: { id: MobileTool; label: string }[] = [
  { id: 'pads', label: 'Pads' },
  { id: 'loops', label: 'Loops' },
  { id: 'fx', label: 'FX' },
  { id: 'tempo', label: 'Tempo' },
  { id: 'mixer', label: 'Mixer' },
  { id: 'sampler', label: 'Sampler' },
  { id: 'tracks', label: 'Tracks' },
];
const DECK_TOOLS: MobileTool[] = ['pads', 'loops', 'fx', 'tempo'];

const primaryBtn = 'h-10 px-5 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-bold disabled:opacity-40 transition-colors';
const ghostBtn = 'h-10 px-4 rounded-full border border-border-medium text-sm font-semibold text-text-primary hover:bg-surface-overlay disabled:opacity-40 transition-colors';

/* ───────────── page ───────────── */

export default function DJPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { pauseTrack, isPlaying } = useAudioPlayer();
  const { tracks, loading, error } = useCatalogue();
  const tracksRef = useRef<DJTrack[]>([]);
  tracksRef.current = tracks;

  const [engine, setEngine] = useState<DJEngine | null>(null);
  const [auto, setAuto] = useState<AutoDJ | null>(null);
  const [mobileTool, setMobileTool] = useState<MobileTool>('pads');
  const [mobileDeck, setMobileDeck] = useState<0 | 1>(0);
  const [notice, setNotice] = useState<string | null>(null);

  // recording / saving
  const [saving, setSaving] = useState<{ blob: Blob; duration: number; mimeType: string; tracklist: DjMix['tracklist']; autoDj: boolean } | null>(null);
  const [mixTitle, setMixTitle] = useState('');
  const [uploadPct, setUploadPct] = useState<number | null>(null);
  const [savedMix, setSavedMix] = useState<DjMix | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  // live
  const [liveId, setLiveId] = useState<string | null>(null);
  const [goLiveOpen, setGoLiveOpen] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [liveBusy, setLiveBusy] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [listeners, setListeners] = useState(0);
  const [chat, setChat] = useState<LiveChat[]>([]);
  const [chatText, setChatText] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  // dialogs
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [mixesOpen, setMixesOpen] = useState(false);
  const [mixes, setMixes] = useState<DjMix[] | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);

  const canGoLive = user?.role === 'creator' || user?.role === 'admin';
  const canPublish = user?.role === 'creator';

  /* engine lifecycle */
  useEffect(() => {
    const e = new DJEngine();
    const a = new AutoDJ(e, () => tracksRef.current);
    setEngine(e);
    setAuto(a);
    if (process.env.NODE_ENV !== 'production') (window as any).__muzikaxDJ = { engine: e, auto: a }; // dev-only debugging handle
    return () => {
      a.stop();
      e.destroy();
    };
  }, []);
  useDJ(engine);

  // the regular player would play on top of the decks
  useEffect(() => {
    if (isPlaying) pauseTrack();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // warn before leaving mid-set
  useEffect(() => {
    const busy = engine?.recording || !!liveId;
    if (!busy) return;
    const h = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [engine?.recording, liveId]);

  const flash = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice((n) => (n === msg ? null : n)), 3500);
  };

  // Always act on the CURRENT engine. Callbacks handed to memoised children (the library)
  // read through refs, so they can never target a stale/destroyed engine.
  const engineRef = useRef<DJEngine | null>(null);
  const autoRef = useRef<AutoDJ | null>(null);
  engineRef.current = engine;
  autoRef.current = auto;

  const onManual = useCallback(() => autoRef.current?.notifyManual(), []);

  const loadOnDeck = useCallback((id: 0 | 1, t: DJTrack) => {
    const e = engineRef.current;
    if (!e) return;
    const deck = e.decks[id];
    if (deck.playing && deck.onAir > 0.1 && !window.confirm(`Deck ${id === 0 ? 'A' : 'B'} is playing to the crowd. Load anyway?`)) return;
    autoRef.current?.notifyManual();
    e.resume();
    deck.load(t);
  }, []);
  const enqueue = useCallback((t: DJTrack) => autoRef.current?.enqueue(t), []);
  const dequeue = useCallback((id: string) => autoRef.current?.removeFromQueue(id), []);

  /* ───── recording ───── */
  const toggleRecording = async () => {
    if (!engine) return;
    if (!engine.recording) {
      try {
        engine.resume();
        engine.startRecording();
        flash('Recording started. Everything on the master output is captured.');
      } catch (e) {
        flash((e as Error).message);
      }
      return;
    }
    const tracklist = [...engine.tracklist];
    const res = await engine.stopRecording();
    if (!res || res.duration < 3) return flash('Recording was too short to save.');
    setSaving({ ...res, tracklist, autoDj: !!auto?.enabled });
    setMixTitle(`Mix ${new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`);
    setSavedMix(null);
    setSaveError(null);
    setUploadPct(null);
  };

  const download = (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name.replace(/[^\w\- ]/g, '') || 'mix'}.${blob.type.includes('mp4') ? 'm4a' : 'webm'}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const saveMix = async () => {
    if (!saving) return;
    if (!isAuthenticated) return setSaveError('Log in to save mixes to your library. You can still download it.');
    setSaveError(null);
    setUploadPct(0);
    try {
      const mix = await uploadMix(saving.blob, { title: mixTitle.trim() || 'Untitled mix', duration: saving.duration, tracklist: saving.tracklist, autoDj: saving.autoDj }, (p) => setUploadPct(p));
      setSavedMix(mix);
      setMixes(null);
    } catch (e) {
      setSaveError((e as Error).message);
    } finally {
      setUploadPct(null);
    }
  };

  const doPublish = async (id: string) => {
    try {
      await publishMix(id);
      flash('Published — your mix is now on the Mixes page.');
      setMixes(await getMyMixes());
      if (savedMix?._id === id) setSavedMix({ ...savedMix, publishedTrackId: 'published' });
    } catch (e) {
      flash((e as Error).message);
    }
  };

  /* ───── live ───── */
  useEffect(() => {
    if (!liveId) return;
    const s = liveSocket();
    const onCount = (d: { id: string; listeners: number }) => d.id === liveId && setListeners(d.listeners);
    const onChat = (m: LiveChat) => setChat((c) => [...c.slice(-80), m]);
    const onErr = (d: { message: string }) => {
      setLiveError(d.message);
      endLive(false);
    };
    const onReconnect = () => resumeLive(liveId).catch(() => {});
    s.on('live:listeners', onCount);
    s.on('live:chat', onChat);
    s.on('dj:error', onErr);
    s.on('connect', onReconnect);
    return () => {
      s.off('live:listeners', onCount);
      s.off('live:chat', onChat);
      s.off('dj:error', onErr);
      s.off('connect', onReconnect);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveId]);

  const goLive = async () => {
    if (!engine) return;
    setLiveBusy(true);
    setLiveError(null);
    try {
      const res = await startLive(liveTitle.trim() || `${user?.name ?? 'DJ'} live`);
      if (!res.ok || !res.id) throw new Error(res.message || 'Could not go live.');
      engine.resume();
      engine.onLiveChunk = sendLiveChunk;
      engine.onNowPlaying = (t) => sendNowPlaying(t ? { title: t.title, artist: t.artist, cover: t.cover } : null);
      engine.startLiveCapture();
      setLiveId(res.id);
      setListeners(0);
      setChat([]);
      setGoLiveOpen(false);
      setChatOpen(true);
    } catch (e) {
      setLiveError((e as Error).message);
    } finally {
      setLiveBusy(false);
    }
  };

  const endLive = (notify = true) => {
    engine?.stopLiveCapture();
    if (engine) {
      engine.onLiveChunk = null;
      engine.onNowPlaying = null;
    }
    stopLive();
    setLiveId(null);
    setChatOpen(false);
    if (notify) flash('Your live set has ended.');
  };

  const shareLink = liveId && typeof window !== 'undefined' ? `${window.location.origin}/live?set=${liveId}` : '';

  /* ───── settings ───── */
  const loadDevices = async (askNames = false) => {
    try {
      if (askNames) {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true });
        s.getTracks().forEach((t) => t.stop());
      }
      const list = await navigator.mediaDevices.enumerateDevices();
      setDevices(list.filter((d) => d.kind === 'audiooutput'));
    } catch {
      setDevices([]);
    }
  };

  useEffect(() => {
    if (settingsOpen) loadDevices();
  }, [settingsOpen]);

  useEffect(() => {
    if (mixesOpen && mixes === null && isAuthenticated) getMyMixes().then(setMixes).catch(() => setMixes([]));
  }, [mixesOpen, mixes, isAuthenticated]);

  useDJKeyboard(engine, auto, { toggleRecording, showHelp: () => setHelpOpen(true), enabled: true });

  if (!engine || !auto) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-text-secondary text-sm">Starting DJ mode…</div>;
  }

  const [A, B] = engine.decks;
  const loadedIds = engine.decks.map((d) => d.track?.id);

  return (
    <div className="dj-root min-h-screen bg-background text-text-primary pb-32 lg:pb-6">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border-light">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5">
          <button
            onClick={() => {
              if ((engine.recording || liveId) && !window.confirm('Leave DJ mode? Your recording or live set will stop.')) return;
              router.back();
            }}
            className="h-9 px-3 rounded-full flex items-center gap-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
            Exit
          </button>
          <div className="mr-auto">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary leading-none">MuzikaX</p>
            <h1 className="text-base font-extrabold leading-tight">DJ Mode</h1>
          </div>

          {/* Auto DJ */}
          <div className="flex items-center gap-2 h-10 pl-1.5 pr-1.5 sm:pr-3 rounded-full bg-surface border border-border-light max-w-full">
            <button
              onClick={() => (auto.enabled ? auto.stop() : auto.start())}
              className={`h-7 px-3 rounded-full text-xs font-bold transition-colors ${auto.enabled ? 'bg-primary text-black' : 'bg-surface-overlay text-text-primary hover:bg-white/15'}`}
              aria-pressed={auto.enabled}
            >
              Auto DJ {auto.enabled ? 'ON' : 'OFF'}
            </button>
            <select
              value={auto.style}
              onChange={(e) => {
                auto.style = e.target.value as AutoDjStyle;
                engine.emit();
              }}
              className="hidden sm:block bg-transparent text-xs font-semibold text-text-secondary focus:outline-none"
              aria-label="Auto DJ style"
            >
              <option value="full" className="bg-surface-elevated">Full tracks</option>
              <option value="short" className="bg-surface-elevated">Quick mix (~90 s)</option>
            </select>
            <select
              value={auto.transitionBeats}
              onChange={(e) => {
                auto.transitionBeats = Number(e.target.value);
                engine.emit();
              }}
              className="hidden sm:block bg-transparent text-xs font-semibold text-text-secondary focus:outline-none"
              aria-label="Transition length"
            >
              {[8, 16, 32].map((b) => (
                <option key={b} value={b} className="bg-surface-elevated">{b}-beat blend</option>
              ))}
            </select>
          </div>

          {/* Record */}
          <button
            onClick={toggleRecording}
            className={`h-10 px-4 rounded-full flex items-center gap-2 text-sm font-bold border transition-colors ${
              engine.recording ? 'bg-red-500/15 border-red-500/60 text-red-300' : 'border-border-medium text-text-primary hover:bg-surface-overlay'
            }`}
            aria-pressed={engine.recording}
          >
            <span className={`w-2.5 h-2.5 rounded-full ${engine.recording ? 'bg-red-500 animate-pulse' : 'bg-red-500/80'}`} />
            {engine.recording ? <RecTimer engine={engine} /> : 'Record'}
          </button>

          {/* Live */}
          {liveId ? (
            <div className="flex items-center gap-1.5">
              <button onClick={() => setChatOpen((o) => !o)} className="h-10 px-4 rounded-full flex items-center gap-2 text-sm font-bold bg-red-500 text-white">
                <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> LIVE · {listeners}
              </button>
              <button onClick={() => endLive()} className={ghostBtn}>End</button>
            </div>
          ) : (
            <button
              onClick={() => (canGoLive ? (setLiveTitle(`${user?.name ?? 'DJ'} live`), setGoLiveOpen(true)) : flash(isAuthenticated ? 'Going live is for creator accounts. Upgrade in your profile.' : 'Log in with a creator account to go live.'))}
              className={ghostBtn}
            >
              Go live
            </button>
          )}

          <button onClick={() => setMixesOpen(true)} className={`${ghostBtn} hidden sm:inline-flex items-center`}>My mixes</button>
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="Keyboard shortcuts"
            title="Keyboard shortcuts (?)"
            className="hidden lg:flex w-10 h-10 rounded-full border border-border-medium items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-overlay"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path strokeLinecap="round" d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10" />
            </svg>
          </button>
          <button onClick={() => setSettingsOpen(true)} aria-label="Audio settings" className="w-10 h-10 rounded-full border border-border-medium flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-overlay">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></svg>
          </button>
        </div>
        {(auto.enabled || auto.status !== 'Off') && (
          <p className="px-3 sm:px-5 pb-2 text-xs text-text-secondary truncate">
            <span className="font-semibold text-primary">Auto DJ</span> · {auto.status}
          </p>
        )}
      </header>

      {notice && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-6 z-[9999] px-4 py-2.5 rounded-full bg-surface-elevated border border-border-medium text-sm text-text-primary shadow-xl shadow-black/50" role="status">
          {notice}
        </div>
      )}

      <main className="px-3 sm:px-5 pt-3 space-y-3 max-w-[1600px] mx-auto">
        {/* Beat-matching view */}
        <div className="grid gap-1.5">
          <ZoomWaveform deck={A} label="A" />
          <ZoomWaveform deck={B} label="B" />
        </div>

        {/* Desktop booth */}
        <div className="hidden lg:grid gap-3 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-start">
          <DeckPanel deck={A} side="A" onDropTrack={(t) => loadOnDeck(0, t)} onManual={onManual} />
          <div className="space-y-3 w-[19rem]">
            <MixerPanel engine={engine} onManual={onManual} />
            <SamplerPanel engine={engine} />
          </div>
          <DeckPanel deck={B} side="B" onDropTrack={(t) => loadOnDeck(1, t)} onManual={onManual} />
        </div>

        {/* Mobile booth: both decks always visible, tools in tabs, crossfader pinned at the bottom */}
        <div className="lg:hidden space-y-2.5">
          {[A, B].map((d, i) => (
            <div
              key={i}
              onPointerDown={() => DECK_TOOLS.includes(mobileTool) && setMobileDeck(i as 0 | 1)}
              className={`rounded-2xl border bg-surface p-3 space-y-2.5 transition-colors ${
                DECK_TOOLS.includes(mobileTool) && mobileDeck === i ? 'border-primary/60' : 'border-border-light'
              }`}
            >
              <DeckHeader deck={d} side={i === 0 ? 'A' : 'B'} compact />
              <OverviewWaveform deck={d} height={30} />
              <Transport deck={d} onManual={onManual} big />
            </div>
          ))}

          <nav className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-3 px-3 py-1" aria-label="DJ tools">
            {MOBILE_TOOLS.map((t) => (
              <button
                key={t.id}
                onClick={() => setMobileTool(t.id)}
                aria-pressed={mobileTool === t.id}
                className={`dj-pad shrink-0 h-10 px-4 rounded-full text-sm font-semibold ${
                  mobileTool === t.id ? 'bg-primary text-black' : 'bg-surface border border-border-light text-text-secondary'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {DECK_TOOLS.includes(mobileTool) && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-muted">Deck</span>
              <div className="flex gap-1 p-1 rounded-full bg-surface border border-border-light">
                {['A', 'B'].map((l, i) => (
                  <button
                    key={l}
                    onClick={() => setMobileDeck(i as 0 | 1)}
                    className={`dj-pad h-9 w-12 rounded-full text-sm font-bold ${mobileDeck === i ? 'bg-surface-overlay text-text-primary' : 'text-text-secondary'}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(() => {
            const d = engine.decks[mobileDeck];
            const side = mobileDeck === 0 ? 'A' : 'B';
            switch (mobileTool) {
              case 'pads':
                return (
                  <div className="rounded-2xl border border-border-light bg-surface p-3 space-y-4">
                    <HotCues deck={d} onManual={onManual} big />
                    <Perform deck={d} onManual={onManual} big />
                  </div>
                );
              case 'loops':
                return (
                  <div className="rounded-2xl border border-border-light bg-surface p-3">
                    <Loops deck={d} onManual={onManual} big />
                  </div>
                );
              case 'fx':
                return <FxUnit deck={d} onManual={onManual} big />;
              case 'tempo':
                return (
                  <div className="rounded-2xl border border-border-light bg-surface p-4 flex items-center justify-around gap-4">
                    <JogWheel deck={d} side={side} />
                    <TempoFader deck={d} onManual={onManual} height={160} />
                  </div>
                );
              case 'mixer':
                return <MixerPanel engine={engine} onManual={onManual} hideCrossfader />;
              case 'sampler':
                return <SamplerPanel engine={engine} big />;
              default:
                return null;
            }
          })()}
        </div>

        <div className={mobileTool === 'tracks' ? '' : 'hidden lg:block'}>
        <Library
          tracks={tracks}
          loading={loading}
          error={error}
          queue={auto.queue}
          onLoad={loadOnDeck}
          onQueue={enqueue}
          onRemoveFromQueue={dequeue}
          loadedIds={loadedIds}
        />
        </div>
      </main>

      {/* Mobile: crossfader always under your thumb */}
      <div className="lg:hidden fixed inset-x-0 bottom-0 z-40 bg-background/95 backdrop-blur-xl border-t border-border-light px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Crossfader engine={engine} onManual={onManual} />
      </div>

      {/* Live chat (DJ side) */}
      {liveId && chatOpen && (
        <aside className="fixed right-3 bottom-3 top-24 z-50 w-[min(22rem,calc(100vw-1.5rem))] flex flex-col rounded-2xl bg-surface-elevated border border-border-medium shadow-2xl shadow-black/60">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-light">
            <div>
              <p className="text-sm font-bold">Live chat</p>
              <p className="text-[11px] text-text-secondary">{listeners} listening</p>
            </div>
            <button onClick={() => setChatOpen(false)} aria-label="Hide chat" className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-overlay">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          <div className="px-4 py-2 border-b border-border-light flex items-center gap-2">
            <input readOnly value={shareLink} className="flex-1 min-w-0 h-8 px-2.5 rounded-md bg-background border border-border-light text-xs text-text-secondary" aria-label="Share link" />
            <button onClick={() => navigator.clipboard?.writeText(shareLink).then(() => flash('Link copied'))} className="h-8 px-3 rounded-md bg-primary text-black text-xs font-bold">Copy</button>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {chat.length === 0 ? (
              <p className="text-xs text-text-muted text-center mt-6">Share the link — messages from your audience appear here.</p>
            ) : (
              chat.map((m) => (
                <p key={m.id} className="text-sm leading-snug">
                  <span className={`font-semibold ${m.isHost ? 'text-primary' : 'text-text-primary'}`}>{m.user.name}</span>{' '}
                  <span className="text-text-secondary">{m.text}</span>
                </p>
              ))
            )}
          </div>
          <form
            className="p-3 border-t border-border-light flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              const text = chatText.trim();
              if (!text) return;
              setChatText('');
              const r = await sendChat(liveId, text).catch(() => null);
              if (r && !r.ok && r.message) flash(r.message);
            }}
          >
            <input value={chatText} onChange={(e) => setChatText(e.target.value)} maxLength={300} placeholder="Say something to the crowd" className="flex-1 min-w-0 h-9 px-3 rounded-full bg-background border border-border-light text-sm placeholder:text-text-muted focus:outline-none focus:border-primary" />
            <button type="submit" className="h-9 px-4 rounded-full bg-primary text-black text-sm font-bold">Send</button>
          </form>
        </aside>
      )}

      {/* Go live */}
      {goLiveOpen && (
        <Modal title="Go live" onClose={() => setGoLiveOpen(false)}>
          <p className="text-sm text-text-secondary mb-4">
            Everything on your master output streams to your audience (about 2–4 seconds behind you). Listeners join from a link or the Live page, and can chat and react.
          </p>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5" htmlFor="live-title">Set title</label>
          <input id="live-title" value={liveTitle} onChange={(e) => setLiveTitle(e.target.value)} maxLength={100} className="w-full h-10 px-3.5 rounded-xl bg-background border border-border-medium text-sm focus:outline-none focus:border-primary" />
          {!DJEngine.liveSupported() && <p className="mt-3 text-sm text-red-400">Live streaming needs Chrome, Edge or Firefox.</p>}
          {liveError && <p className="mt-3 text-sm text-red-400">{liveError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <button onClick={() => setGoLiveOpen(false)} className={ghostBtn}>Cancel</button>
            <button onClick={goLive} disabled={liveBusy || !DJEngine.liveSupported()} className={primaryBtn}>{liveBusy ? 'Starting…' : 'Start live set'}</button>
          </div>
        </Modal>
      )}

      {/* Save recording */}
      {saving && (
        <Modal title={savedMix ? 'Mix saved' : 'Save your mix'} onClose={() => uploadPct === null && setSaving(null)}>
          {savedMix ? (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                <span className="font-semibold text-text-primary">{savedMix.title}</span> is in <span className="font-semibold text-text-primary">My mixes</span>. Only you can see it until you publish it.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={() => download(saving.blob, savedMix.title)} className={ghostBtn}>Download</button>
                {canPublish && !savedMix.publishedTrackId && (
                  <button onClick={() => doPublish(savedMix._id)} className={primaryBtn}>Publish to Mixes</button>
                )}
                <button onClick={() => setSaving(null)} className={ghostBtn}>Done</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary">
                {fmtTime(saving.duration)} recorded{saving.tracklist.length ? ` · ${saving.tracklist.length} tracks` : ''}.
              </p>
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1.5" htmlFor="mix-title">Mix name</label>
                <input id="mix-title" value={mixTitle} onChange={(e) => setMixTitle(e.target.value)} maxLength={120} className="w-full h-10 px-3.5 rounded-xl bg-background border border-border-medium text-sm focus:outline-none focus:border-primary" />
              </div>
              {saving.tracklist.length > 0 && (
                <ol className="max-h-40 overflow-y-auto rounded-xl bg-background border border-border-light p-3 space-y-1 text-xs">
                  {saving.tracklist.map((t, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="tabular-nums text-text-muted w-10 shrink-0">{fmtTime(t.at)}</span>
                      <span className="truncate text-text-secondary"><span className="text-text-primary">{t.title}</span> · {t.artist}</span>
                    </li>
                  ))}
                </ol>
              )}
              {uploadPct !== null && (
                <div className="h-1.5 rounded-full bg-surface-overlay overflow-hidden" role="progressbar" aria-valuenow={Math.round(uploadPct)}>
                  <div className="h-full bg-primary transition-all" style={{ width: `${uploadPct}%` }} />
                </div>
              )}
              {saveError && <p className="text-sm text-red-400">{saveError}</p>}
              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={() => window.confirm('Discard this recording?') && setSaving(null)} disabled={uploadPct !== null} className="h-10 px-4 text-sm font-semibold text-text-secondary hover:text-red-400">Discard</button>
                <button onClick={() => download(saving.blob, mixTitle)} disabled={uploadPct !== null} className={ghostBtn}>Download</button>
                <button onClick={saveMix} disabled={uploadPct !== null || !mixTitle.trim()} className={primaryBtn}>
                  {uploadPct !== null ? `Uploading ${Math.round(uploadPct)}%` : 'Save to My mixes'}
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}

      {/* My mixes */}
      {mixesOpen && (
        <Modal title="My mixes" onClose={() => setMixesOpen(false)} wide>
          {!isAuthenticated ? (
            <p className="text-sm text-text-secondary">Log in to keep your recorded mixes.</p>
          ) : mixes === null ? (
            <p className="text-sm text-text-secondary">Loading…</p>
          ) : mixes.length === 0 ? (
            <p className="text-sm text-text-secondary">No mixes yet. Press Record, play a set, then stop to save it here.</p>
          ) : (
            <ul className="space-y-3">
              {mixes.map((m) => (
                <li key={m._id} className="rounded-xl bg-background border border-border-light p-3">
                  <div className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{m.title}</p>
                      <p className="text-xs text-text-secondary">
                        {fmtTime(m.duration)} · {m.tracklist.length} tracks · {new Date(m.createdAt).toLocaleDateString()}
                        {m.autoDj ? ' · Auto DJ' : ''}
                        {m.publishedTrackId ? ' · Published' : ' · Private'}
                      </p>
                    </div>
                    {canPublish && !m.publishedTrackId && (
                      <button onClick={() => doPublish(m._id)} className="h-8 px-3 rounded-full bg-primary text-black text-xs font-bold">Publish</button>
                    )}
                    <button
                      onClick={async () => {
                        if (!window.confirm(`Delete "${m.title}"?`)) return;
                        await deleteMix(m._id).catch(() => null);
                        setMixes((list) => (list || []).filter((x) => x._id !== m._id));
                      }}
                      className="h-8 px-3 rounded-full text-xs font-semibold text-text-secondary hover:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                  <audio controls preload="none" src={m.audioURL} className="mt-2 w-full h-9" />
                </li>
              ))}
            </ul>
          )}
        </Modal>
      )}

      {/* Keyboard shortcuts */}
      {helpOpen && (
        <Modal title="Keyboard shortcuts" onClose={() => setHelpOpen(false)} wide>
          <p className="text-sm text-text-secondary mb-4">
            Deck A sits under your left hand, Deck B mirrors it under your right, the same action on the same finger. Keys follow their position, so this works on any keyboard layout.
          </p>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
            {SHORTCUTS.map((g) => (
              <section key={g.group}>
                <h3 className="text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-2">{g.group}</h3>
                <table className="w-full text-sm">
                  <tbody>
                    {g.items.map((it) => (
                      <tr key={it.action} className="border-t border-border-light first:border-t-0">
                        <td className="py-1.5 pr-3 text-text-secondary">{it.action}</td>
                        <td className="py-1.5 text-right whitespace-nowrap">
                          {it.keys.filter(Boolean).map((k, i) => (
                            <span key={i}>
                              {i > 0 && <span className="mx-1 text-text-muted text-xs">·</span>}
                              <kbd className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-overlay border border-border-medium text-[11px] font-semibold text-text-primary">
                                {it.keys.length > 1 && it.keys[1] && <span className="text-primary">{i === 0 ? 'A' : 'B'}</span>}
                                {k}
                              </kbd>
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ))}
          </div>
        </Modal>
      )}

      {/* Settings */}
      {settingsOpen && (
        <Modal title="Audio setup" onClose={() => setSettingsOpen(false)}>
          <div className="space-y-5 text-sm">
            <div className="sm:hidden space-y-2">
              <p className="font-semibold">Auto DJ</p>
              <div className="flex gap-2">
                <select value={auto.style} onChange={(e) => { auto.style = e.target.value as AutoDjStyle; engine.emit(); }} className="flex-1 h-10 px-3 rounded-xl bg-background border border-border-medium focus:outline-none" aria-label="Auto DJ style">
                  <option value="full">Full tracks</option>
                  <option value="short">Quick mix (~90 s)</option>
                </select>
                <select value={auto.transitionBeats} onChange={(e) => { auto.transitionBeats = Number(e.target.value); engine.emit(); }} className="flex-1 h-10 px-3 rounded-xl bg-background border border-border-medium focus:outline-none" aria-label="Transition length">
                  {[8, 16, 32].map((b) => (
                    <option key={b} value={b}>{b}-beat blend</option>
                  ))}
                </select>
              </div>
              <button onClick={() => { setSettingsOpen(false); setMixesOpen(true); }} className={`${ghostBtn} w-full`}>My mixes</button>
            </div>
            <div>
              <p className="font-semibold mb-1">Headphones (cue)</p>
              <p className="text-xs text-text-secondary mb-2">Send the cue mix to a second output, e.g. headphones plugged into a USB audio interface.</p>
              {engine.supportsOutputSelection ? (
                <select value={engine.headphoneDeviceId} onChange={(e) => engine.setHeadphoneDevice(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-background border border-border-medium focus:outline-none">
                  <option value="">Off</option>
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Output ${i + 1}`}</option>
                  ))}
                </select>
              ) : (
                <p className="text-xs text-text-muted">This browser can't choose outputs. Use Split cue below, or Chrome/Edge.</p>
              )}
              {devices.length > 0 && devices.every((d) => !d.label) && (
                <button onClick={() => loadDevices(true)} className="mt-2 text-xs font-semibold text-primary hover:underline">Show device names</button>
              )}
            </div>
            {engine.supportsOutputSelection && (
              <div>
                <p className="font-semibold mb-1">Main output (speakers)</p>
                <select value={engine.masterDeviceId} onChange={(e) => engine.setMasterDevice(e.target.value)} className="w-full h-10 px-3 rounded-xl bg-background border border-border-medium focus:outline-none">
                  <option value="">System default</option>
                  {devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Output ${i + 1}`}</option>
                  ))}
                </select>
              </div>
            )}
            <label className="flex items-start justify-between gap-4">
              <span>
                <span className="font-semibold block">Split cue</span>
                <span className="text-xs text-text-secondary">One output only: master in your left ear, cue in your right (mono).</span>
              </span>
              <input type="checkbox" checked={engine.splitCue} onChange={(e) => engine.setSplitCue(e.target.checked)} className="mt-1 w-4 h-4 accent-[rgb(var(--primary-rgb))]" />
            </label>
            {[A, B].map((d, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <span className="font-semibold">Deck {i === 0 ? 'A' : 'B'}</span>
                <div className="flex gap-4 text-xs text-text-secondary">
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={d.quantize} onChange={(e) => { d.quantize = e.target.checked; engine.emit(); }} className="accent-[rgb(var(--primary-rgb))]" /> Quantize
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={d.autoGain} onChange={(e) => { d.autoGain = e.target.checked; d.applyTrim(); engine.emit(); }} className="accent-[rgb(var(--primary-rgb))]" /> Auto gain
                  </label>
                </div>
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
