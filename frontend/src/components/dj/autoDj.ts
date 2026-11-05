/**
 * Auto DJ — mixes tracks the way a DJ would:
 *  • preloads the next track on the idle deck
 *  • picks a mix-out point on a 16-beat phrase boundary near the end of the music
 *  • tempo-matches (±8 %, half/double time allowed) and starts the incoming track
 *    sample-accurately on the beat, so both tracks are phase-locked
 *  • 16-beat blend: crossfader sweep, bass swap at the midpoint, high-pass on the outgoing track
 *  • tempo mismatch → shorter echo-out transition instead of a train-wreck
 *  • afterwards eases the new track back to its original tempo
 */
import type { DJEngine, DJTrack, Deck, DeckId } from './djEngine';
import { getCachedBpm } from './analysis';

export type AutoDjStyle = 'full' | 'short';

interface Transition {
  from: Deck;
  to: Deck;
  startCtx: number;
  length: number; // seconds
  synced: boolean;
  fromSide: number;
  toSide: number;
}

const smoothstep = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const seg = (p: number, a: number, b: number) => smoothstep((p - a) / (b - a));

export class AutoDJ {
  enabled = false;
  style: AutoDjStyle = 'full';
  transitionBeats = 16;
  queue: DJTrack[] = [];
  status = 'Off';
  private pool: () => DJTrack[];
  private played = new Set<string>();
  private transition: Transition | null = null;
  private entered = new Map<DeckId, number>(); // track position where each deck's track came in
  private timer: ReturnType<typeof setInterval> | null = null;
  private loadingNext = false;
  private e: DJEngine;
  private unsubEnded: (() => void) | null = null;

  constructor(engine: DJEngine, pool: () => DJTrack[]) {
    this.e = engine;
    this.pool = pool;
  }

  /* ---------- public ---------- */

  start() {
    if (this.enabled) return;
    this.enabled = true;
    this.status = 'Starting…';
    const handler = (id: DeckId) => this.onEnded(id);
    this.e.deckEndedHandlers.add(handler);
    this.unsubEnded = () => this.e.deckEndedHandlers.delete(handler);
    this.timer = setInterval(() => this.tick(), 100);
    this.e.resume();
    this.tick();
    this.e.emit();
  }

  stop(reason = 'Off') {
    this.enabled = false;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.unsubEnded?.();
    this.unsubEnded = null;
    if (this.transition) this.finishTransition(true);
    this.status = reason;
    this.e.emit();
  }

  /** Called by the UI when the DJ grabs a mixer control: hand control back */
  notifyManual() {
    if (this.enabled && this.transition) this.stop('Off — you took over');
  }

  enqueue(t: DJTrack) {
    if (!this.queue.some((q) => q.id === t.id)) this.queue.push(t);
    this.e.emit();
  }

  removeFromQueue(id: string) {
    this.queue = this.queue.filter((q) => q.id !== id);
    this.e.emit();
  }

  get isMixing() {
    return !!this.transition;
  }

  /* ---------- internals ---------- */

  private sideOf(d: Deck) {
    return d.id === 0 ? -1 : 1;
  }

  private active(): Deck | null {
    const [a, b] = this.e.decks;
    if (a.playing && !b.playing) return a;
    if (b.playing && !a.playing) return b;
    if (a.playing && b.playing) return a.onAir >= b.onAir ? a : b;
    return null;
  }

  private pickNext(currentBpm: number, genre?: string): DJTrack | null {
    const loaded = new Set(this.e.decks.map((d) => d.track?.id));
    while (this.queue.length) {
      const q = this.queue.shift()!;
      if (!loaded.has(q.id)) {
        this.e.emit();
        return q;
      }
    }
    const candidates = this.pool().filter((t) => !this.played.has(t.id) && !loaded.has(t.id));
    const list = candidates.length ? candidates : this.pool().filter((t) => !loaded.has(t.id));
    if (!list.length) return null;
    if (candidates.length === 0) this.played.clear();
    // score: tempo closeness (when known), same genre, a little randomness
    const scored = list.map((t) => {
      const bpm = getCachedBpm(t.id);
      let s = Math.random() * 0.6;
      if (bpm && currentBpm) {
        const r = Math.min(Math.abs(bpm / currentBpm - 1), Math.abs((bpm * 2) / currentBpm - 1), Math.abs(bpm / 2 / currentBpm - 1));
        s += r < 0.03 ? 1.5 : r < 0.06 ? 1 : r < 0.1 ? 0.4 : 0;
      }
      if (genre && t.genre && t.genre.toLowerCase() === genre.toLowerCase()) s += 0.5;
      return { t, s };
    });
    scored.sort((x, y) => y.s - x.s);
    return scored[0].t;
  }

  private async loadInto(deck: Deck, track: DJTrack) {
    this.loadingNext = true;
    this.status = `Loading ${track.title}`;
    this.e.emit();
    try {
      await deck.load(track);
      deck.resetMixState();
      deck.setFader(1);
    } finally {
      this.loadingNext = false;
    }
  }

  /** Track position where the mix into the next track should start */
  private mixOutPoint(d: Deck): number {
    const a = d.analysis!;
    const beat = d.beatLen;
    const phrase = 16 * beat;
    const transLen = this.transitionBeats * beat;
    let target: number;
    if (this.style === 'short') {
      const entered = this.entered.get(d.id) ?? a.firstBeat;
      target = Math.min(entered + 90, a.musicEnd - transLen - 2 * beat);
    } else {
      target = a.musicEnd - transLen - 2 * beat;
    }
    target = Math.max(target, (this.entered.get(d.id) ?? 0) + 30); // play at least 30 s
    const snapped = a.firstBeat + Math.floor((target - a.firstBeat) / phrase) * phrase;
    return Math.max(a.firstBeat, Math.min(snapped, d.duration - transLen - 0.5));
  }

  private tick() {
    if (!this.enabled) return;
    const e = this.e;
    if (this.transition) return this.runTransition();

    const cur = this.active();
    const [A, B] = e.decks;

    // nothing playing yet: start the first track
    if (!cur) {
      const ready = [A, B].find((d) => d.buffer && !d.loading);
      if (ready && !this.loadingNext) {
        e.setCrossfader(this.sideOf(ready));
        ready.setFader(1);
        ready.resetMixState();
        const start = ready.analysis ? Math.max(0, ready.analysis.firstBeat) : 0;
        this.entered.set(ready.id, start);
        ready.seek(start);
        ready.play();
        if (ready.track) this.played.add(ready.track.id);
        this.status = `Playing ${ready.track?.title ?? ''}`;
        e.emit();
      } else if (!this.loadingNext && !A.loading && !B.loading) {
        const t = this.pickNext(0);
        if (t) this.loadInto(A, t);
        else this.stop('Add tracks to your library to use Auto DJ');
      }
      return;
    }

    // ease tempo back to the track's own tempo after a synced mix (~0.1 %/s)
    if (cur.playing && Math.abs(cur.rate - 1) > 0.0008) {
      cur.setRate(cur.rate + (cur.rate > 1 ? -0.0001 : 0.0001));
    }

    const next = cur.id === 0 ? B : A;
    // preload the next track
    if (!next.track && !next.loading && !this.loadingNext) {
      const t = this.pickNext(cur.currentBpm, cur.track?.genre);
      if (t) this.loadInto(next, t);
      return;
    }
    if (!cur.analysis || !next.analysis || next.loading) {
      this.status = `Playing ${cur.track?.title ?? ''}`;
      return;
    }

    const pos = cur.position();
    const out = this.mixOutPoint(cur);
    const secsLeft = (out - pos) / cur.rate;
    if (secsLeft > 0.6) {
      const m = Math.floor(secsLeft / 60);
      const s = Math.floor(secsLeft % 60);
      this.status = `Mixing into ${next.track?.title} in ${m}:${String(s).padStart(2, '0')}`;
      e.emit();
      return;
    }
    this.armTransition(cur, next);
  }

  private armTransition(cur: Deck, next: Deck) {
    const e = this.e;
    const ctx = e.ctx;
    const pos = cur.position();
    const beat = cur.beatLen;
    // start on the next beat at least 0.25 s away
    let startPos = cur.firstBeat + Math.ceil((pos + 0.25 * cur.rate - cur.firstBeat) / beat) * beat;
    if (startPos > cur.duration - 1) startPos = pos + 0.3;
    const startCtx = ctx.currentTime + (startPos - pos) / cur.rate;

    // tempo match
    let want = cur.currentBpm / next.bpm;
    if (want > 1.4) want /= 2;
    if (want < 0.7) want *= 2;
    const synced = Math.abs(want - 1) <= 0.08;
    if (synced) {
      next.setTempoRange(0.08);
      next.setRate(want);
    } else {
      next.setRate(1);
    }

    const a = next.analysis!;
    const inPoint = synced ? a.firstBeat : Math.max(0, a.musicStart);
    next.resetMixState();
    next.setFader(1);
    if (synced) next.setEq('low', -1); // bass comes in at the swap
    next.playAt(startCtx, inPoint);
    this.entered.set(next.id, inPoint);
    if (next.track) this.played.add(next.track.id);

    if (!synced) cur.setFx({ type: 'echo', beats: 0.75, wet: 0.55, on: false });

    this.transition = {
      from: cur,
      to: next,
      startCtx,
      length: synced ? (this.transitionBeats * 60) / cur.currentBpm : 6,
      synced,
      fromSide: this.sideOf(cur),
      toSide: this.sideOf(next),
    };
    this.status = synced ? `Mixing into ${next.track?.title}` : `Blending into ${next.track?.title} (tempos too far apart to beat-match)`;
    e.emit();
  }

  private runTransition() {
    const t = this.transition!;
    const e = this.e;
    const now = e.ctx.currentTime;
    if (now < t.startCtx) return;
    const p = (now - t.startCtx) / t.length;

    if (t.synced) {
      // crossfader across the first 60 %, bass swap at 50 %, outgoing high-pass in the last third
      e.setCrossfader(t.fromSide + (t.toSide - t.fromSide) * seg(p, 0, 0.6));
      t.to.setEq('low', -1 + seg(p, 0.45, 0.55));
      t.from.setEq('low', -seg(p, 0.45, 0.55));
      t.from.setFilter(0.65 * seg(p, 0.65, 1));
    } else {
      // echo-out: echo the outgoing track, filter it away, bring the new one up
      if (p > 0.05 && !t.from.fx.on) t.from.setFx({ on: true });
      t.from.setFilter(0.7 * seg(p, 0.1, 0.8));
      t.from.setFader(1 - seg(p, 0.3, 0.75));
      e.setCrossfader(t.fromSide + (t.toSide - t.fromSide) * seg(p, 0.25, 0.7));
    }

    if (p >= 1) this.finishTransition(false);
  }

  private finishTransition(aborted: boolean) {
    const t = this.transition;
    if (!t) return;
    this.transition = null;
    if (!aborted) {
      t.from.pause();
      t.from.resetMixState();
      t.from.setFader(1);
      t.from.track = null; // free the deck for the next preload
      t.from.buffer = null;
      t.from.analysis = null;
      t.to.setEq('low', 0);
      this.e.setCrossfader(t.toSide);
      this.status = `Playing ${t.to.track?.title ?? ''}`;
    }
    this.e.emit();
  }

  private onEnded(id: DeckId) {
    if (!this.enabled || this.transition) return;
    const other = this.e.decks[id === 0 ? 1 : 0];
    if (other.buffer && !other.playing) {
      this.e.setCrossfader(this.sideOf(other));
      other.resetMixState();
      other.setFader(1);
      other.seek(other.analysis?.firstBeat ?? 0);
      other.play();
      this.entered.set(other.id, other.analysis?.firstBeat ?? 0);
      if (other.track) this.played.add(other.track.id);
    }
    const ended = this.e.decks[id];
    ended.track = null;
    ended.buffer = null;
    ended.analysis = null;
    this.e.emit();
  }
}
