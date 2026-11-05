/**
 * MuzikaX Sound Engine — one shared Web Audio graph for the whole app.
 *
 *   <audio> ─► input ─► preamp ─► EQ (10 bands) ─► bass shelf ─► stereo stage ─┬─► dry ──┬─► leveler ─► limiter ─► analyser ─► out
 *                                                  (width + vocal reducer)       └─► reverb ┘
 *
 * - A media element can only be connected to Web Audio once, and the player creates a new
 *   <audio> per track, so every element is attached here (attach()) instead of in components.
 * - Settings persist in localStorage and survive track changes and reloads.
 * - A brick-wall limiter is always on, and boosts are compensated by auto-gain, so the
 *   engine can't clip no matter what the user dials in.
 */

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000] as const;
export const EQ_LIMIT_DB = 12;

export type ReverbType = 'off' | 'room' | 'hall' | 'club';

export interface SoundSettings {
  enabled: boolean;
  presetId: string; // built-in preset id, saved preset id, or 'custom'
  eq: number[]; // dB per band, length 10
  bass: number; // 0..100  -> low-shelf boost 0..+9 dB
  width: number; // 0..150  (%), 100 = original
  vocalReducer: boolean;
  reverb: ReverbType;
  reverbMix: number; // 0..100
  leveler: boolean; // gentle compression for consistent loudness
  outputGain: number; // -12..+6 dB, user trim
}

export interface Preset {
  id: string;
  name: string;
  eq: number[];
  bass?: number;
  width?: number;
  leveler?: boolean;
}

const flat = () => EQ_FREQUENCIES.map(() => 0);

export const BUILT_IN_PRESETS: Preset[] = [
  { id: 'flat', name: 'Flat', eq: flat() },
  { id: 'bass', name: 'Bass Boost', eq: [6, 5, 4, 2, 0, 0, 0, 0, 0, 0] },
  { id: 'afrobeats', name: 'Afrobeats', eq: [4, 4, 2, 0, -1, 0, 1, 2, 2, 1], width: 115 },
  { id: 'hiphop', name: 'Hip-Hop', eq: [5, 4, 2, 1, -1, -1, 1, 1, 2, 2] },
  { id: 'electronic', name: 'Electronic', eq: [5, 4, 1, 0, -2, 1, 0, 1, 4, 5], width: 120 },
  { id: 'vocal', name: 'Vocal', eq: [-2, -2, -1, 1, 3, 4, 4, 3, 1, 0] },
  { id: 'acoustic', name: 'Acoustic', eq: [3, 3, 2, 1, 1, 1, 2, 3, 2, 1] },
  { id: 'treble', name: 'Treble Boost', eq: [0, 0, 0, 0, 0, 1, 2, 4, 5, 6] },
  { id: 'spoken', name: 'Spoken Word', eq: [-4, -3, -1, 1, 3, 4, 4, 2, 0, -2], leveler: true },
  { id: 'night', name: 'Late Night', eq: [2, 2, 1, 0, 0, 0, 0, 0, -1, -2], leveler: true },
];

export const DEFAULT_SETTINGS: SoundSettings = {
  enabled: true,
  presetId: 'flat',
  eq: flat(),
  bass: 0,
  width: 100,
  vocalReducer: false,
  reverb: 'off',
  reverbMix: 25,
  leveler: false,
  outputGain: 0,
};

const STORAGE_KEY = 'muzikax_sound_engine_v2';
const PRESETS_KEY = 'muzikax_sound_presets_v2';
const RAMP = 0.04; // seconds, click-free parameter changes

const dbToGain = (db: number) => Math.pow(10, db / 20);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    return raw ? { ...(fallback as any), ...JSON.parse(raw) } : fallback;
  } catch {
    return fallback;
  }
}

function sanitize(s: SoundSettings): SoundSettings {
  const eq = Array.isArray(s.eq) && s.eq.length === EQ_FREQUENCIES.length ? s.eq : flat();
  return {
    ...DEFAULT_SETTINGS,
    ...s,
    eq: eq.map((v) => clamp(Number(v) || 0, -EQ_LIMIT_DB, EQ_LIMIT_DB)),
    bass: clamp(Number(s.bass) || 0, 0, 100),
    width: clamp(Number(s.width) || 100, 0, 150),
    reverbMix: clamp(Number(s.reverbMix) || 0, 0, 100),
    outputGain: clamp(Number(s.outputGain) || 0, -12, 6),
    reverb: (['off', 'room', 'hall', 'club'] as ReverbType[]).includes(s.reverb) ? s.reverb : 'off',
  };
}

type Listener = (s: SoundSettings) => void;

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sources = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
  private current: MediaElementAudioSourceNode | null = null;
  private settings: SoundSettings = DEFAULT_SETTINGS;
  private listeners = new Set<Listener>();
  private loaded = false;

  // nodes
  private input!: GainNode;
  private preamp!: GainNode;
  private eq: BiquadFilterNode[] = [];
  private bassShelf!: BiquadFilterNode;
  private midFull!: GainNode;
  private midLow!: GainNode;
  private sideL!: GainNode;
  private sideR!: GainNode;
  private dry!: GainNode;
  private wet!: GainNode;
  private convolver!: ConvolverNode;
  private leveler!: DynamicsCompressorNode;
  private limiter!: DynamicsCompressorNode;
  private output!: GainNode;
  private clipper!: WaveShaperNode;
  analyser: AnalyserNode | null = null;

  /* ---------------- settings ---------------- */

  getSettings(): SoundSettings {
    if (!this.loaded) {
      this.settings = sanitize(readJSON(STORAGE_KEY, DEFAULT_SETTINGS));
      this.loaded = true;
    }
    return this.settings;
  }

  update(patch: Partial<SoundSettings>) {
    this.settings = sanitize({ ...this.getSettings(), ...patch });
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.settings));
    } catch {
      /* storage unavailable: settings still apply for this session */
    }
    this.apply();
    this.listeners.forEach((l) => l(this.settings));
  }

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }

  getSavedPresets(): Preset[] {
    try {
      const raw = window.localStorage.getItem(PRESETS_KEY);
      return raw ? (JSON.parse(raw) as Preset[]) : [];
    } catch {
      return [];
    }
  }

  savePresets(presets: Preset[]) {
    try {
      window.localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
    } catch {
      /* ignore */
    }
  }

  /* ---------------- graph ---------------- */

  get audioContext() {
    return this.ctx;
  }

  private build() {
    if (this.ctx) return this.ctx;
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx: AudioContext = new Ctx();
    this.ctx = ctx;

    this.input = ctx.createGain();
    // Force stereo so mono files reach both speakers through the mid/side stage
    this.input.channelCount = 2;
    this.input.channelCountMode = 'explicit';
    this.input.channelInterpretation = 'speakers';
    this.preamp = ctx.createGain();

    this.eq = EQ_FREQUENCIES.map((f, i) => {
      const b = ctx.createBiquadFilter();
      b.type = i === 0 ? 'lowshelf' : i === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
      b.frequency.value = f;
      b.Q.value = 1.1;
      b.gain.value = 0;
      return b;
    });

    this.bassShelf = ctx.createBiquadFilter();
    this.bassShelf.type = 'lowshelf';
    this.bassShelf.frequency.value = 90;

    // Stereo stage (mid/side). L = M + S, R = M - S
    //   width scales S; vocal reducer removes M above ~180 Hz (centre-panned vocals)
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    const toMid = ctx.createGain(); // (L + R) / 2
    const lHalf = ctx.createGain();
    const rHalf = ctx.createGain();
    const rNeg = ctx.createGain();
    lHalf.gain.value = 0.5;
    rHalf.gain.value = 0.5;
    rNeg.gain.value = -0.5;
    const side = ctx.createGain(); // (L - R) / 2

    splitter.connect(lHalf, 0);
    splitter.connect(rHalf, 1);
    splitter.connect(rNeg, 1);
    lHalf.connect(toMid);
    rHalf.connect(toMid);
    lHalf.connect(side);
    rNeg.connect(side);

    // mid: full-band path and a low-only path (keeps kick/bass when vocals are reduced)
    this.midFull = ctx.createGain();
    this.midLow = ctx.createGain();
    const midLowpass = ctx.createBiquadFilter();
    midLowpass.type = 'lowpass';
    midLowpass.frequency.value = 180;
    toMid.connect(this.midFull);
    toMid.connect(midLowpass).connect(this.midLow);

    this.sideL = ctx.createGain();
    this.sideR = ctx.createGain();
    side.connect(this.sideL);
    side.connect(this.sideR);

    // L = M + S ; R = M - S
    this.midFull.connect(merger, 0, 0);
    this.midFull.connect(merger, 0, 1);
    this.midLow.connect(merger, 0, 0);
    this.midLow.connect(merger, 0, 1);
    this.sideL.connect(merger, 0, 0);
    this.sideR.connect(merger, 0, 1);

    // reverb send
    this.dry = ctx.createGain();
    this.wet = ctx.createGain();
    this.convolver = ctx.createConvolver();
    merger.connect(this.dry);
    merger.connect(this.convolver).connect(this.wet);

    this.leveler = ctx.createDynamicsCompressor();
    this.limiter = ctx.createDynamicsCompressor();
    this.limiter.threshold.value = -1;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.12;

    this.output = ctx.createGain();

    // Final safety stage: the browser compressor isn't a true brick wall (fast transients
    // overshoot slightly), so a transparent soft clipper guarantees output stays under 0 dBFS.
    // Linear below 0.85, smooth knee to 0.98 at full scale; anything hotter is held at 0.98.
    const clipper = ctx.createWaveShaper();
    const N = 2048;
    const curve = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * 2 - 1;
      const a = Math.abs(x);
      const y = a <= 0.85 ? a : 0.85 + 0.13 * Math.tanh((a - 0.85) / 0.13);
      curve[i] = Math.sign(x) * y;
    }
    clipper.curve = curve;
    clipper.oversample = '4x';
    this.clipper = clipper;

    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.82;

    // wire main chain
    let node: AudioNode = this.preamp;
    this.input.connect(this.preamp);
    this.eq.forEach((b) => {
      node.connect(b);
      node = b;
    });
    node.connect(this.bassShelf);
    this.bassShelf.connect(splitter);
    this.dry.connect(this.leveler);
    this.wet.connect(this.leveler);
    this.leveler.connect(this.limiter).connect(this.output).connect(this.clipper).connect(this.analyser).connect(ctx.destination);

    this.apply(true);
    return ctx;
  }

  /** Route a media element through the engine. Safe to call repeatedly. */
  attach(el: HTMLMediaElement | null | undefined) {
    if (!el || typeof window === 'undefined') return;
    try {
      const ctx = this.build();
      let src = this.sources.get(el);
      if (!src) {
        src = ctx.createMediaElementSource(el);
        this.sources.set(el, src);
        // browsers start contexts suspended until a user gesture; resume on play
        el.addEventListener('play', () => {
          if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        });
      }
      if (this.current && this.current !== src) {
        try {
          this.current.disconnect();
        } catch {
          /* already disconnected */
        }
      }
      src.connect(this.input);
      this.current = src;
      if (!el.paused && ctx.state === 'suspended') ctx.resume().catch(() => {});
    } catch (e) {
      // Element was connected by another context, or Web Audio unavailable: playback continues unprocessed.
      console.warn('[SoundEngine] attach skipped:', (e as Error).message);
    }
  }

  /** Fill `target` with the current output spectrum (0..255 per bin). */
  readSpectrum(target: Uint8Array) {
    this.analyser?.getByteFrequencyData(target as Uint8Array<ArrayBuffer>);
  }

  private impulse(type: ReverbType): AudioBuffer | null {
    if (!this.ctx || type === 'off') return null;
    const seconds = type === 'room' ? 0.8 : type === 'club' ? 1.4 : 2.8;
    const decay = type === 'room' ? 3.5 : type === 'club' ? 2.6 : 2.0;
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private lastReverb: ReverbType | null = null;

  private set(param: AudioParam, value: number, instant = false) {
    if (!this.ctx) return;
    if (instant) param.value = value;
    else param.setTargetAtTime(value, this.ctx.currentTime, RAMP);
  }

  private apply(instant = false) {
    if (!this.ctx) return;
    const s = this.getSettings();
    const on = s.enabled;

    this.eq.forEach((b, i) => this.set(b.gain, on ? s.eq[i] : 0, instant));
    const bassDb = on ? (s.bass / 100) * 9 : 0;
    this.set(this.bassShelf.gain, bassDb, instant);

    // Auto-gain: pull the preamp down by the largest low/mid boost so peaks stay under the limiter
    const maxBoost = on ? Math.max(0, ...s.eq.map((v, i) => v + (i < 3 ? bassDb : 0))) : 0;
    const trim = on ? s.outputGain : 0;
    this.set(this.preamp.gain, dbToGain(trim - maxBoost * 0.7), instant);

    const width = on ? s.width / 100 : 1;
    const reduce = on && s.vocalReducer;
    this.set(this.midFull.gain, reduce ? 0 : 1, instant);
    this.set(this.midLow.gain, reduce ? 1 : 0, instant);
    this.set(this.sideL.gain, reduce ? Math.max(width, 1) : width, instant);
    this.set(this.sideR.gain, -(reduce ? Math.max(width, 1) : width), instant);

    const reverb = on ? s.reverb : 'off';
    if (reverb !== this.lastReverb) {
      if (reverb !== 'off') this.convolver.buffer = this.impulse(reverb);
      this.lastReverb = reverb;
    }
    const mix = reverb === 'off' ? 0 : s.reverbMix / 100;
    this.set(this.wet.gain, mix * 0.6, instant);
    this.set(this.dry.gain, 1 - mix * 0.25, instant);

    const lev = on && s.leveler;
    this.set(this.leveler.threshold, lev ? -24 : 0, instant);
    this.set(this.leveler.ratio, lev ? 3 : 1, instant);
    this.set(this.leveler.knee, lev ? 12 : 0, instant);
    this.leveler.attack.value = 0.01;
    this.leveler.release.value = 0.25;
    this.set(this.output.gain, lev ? dbToGain(4) : 1, instant); // make-up gain
  }
}

let engine: SoundEngine | null = null;
export function getSoundEngine(): SoundEngine {
  if (!engine) engine = new SoundEngine();
  return engine;
}

export function isFlat(s: SoundSettings) {
  return (
    s.eq.every((v) => v === 0) && s.bass === 0 && s.width === 100 && !s.vocalReducer && s.reverb === 'off' && !s.leveler && s.outputGain === 0
  );
}
