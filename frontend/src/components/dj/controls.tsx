'use client';
// Renders from the DJ engine's mutable state, so opt out of React Compiler auto-memoisation.
'use no memo';

import { useEffect, useReducer, useRef } from 'react';
import type { DJEngine } from './djEngine';

/* ───────────── hooks ───────────── */

/** Re-render when the engine reports a state change */
export function useDJ(engine: DJEngine | null) {
  const [, force] = useReducer((x: number) => x + 1, 0);
  useEffect(() => (engine ? engine.subscribe(force) : undefined), [engine]);
}

/** Run a callback every animation frame (for playheads, meters, timers) */
export function useFrame(cb: () => void, active = true) {
  const ref = useRef(cb);
  ref.current = cb;
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    const loop = () => {
      try {
        ref.current();
      } catch (e) {
        // one bad frame must never stop the animation loop
        if (process.env.NODE_ENV !== 'production') console.warn('[DJ] frame error', e);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

export const fmtTime = (s: number) => {
  if (!isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ───────────── Knob ───────────── */

export function Knob({
  value,
  min = -1,
  max = 1,
  defaultValue = 0,
  onChange,
  label,
  size = 44,
  bipolar = true,
  format,
  onGrab,
  accent = false,
}: {
  value: number;
  min?: number;
  max?: number;
  defaultValue?: number;
  onChange: (v: number) => void;
  label: string;
  size?: number;
  bipolar?: boolean;
  format?: (v: number) => string;
  onGrab?: () => void;
  accent?: boolean;
}) {
  const drag = useRef<{ y: number; v: number } | null>(null);
  const t = (value - min) / (max - min); // 0..1
  const START = -135;
  const SWEEP = 270;
  const angle = START + t * SWEEP;
  const r = size / 2 - 4;
  const c = size / 2;
  const polar = (deg: number) => {
    const rad = ((deg - 90) * Math.PI) / 180;
    return [c + r * Math.cos(rad), c + r * Math.sin(rad)];
  };
  const arc = (from: number, to: number) => {
    const [x1, y1] = polar(from);
    const [x2, y2] = polar(to);
    const large = Math.abs(to - from) > 180 ? 1 : 0;
    const sweep = to > from ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} ${sweep} ${x2} ${y2}`;
  };
  const zeroAngle = bipolar ? START + ((defaultValue - min) / (max - min)) * SWEEP : START;
  const [kx, ky] = polar(angle);
  const changed = Math.abs(value - defaultValue) > 1e-3;

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={format ? format(value) : value.toFixed(2)}
        title={`${label}${format ? `: ${format(value)}` : ''} — drag, scroll or arrow keys · double-click to reset`}
        className="relative cursor-ns-resize touch-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        style={{ width: size, height: size }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          drag.current = { y: e.clientY, v: value };
          onGrab?.();
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const fine = e.shiftKey ? 0.25 : 1;
          const dv = ((drag.current.y - e.clientY) / 160) * (max - min) * fine;
          onChange(clamp(drag.current.v + dv, min, max));
        }}
        onPointerUp={() => (drag.current = null)}
        onDoubleClick={() => {
          onGrab?.();
          onChange(defaultValue);
        }}
        onWheel={(e) => {
          onGrab?.();
          onChange(clamp(value - Math.sign(e.deltaY) * (max - min) * 0.02, min, max));
        }}
        onKeyDown={(e) => {
          const step = (max - min) * (e.shiftKey ? 0.1 : 0.02);
          if (e.key === 'ArrowUp' || e.key === 'ArrowRight') onChange(clamp(value + step, min, max));
          else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') onChange(clamp(value - step, min, max));
          else if (e.key === 'Home' || e.key === '0') onChange(defaultValue);
          else return;
          e.preventDefault();
          onGrab?.();
        }}
      >
        <svg width={size} height={size} aria-hidden="true">
          <circle cx={c} cy={c} r={r - 5} fill="rgb(var(--overlay-rgb))" />
          <path d={arc(START, START + SWEEP)} stroke="rgba(255,255,255,0.08)" strokeWidth={3} fill="none" strokeLinecap="round" />
          {Math.abs(angle - zeroAngle) > 0.5 && (
            <path
              d={arc(Math.min(zeroAngle, angle), Math.max(zeroAngle, angle))}
              stroke={accent || changed ? 'rgb(var(--primary-rgb))' : 'rgba(255,255,255,0.5)'}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
            />
          )}
          <line x1={c} y1={c} x2={c + (kx - c) * 0.62} y2={c + (ky - c) * 0.62} stroke="#fff" strokeWidth={2.5} strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
    </div>
  );
}

/* ───────────── Faders ───────────── */

export function VFader({
  value,
  onChange,
  label,
  height = 140,
  min = 0,
  max = 1,
  invert = false,
  onGrab,
  marks,
  defaultValue,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  height?: number;
  min?: number;
  max?: number;
  invert?: boolean;
  onGrab?: () => void;
  marks?: number[];
  defaultValue?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const t = (value - min) / (max - min);
  const pos = invert ? t : 1 - t; // 0 = top
  const fromPointer = (y: number) => {
    const r = ref.current!.getBoundingClientRect();
    let k = clamp((y - r.top) / r.height, 0, 1);
    if (!invert) k = 1 - k;
    onChange(min + k * (max - min));
  };
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-orientation="vertical"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className="relative w-9 cursor-ns-resize touch-none select-none rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ height }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onGrab?.();
        fromPointer(e.clientY);
      }}
      onPointerMove={(e) => e.buttons === 1 && fromPointer(e.clientY)}
      onDoubleClick={() => defaultValue !== undefined && onChange(defaultValue)}
      onKeyDown={(e) => {
        const step = (max - min) * (e.shiftKey ? 0.1 : 0.02) * (invert ? -1 : 1);
        if (e.key === 'ArrowUp') onChange(clamp(value + step, min, max));
        else if (e.key === 'ArrowDown') onChange(clamp(value - step, min, max));
        else return;
        e.preventDefault();
        onGrab?.();
      }}
    >
      <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 rounded-full bg-black/60 ring-1 ring-white/5" />
      {(marks || []).map((m) => {
        const mt = (m - min) / (max - min);
        return (
          <div key={m} className="absolute left-0 right-0 h-px bg-white/10" style={{ top: `${(invert ? mt : 1 - mt) * 100}%` }} />
        );
      })}
      <div
        className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-5 rounded-md bg-gradient-to-b from-zinc-300 to-zinc-500 shadow-md shadow-black/60 border border-black/40"
        style={{ top: `${pos * 100}%` }}
      >
        <div className="absolute inset-x-1 top-1/2 h-px bg-black/60" />
      </div>
    </div>
  );
}

export function HFader({
  value,
  onChange,
  label,
  min = -1,
  max = 1,
  onGrab,
  width = '100%',
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min?: number;
  max?: number;
  onGrab?: () => void;
  width?: number | string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const t = (value - min) / (max - min);
  const fromPointer = (x: number) => {
    const r = ref.current!.getBoundingClientRect();
    onChange(min + clamp((x - r.left) / r.width, 0, 1) * (max - min));
  };
  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      className="relative h-9 cursor-ew-resize touch-none select-none rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      style={{ width }}
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        onGrab?.();
        fromPointer(e.clientX);
      }}
      onPointerMove={(e) => e.buttons === 1 && fromPointer(e.clientX)}
      onDoubleClick={() => onChange((min + max) / 2)}
      onKeyDown={(e) => {
        const step = (max - min) * (e.shiftKey ? 0.1 : 0.02);
        if (e.key === 'ArrowRight') onChange(clamp(value + step, min, max));
        else if (e.key === 'ArrowLeft') onChange(clamp(value - step, min, max));
        else return;
        e.preventDefault();
        onGrab?.();
      }}
    >
      <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 rounded-full bg-black/60 ring-1 ring-white/5" />
      <div className="absolute top-1 bottom-1 left-1/2 w-px bg-white/15" />
      <div
        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-8 w-5 rounded-md bg-gradient-to-r from-zinc-300 to-zinc-500 shadow-md shadow-black/60 border border-black/40"
        style={{ left: `${t * 100}%` }}
      >
        <div className="absolute inset-y-1 left-1/2 w-px bg-black/60" />
      </div>
    </div>
  );
}

/* ───────────── Meter ───────────── */

export function Meter({ read, height = 140, width = 6 }: { read: () => number; height?: number; width?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const peakHold = useRef({ v: 0, t: 0 });
  const smooth = useRef(0);
  useFrame(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    if (cv.width !== width * dpr) {
      cv.width = width * dpr;
      cv.height = height * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const raw = read();
    const db = raw > 0 ? 20 * Math.log10(raw) : -60;
    const lvl = clamp((db + 48) / 48, 0, 1); // -48..0 dBFS
    smooth.current = Math.max(lvl, smooth.current - 0.025);
    const now = performance.now();
    if (lvl >= peakHold.current.v || now - peakHold.current.t > 1200) peakHold.current = { v: lvl, t: now };
    ctx.clearRect(0, 0, width, height);
    const segs = 24;
    const gap = 1.5;
    const sh = (height - gap * (segs - 1)) / segs;
    for (let i = 0; i < segs; i++) {
      const k = (i + 1) / segs;
      const y = height - (i + 1) * sh - i * gap;
      const lit = k <= smooth.current;
      const color = k > 0.94 ? '239,68,68' : k > 0.8 ? '255,176,32' : '255,140,0';
      ctx.fillStyle = lit ? `rgba(${color},${0.55 + k * 0.45})` : 'rgba(255,255,255,0.06)';
      ctx.fillRect(0, y, width, sh);
    }
    const ph = peakHold.current.v;
    if (ph > 0.02) {
      ctx.fillStyle = ph > 0.94 ? '#ef4444' : '#fff';
      ctx.fillRect(0, height - ph * height, width, 2);
    }
  });
  return <canvas ref={ref} style={{ width, height }} aria-hidden="true" />;
}

/* ───────────── Buttons ───────────── */

/**
 * DJ pad. `onPress` fires on pointer-DOWN (like hardware), not on release — that's what
 * makes pads feel instant. Keyboard activation (Enter/Space) still works via click.
 */
export function PadButton({
  children,
  active,
  onClick,
  onPress,
  onPointerDown,
  onPointerUp,
  className = '',
  title,
  tone = 'default',
  ...rest
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
  tone?: 'default' | 'primary' | 'danger';
  onPress?: (e: React.PointerEvent<HTMLButtonElement> | React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const on =
    tone === 'primary'
      ? 'bg-primary text-black border-primary'
      : tone === 'danger'
      ? 'bg-red-500 text-white border-red-500'
      : 'bg-surface-overlay text-text-primary border-border-strong';
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        if (onPress && e.detail === 0) onPress(e); // keyboard
        onClick?.(e);
      }}
      onPointerDown={(e) => {
        if (onPress && e.button === 0) onPress(e);
        onPointerDown?.(e);
      }}
      onPointerUp={onPointerUp}
      className={`dj-pad h-9 rounded-lg border text-xs font-bold tracking-wide select-none disabled:opacity-35 disabled:pointer-events-none ${
        active ? on : 'bg-surface border-border-light text-text-secondary hover:text-text-primary hover:border-border-medium'
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
