'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BUILT_IN_PRESETS,
  DEFAULT_SETTINGS,
  EQ_FREQUENCIES,
  EQ_LIMIT_DB,
  getSoundEngine,
  isFlat,
  type Preset,
  type ReverbType,
  type SoundSettings,
} from '../utils/soundEngine';

interface MuzikaXSoundEngineProps {
  audioElement: HTMLAudioElement | null;
  onClose: () => void;
}

const fmtHz = (f: number) => (f >= 1000 ? `${f / 1000}k` : `${f}`);
const fmtDb = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(v % 1 ? 1 : 0)}`;

/* ───────────────────────── small controls ───────────────────────── */

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        checked ? 'bg-primary' : 'bg-surface-overlay'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform duration-150 ${
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}

function Slider({
  value,
  min,
  max,
  step = 1,
  onChange,
  label,
  display,
  disabled,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  label: string;
  display: string;
  disabled?: boolean;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className={disabled ? 'opacity-40 pointer-events-none' : ''}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-text-primary">{label}</span>
        <span className="text-xs tabular-nums text-text-secondary">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mx-range w-full"
        style={{ ['--pct' as any]: `${pct}%` }}
      />
    </div>
  );
}

/** Vertical EQ band: pointer drag + keyboard (arrows, PageUp/Down, Home = 0), double-click resets. */
function EqBand({ freq, value, onChange, disabled }: { freq: number; value: number; onChange: (v: number) => void; disabled: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const fromPointer = (clientY: number) => {
    const el = trackRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const t = 1 - Math.min(1, Math.max(0, (clientY - r.top) / r.height));
    const db = Math.round((t * 2 * EQ_LIMIT_DB - EQ_LIMIT_DB) * 2) / 2; // 0.5 dB steps
    onChange(db);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    fromPointer(e.clientY);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.shiftKey || e.key.startsWith('Page') ? 3 : 0.5;
    let next = value;
    if (e.key === 'ArrowUp' || e.key === 'ArrowRight' || e.key === 'PageUp') next = value + step;
    else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'PageDown') next = value - step;
    else if (e.key === 'Home' || e.key === '0') next = 0;
    else return;
    e.preventDefault();
    onChange(Math.max(-EQ_LIMIT_DB, Math.min(EQ_LIMIT_DB, next)));
  };

  const pos = (value + EQ_LIMIT_DB) / (2 * EQ_LIMIT_DB); // 0..1 from bottom
  const fillTop = value >= 0 ? 1 - pos : 0.5;
  const fillHeight = Math.abs(pos - 0.5);

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <span className={`text-[10px] tabular-nums h-3 ${value === 0 ? 'text-text-muted' : 'text-text-primary'}`}>{fmtDb(value)}</span>
      <div
        ref={trackRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label={`${fmtHz(freq)}Hz`}
        aria-valuemin={-EQ_LIMIT_DB}
        aria-valuemax={EQ_LIMIT_DB}
        aria-valuenow={value}
        aria-valuetext={`${fmtDb(value)} dB`}
        onPointerDown={onPointerDown}
        onPointerMove={(e) => e.buttons === 1 && !disabled && fromPointer(e.clientY)}
        onDoubleClick={() => !disabled && onChange(0)}
        onKeyDown={onKeyDown}
        className="relative h-36 sm:h-44 w-7 cursor-ns-resize touch-none rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 rounded-full bg-surface-overlay" />
        <div className="absolute left-1/2 -translate-x-1/2 w-3 h-px bg-border-strong" style={{ top: '50%' }} />
        <div
          className="absolute left-1/2 -translate-x-1/2 w-1 rounded-full bg-primary"
          style={{ top: `${fillTop * 100}%`, height: `${fillHeight * 100}%` }}
        />
        <div
          className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white shadow-md ring-2 ring-background"
          style={{ top: `${(1 - pos) * 100}%` }}
        />
      </div>
      <span className="text-[10px] font-medium text-text-secondary">{fmtHz(freq)}</span>
    </div>
  );
}

/** Live output spectrum (log-frequency bars). */
function Spectrum({ active }: { active: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const engine = getSoundEngine();
    if (!canvas) return;
    const ctx2d = canvas.getContext('2d');
    if (!ctx2d) return;
    let raf = 0;
    const BARS = 48;
    const levels = new Float32Array(BARS);
    let data: Uint8Array | null = null;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx2d.clearRect(0, 0, w, h);

      const analyser = engine.analyser;
      const sampleRate = engine.audioContext?.sampleRate || 44100;
      if (analyser) {
        if (!data || data.length !== analyser.frequencyBinCount) data = new Uint8Array(analyser.frequencyBinCount);
        engine.readSpectrum(data);
      }
      const gap = 3;
      const bw = (w - gap * (BARS - 1)) / BARS;
      for (let i = 0; i < BARS; i++) {
        // log-spaced 30 Hz – 16 kHz
        const f0 = 30 * Math.pow(16000 / 30, i / BARS);
        const f1 = 30 * Math.pow(16000 / 30, (i + 1) / BARS);
        let v = 0;
        if (data && active) {
          const binHz = sampleRate / 2 / data.length;
          const a = Math.max(0, Math.floor(f0 / binHz));
          const b = Math.max(a + 1, Math.ceil(f1 / binHz));
          let peak = 0;
          for (let k = a; k < b && k < data.length; k++) peak = Math.max(peak, data[k]);
          v = peak / 255;
        }
        levels[i] = Math.max(v, levels[i] * 0.9); // smooth fall
        const bh = Math.max(2, levels[i] * h);
        ctx2d.fillStyle = `rgba(255, 140, 0, ${0.35 + levels[i] * 0.65})`;
        ctx2d.beginPath();
        const x = i * (bw + gap);
        ctx2d.roundRect ? ctx2d.roundRect(x, h - bh, bw, bh, 2) : ctx2d.rect(x, h - bh, bw, bh);
        ctx2d.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  return <canvas ref={canvasRef} className="w-full h-16 sm:h-20" aria-hidden="true" />;
}

/* ───────────────────────── panel ───────────────────────── */

const REVERBS: { id: ReverbType; label: string }[] = [
  { id: 'off', label: 'Off' },
  { id: 'room', label: 'Room' },
  { id: 'club', label: 'Club' },
  { id: 'hall', label: 'Hall' },
];

export default function MuzikaXSoundEngine({ audioElement, onClose }: MuzikaXSoundEngineProps) {
  const engine = getSoundEngine();
  const [s, setS] = useState<SoundSettings>(() => engine.getSettings());
  const [saved, setSaved] = useState<Preset[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  // make sure the element that's playing right now is routed through the engine
  useEffect(() => {
    engine.attach(audioElement);
  }, [audioElement, engine]);

  useEffect(() => {
    setSaved(engine.getSavedPresets());
    return engine.subscribe(setS);
  }, [engine]);

  // Esc closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = useCallback((patch: Partial<SoundSettings>, keepPreset = false) => {
    engine.update(keepPreset ? patch : { ...patch, presetId: 'custom' });
  }, [engine]);

  const applyPreset = (p: Preset) => {
    engine.update({
      presetId: p.id,
      eq: [...p.eq],
      bass: p.bass ?? 0,
      width: p.width ?? 100,
      leveler: p.leveler ?? false,
    });
  };

  const savePreset = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const preset: Preset = { id: `user-${Date.now()}`, name: trimmed, eq: [...s.eq], bass: s.bass, width: s.width, leveler: s.leveler };
    const next = [...saved, preset];
    setSaved(next);
    engine.savePresets(next);
    engine.update({ presetId: preset.id });
    setName('');
    setNaming(false);
  };

  const deletePreset = (id: string) => {
    const next = saved.filter((p) => p.id !== id);
    setSaved(next);
    engine.savePresets(next);
    if (s.presetId === id) engine.update({ presetId: 'custom' });
  };

  const off = !s.enabled;
  const allPresets = [...BUILT_IN_PRESETS, ...saved];

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sound settings"
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-3xl max-h-[92dvh] overflow-y-auto bg-surface-elevated border border-border-medium sm:rounded-2xl rounded-t-3xl shadow-2xl shadow-black/60"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-5 sm:px-6 py-4 bg-surface-elevated/95 backdrop-blur border-b border-border-light">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-text-primary">Sound</h2>
            <p className="text-xs text-text-secondary">Equalizer and effects · applies to everything you play</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2.5 text-sm font-medium text-text-secondary">
              <span className="hidden sm:inline">{s.enabled ? 'On' : 'Off'}</span>
              <Switch checked={s.enabled} onChange={(v) => update({ enabled: v }, true)} label="Sound engine on" />
            </label>
            <button
              onClick={onClose}
              aria-label="Close"
              className="w-9 h-9 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-overlay transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-7">
          {/* Spectrum */}
          <div className="rounded-xl bg-surface border border-border-light px-4 pt-4 pb-3">
            <Spectrum active />
            <div className="flex justify-between mt-1.5 text-[10px] text-text-muted tabular-nums">
              <span>30 Hz</span>
              <span>250</span>
              <span>1k</span>
              <span>4k</span>
              <span>16 kHz</span>
            </div>
          </div>

          {/* Presets */}
          <section className={off ? 'opacity-40 pointer-events-none' : ''}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Presets</h3>
              <button
                onClick={() => engine.update({ ...DEFAULT_SETTINGS, enabled: s.enabled })}
                disabled={isFlat(s)}
                className="text-xs font-semibold text-text-secondary hover:text-text-primary disabled:opacity-40 transition-colors"
              >
                Reset all
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {allPresets.map((p) => {
                const active = s.presetId === p.id;
                const mine = p.id.startsWith('user-');
                return (
                  <span key={p.id} className="relative group/chip">
                    <button
                      onClick={() => applyPreset(p)}
                      aria-pressed={active}
                      className={`h-8 rounded-full text-sm font-medium transition-colors ${mine ? 'pl-3.5 pr-7' : 'px-3.5'} ${
                        active
                          ? 'bg-primary text-black'
                          : 'bg-surface border border-border-light text-text-secondary hover:text-text-primary hover:border-border-medium'
                      }`}
                    >
                      {p.name}
                    </button>
                    {mine && (
                      <button
                        onClick={() => deletePreset(p.id)}
                        aria-label={`Delete preset ${p.name}`}
                        className={`absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center ${
                          active ? 'text-black/70 hover:text-black' : 'text-text-muted hover:text-text-primary'
                        }`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </span>
                );
              })}
              {s.presetId === 'custom' && (
                <span className="h-8 px-3.5 inline-flex items-center rounded-full text-sm font-medium bg-surface-overlay text-text-primary">
                  Custom
                </span>
              )}
            </div>
          </section>

          {/* Equalizer */}
          <section className={off ? 'opacity-40 pointer-events-none' : ''}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Equalizer</h3>
              <span className="text-[11px] text-text-muted">Drag, or use arrow keys · double-click resets a band</span>
            </div>
            <div className="rounded-xl bg-surface border border-border-light px-2 sm:px-4 py-4">
              <div className="flex">
                <div className="hidden sm:flex flex-col justify-between text-[10px] text-text-muted tabular-nums pr-2 pt-5 pb-7 h-[13.5rem]">
                  <span>+12</span>
                  <span>0</span>
                  <span>−12</span>
                </div>
                <div className="flex-1 grid grid-cols-10 gap-0.5">
                  {EQ_FREQUENCIES.map((f, i) => (
                    <EqBand
                      key={f}
                      freq={f}
                      value={s.eq[i]}
                      disabled={off}
                      onChange={(v) => {
                        const eq = [...s.eq];
                        eq[i] = v;
                        update({ eq });
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Effects */}
          <section className={`grid sm:grid-cols-2 gap-x-8 gap-y-6 ${off ? 'opacity-40 pointer-events-none' : ''}`}>
            <h3 className="sm:col-span-2 -mb-2 text-xs font-semibold uppercase tracking-widest text-text-muted">Effects</h3>

            <Slider
              label="Bass"
              value={s.bass}
              min={0}
              max={100}
              onChange={(v) => update({ bass: v })}
              display={s.bass === 0 ? 'Off' : `+${((s.bass / 100) * 9).toFixed(1)} dB`}
            />
            <Slider
              label="Stereo width"
              value={s.width}
              min={0}
              max={150}
              step={5}
              onChange={(v) => update({ width: v })}
              display={s.width === 0 ? 'Mono' : s.width === 100 ? 'Original' : `${s.width}%`}
            />

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-primary">Room</span>
                <span className="text-xs text-text-secondary">{s.reverb === 'off' ? 'Off' : `${s.reverbMix}% mix`}</span>
              </div>
              <div className="flex gap-1 p-1 rounded-full bg-surface border border-border-light w-fit">
                {REVERBS.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => update({ reverb: r.id })}
                    aria-pressed={s.reverb === r.id}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      s.reverb === r.id ? 'bg-surface-overlay text-text-primary' : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {s.reverb !== 'off' && (
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={s.reverbMix}
                  aria-label="Room mix"
                  onChange={(e) => update({ reverbMix: Number(e.target.value) })}
                  className="mx-range w-full mt-3"
                  style={{ ['--pct' as any]: `${s.reverbMix}%` }}
                />
              )}
            </div>

            <Slider
              label="Output"
              value={s.outputGain}
              min={-12}
              max={6}
              step={0.5}
              onChange={(v) => update({ outputGain: v }, true)}
              display={`${fmtDb(s.outputGain)} dB`}
            />

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Loudness leveling</p>
                <p className="text-xs text-text-secondary mt-0.5">Evens out quiet and loud parts</p>
              </div>
              <Switch checked={s.leveler} onChange={(v) => update({ leveler: v })} label="Loudness leveling" />
            </div>

            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-text-primary">Vocal reducer</p>
                <p className="text-xs text-text-secondary mt-0.5">Karaoke-style. Works best on stereo mixes with centred vocals</p>
              </div>
              <Switch checked={s.vocalReducer} onChange={(v) => update({ vocalReducer: v })} label="Vocal reducer" />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-surface-elevated/95 backdrop-blur border-t border-border-light">
          <p className="text-[11px] text-text-muted hidden sm:block">Built-in limiter prevents distortion at any setting.</p>
          {naming ? (
            <form
              className="flex items-center gap-2 w-full sm:w-auto"
              onSubmit={(e) => {
                e.preventDefault();
                savePreset();
              }}
            >
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                placeholder="Preset name"
                className="flex-1 sm:w-48 h-9 px-3.5 rounded-full bg-surface border border-border-medium text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary"
              />
              <button type="button" onClick={() => setNaming(false)} className="h-9 px-3 text-sm font-semibold text-text-secondary hover:text-text-primary">
                Cancel
              </button>
              <button type="submit" disabled={!name.trim()} className="h-9 px-4 rounded-full bg-primary hover:bg-primary-hover text-black text-sm font-bold disabled:opacity-40">
                Save
              </button>
            </form>
          ) : (
            <button
              onClick={() => setNaming(true)}
              disabled={off}
              className="ml-auto h-9 px-4 rounded-full border border-border-medium text-sm font-semibold text-text-primary hover:bg-surface-overlay disabled:opacity-40 transition-colors"
            >
              Save as preset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
