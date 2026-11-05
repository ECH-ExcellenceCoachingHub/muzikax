/**
 * Track analysis for DJ mode: tempo, beat grid, waveform, loudness, intro/outro.
 * Runs on a decoded AudioBuffer in a few tens of milliseconds for a 4-minute track.
 */

export interface TrackAnalysis {
  bpm: number; // detected tempo
  firstBeat: number; // seconds: position of the first beat of the grid
  duration: number;
  /** Waveform: per bucket [peak (0..1), bassRatio (0..1)] at WAVE_RATE buckets/second */
  peaks: Float32Array;
  bass: Float32Array;
  /** Linear gain that brings the track to a common loudness (for auto-gain) */
  autoGain: number;
  /** First/last second where the music is "in" (for Auto DJ mix points) */
  musicStart: number;
  musicEnd: number;
}

export const WAVE_RATE = 100; // buckets per second

const MIN_BPM = 70;
const MAX_BPM = 180;

/** Mono, decimated copy of the signal plus a low-passed copy for bass energy. */
function prepare(buffer: AudioBuffer, targetRate: number) {
  const step = Math.max(1, Math.round(buffer.sampleRate / targetRate));
  const rate = buffer.sampleRate / step;
  const chans = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
  const n = Math.floor(buffer.length / step);
  const mono = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0;
    const o = i * step;
    for (const ch of chans) s += ch[o];
    mono[i] = s / chans.length;
  }
  return { mono, rate };
}

export function analyzeTrack(buffer: AudioBuffer): TrackAnalysis {
  const duration = buffer.duration;

  /* ---------- waveform (full-rate, cheap) ---------- */
  const chans = Array.from({ length: buffer.numberOfChannels }, (_, c) => buffer.getChannelData(c));
  const buckets = Math.ceil(duration * WAVE_RATE);
  const per = buffer.sampleRate / WAVE_RATE;
  const peaks = new Float32Array(buckets);
  const bass = new Float32Array(buckets);
  // one-pole low-pass ~150 Hz to estimate bass share for colouring
  const a = Math.exp((-2 * Math.PI * 150) / buffer.sampleRate);
  let lp = 0;
  let sumSq = 0;
  for (let b = 0; b < buckets; b++) {
    const start = Math.floor(b * per);
    const end = Math.min(buffer.length, Math.floor((b + 1) * per));
    let pk = 0;
    let eAll = 0;
    let eLow = 0;
    for (let i = start; i < end; i++) {
      let s = 0;
      for (const ch of chans) s += ch[i];
      s /= chans.length;
      lp = (1 - a) * s + a * lp;
      const abs = s < 0 ? -s : s;
      if (abs > pk) pk = abs;
      eAll += s * s;
      eLow += lp * lp;
    }
    sumSq += eAll;
    peaks[b] = pk;
    bass[b] = eAll > 0 ? Math.min(1, eLow / eAll) : 0;
  }
  const rms = Math.sqrt(sumSq / Math.max(1, buffer.length));
  // target RMS ≈ -14 dBFS; never boost more than +6 dB or cut more than -9 dB
  const autoGain = rms > 0 ? Math.min(2, Math.max(0.35, 0.2 / rms)) : 1;

  /* ---------- onset envelope at ~172 fps ---------- */
  const { mono, rate } = prepare(buffer, 11025);
  const hop = 64;
  const fps = rate / hop;
  const frames = Math.floor(mono.length / hop);
  const env = new Float32Array(frames);
  const aLow = Math.exp((-2 * Math.PI * 120) / rate);
  let low = 0;
  let prevLow = 0;
  let prevAll = 0;
  for (let f = 0; f < frames; f++) {
    let eAll = 0;
    let eLow = 0;
    for (let i = f * hop, e = i + hop; i < e; i++) {
      const s = mono[i];
      low = (1 - aLow) * s + aLow * low;
      eAll += s * s;
      eLow += low * low;
    }
    eAll = Math.log1p(eAll * 1000);
    eLow = Math.log1p(eLow * 1000);
    // half-wave rectified energy increase; kicks/bass drive the beat, hats only a little
    env[f] = 0.4 * Math.max(0, eAll - prevAll) + 2 * Math.max(0, eLow - prevLow);
    prevAll = eAll;
    prevLow = eLow;
  }
  // remove slow trend so autocorrelation isn't dominated by loudness changes
  const win = Math.round(fps * 0.5);
  const det = new Float32Array(frames);
  let acc = 0;
  for (let f = 0; f < frames; f++) {
    acc += env[f];
    if (f >= win) acc -= env[f - win];
    det[f] = Math.max(0, env[f] - acc / Math.min(f + 1, win));
  }

  /* ---------- tempo by autocorrelation (middle 2 minutes) ---------- */
  const span = Math.min(frames, Math.round(fps * 120));
  const from = Math.max(0, Math.floor((frames - span) / 2));
  const minLag = Math.floor((60 * fps) / MAX_BPM);
  const maxLag = Math.ceil((60 * fps) / MIN_BPM);
  const ac = new Float32Array(maxLag + 2);
  for (let lag = minLag; lag <= maxLag + 1; lag++) {
    let s = 0;
    for (let f = from; f < from + span - lag; f++) s += det[f] * det[f + lag];
    ac[lag] = s;
  }
  const prior = (b: number) => Math.exp(-0.5 * Math.pow(Math.log2(b / 118) / 0.6, 2)); // dance range
  // candidate tempos: the strongest autocorrelation peaks
  const peaksAc: { lag: number; v: number }[] = [];
  for (let lag = minLag + 1; lag < maxLag; lag++) {
    if (ac[lag] > ac[lag - 1] && ac[lag] >= ac[lag + 1]) peaksAc.push({ lag, v: ac[lag] });
  }
  peaksAc.sort((x, y) => y.v - x.v);
  const candidates = new Set<number>();
  for (const p of peaksAc.slice(0, 5)) {
    // parabolic interpolation for sub-frame precision
    const y0 = ac[p.lag - 1];
    const y1 = ac[p.lag];
    const y2 = ac[p.lag + 1];
    const den = y0 - 2 * y1 + y2;
    const lag = den !== 0 ? p.lag + (0.5 * (y0 - y2)) / den : p.lag;
    const b = (60 * fps) / lag;
    for (const m of [0.5, 1, 2]) if (b * m >= MIN_BPM && b * m <= MAX_BPM) candidates.add(Math.round(b * m * 10) / 10);
  }
  if (!candidates.size) candidates.add(120);

  /* ---------- comb: mean onset strength on the beat grid (whole track) ----------
     Using the MEAN per beat means a double-time reading (which also lands on weak
     off-beats) scores lower than the true beat. A ±1 frame window absorbs rounding. */
  const combScore = (testBpm: number) => {
    const period = (60 * fps) / testBpm;
    let best = 0;
    let bestOff = 0;
    const steps = Math.ceil(period);
    for (let off = 0; off < steps; off++) {
      let s = 0;
      let n = 0;
      for (let t = off; t < frames - 1; t += period) {
        const r = Math.round(t);
        s += Math.max(det[r - 1] || 0, det[r], det[r + 1] || 0);
        n++;
      }
      const mean = n ? s / n : 0;
      if (mean > best) {
        best = mean;
        bestOff = off;
      }
    }
    return { score: best, offset: bestOff };
  };
  const search = (center: number, span: number, step: number) => {
    let res = { bpm: center, ...combScore(center) };
    for (let b = center - span; b <= center + span + 1e-9; b += step) {
      const r = combScore(b);
      if (r.score > res.score) res = { bpm: b, ...r };
    }
    return res;
  };
  let bestRefine = { bpm: 120, score: -1, offset: 0 };
  let bestWeighted = -1;
  for (const c of candidates) {
    const r = search(c, c * 0.02, 0.1); // ±2 %
    const w = r.score * Math.sqrt(prior(r.bpm));
    if (w > bestWeighted) {
      bestWeighted = w;
      bestRefine = r;
    }
  }
  bestRefine = search(bestRefine.bpm, 0.15, 0.01); // fine tune
  let bpm = Math.round(bestRefine.bpm * 100) / 100;
  // whole-number tempos are far more common in produced music
  if (Math.abs(bpm - Math.round(bpm)) < 0.12) bpm = Math.round(bpm);
  const firstBeat = bestRefine.offset / fps;

  /* ---------- where the music actually is (skip silence / fades) ---------- */
  const secs = Math.floor(duration);
  const loud: number[] = [];
  for (let s = 0; s < secs; s++) {
    let m = 0;
    for (let b = s * WAVE_RATE; b < (s + 1) * WAVE_RATE && b < buckets; b++) m = Math.max(m, peaks[b]);
    loud.push(m);
  }
  const sorted = [...loud].sort((x, y) => x - y);
  const median = sorted[Math.floor(sorted.length / 2)] || 0;
  const threshold = median * 0.35;
  let musicStart = 0;
  while (musicStart < secs - 1 && loud[musicStart] < threshold) musicStart++;
  let musicEnd = secs;
  while (musicEnd > musicStart + 1 && loud[musicEnd - 1] < threshold) musicEnd--;

  return { bpm, firstBeat, duration, peaks, bass, autoGain, musicStart, musicEnd };
}

/* ---------- small cache so the library can show BPM for tracks analysed before ---------- */
const CACHE_KEY = 'muzikax_dj_bpm_cache_v1';
// read localStorage once, then serve from memory (the library asks for every row on every render)
let memCache: Record<string, { bpm: number; firstBeat: number }> | null = null;
function cache() {
  if (!memCache) {
    try {
      memCache = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    } catch {
      memCache = {};
    }
  }
  return memCache!;
}

export function cacheBpm(trackId: string, bpm: number, firstBeat: number) {
  const c = cache();
  c[trackId] = { bpm, firstBeat };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(c));
  } catch {
    /* ignore */
  }
}

export function getCachedBpm(trackId: string): number | null {
  return cache()[trackId]?.bpm ?? null;
}
