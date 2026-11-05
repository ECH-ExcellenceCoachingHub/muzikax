'use client';
// Renders from the DJ engine's mutable state, so opt out of React Compiler auto-memoisation.
'use no memo';

import { useRef, useState } from 'react';
import type { Deck, DJTrack, FxType } from './djEngine';
import { Knob, PadButton, VFader, fmtTime, useFrame } from './controls';
import { HOT_CUE_COLORS, OverviewWaveform } from './Waveform';

const LOOPS = [0.5, 1, 2, 4, 8, 16];
const ROLLS = [0.125, 0.25, 0.5, 1];
const FX_TYPES: { id: FxType; label: string; timed: boolean }[] = [
  { id: 'echo', label: 'Echo', timed: true },
  { id: 'reverb', label: 'Reverb', timed: false },
  { id: 'flanger', label: 'Flanger', timed: true },
  { id: 'phaser', label: 'Phaser', timed: true },
  { id: 'gate', label: 'Gate', timed: true },
  { id: 'crush', label: 'Crush', timed: false },
];
const beatLabel = (b: number) => (b === 0.125 ? '⅛' : b === 0.25 ? '¼' : b === 0.5 ? '½' : b === 0.75 ? '¾' : String(b));

type Props = { deck: Deck; side: 'A' | 'B'; onManual: () => void };

/* ───────────── pieces (shared by desktop deck and mobile booth) ───────────── */

export function JogWheel({ deck, side, compact = false }: { deck: Deck; side: 'A' | 'B'; compact?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const markerRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ angle: number; t: number } | null>(null);

  useFrame(() => {
    if (markerRef.current) markerRef.current.style.transform = `rotate(${(deck.position() * 200) % 360}deg)`;
  });

  const angleOf = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  };

  return (
    <div
      ref={ref}
      role="presentation"
      aria-label={`Deck ${side} jog wheel`}
      className={`relative aspect-square w-full ${compact ? 'max-w-[112px]' : 'max-w-[180px]'} rounded-full bg-gradient-to-b from-zinc-800 to-zinc-950 ring-1 ring-white/10 shadow-inner shadow-black touch-none cursor-grab active:cursor-grabbing select-none`}
      onPointerDown={(e) => {
        if (!deck.buffer) return;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        drag.current = { angle: angleOf(e), t: performance.now() };
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const a = angleOf(e);
        let delta = a - d.angle;
        if (delta > Math.PI) delta -= 2 * Math.PI;
        if (delta < -Math.PI) delta += 2 * Math.PI;
        const now = performance.now();
        const dt = Math.max(1, now - d.t);
        if (deck.playing) deck.nudge(Math.max(-0.2, Math.min(0.2, (delta / dt) * 6)));
        else deck.seek(deck.position() + (delta / (2 * Math.PI)) * 1.8);
        drag.current = { angle: a, t: now };
      }}
      onPointerUp={() => {
        drag.current = null;
        deck.endNudge();
      }}
    >
      <div className="absolute inset-[10%] rounded-full bg-zinc-900 ring-1 ring-black/60 overflow-hidden">
        {deck.track?.cover ? (
          <img src={deck.track.cover} alt="" className="w-full h-full object-cover opacity-80" draggable={false} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/10">{side}</div>
        )}
      </div>
      <div ref={markerRef} className="absolute inset-0">
        <div className="absolute left-1/2 top-[3%] -translate-x-1/2 w-1.5 h-[9%] rounded-full bg-primary" />
      </div>
      <div className="absolute inset-[44%] rounded-full bg-zinc-950 ring-1 ring-white/10" />
    </div>
  );
}

function TimeReadout({ deck }: { deck: Deck }) {
  const el = useRef<HTMLSpanElement>(null);
  const rem = useRef<HTMLSpanElement>(null);
  useFrame(() => {
    const p = deck.position();
    if (el.current) el.current.textContent = fmtTime(p);
    if (rem.current) rem.current.textContent = `-${fmtTime(deck.duration - p)}`;
  });
  return (
    <span className="flex items-baseline gap-2 tabular-nums">
      <span ref={el} className="text-sm font-semibold text-text-primary">0:00</span>
      <span ref={rem} className="text-xs text-text-muted">-0:00</span>
    </span>
  );
}

export function DeckHeader({ deck, side, compact = false }: { deck: Deck; side: 'A' | 'B'; compact?: boolean }) {
  const loaded = !!deck.buffer;
  const pct = (deck.rate - 1) * 100;
  return (
    <div className="flex items-center gap-2.5 min-w-0">
      <span className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-xs font-black ${deck.playing ? 'bg-primary text-black' : 'bg-surface-overlay text-text-secondary'}`}>{side}</span>
      <div className="min-w-0 flex-1">
        {deck.track ? (
          <>
            <p className="truncate text-sm font-semibold text-text-primary" title={deck.track.title}>{deck.track.title}</p>
            <p className="truncate text-xs text-text-secondary">
              {compact && loaded ? <TimeReadout deck={deck} /> : deck.loading ? `Loading… ${Math.round(deck.loadProgress * 100)}%` : deck.track.artist}
            </p>
          </>
        ) : (
          <p className="text-sm text-text-muted truncate">{deck.error ?? (compact ? 'Empty: load from Tracks' : `Drag a track here or press ${side} in the library`)}</p>
        )}
      </div>
      <div className="text-right shrink-0">
        <p className={`${compact ? 'text-base' : 'text-lg'} font-bold tabular-nums leading-none text-text-primary`}>{loaded ? deck.currentBpm.toFixed(1) : '—'}</p>
        <p className={`text-[11px] tabular-nums mt-0.5 ${Math.abs(pct) < 0.05 ? 'text-text-muted' : 'text-primary'}`}>{loaded ? `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%` : 'BPM'}</p>
      </div>
    </div>
  );
}

export function Transport({ deck, onManual, big = false }: { deck: Deck; onManual: () => void; big?: boolean }) {
  const loaded = !!deck.buffer;
  const h = big ? 'h-12' : 'h-11';
  return (
    <div className="grid grid-cols-[1fr_1.3fr_1fr] gap-2">
      <PadButton
        className={`${h} text-sm`}
        disabled={!loaded}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          onManual();
          deck.cueDown();
        }}
        onPointerUp={() => deck.cueUp()}
        onPointerCancel={() => deck.cueUp()}
        title="Cue: when stopped sets the cue point (hold to preview); when playing jumps back to it"
      >
        CUE
      </PadButton>
      <PadButton
        className={`${h} text-sm`}
        tone="primary"
        active={deck.playing}
        disabled={!loaded}
        onPress={() => {
          onManual();
          deck.latchPreview();
          deck.togglePlay();
        }}
        aria-label={deck.playing ? 'Pause' : 'Play'}
      >
        {deck.playing ? (
          <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4h3v12H5zM12 4h3v12h-3z" /></svg>
        ) : (
          <svg className="w-4 h-4 mx-auto" fill="currentColor" viewBox="0 0 20 20"><path d="M6.3 2.84A1.5 1.5 0 004 4.11v11.78a1.5 1.5 0 002.3 1.27l9.344-5.891a1.5 1.5 0 000-2.538L6.3 2.84z" /></svg>
        )}
      </PadButton>
      <PadButton className={`${h} text-sm`} disabled={!loaded} onPress={() => { onManual(); deck.sync(); }} title="Match tempo and beats to the other deck">
        SYNC
      </PadButton>
    </div>
  );
}

export function TempoFader({ deck, onManual, height = 130 }: { deck: Deck; onManual: () => void; height?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-[10px] font-semibold text-text-muted">−</span>
      <VFader label="Tempo" value={deck.rate} min={1 - deck.tempoRange} max={1 + deck.tempoRange} invert height={height} marks={[1]} defaultValue={1} onGrab={onManual} onChange={(v) => deck.setRate(v)} />
      <span className="text-[10px] font-semibold text-text-muted">+</span>
      <button onClick={() => deck.setTempoRange(deck.tempoRange === 0.08 ? 0.16 : 0.08)} className="text-[10px] font-semibold text-text-secondary hover:text-text-primary" title="Tempo range">
        ±{Math.round(deck.tempoRange * 100)}%
      </button>
    </div>
  );
}

export function HotCues({ deck, onManual, big = false }: { deck: Deck; onManual: () => void; big?: boolean }) {
  const loaded = !!deck.buffer;
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
        Hot cues <span className="normal-case tracking-normal">· {big ? 'hold to clear' : 'right-click or hold to clear'}</span>
      </p>
      <div className={`grid ${big ? 'grid-cols-4' : 'grid-cols-8'} gap-1.5`}>
        {deck.hotCues.map((c, i) => (
          <button
            key={i}
            type="button"
            disabled={!loaded}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              onManual();
              if (e.shiftKey) return deck.clearHotCue(i);
              deck.hotCue(i);
              // long-press clears (touch-friendly)
              if (c != null) pressTimer.current = setTimeout(() => deck.clearHotCue(i), 650);
            }}
            onPointerUp={() => pressTimer.current && clearTimeout(pressTimer.current)}
            onPointerLeave={() => pressTimer.current && clearTimeout(pressTimer.current)}
            onClick={(e) => e.detail === 0 && deck.hotCue(i)}
            onContextMenu={(e) => {
              e.preventDefault();
              deck.clearHotCue(i);
            }}
            className={`dj-pad ${big ? 'h-14 text-sm' : 'h-8 text-[11px]'} rounded-md border font-bold disabled:opacity-35`}
            style={
              c != null
                ? { background: HOT_CUE_COLORS[i], borderColor: HOT_CUE_COLORS[i], color: '#000' }
                : { background: 'transparent', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.45)' }
            }
            title={c != null ? `Hot cue ${i + 1} at ${fmtTime(c)}` : `Set hot cue ${i + 1}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Loops({ deck, onManual, big = false }: { deck: Deck; onManual: () => void; big?: boolean }) {
  const loaded = !!deck.buffer;
  const h = big ? 'h-12' : '';
  const active = (b: number) => !!deck.loop && Math.abs(deck.loop.beats - b) < 1e-6;
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Loop (beats)</p>
      <div className={`grid ${big ? 'grid-cols-3' : 'grid-cols-9'} gap-1.5`}>
        {LOOPS.map((b) => (
          <PadButton
            key={b}
            className={h}
            disabled={!loaded}
            active={active(b)}
            onPress={() => { onManual(); deck.setLoop(b); }}
            style={active(b) ? { background: '#22C55E', borderColor: '#22C55E', color: '#000' } : undefined}
          >
            {beatLabel(b)}
          </PadButton>
        ))}
        <PadButton className={h} disabled={!deck.loop} onPress={() => deck.resizeLoop(0.5)} title="Halve loop">½×</PadButton>
        <PadButton className={h} disabled={!deck.loop} onPress={() => deck.resizeLoop(2)} title="Double loop">2×</PadButton>
        <PadButton className={h} disabled={!deck.loop} onPress={() => deck.exitLoop()} title="Exit loop">EXIT</PadButton>
      </div>
      <p className="pt-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Beat jump</p>
      <div className="grid grid-cols-4 gap-1.5">
        {[-16, -4, 4, 16].map((b) => (
          <PadButton key={b} className={h} disabled={!loaded} onPress={() => { onManual(); deck.beatJump(b); }} title={`Jump ${b > 0 ? 'forward' : 'back'} ${Math.abs(b)} beats`}>
            {b > 0 ? `+${b}` : b}
          </PadButton>
        ))}
      </div>
    </div>
  );
}

/** Roll (hold = beat repeat with slip), Brake, BPM ×2/÷2 */
export function Perform({ deck, onManual, big = false }: { deck: Deck; onManual: () => void; big?: boolean }) {
  const loaded = !!deck.buffer;
  const h = big ? 'h-12' : '';
  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Roll <span className="normal-case tracking-normal">· hold, the track keeps going underneath</span></p>
      <div className="grid grid-cols-4 gap-1.5">
        {ROLLS.map((b) => (
          <PadButton
            key={b}
            className={h}
            disabled={!deck.playing}
            onPointerDown={(e) => {
              if (e.button !== 0) return;
              (e.target as HTMLElement).setPointerCapture(e.pointerId);
              onManual();
              deck.rollStart(b);
            }}
            onPointerUp={() => deck.rollEnd()}
            onPointerCancel={() => deck.rollEnd()}
          >
            {beatLabel(b)}
          </PadButton>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 pt-1">
        <PadButton className={h} disabled={!deck.playing} active={deck.braking} tone="danger" onPress={() => { onManual(); deck.brake(); }} title="Vinyl stop">
          BRAKE
        </PadButton>
        <PadButton className={h} disabled={!loaded} onPress={() => deck.scaleBpm(0.5)} title="Detected tempo is double: halve it">BPM ÷2</PadButton>
        <PadButton className={h} disabled={!loaded} onPress={() => deck.scaleBpm(2)} title="Detected tempo is half: double it">BPM ×2</PadButton>
      </div>
    </div>
  );
}

export function FxUnit({ deck, onManual, big = false }: { deck: Deck; onManual: () => void; big?: boolean }) {
  const timed = FX_TYPES.find((f) => f.id === deck.fx.type)?.timed;
  return (
    <div className="rounded-xl bg-black/25 border border-border-light p-2.5 space-y-2.5">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
        {FX_TYPES.map((t) => (
          <PadButton key={t.id} className={`${big ? 'h-11' : 'h-7'} text-[10px] uppercase`} active={deck.fx.type === t.id} onPress={() => deck.setFx({ type: t.id })}>
            {t.label}
          </PadButton>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {timed ? (
          <div className="flex gap-1">
            {[0.25, 0.5, 0.75, 1].map((b) => (
              <PadButton key={b} className={`${big ? 'h-11 w-11' : 'h-7 w-8'} text-[11px]`} active={deck.fx.beats === b} onPress={() => deck.setFx({ beats: b })} title={`${beatLabel(b)} beat`}>
                {beatLabel(b)}
              </PadButton>
            ))}
          </div>
        ) : (
          <span className="text-[10px] text-text-muted w-[8.5rem]">Not tempo-synced</span>
        )}
        <Knob label={deck.fx.type === 'crush' ? 'Amount' : 'Wet'} value={deck.fx.wet} min={0} max={1} defaultValue={0.5} bipolar={false} size={big ? 48 : 40} onChange={(v) => deck.setFx({ wet: v })} format={(v) => `${Math.round(v * 100)}%`} />
        <PadButton className={`ml-auto ${big ? 'h-12' : 'h-10'} px-4`} tone="primary" active={deck.fx.on} onPress={() => { onManual(); deck.setFx({ on: !deck.fx.on }); }}>
          FX {deck.fx.on ? 'ON' : 'OFF'}
        </PadButton>
      </div>
    </div>
  );
}

/* ───────────── desktop deck ───────────── */

function DeckPanel({ deck, side, onDropTrack, onManual }: Props & { onDropTrack: (t: DJTrack) => void }) {
  const [dragOver, setDragOver] = useState(false);
  const loaded = !!deck.buffer;
  return (
    <section
      className={`flex flex-col gap-3 rounded-2xl border bg-surface p-3 sm:p-4 min-w-0 transition-colors ${dragOver ? 'border-primary' : 'border-border-light'}`}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes('application/x-muzikax-track')) {
          e.preventDefault();
          setDragOver(true);
        }
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        setDragOver(false);
        const raw = e.dataTransfer.getData('application/x-muzikax-track');
        if (raw) onDropTrack(JSON.parse(raw));
      }}
      aria-label={`Deck ${side}`}
    >
      <DeckHeader deck={deck} side={side} />
      <div className="flex items-center justify-between">
        {loaded ? <TimeReadout deck={deck} /> : <span className="text-xs text-text-muted">{deck.loading ? `Loading… ${Math.round(deck.loadProgress * 100)}%` : ' '}</span>}
        {loaded && <span className="text-[10px] text-text-muted">Key follows tempo</span>}
      </div>
      <OverviewWaveform deck={deck} />
      <div className="flex items-center gap-3">
        <div className="flex-1 flex justify-center">
          <JogWheel deck={deck} side={side} />
        </div>
        <TempoFader deck={deck} onManual={onManual} />
      </div>
      <Transport deck={deck} onManual={onManual} />
      <HotCues deck={deck} onManual={onManual} />
      <Loops deck={deck} onManual={onManual} />
      <Perform deck={deck} onManual={onManual} />
      <FxUnit deck={deck} onManual={onManual} />
    </section>
  );
}

export default DeckPanel;
