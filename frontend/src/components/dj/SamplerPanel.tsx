'use client';
// Renders from the DJ engine's mutable state, so opt out of React Compiler auto-memoisation.
'use no memo';

import type { DJEngine } from './djEngine';
import { Knob, Meter, PadButton } from './controls';

export default function SamplerPanel({ engine, big = false }: { engine: DJEngine; big?: boolean }) {
  return (
    <section className="rounded-2xl border border-border-light bg-surface p-3 sm:p-4 space-y-4" aria-label="Sampler and microphone">
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Sampler</p>
          <Knob label="Vol" value={engine.samplerVolume} min={0} max={1} defaultValue={0.8} bipolar={false} size={big ? 40 : 32} onChange={(v) => engine.setSamplerVolume(v)} format={(v) => `${Math.round(v * 100)}%`} />
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {engine.samples.map((s) => (
            <PadButton
              key={s.id}
              className={`${big ? 'h-16' : 'h-12'} text-[10px] leading-tight px-1`}
              disabled={!s.buffer}
              onPress={() => engine.triggerSample(s.id)}
              title={`Play ${s.name}`}
            >
              {s.name}
            </PadButton>
          ))}
        </div>
      </div>

      <div className="border-t border-border-light pt-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text-primary">Mic</p>
            <p className="text-[11px] text-text-secondary">Goes to your recording and live set, not your speakers</p>
          </div>
          <PadButton className="h-10 px-4 shrink-0" tone="danger" active={engine.micOn} onPress={() => engine.setMic(!engine.micOn)} aria-pressed={engine.micOn}>
            {engine.micOn ? 'MIC ON' : 'MIC OFF'}
          </PadButton>
        </div>
        {engine.micError && <p className="mt-2 text-xs text-red-400">{engine.micError}</p>}
        {engine.micOn && (
          <div className="mt-3 flex items-center gap-4">
            <Meter read={() => engine.micPeak()} height={48} width={6} />
            <Knob label="Level" value={engine.micLevel} min={0} max={1.5} defaultValue={0.9} bipolar={false} size={big ? 44 : 38} onChange={(v) => engine.setMicLevel(v)} format={(v) => `${Math.round(v * 100)}%`} />
            <label className="flex items-center gap-2 text-xs text-text-secondary">
              <input type="checkbox" checked={engine.talkover} onChange={(e) => engine.setTalkover(e.target.checked)} className="w-4 h-4 accent-[rgb(var(--primary-rgb))]" />
              Talkover (duck music)
            </label>
          </div>
        )}
      </div>
    </section>
  );
}
