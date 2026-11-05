/**
 * MuzikaX DJ engine — two decks, a 2-channel mixer, headphone cue, recording and live capture.
 *
 *  deck: source ─► declick ─► trim ─► EQ low/mid/high ─► filter HP/LP ─► FX (echo|reverb) ─► pre ─┬─► fader ─► xfade ─► master bus
 *                                                                                                 ├─► cue (PFL) ─► cue bus
 *                                                                                                 └─► meter
 *  master bus ─► master gain ─► limiter ─► out ─┬─► speakers (ctx.destination)
 *                                              ├─► recording / live (MediaStreamDestination)
 *                                              └─► headphone mix
 *
 * Tempo is vinyl-style (playbackRate), so pitch follows tempo, like a turntable.
 */
import { analyzeTrack, cacheBpm, type TrackAnalysis } from './analysis';

export interface DJTrack {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  audioUrl: string;
  genre?: string;
}

export type DeckId = 0 | 1;
export type XfadeCurve = 'blend' | 'cut';
export type FxType = 'echo' | 'reverb' | 'flanger' | 'phaser' | 'gate' | 'crush';

const API = process.env.NEXT_PUBLIC_AUDIO_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
export const proxied = (url: string) =>
  url.includes('cloudfront.net') || url.includes('amazonaws.com') ? `${API}/api/audio-proxy?url=${encodeURIComponent(url)}` : url;

const dbToGain = (db: number) => Math.pow(10, db / 20);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Isolator-style EQ: -1 = full kill, 0 = flat, +1 = +6 dB */
export const eqToGainDb = (v: number) => (v >= 0 ? v * 6 : v <= -0.985 ? -80 : 20 * Math.log10(1 + v));

type Listener = () => void;

/* ───────────────────────── Sampler sounds (synthesised, no files) ───────────────────────── */

function noiseBuffer(c: BaseAudioContext, secs: number) {
  const b = c.createBuffer(1, Math.ceil(c.sampleRate * secs), c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

interface SampleDef {
  id: string;
  name: string;
  seconds: number;
  render: (c: OfflineAudioContext) => void;
}

const SAMPLE_DEFS: SampleDef[] = [
  {
    id: 'horn',
    name: 'Air horn',
    seconds: 1.6,
    render: (c) => {
      const out = c.createGain();
      const lp = c.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 3200;
      out.connect(lp).connect(c.destination);
      // classic stutter: short, short, long
      [[0, 0.16], [0.2, 0.16], [0.42, 1.05]].forEach(([t, len]) => {
        [466, 470, 233].forEach((f, i) => {
          const o = c.createOscillator();
          o.type = 'sawtooth';
          o.frequency.setValueAtTime(f * 0.94, t);
          o.frequency.linearRampToValueAtTime(f, t + 0.04);
          const g = c.createGain();
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(i === 2 ? 0.12 : 0.16, t + 0.015);
          g.gain.setValueAtTime(i === 2 ? 0.12 : 0.16, t + len - 0.04);
          g.gain.linearRampToValueAtTime(0, t + len);
          o.connect(g).connect(out);
          o.start(t);
          o.stop(t + len);
        });
      });
    },
  },
  {
    id: 'siren',
    name: 'Siren',
    seconds: 2.4,
    render: (c) => {
      const o = c.createOscillator();
      o.type = 'square';
      const lfo = c.createOscillator();
      lfo.frequency.value = 2.2;
      const depth = c.createGain();
      depth.gain.value = 320;
      o.frequency.value = 900;
      lfo.connect(depth).connect(o.frequency);
      const g = c.createGain();
      g.gain.setValueAtTime(0, 0);
      g.gain.linearRampToValueAtTime(0.18, 0.05);
      g.gain.setValueAtTime(0.18, 2.1);
      g.gain.linearRampToValueAtTime(0, 2.4);
      const lp = c.createBiquadFilter();
      lp.frequency.value = 2500;
      o.connect(lp).connect(g).connect(c.destination);
      o.start();
      lfo.start();
    },
  },
  {
    id: 'laser',
    name: 'Laser',
    seconds: 0.6,
    render: (c) => {
      for (let k = 0; k < 2; k++) {
        const t = k * 0.16;
        const o = c.createOscillator();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(2400, t);
        o.frequency.exponentialRampToValueAtTime(110, t + 0.35);
        const g = c.createGain();
        g.gain.setValueAtTime(0.2, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        o.connect(g).connect(c.destination);
        o.start(t);
        o.stop(t + 0.42);
      }
    },
  },
  {
    id: 'boom',
    name: 'Bass drop',
    seconds: 2.2,
    render: (c) => {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(110, 0);
      o.frequency.exponentialRampToValueAtTime(32, 1.6);
      const sh = c.createWaveShaper();
      const curve = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) {
        const x = (i / 1023) * 2 - 1;
        curve[i] = Math.tanh(x * 2.5);
      }
      sh.curve = curve;
      const g = c.createGain();
      g.gain.setValueAtTime(0.9, 0);
      g.gain.exponentialRampToValueAtTime(0.001, 2.1);
      o.connect(sh).connect(g).connect(c.destination);
      o.start();
    },
  },
  {
    id: 'clap',
    name: 'Clap',
    seconds: 0.5,
    render: (c) => {
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1500;
      bp.Q.value = 0.9;
      bp.connect(c.destination);
      [0, 0.012, 0.024, 0.04].forEach((t, i) => {
        const n = c.createBufferSource();
        n.buffer = noiseBuffer(c, 0.4);
        const g = c.createGain();
        g.gain.setValueAtTime(0.8, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + (i === 3 ? 0.35 : 0.03));
        n.connect(g).connect(bp);
        n.start(t);
      });
    },
  },
  {
    id: 'riser',
    name: 'Riser',
    seconds: 4,
    render: (c) => {
      const n = c.createBufferSource();
      n.buffer = noiseBuffer(c, 4);
      const hp = c.createBiquadFilter();
      hp.type = 'bandpass';
      hp.Q.value = 3;
      hp.frequency.setValueAtTime(300, 0);
      hp.frequency.exponentialRampToValueAtTime(9000, 3.8);
      const g = c.createGain();
      g.gain.setValueAtTime(0.02, 0);
      g.gain.exponentialRampToValueAtTime(0.5, 3.8);
      g.gain.linearRampToValueAtTime(0, 4);
      n.connect(hp).connect(g).connect(c.destination);
      n.start();
    },
  },
  {
    id: 'kick',
    name: 'Kick',
    seconds: 0.6,
    render: (c) => {
      const o = c.createOscillator();
      o.frequency.setValueAtTime(160, 0);
      o.frequency.exponentialRampToValueAtTime(42, 0.12);
      const g = c.createGain();
      g.gain.setValueAtTime(1, 0);
      g.gain.exponentialRampToValueAtTime(0.001, 0.5);
      o.connect(g).connect(c.destination);
      o.start();
    },
  },
  {
    id: 'snare-roll',
    name: 'Snare roll',
    seconds: 2,
    render: (c) => {
      const hp = c.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.value = 1200;
      hp.connect(c.destination);
      // accelerating roll 4 → 32 hits per second
      let t = 0;
      let k = 0;
      while (t < 1.9) {
        const n = c.createBufferSource();
        n.buffer = noiseBuffer(c, 0.12);
        const g = c.createGain();
        const level = 0.15 + (t / 1.9) * 0.5;
        g.gain.setValueAtTime(level, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.09);
        n.connect(g).connect(hp);
        n.start(t);
        t += Math.max(0.03, 0.25 / (1 + k * 0.18));
        k++;
      }
    },
  },
];

/* ───────────────────────── Deck ───────────────────────── */

export class Deck {
  readonly id: DeckId;
  private e: DJEngine;
  track: DJTrack | null = null;
  buffer: AudioBuffer | null = null;
  analysis: TrackAnalysis | null = null;
  loading = false;
  loadProgress = 0;
  error: string | null = null;

  // transport
  playing = false;
  private src: AudioBufferSourceNode | null = null;
  private anchorCtx = 0;
  private anchorPos = 0;
  rate = 1; // playbackRate (tempo ratio)
  tempoRange = 0.08; // ±8 %
  private nudgeFactor = 1;
  cuePoint = 0;
  private cuePreview = false;
  hotCues: (number | null)[] = Array(8).fill(null);
  loop: { start: number; end: number; beats: number } | null = null;
  quantize = true;
  keyLockNote = 'Tempo changes pitch (vinyl mode)';

  // channel controls (UI values)
  trimDb = 0;
  autoGain = true;
  eq = { high: 0, mid: 0, low: 0 }; // -1..1
  filter = 0; // -1 (low-pass) .. 0 (off) .. 1 (high-pass)
  fader = 1; // 0..1
  pfl = false;
  fx = { type: 'echo' as FxType, on: false, wet: 0.5, beats: 0.75 };

  // nodes
  declick!: GainNode;
  trim!: GainNode;
  low!: BiquadFilterNode;
  mid!: BiquadFilterNode;
  high!: BiquadFilterNode;
  hp!: BiquadFilterNode;
  lp!: BiquadFilterNode;
  fxSend!: GainNode;
  fxDry!: GainNode;
  flDelay!: DelayNode;
  flFb!: GainNode;
  flWet!: GainNode;
  flLfo!: OscillatorNode;
  phStages: BiquadFilterNode[] = [];
  phWet!: GainNode;
  phLfo!: OscillatorNode;
  crusher!: WaveShaperNode;
  crWet!: GainNode;
  gate!: GainNode;
  gateDepth!: GainNode;
  private gateOsc: OscillatorNode | null = null;
  private slip: { pos: number; ctx: number } | null = null;
  braking = false;
  delay!: DelayNode;
  delayFb!: GainNode;
  echoWet!: GainNode;
  reverb!: ConvolverNode;
  reverbWet!: GainNode;
  pre!: GainNode;
  faderGain!: GainNode;
  xfadeGain!: GainNode;
  cueGain!: GainNode;
  meter!: AnalyserNode;

  constructor(e: DJEngine, id: DeckId) {
    this.e = e;
    this.id = id;
    this.build();
  }

  private get ctx() {
    return this.e.ctx;
  }

  private build() {
    const c = this.ctx;
    this.declick = c.createGain();
    this.trim = c.createGain();
    this.low = c.createBiquadFilter();
    this.low.type = 'lowshelf';
    this.low.frequency.value = 110;
    this.mid = c.createBiquadFilter();
    this.mid.type = 'peaking';
    this.mid.frequency.value = 1100;
    this.mid.Q.value = 0.7;
    this.high = c.createBiquadFilter();
    this.high.type = 'highshelf';
    this.high.frequency.value = 5500;
    this.hp = c.createBiquadFilter();
    this.hp.type = 'highpass';
    this.hp.frequency.value = 10;
    this.lp = c.createBiquadFilter();
    this.lp.type = 'lowpass';
    this.lp.frequency.value = 22000;

    // FX unit. Parallel sends (echo, reverb, flanger, phaser, crush) mix back in on top of
    // the dry signal; the gate is an insert after the mix. Only the selected effect is wet.
    const fxOut = c.createGain();
    this.fxDry = c.createGain();
    this.fxSend = c.createGain();
    this.fxSend.gain.value = 0;
    this.delay = c.createDelay(4);
    this.delayFb = c.createGain();
    this.delayFb.gain.value = 0.45;
    this.echoWet = c.createGain();
    this.echoWet.gain.value = 0;
    this.reverb = c.createConvolver();
    this.reverb.buffer = this.e.reverbImpulse;
    this.reverbWet = c.createGain();
    this.reverbWet.gain.value = 0;

    // flanger: short modulated delay with feedback
    this.flDelay = c.createDelay(0.05);
    this.flDelay.delayTime.value = 0.004;
    this.flFb = c.createGain();
    this.flFb.gain.value = 0.55;
    this.flWet = c.createGain();
    this.flWet.gain.value = 0;
    this.flLfo = c.createOscillator();
    this.flLfo.frequency.value = 0.25;
    const flDepth = c.createGain();
    flDepth.gain.value = 0.0032;
    this.flLfo.connect(flDepth).connect(this.flDelay.delayTime);
    this.flLfo.start();

    // phaser: four modulated all-pass stages
    this.phStages = [0, 1, 2, 3].map(() => {
      const ap = c.createBiquadFilter();
      ap.type = 'allpass';
      ap.frequency.value = 900;
      ap.Q.value = 0.6;
      return ap;
    });
    this.phWet = c.createGain();
    this.phWet.gain.value = 0;
    this.phLfo = c.createOscillator();
    this.phLfo.frequency.value = 0.4;
    const phDepth = c.createGain();
    phDepth.gain.value = 700;
    this.phLfo.connect(phDepth);
    this.phStages.forEach((s) => phDepth.connect(s.frequency));
    this.phLfo.start();

    // bit-crusher: quantising wave-shaper
    this.crusher = c.createWaveShaper();
    this.crWet = c.createGain();
    this.crWet.gain.value = 0;

    // gate / trans: beat-synced volume chop (insert)
    this.gate = c.createGain();
    this.gateDepth = c.createGain();
    this.gateDepth.gain.value = 0;
    this.gateDepth.connect(this.gate.gain);

    this.pre = c.createGain();
    this.faderGain = c.createGain();
    this.xfadeGain = c.createGain();
    this.cueGain = c.createGain();
    this.cueGain.gain.value = 0;
    this.meter = c.createAnalyser();
    this.meter.fftSize = 1024;

    this.declick
      .connect(this.trim)
      .connect(this.low)
      .connect(this.mid)
      .connect(this.high)
      .connect(this.hp)
      .connect(this.lp);
    this.lp.connect(this.fxDry).connect(fxOut);
    this.lp.connect(this.fxSend);
    this.fxSend.connect(this.delay);
    this.delay.connect(this.delayFb).connect(this.delay);
    this.delay.connect(this.echoWet).connect(fxOut);
    this.fxSend.connect(this.reverb).connect(this.reverbWet).connect(fxOut);
    this.fxSend.connect(this.flDelay);
    this.flDelay.connect(this.flFb).connect(this.flDelay);
    this.flDelay.connect(this.flWet).connect(fxOut);
    let ph: AudioNode = this.fxSend;
    this.phStages.forEach((s) => {
      ph.connect(s);
      ph = s;
    });
    ph.connect(this.phWet).connect(fxOut);
    this.fxSend.connect(this.crusher).connect(this.crWet).connect(fxOut);
    fxOut.connect(this.gate).connect(this.pre);
    this.pre.connect(this.meter);
    this.pre.connect(this.cueGain).connect(this.e.cueBus);
    this.pre.connect(this.faderGain).connect(this.xfadeGain).connect(this.e.masterBus);
  }

  /* ---------- helpers ---------- */

  get bpm() {
    return this.analysis?.bpm || 0;
  }
  /** Tempo you hear: detected BPM × rate */
  get currentBpm() {
    return this.bpm * this.rate * this.nudgeFactor;
  }
  get beatLen() {
    return this.bpm ? 60 / this.bpm : 0.5;
  }
  get duration() {
    return this.buffer?.duration || 0;
  }
  get firstBeat() {
    return this.analysis?.firstBeat || 0;
  }

  position(): number {
    if (!this.playing) return this.anchorPos;
    const now = this.ctx.currentTime;
    if (now < this.anchorCtx) return this.anchorPos; // scheduled start not reached yet
    let p = this.anchorPos + (now - this.anchorCtx) * this.rate * this.nudgeFactor;
    if (this.loop && p >= this.loop.end) {
      const len = this.loop.end - this.loop.start;
      p = this.loop.start + ((p - this.loop.start) % len);
    }
    return Math.min(p, this.duration);
  }

  snap(t: number) {
    if (!this.quantize || !this.bpm) return t;
    const b = this.beatLen;
    return this.firstBeat + Math.round((t - this.firstBeat) / b) * b;
  }

  /** Beat phase 0..1 at a track position */
  phaseAt(t: number) {
    if (!this.bpm) return 0;
    const x = (t - this.firstBeat) / this.beatLen;
    return x - Math.floor(x);
  }

  private reanchor() {
    this.anchorPos = this.position();
    this.anchorCtx = this.ctx.currentTime;
  }

  private effectiveRate() {
    return this.rate * this.nudgeFactor;
  }

  /* ---------- loading ---------- */

  async load(track: DJTrack) {
    this.stopSource(true);
    this.playing = false;
    this.track = track;
    this.buffer = null;
    this.analysis = null;
    this.loading = true;
    this.loadProgress = 0;
    this.error = null;
    this.loop = null;
    this.hotCues = Array(8).fill(null);
    this.anchorPos = 0;
    this.rate = 1;
    this.e.emit();
    try {
      const res = await fetch(proxied(track.audioUrl));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const total = Number(res.headers.get('content-length')) || 0;
      let bytes: ArrayBuffer;
      if (res.body && total) {
        const reader = res.body.getReader();
        const parts: Uint8Array[] = [];
        let got = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          parts.push(value);
          got += value.length;
          this.loadProgress = Math.min(0.9, (got / total) * 0.9);
          this.e.emit();
        }
        const all = new Uint8Array(got);
        let o = 0;
        for (const p of parts) {
          all.set(p, o);
          o += p.length;
        }
        bytes = all.buffer;
      } else {
        bytes = await res.arrayBuffer();
      }
      if (this.track !== track) return; // another track was loaded meanwhile
      const buffer = await this.ctx.decodeAudioData(bytes);
      if (this.track !== track) return;
      await new Promise((r) => setTimeout(r, 0));
      const analysis = analyzeTrack(buffer);
      this.buffer = buffer;
      this.analysis = analysis;
      cacheBpm(track.id, analysis.bpm, analysis.firstBeat);
      this.cuePoint = this.snapForce(analysis.musicStart > 0 ? analysis.musicStart : analysis.firstBeat);
      this.anchorPos = this.cuePoint;
      this.applyTrim();
      this.loadProgress = 1;
    } catch (err) {
      this.error = "Couldn't load this track";
      console.error('[DJ] load failed', err);
      this.track = null;
    } finally {
      this.loading = false;
      this.e.emit();
    }
  }

  private snapForce(t: number) {
    if (!this.analysis?.bpm) return t;
    const b = 60 / this.analysis.bpm;
    const fb = this.analysis.firstBeat;
    return Math.max(0, fb + Math.floor((t - fb) / b) * b);
  }

  /* ---------- transport ---------- */

  private stopSource(immediate = false) {
    const s = this.src;
    if (!s) return;
    this.src = null;
    const t = this.ctx.currentTime;
    if (immediate) {
      try {
        s.stop();
      } catch {}
      return;
    }
    this.declick.gain.cancelScheduledValues(t);
    this.declick.gain.setValueAtTime(this.declick.gain.value, t);
    this.declick.gain.linearRampToValueAtTime(0, t + 0.006);
    try {
      s.stop(t + 0.008);
    } catch {}
  }

  private startSource(offset: number, when = 0) {
    if (!this.buffer) return;
    const c = this.ctx;
    const startAt = Math.max(when, c.currentTime + 0.008);
    const s = c.createBufferSource();
    s.buffer = this.buffer;
    s.playbackRate.value = this.effectiveRate();
    if (this.loop) {
      s.loop = true;
      s.loopStart = this.loop.start;
      s.loopEnd = this.loop.end;
    }
    s.connect(this.declick);
    this.declick.gain.cancelScheduledValues(startAt);
    this.declick.gain.setValueAtTime(0, startAt);
    this.declick.gain.linearRampToValueAtTime(1, startAt + 0.006);
    s.start(startAt, clamp(offset, 0, Math.max(0, this.duration - 0.01)));
    s.onended = () => {
      if (this.src === s) {
        this.src = null;
        this.playing = false;
        this.anchorPos = this.duration;
        this.e.emit();
        this.e.onDeckEnded(this.id);
      }
    };
    this.src = s;
    this.anchorPos = offset;
    this.anchorCtx = startAt;
    this.playing = true;
  }

  play() {
    if (!this.buffer || this.playing) return;
    this.e.resume();
    if (this.anchorPos >= this.duration - 0.05) this.anchorPos = this.cuePoint;
    this.startSource(this.anchorPos);
    this.cuePreview = false;
    this.e.emit();
  }

  /** Sample-accurate start at an AudioContext time (used by sync-start and Auto DJ). */
  playAt(when: number, offset: number) {
    if (!this.buffer) return;
    this.stopSource(true);
    this.startSource(offset, when);
    this.e.emit();
  }

  pause() {
    if (!this.playing) return;
    this.anchorPos = this.position();
    this.stopSource();
    this.playing = false;
    this.e.emit();
  }

  togglePlay() {
    this.playing ? this.pause() : this.play();
  }

  seek(t: number) {
    const pos = clamp(t, 0, Math.max(0, this.duration - 0.01));
    if (this.loop && (pos < this.loop.start || pos >= this.loop.end)) this.loop = null;
    if (this.playing) {
      this.stopSource();
      this.startSource(pos);
    } else {
      this.anchorPos = pos;
    }
    this.e.emit();
  }

  /** CDJ-style cue: while playing → back to cue & stop; while paused → set cue (if moved) and preview while held */
  cueDown() {
    if (!this.buffer) return;
    if (this.playing && !this.cuePreview) {
      this.pause();
      this.anchorPos = this.cuePoint;
    } else if (!this.playing) {
      const here = this.position();
      if (Math.abs(here - this.cuePoint) > 0.01) this.cuePoint = this.snap(here);
      this.anchorPos = this.cuePoint;
      this.startSource(this.cuePoint);
      this.cuePreview = true;
    }
    this.e.emit();
  }

  cueUp() {
    if (this.cuePreview) {
      this.cuePreview = false;
      this.stopSource();
      this.playing = false;
      this.anchorPos = this.cuePoint;
      this.e.emit();
    }
  }

  /** pressing play while previewing the cue keeps it playing */
  latchPreview() {
    this.cuePreview = false;
  }

  hotCue(i: number) {
    if (!this.buffer) return;
    const at = this.hotCues[i];
    if (at == null) {
      this.hotCues[i] = this.snap(this.position());
      this.e.emit();
      return;
    }
    this.loop = null;
    if (this.playing) this.seek(at);
    else {
      this.anchorPos = at;
      this.play();
    }
  }

  clearHotCue(i: number) {
    this.hotCues[i] = null;
    this.e.emit();
  }

  /* ---------- loops & jumps ---------- */

  setLoop(beats: number) {
    if (!this.buffer || !this.bpm) return;
    if (this.loop && Math.abs(this.loop.beats - beats) < 1e-6) return this.exitLoop();
    const here = this.position();
    const b = this.beatLen;
    const start = this.loop ? this.loop.start : Math.max(0, this.firstBeat + Math.floor((here - this.firstBeat) / b) * b);
    const end = Math.min(this.duration, start + beats * b);
    this.loop = { start, end, beats };
    if (this.src) {
      this.src.loop = true;
      this.src.loopStart = start;
      this.src.loopEnd = end;
      if (here >= end) this.seek(start + ((here - start) % (end - start)));
    }
    this.e.emit();
  }

  /** Halve / double the active loop, keeping its start point */
  resizeLoop(factor: number) {
    if (!this.loop || !this.bpm) return;
    const beats = clamp(this.loop.beats * factor, 1 / 8, 32);
    const start = this.loop.start;
    const end = Math.min(this.duration, start + beats * this.beatLen);
    const here = this.position();
    this.loop = { start, end, beats };
    if (this.src) {
      this.src.loopEnd = end;
      if (here >= end) this.seek(start + ((here - start) % (end - start)));
      else this.reanchor();
    }
    this.e.emit();
  }

  exitLoop() {
    if (!this.loop) return;
    this.reanchor();
    this.loop = null;
    if (this.src) this.src.loop = false;
    this.e.emit();
  }

  beatJump(beats: number) {
    if (!this.bpm) return;
    this.seek(this.position() + beats * this.beatLen);
  }

  /* ---------- tempo ---------- */

  setRate(r: number) {
    const next = clamp(r, 1 - this.tempoRange, 1 + this.tempoRange);
    this.reanchor();
    this.rate = next;
    if (this.src) this.src.playbackRate.setValueAtTime(this.effectiveRate(), this.ctx.currentTime);
    this.updateFxTiming();
    this.e.emit();
  }

  setTempoRange(r: number) {
    this.tempoRange = r;
    this.setRate(this.rate);
  }

  /** Temporary pitch bend while dragging the jog wheel / holding nudge */
  nudge(amount: number) {
    this.reanchor();
    this.nudgeFactor = 1 + clamp(amount, -0.25, 0.25);
    if (this.src) this.src.playbackRate.setValueAtTime(this.effectiveRate(), this.ctx.currentTime);
  }

  endNudge() {
    if (this.nudgeFactor === 1) return;
    this.reanchor();
    this.nudgeFactor = 1;
    if (this.src) this.src.playbackRate.setValueAtTime(this.effectiveRate(), this.ctx.currentTime);
  }

  /** Match the other deck's tempo and, if both play, lock the beats in phase */
  sync() {
    const other = this.e.decks[this.id === 0 ? 1 : 0];
    if (!this.bpm || !other.bpm) return;
    let target = other.currentBpm / this.bpm;
    // allow half/double time matches
    if (target > 1.4) target /= 2;
    if (target < 0.7) target *= 2;
    if (Math.abs(target - 1) > this.tempoRange) this.setTempoRange(target > 1.16 || target < 0.84 ? 0.5 : 0.16);
    this.setRate(target);
    if (this.playing && other.playing) {
      const diff = other.phaseAt(other.position()) - this.phaseAt(this.position());
      const wrapped = diff - Math.round(diff);
      if (Math.abs(wrapped) > 0.01) this.seek(this.position() + wrapped * this.beatLen);
    }
    this.e.emit();
  }

  /* ---------- channel ---------- */

  applyTrim() {
    const auto = this.autoGain && this.analysis ? this.analysis.autoGain : 1;
    this.trim.gain.setTargetAtTime(auto * dbToGain(this.trimDb), this.ctx.currentTime, 0.02);
  }

  setTrim(db: number) {
    this.trimDb = clamp(db, -12, 12);
    this.applyTrim();
    this.e.emit();
  }

  setEq(band: 'high' | 'mid' | 'low', v: number) {
    this.eq[band] = clamp(v, -1, 1);
    const node = band === 'high' ? this.high : band === 'mid' ? this.mid : this.low;
    node.gain.setTargetAtTime(eqToGainDb(this.eq[band]), this.ctx.currentTime, 0.015);
    this.e.emit();
  }

  setFilter(v: number) {
    this.filter = clamp(v, -1, 1);
    const t = this.ctx.currentTime;
    const f = this.filter;
    const dead = Math.abs(f) < 0.03;
    const lpHz = dead || f > 0 ? 22000 : 20000 * Math.pow(200 / 20000, -f);
    const hpHz = dead || f < 0 ? 10 : 20 * Math.pow(6000 / 20, f);
    const q = dead ? 0.7 : 1.4;
    this.lp.frequency.setTargetAtTime(lpHz, t, 0.02);
    this.hp.frequency.setTargetAtTime(hpHz, t, 0.02);
    this.lp.Q.setTargetAtTime(q, t, 0.02);
    this.hp.Q.setTargetAtTime(q, t, 0.02);
    this.e.emit();
  }

  setFader(v: number) {
    this.fader = clamp(v, 0, 1);
    // audio-taper fader
    this.faderGain.gain.setTargetAtTime(this.fader * this.fader, this.ctx.currentTime, 0.01);
    this.e.emit();
  }

  setPfl(on: boolean) {
    this.pfl = on;
    this.cueGain.gain.setTargetAtTime(on ? 1 : 0, this.ctx.currentTime, 0.01);
    this.e.emit();
  }

  /** Seconds of real time per beat at the current tempo */
  private get beatSecs() {
    return this.beatLen / this.effectiveRate();
  }

  /** Keep every tempo-based effect locked to the current BPM */
  private updateFxTiming() {
    const t = this.ctx.currentTime;
    const beat = this.beatSecs;
    const b = this.fx.beats;
    this.delay.delayTime.setTargetAtTime(clamp(b * beat, 0.05, 3.9), t, 0.05);
    this.flLfo.frequency.setTargetAtTime(1 / (beat * 8 * b), t, 0.05); // one sweep per 8×beats
    this.phLfo.frequency.setTargetAtTime(1 / (beat * 4 * b), t, 0.05);
    if (this.gateOsc) this.gateOsc.frequency.setTargetAtTime(1 / (beat * b), t, 0.01);
  }

  private crushCurve(amount: number) {
    const bits = Math.round(8 - amount * 5.5); // 8 → ~3 bits
    const steps = Math.pow(2, bits);
    const n = 1024;
    const curve = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = (i / (n - 1)) * 2 - 1;
      curve[i] = Math.round(x * steps) / steps;
    }
    return curve;
  }

  private startGate() {
    if (this.gateOsc) return;
    const c = this.ctx;
    const osc = c.createOscillator();
    osc.type = 'square';
    osc.frequency.value = 1 / (this.beatSecs * this.fx.beats);
    osc.connect(this.gateDepth);
    // start on the next beat so the chop lands on the grid
    let at = c.currentTime + 0.01;
    if (this.playing && this.bpm) {
      const pos = this.position();
      const next = this.firstBeat + Math.ceil((pos - this.firstBeat) / this.beatLen) * this.beatLen;
      at = c.currentTime + Math.max(0.005, (next - pos) / this.effectiveRate());
    }
    osc.start(at);
    this.gateOsc = osc;
  }

  private stopGate() {
    if (!this.gateOsc) return;
    try {
      this.gateOsc.stop();
    } catch {}
    this.gateOsc.disconnect();
    this.gateOsc = null;
  }

  setFx(patch: Partial<Deck['fx']>) {
    this.fx = { ...this.fx, ...patch };
    const t = this.ctx.currentTime;
    const { on, type, wet } = this.fx;
    const is = (x: FxType) => on && type === x;
    const ramp = (p: AudioParam, v: number) => p.setTargetAtTime(v, t, 0.02);
    ramp(this.fxSend.gain, on && type !== 'gate' ? 1 : 0);
    ramp(this.echoWet.gain, is('echo') ? wet : 0);
    ramp(this.delayFb.gain, is('echo') ? 0.3 + wet * 0.35 : 0);
    ramp(this.reverbWet.gain, is('reverb') ? wet * 1.2 : 0);
    ramp(this.flWet.gain, is('flanger') ? 0.4 + wet * 0.6 : 0);
    ramp(this.flFb.gain, is('flanger') ? 0.3 + wet * 0.5 : 0);
    ramp(this.phWet.gain, is('phaser') ? 0.5 + wet * 0.5 : 0);
    ramp(this.crWet.gain, is('crush') ? 1 : 0);
    // inserts replace (part of) the dry signal instead of adding to it
    ramp(this.fxDry.gain, is('crush') ? 1 - Math.min(0.95, 0.4 + wet * 0.6) : 1);
    if (is('crush')) this.crusher.curve = this.crushCurve(wet);
    if (is('gate')) {
      // gain = 1 - depth/2 ± depth/2  → chops between (1 - depth) and 1
      const depth = 0.35 + wet * 0.65;
      ramp(this.gate.gain, 1 - depth / 2);
      ramp(this.gateDepth.gain, depth / 2);
      this.startGate();
    } else {
      ramp(this.gate.gain, 1);
      ramp(this.gateDepth.gain, 0);
      this.stopGate();
    }
    this.updateFxTiming();
    this.e.emit();
  }

  /* ---------- performance tools ---------- */

  /** Beat repeat while held; the track keeps running underneath (slip) and resumes there */
  rollStart(beats: number) {
    if (!this.playing || !this.bpm || this.slip) return;
    this.slip = { pos: this.position(), ctx: this.ctx.currentTime };
    this.loop = null;
    const b = this.beatLen;
    const start = this.firstBeat + Math.floor((this.slip.pos - this.firstBeat) / (b * beats)) * b * beats;
    this.loop = { start, end: Math.min(this.duration, start + b * beats), beats };
    if (this.src) {
      this.src.loop = true;
      this.src.loopStart = this.loop.start;
      this.src.loopEnd = this.loop.end;
      if (this.slip.pos >= this.loop.end) this.seek(this.loop.start);
    }
    this.e.emit();
  }

  rollEnd() {
    const s = this.slip;
    if (!s) return;
    this.slip = null;
    const resume = s.pos + (this.ctx.currentTime - s.ctx) * this.effectiveRate();
    this.loop = null;
    if (this.src) this.src.loop = false;
    this.seek(resume);
  }

  /** Vinyl-style stop: the platter slows down over `secs` then stops */
  brake(secs = 1.1) {
    if (!this.src || !this.playing || this.braking) return;
    const c = this.ctx;
    const s = this.src;
    const r0 = this.effectiveRate();
    const t = c.currentTime;
    const startPos = this.position();
    this.braking = true;
    s.playbackRate.cancelScheduledValues(t);
    s.playbackRate.setValueAtTime(r0, t);
    s.playbackRate.exponentialRampToValueAtTime(0.01, t + secs);
    this.e.emit();
    setTimeout(() => {
      if (this.src !== s) {
        this.braking = false;
        return;
      }
      // distance travelled under an exponential slow-down
      const k = Math.log(r0 / 0.01) / secs;
      const travelled = (r0 * (1 - Math.exp(-k * secs))) / k;
      this.stopSource();
      this.playing = false;
      this.anchorPos = Math.min(this.duration, startPos + travelled);
      this.braking = false;
      this.e.emit();
    }, secs * 1000);
  }

  /** Fix half/double-time detection */
  scaleBpm(factor: 0.5 | 2) {
    if (!this.analysis) return;
    this.analysis = { ...this.analysis, bpm: this.analysis.bpm * factor };
    if (this.track) cacheBpm(this.track.id, this.analysis.bpm, this.analysis.firstBeat);
    if (this.loop) this.exitLoop();
    this.updateFxTiming();
    this.e.emit();
  }

  /** Peak level 0..1 (pre-fader) for meters */
  private meterBuf = new Float32Array(1024);
  level() {
    this.meter.getFloatTimeDomainData(this.meterBuf);
    let pk = 0;
    for (let i = 0; i < this.meterBuf.length; i++) {
      const v = Math.abs(this.meterBuf[i]);
      if (v > pk) pk = v;
    }
    return pk;
  }

  /** How loud this deck is in the master right now (fader × crossfader), 0..1 */
  get onAir() {
    return this.playing ? this.fader * this.fader * this.e.xfadeGainFor(this.id) : 0;
  }

  resetMixState() {
    this.setEq('high', 0);
    this.setEq('mid', 0);
    this.setEq('low', 0);
    this.setFilter(0);
    this.setFx({ on: false });
  }
}

/* ───────────────────────── Engine ───────────────────────── */

export class DJEngine {
  ctx: AudioContext;
  decks: [Deck, Deck];
  masterBus: GainNode;
  cueBus: GainNode;
  reverbImpulse: AudioBuffer;
  masterGainNode: GainNode;
  limiter: DynamicsCompressorNode;
  out: GainNode;
  masterMeter: AnalyserNode;
  streamDest: MediaStreamAudioDestinationNode;

  crossfader = 0; // -1 (A) .. 1 (B)
  xfCurve: XfadeCurve = 'blend';
  masterLevel = 0.9;
  cueMix = 0; // 0 = cue only, 1 = master only
  headphoneLevel = 0.8;
  splitCue = false;
  headphoneDeviceId = '';
  masterDeviceId = '';

  // headphones
  private headCue: GainNode;
  private headMaster: GainNode;
  private headGain: GainNode;
  private headDest: MediaStreamAudioDestinationNode;
  private headEl: HTMLAudioElement | null = null;
  private splitMerger: ChannelMergerNode;
  private splitMaster: GainNode;
  private splitCueNode: GainNode;

  // recording
  recording = false;
  recordStartedAt = 0;
  private recorder: MediaRecorder | null = null;
  private recordChunks: Blob[] = [];
  tracklist: { trackId: string; title: string; artist: string; at: number }[] = [];
  private lastAnnounced: string | null = null;

  // live
  live = false;
  private liveRecorder: MediaRecorder | null = null;
  onLiveChunk: ((buf: ArrayBuffer) => void) | null = null;
  onNowPlaying: ((t: DJTrack | null) => void) | null = null;

  private listeners = new Set<Listener>();
  private emitQueued = false;
  deckEndedHandlers = new Set<(id: DeckId) => void>();
  private watchTimer: ReturnType<typeof setInterval>;

  constructor() {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    this.ctx = new Ctx({ latencyHint: 'interactive' });
    const c = this.ctx;
    this.reverbImpulse = this.makeImpulse(2.4, 2.2);

    this.masterBus = c.createGain();
    this.cueBus = c.createGain();
    this.masterGainNode = c.createGain();
    this.masterGainNode.gain.value = this.masterLevel;
    this.limiter = c.createDynamicsCompressor();
    this.limiter.threshold.value = -1.5;
    this.limiter.knee.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0.002;
    this.limiter.release.value = 0.15;
    this.out = c.createGain();
    this.masterMeter = c.createAnalyser();
    this.masterMeter.fftSize = 1024;
    this.streamDest = c.createMediaStreamDestination();

    this.masterBus.connect(this.masterGainNode).connect(this.limiter).connect(this.out);
    this.out.connect(this.masterMeter);
    this.out.connect(c.destination);
    this.out.connect(this.streamDest);

    // headphone mix
    this.headCue = c.createGain();
    this.headMaster = c.createGain();
    this.headGain = c.createGain();
    this.headDest = c.createMediaStreamDestination();
    this.cueBus.connect(this.headCue).connect(this.headGain);
    this.out.connect(this.headMaster).connect(this.headGain);
    this.headGain.connect(this.headDest);

    // split cue (single output): master mono → left, cue mono → right
    this.splitMerger = c.createChannelMerger(2);
    this.splitMaster = c.createGain();
    this.splitCueNode = c.createGain();
    for (const g of [this.splitMaster, this.splitCueNode]) {
      g.channelCount = 1;
      g.channelCountMode = 'explicit';
      g.channelInterpretation = 'speakers';
    }
    this.out.connect(this.splitMaster).connect(this.splitMerger, 0, 0);
    this.headGain.connect(this.splitCueNode).connect(this.splitMerger, 0, 1);

    this.decks = [new Deck(this, 0), new Deck(this, 1)];
    this.applyHeadphones();
    this.setCrossfader(0);

    // tracklist + "now playing" watcher
    this.watchTimer = setInterval(() => this.watchOnAir(), 1000);
    this.prepareSamples();
  }

  private makeImpulse(seconds: number, decay: number) {
    const rate = this.ctx.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = this.ctx.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  resume() {
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  /* ---------- events ---------- */

  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => {
      this.listeners.delete(l);
    };
  }

  emit() {
    if (this.emitQueued) return;
    this.emitQueued = true;
    queueMicrotask(() => {
      this.emitQueued = false;
      this.listeners.forEach((l) => l());
    });
  }

  onDeckEnded(id: DeckId) {
    this.deckEndedHandlers.forEach((h) => h(id));
  }

  /* ---------- mixer ---------- */

  xfadeGainFor(id: DeckId, value = this.crossfader) {
    const x = (value + 1) / 2; // 0 = A, 1 = B
    const a = this.xfCurve === 'cut' ? (x < 0.97 ? 1 : 0) : x <= 0.5 ? 1 : Math.cos((x - 0.5) * Math.PI);
    const b = this.xfCurve === 'cut' ? (x > 0.03 ? 1 : 0) : x >= 0.5 ? 1 : Math.sin(x * Math.PI);
    return id === 0 ? a : b;
  }

  setCrossfader(v: number) {
    this.crossfader = clamp(v, -1, 1);
    const t = this.ctx.currentTime;
    for (const d of this.decks) d.xfadeGain.gain.setTargetAtTime(this.xfadeGainFor(d.id), t, 0.008);
    this.emit();
  }

  setCurve(c: XfadeCurve) {
    this.xfCurve = c;
    this.setCrossfader(this.crossfader);
  }

  setMaster(v: number) {
    this.masterLevel = clamp(v, 0, 1.2);
    this.applyTalkover(); // master level respects the talkover duck
    this.emit();
  }

  private masterBuf = new Float32Array(1024);
  masterPeak() {
    this.masterMeter.getFloatTimeDomainData(this.masterBuf);
    let pk = 0;
    for (let i = 0; i < this.masterBuf.length; i++) pk = Math.max(pk, Math.abs(this.masterBuf[i]));
    return pk;
  }

  /* ---------- headphones / outputs ---------- */

  setCueMix(v: number) {
    this.cueMix = clamp(v, 0, 1);
    this.applyHeadphones();
  }

  setHeadphoneLevel(v: number) {
    this.headphoneLevel = clamp(v, 0, 1);
    this.applyHeadphones();
  }

  private applyHeadphones() {
    const t = this.ctx.currentTime;
    this.headCue.gain.setTargetAtTime(Math.cos((this.cueMix * Math.PI) / 2), t, 0.02);
    this.headMaster.gain.setTargetAtTime(Math.sin((this.cueMix * Math.PI) / 2), t, 0.02);
    this.headGain.gain.setTargetAtTime(this.headphoneLevel, t, 0.02);
    this.emit();
  }

  get supportsOutputSelection() {
    return typeof (HTMLMediaElement.prototype as any).setSinkId === 'function';
  }

  async setHeadphoneDevice(deviceId: string) {
    this.headphoneDeviceId = deviceId;
    if (!deviceId) {
      this.headEl?.pause();
      this.headEl = null;
    } else {
      if (!this.headEl) {
        this.headEl = new Audio();
        this.headEl.srcObject = this.headDest.stream;
        this.headEl.autoplay = true;
      }
      try {
        await (this.headEl as any).setSinkId(deviceId);
        await this.headEl.play();
      } catch (e) {
        console.warn('[DJ] headphone output failed', e);
      }
    }
    if (deviceId && this.splitCue) this.setSplitCue(false);
    this.emit();
  }

  async setMasterDevice(deviceId: string) {
    this.masterDeviceId = deviceId;
    try {
      if ((this.ctx as any).setSinkId) await (this.ctx as any).setSinkId(deviceId || '');
    } catch (e) {
      console.warn('[DJ] master output failed', e);
    }
    this.emit();
  }

  /** Single-output cueing: master in the left ear, cue in the right (mono) */
  setSplitCue(on: boolean) {
    this.splitCue = on;
    try {
      this.out.disconnect(this.ctx.destination);
    } catch {}
    try {
      this.splitMerger.disconnect();
    } catch {}
    if (on) this.splitMerger.connect(this.ctx.destination);
    else this.out.connect(this.ctx.destination);
    this.emit();
  }

  /* ---------- sampler ---------- */

  samples: { id: string; name: string; buffer: AudioBuffer | null }[] = SAMPLE_DEFS.map((s) => ({ id: s.id, name: s.name, buffer: null }));
  samplerVolume = 0.8;
  private samplerGain: GainNode | null = null;
  private samplesReady: Promise<void> | null = null;

  /** Render the built-in one-shots once, so pads fire instantly */
  prepareSamples() {
    if (this.samplesReady) return this.samplesReady;
    this.samplerGain = this.ctx.createGain();
    this.samplerGain.gain.value = this.samplerVolume;
    this.samplerGain.connect(this.masterBus);
    this.samplesReady = Promise.all(
      SAMPLE_DEFS.map(async (def, i) => {
        const oc = new OfflineAudioContext(2, Math.ceil(this.ctx.sampleRate * def.seconds), this.ctx.sampleRate);
        def.render(oc);
        this.samples[i].buffer = await oc.startRendering();
      })
    ).then(() => this.emit());
    return this.samplesReady;
  }

  triggerSample(id: string) {
    const s = this.samples.find((x) => x.id === id);
    if (!s?.buffer || !this.samplerGain) return;
    this.resume();
    const src = this.ctx.createBufferSource();
    src.buffer = s.buffer;
    src.connect(this.samplerGain);
    src.start();
  }

  setSamplerVolume(v: number) {
    this.samplerVolume = clamp(v, 0, 1);
    this.samplerGain?.gain.setTargetAtTime(this.samplerVolume, this.ctx.currentTime, 0.02);
    this.emit();
  }

  /* ---------- microphone (talkover) ---------- */

  micOn = false;
  micLevel = 0.9;
  talkover = true;
  micError: string | null = null;
  private micStream: MediaStream | null = null;
  private micGain: GainNode | null = null;
  micMeter: AnalyserNode | null = null;

  /** Mic goes to the recording/live stream only (not your speakers), so it never feeds back */
  async setMic(on: boolean) {
    this.micError = null;
    if (on && !this.micOn) {
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
      } catch {
        this.micError = 'Microphone permission was denied.';
        this.emit();
        return;
      }
      const c = this.ctx;
      const src = c.createMediaStreamSource(this.micStream);
      const comp = c.createDynamicsCompressor();
      comp.threshold.value = -20;
      comp.ratio.value = 4;
      this.micGain = c.createGain();
      this.micGain.gain.value = this.micLevel;
      this.micMeter = c.createAnalyser();
      this.micMeter.fftSize = 512;
      src.connect(comp).connect(this.micGain);
      this.micGain.connect(this.micMeter);
      this.micGain.connect(this.streamDest);
      this.micOn = true;
    } else if (!on && this.micOn) {
      this.micStream?.getTracks().forEach((t) => t.stop());
      this.micGain?.disconnect();
      this.micStream = null;
      this.micGain = null;
      this.micMeter = null;
      this.micOn = false;
    }
    this.applyTalkover();
    this.emit();
  }

  setMicLevel(v: number) {
    this.micLevel = clamp(v, 0, 1.5);
    this.micGain?.gain.setTargetAtTime(this.micLevel, this.ctx.currentTime, 0.02);
    this.emit();
  }

  setTalkover(on: boolean) {
    this.talkover = on;
    this.applyTalkover();
    this.emit();
  }

  /** Duck the music under your voice while the mic is open */
  private applyTalkover() {
    const duck = this.micOn && this.talkover ? 0.35 : 1;
    this.masterGainNode.gain.setTargetAtTime(this.masterLevel * duck, this.ctx.currentTime, 0.08);
  }

  private micBuf = new Float32Array(512);
  micPeak() {
    if (!this.micMeter) return 0;
    this.micMeter.getFloatTimeDomainData(this.micBuf);
    let pk = 0;
    for (let i = 0; i < this.micBuf.length; i++) pk = Math.max(pk, Math.abs(this.micBuf[i]));
    return pk;
  }

  /* ---------- tracklist / now playing ---------- */

  /** The track the audience mostly hears */
  dominantDeck(): Deck | null {
    const [a, b] = this.decks;
    const best = a.onAir >= b.onAir ? a : b;
    return best.onAir > 0.25 && best.track ? best : null;
  }

  private watchOnAir() {
    const d = this.dominantDeck();
    const id = d?.track?.id ?? null;
    if (id && id !== this.lastAnnounced) {
      this.lastAnnounced = id;
      if (this.recording && d?.track) {
        this.tracklist.push({
          trackId: d.track.id,
          title: d.track.title,
          artist: d.track.artist,
          at: Math.round((Date.now() - this.recordStartedAt) / 1000),
        });
        this.emit();
      }
      this.onNowPlaying?.(d!.track);
    }
  }

  /* ---------- recording ---------- */

  static recordingMime() {
    const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4;codecs=mp4a.40.2', 'audio/mp4'];
    return types.find((t) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t)) || '';
  }

  static liveSupported() {
    return typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported('audio/webm;codecs=opus');
  }

  startRecording() {
    if (this.recording) return;
    const mimeType = DJEngine.recordingMime();
    if (!mimeType) throw new Error('Recording is not supported in this browser');
    this.recordChunks = [];
    this.tracklist = [];
    this.lastAnnounced = null;
    this.recorder = new MediaRecorder(this.streamDest.stream, { mimeType, audioBitsPerSecond: 192000 });
    this.recorder.ondataavailable = (e) => e.data.size && this.recordChunks.push(e.data);
    this.recorder.start(1000);
    this.recording = true;
    this.recordStartedAt = Date.now();
    this.watchOnAir();
    this.emit();
  }

  stopRecording(): Promise<{ blob: Blob; duration: number; mimeType: string } | null> {
    const rec = this.recorder;
    if (!rec || !this.recording) return Promise.resolve(null);
    const duration = Math.round((Date.now() - this.recordStartedAt) / 1000);
    return new Promise((resolve) => {
      rec.onstop = () => {
        const blob = new Blob(this.recordChunks, { type: rec.mimeType });
        this.recordChunks = [];
        this.recording = false;
        this.recorder = null;
        this.emit();
        resolve({ blob, duration, mimeType: rec.mimeType });
      };
      rec.stop();
    });
  }

  /* ---------- live ---------- */

  startLiveCapture() {
    if (this.liveRecorder) return;
    if (!DJEngine.liveSupported()) throw new Error('Live streaming needs Chrome, Edge or Firefox');
    const rec = new MediaRecorder(this.streamDest.stream, { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 160000 });
    rec.ondataavailable = async (e) => {
      if (e.data.size && this.onLiveChunk) this.onLiveChunk(await e.data.arrayBuffer());
    };
    rec.start(500);
    this.liveRecorder = rec;
    this.live = true;
    this.lastAnnounced = null;
    this.watchOnAir();
    this.emit();
  }

  stopLiveCapture() {
    try {
      this.liveRecorder?.stop();
    } catch {}
    this.liveRecorder = null;
    this.live = false;
    this.emit();
  }

  destroy() {
    clearInterval(this.watchTimer);
    this.stopLiveCapture();
    try {
      this.recorder?.stop();
    } catch {}
    this.decks.forEach((d) => d.pause());
    this.headEl?.pause();
    this.micStream?.getTracks().forEach((t) => t.stop());
    this.ctx.close().catch(() => {});
  }
}
