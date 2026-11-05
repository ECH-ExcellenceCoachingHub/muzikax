'use client';
// Renders from the DJ engine's mutable state, so opt out of React Compiler auto-memoisation.
'use no memo';

import { useRef } from 'react';
import type { Deck } from './djEngine';
import { WAVE_RATE } from './analysis';
import { useFrame } from './controls';

export const HOT_CUE_COLORS = ['#FF8C00', '#22C55E', '#3B82F6', '#EAB308', '#EC4899', '#14B8A6', '#A855F7', '#F97316'];

/** bass-heavy = brand orange, bright = warm white */
function colorFor(bass: number, alpha = 1) {
  const r = 255;
  const g = Math.round(140 + (236 - 140) * (1 - bass));
  const b = Math.round(0 + 210 * (1 - bass));
  return `rgba(${r},${g},${b},${alpha})`;
}

function setup(cv: HTMLCanvasElement) {
  const dpr = window.devicePixelRatio || 1;
  const w = cv.clientWidth;
  const h = cv.clientHeight;
  if (!w || !h) return null; // hidden (e.g. the other layout): nothing to draw
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) {
    cv.width = Math.round(w * dpr);
    cv.height = Math.round(h * dpr);
  }
  const ctx = cv.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

/* ───────────── Overview (whole track) ───────────── */

export function OverviewWaveform({ deck, height = 44 }: { deck: Deck; height?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cache = useRef<{ key: string; img: HTMLCanvasElement | null }>({ key: '', img: null });

  useFrame(() => {
    const cv = ref.current;
    if (!cv) return;
    const sized = setup(cv);
    if (!sized) return;
    const { ctx, w, h } = sized;
    ctx.clearRect(0, 0, w, h);
    const a = deck.analysis;
    if (!a) {
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      ctx.fillRect(0, h / 2 - 0.5, w, 1);
      if (deck.loading) {
        ctx.fillStyle = 'rgba(255,140,0,0.6)';
        ctx.fillRect(0, h - 2, w * deck.loadProgress, 2);
      }
      return;
    }
    // render the static waveform once per size/track into an offscreen canvas
    const key = `${deck.track?.id}-${w}-${h}`;
    if (cache.current.key !== key) {
      const off = document.createElement('canvas');
      const dpr = window.devicePixelRatio || 1;
      off.width = w * dpr;
      off.height = h * dpr;
      const o = off.getContext('2d')!;
      o.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = a.peaks.length;
      for (let x = 0; x < w; x++) {
        const i0 = Math.floor((x / w) * n);
        const i1 = Math.max(i0 + 1, Math.floor(((x + 1) / w) * n));
        let pk = 0;
        let bs = 0;
        for (let i = i0; i < i1; i++) {
          if (a.peaks[i] > pk) pk = a.peaks[i];
          bs += a.bass[i];
        }
        bs /= i1 - i0;
        const bh = Math.max(1, pk * h * 0.95);
        o.fillStyle = colorFor(bs);
        o.fillRect(x, (h - bh) / 2, 1, bh);
      }
      cache.current = { key, img: off };
    }
    const pos = deck.position();
    const px = (pos / a.duration) * w;
    ctx.drawImage(cache.current.img!, 0, 0, w, h);
    // dim the played part
    ctx.fillStyle = 'rgba(10,10,11,0.55)';
    ctx.fillRect(0, 0, px, h);
    // loop
    if (deck.loop) {
      ctx.fillStyle = 'rgba(34,197,94,0.25)';
      const x0 = (deck.loop.start / a.duration) * w;
      ctx.fillRect(x0, 0, Math.max(2, ((deck.loop.end - deck.loop.start) / a.duration) * w), h);
    }
    // cue + hot cues
    const mark = (t: number, color: string) => {
      const x = (t / a.duration) * w;
      ctx.fillStyle = color;
      ctx.fillRect(x - 0.5, 0, 1.5, h);
      ctx.beginPath();
      ctx.moveTo(x - 3, 0);
      ctx.lineTo(x + 3, 0);
      ctx.lineTo(x, 4);
      ctx.fill();
    };
    mark(deck.cuePoint, '#fff');
    deck.hotCues.forEach((c, i) => c != null && mark(c, HOT_CUE_COLORS[i]));
    // playhead
    ctx.fillStyle = '#fff';
    ctx.fillRect(px - 1, 0, 2, h);
  });

  return (
    <canvas
      ref={ref}
      className="w-full cursor-pointer rounded-md bg-black/40"
      style={{ height }}
      onPointerDown={(e) => {
        if (!deck.analysis) return;
        const r = (e.target as HTMLCanvasElement).getBoundingClientRect();
        deck.seek(((e.clientX - r.left) / r.width) * deck.analysis.duration);
      }}
      aria-label="Track overview: click to jump"
    />
  );
}

/* ───────────── Zoomed (scrolling, beat grid) ───────────── */

export function ZoomWaveform({ deck, label, height = 64, seconds = 8 }: { deck: Deck; label: string; height?: number; seconds?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const scrub = useRef<{ x: number; pos: number; wasPlaying: boolean } | null>(null);

  useFrame(() => {
    const cv = ref.current;
    if (!cv) return;
    const sized = setup(cv);
    if (!sized) return;
    const { ctx, w, h } = sized;
    ctx.clearRect(0, 0, w, h);
    const a = deck.analysis;
    const mid = w / 2;
    if (a) {
      const pos = deck.position();
      const pps = w / seconds; // pixels per second
      const t0 = pos - seconds / 2;
      // beat grid
      if (a.bpm) {
        const beat = 60 / a.bpm;
        let k = Math.ceil((t0 - a.firstBeat) / beat);
        for (let t = a.firstBeat + k * beat; t < t0 + seconds; t += beat, k++) {
          const x = (t - t0) * pps;
          const bar = ((k % 4) + 4) % 4 === 0;
          ctx.fillStyle = bar ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.08)';
          ctx.fillRect(Math.round(x), 0, 1, h);
        }
      }
      // loop region
      if (deck.loop) {
        ctx.fillStyle = 'rgba(34,197,94,0.18)';
        ctx.fillRect((deck.loop.start - t0) * pps, 0, (deck.loop.end - deck.loop.start) * pps, h);
      }
      // waveform: one column per pixel
      for (let x = 0; x < w; x++) {
        const t = t0 + x / pps;
        if (t < 0 || t >= a.duration) continue;
        const i0 = Math.floor(t * WAVE_RATE);
        const i1 = Math.max(i0 + 1, Math.floor((t0 + (x + 1) / pps) * WAVE_RATE));
        let pk = 0;
        let bs = 0;
        let n = 0;
        for (let i = i0; i < i1 && i < a.peaks.length; i++) {
          if (a.peaks[i] > pk) pk = a.peaks[i];
          bs += a.bass[i];
          n++;
        }
        if (!n) continue;
        const bh = Math.max(1, pk * (h - 6));
        ctx.fillStyle = colorFor(bs / n, x < mid ? 0.55 : 1);
        ctx.fillRect(x, (h - bh) / 2, 1, bh);
      }
      // cue markers
      const mark = (t: number, color: string) => {
        const x = (t - t0) * pps;
        if (x < -4 || x > w + 4) return;
        ctx.fillStyle = color;
        ctx.fillRect(x - 1, 0, 2, h);
      };
      mark(deck.cuePoint, '#fff');
      deck.hotCues.forEach((c, i) => c != null && mark(c, HOT_CUE_COLORS[i]));
    }
    // playhead
    ctx.fillStyle = '#fff';
    ctx.fillRect(mid - 1, 0, 2, h);
    ctx.beginPath();
    ctx.moveTo(mid - 5, 0);
    ctx.lineTo(mid + 5, 0);
    ctx.lineTo(mid, 6);
    ctx.fill();
  });

  return (
    <div className="relative">
      <canvas
        ref={ref}
        className="w-full rounded-md bg-black/50 cursor-grab active:cursor-grabbing touch-none"
        style={{ height }}
        onPointerDown={(e) => {
          if (!deck.analysis) return;
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          scrub.current = { x: e.clientX, pos: deck.position(), wasPlaying: deck.playing };
          if (deck.playing) deck.pause();
        }}
        onPointerMove={(e) => {
          if (!scrub.current || !deck.analysis) return;
          const w = (e.target as HTMLCanvasElement).clientWidth;
          const dt = -((e.clientX - scrub.current.x) / w) * seconds;
          deck.seek(scrub.current.pos + dt);
        }}
        onPointerUp={() => {
          if (scrub.current?.wasPlaying) deck.play();
          scrub.current = null;
        }}
        aria-label={`Deck ${label} waveform: drag to move through the track`}
      />
      <span className="pointer-events-none absolute left-2 top-1.5 text-[10px] font-bold text-text-secondary">{label}</span>
      {deck.analysis && (
        <span className="pointer-events-none absolute right-2 top-1.5 text-[10px] font-semibold tabular-nums text-text-secondary">
          {deck.currentBpm.toFixed(1)} BPM
        </span>
      )}
    </div>
  );
}
