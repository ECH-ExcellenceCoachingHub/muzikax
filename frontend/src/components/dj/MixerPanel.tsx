'use client';
// Renders from the DJ engine's mutable state, so opt out of React Compiler auto-memoisation.
'use no memo';

import type { DJEngine, Deck } from './djEngine';
import { eqToGainDb } from './djEngine';
import { HFader, Knob, Meter, PadButton, VFader } from './controls';

const eqFmt = (v: number) => {
  const db = eqToGainDb(v);
  return db <= -60 ? 'Kill' : `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
};
const filterFmt = (v: number) => (Math.abs(v) < 0.03 ? 'Off' : v < 0 ? `Low-pass ${Math.round(-v * 100)}%` : `High-pass ${Math.round(v * 100)}%`);

function Channel({ deck, side, onManual }: { deck: Deck; side: 'A' | 'B'; onManual: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2.5">
      <span className="text-xs font-black text-text-secondary">{side}</span>
      <Knob label="Trim" value={deck.trimDb} min={-12} max={12} defaultValue={0} size={38} onGrab={onManual} onChange={(v) => deck.setTrim(v)} format={(v) => `${v > 0 ? '+' : ''}${v.toFixed(1)} dB`} />
      <Knob label="Hi" value={deck.eq.high} onGrab={onManual} onChange={(v) => deck.setEq('high', v)} format={eqFmt} />
      <Knob label="Mid" value={deck.eq.mid} onGrab={onManual} onChange={(v) => deck.setEq('mid', v)} format={eqFmt} />
      <Knob label="Low" value={deck.eq.low} onGrab={onManual} onChange={(v) => deck.setEq('low', v)} format={eqFmt} />
      <Knob label="Filter" value={deck.filter} onGrab={onManual} onChange={(v) => deck.setFilter(v)} format={filterFmt} accent={Math.abs(deck.filter) > 0.03} />
      <PadButton
        className="w-12"
        active={deck.pfl}
        tone="primary"
        onPress={() => deck.setPfl(!deck.pfl)}
        title="Pre-listen this channel in your headphones"
        aria-pressed={deck.pfl}
      >
        <svg className="w-4 h-4 mx-auto" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-label="Cue">
          <path strokeLinecap="round" d="M3 18v-6a9 9 0 0118 0v6M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3zM3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3z" />
        </svg>
      </PadButton>
      <div className="flex items-end gap-2">
        <Meter read={() => deck.level()} height={140} />
        <VFader label={`Channel ${side} volume`} value={deck.fader} onGrab={onManual} onChange={(v) => deck.setFader(v)} height={140} marks={[0.25, 0.5, 0.75]} defaultValue={1} />
      </div>
    </div>
  );
}

export default function MixerPanel({ engine, onManual, hideCrossfader = false }: { engine: DJEngine; onManual: () => void; hideCrossfader?: boolean }) {
  const [a, b] = engine.decks;
  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border-light bg-surface p-3 sm:p-4" aria-label="Mixer">
      <div className="flex justify-between gap-2 sm:gap-4">
        <Channel deck={a} side="A" onManual={onManual} />

        {/* Master + headphones */}
        <div className="flex flex-col items-center justify-between gap-3 px-1 sm:px-2 border-x border-border-light">
          <div className="flex flex-col items-center gap-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Master</span>
            <Knob label="Level" value={engine.masterLevel} min={0} max={1.2} defaultValue={0.9} bipolar={false} size={44} onChange={(v) => engine.setMaster(v)} format={(v) => `${Math.round(v * 100)}%`} />
            <Meter read={() => engine.masterPeak()} height={120} width={8} />
          </div>
          <div className="flex flex-col items-center gap-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Phones</span>
            <Knob label="Cue / Mst" value={engine.cueMix} min={0} max={1} defaultValue={0} bipolar={false} size={38} onChange={(v) => engine.setCueMix(v)} format={(v) => (v < 0.05 ? 'Cue' : v > 0.95 ? 'Master' : `${Math.round(v * 100)}% master`)} />
            <Knob label="Vol" value={engine.headphoneLevel} min={0} max={1} defaultValue={0.8} bipolar={false} size={38} onChange={(v) => engine.setHeadphoneLevel(v)} format={(v) => `${Math.round(v * 100)}%`} />
          </div>
        </div>

        <Channel deck={b} side="B" onManual={onManual} />
      </div>

      {/* Crossfader */}
      {!hideCrossfader && <Crossfader engine={engine} onManual={onManual} />}
    </section>
  );
}

export function Crossfader({ engine, onManual }: { engine: DJEngine; onManual: () => void }) {
  return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          <span>A</span>
          <div className="flex gap-1">
            {(['blend', 'cut'] as const).map((c) => (
              <button
                key={c}
                onClick={() => engine.setCurve(c)}
                className={`px-2 py-0.5 rounded-full normal-case tracking-normal text-[10px] font-semibold ${engine.xfCurve === c ? 'bg-surface-overlay text-text-primary' : 'text-text-muted hover:text-text-primary'}`}
                title={c === 'blend' ? 'Smooth curve for blending' : 'Sharp curve for cuts and scratching'}
              >
                {c === 'blend' ? 'Blend' : 'Cut'}
              </button>
            ))}
          </div>
          <span>B</span>
        </div>
        <HFader label="Crossfader" value={engine.crossfader} onGrab={onManual} onChange={(v) => engine.setCrossfader(v)} />
      </div>
  );
}
