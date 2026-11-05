'use client';

import { useEffect, useRef } from 'react';
import type { DJEngine, Deck } from './djEngine';
import type { AutoDJ } from './autoDj';

/**
 * DJ keyboard layout (physical keys, so it works on QWERTY, AZERTY, …):
 * Deck A on the left hand, Deck B mirrored on the right hand — same action, same finger.
 * Single source of truth: the help sheet is rendered from SHORTCUTS.
 */
export interface Shortcut {
  keys: [string, string?]; // [Deck A / global, Deck B]
  action: string;
}

export const SHORTCUTS: { group: string; items: Shortcut[] }[] = [
  {
    group: 'Transport',
    items: [
      { keys: ['W', 'I'], action: 'Play / pause' },
      { keys: ['Q', 'U'], action: 'Cue (hold to preview)' },
      { keys: ['E', 'O'], action: 'Sync to the other deck' },
    ],
  },
  {
    group: 'Hot cues',
    items: [
      { keys: ['1 – 4', '7 – 0'], action: 'Hot cues 1–4 (set or jump)' },
      { keys: ['Shift + 1 – 4', 'Shift + 7 – 0'], action: 'Hot cues 5–8' },
    ],
  },
  {
    group: 'Tempo & beats',
    items: [
      { keys: ['A', 'J'], action: 'Nudge slower (hold)' },
      { keys: ['S', 'K'], action: 'Nudge faster (hold)' },
      { keys: ['D', 'L'], action: 'Beat jump back 4' },
      { keys: ['F', ';'], action: 'Beat jump forward 4' },
    ],
  },
  {
    group: 'Loops & performance',
    items: [
      { keys: ['R', 'P'], action: '4-beat loop on / off' },
      { keys: ['Z', 'M'], action: 'Roll ¼ beat (hold)' },
      { keys: ['X', ','], action: 'Brake (vinyl stop)' },
      { keys: ['T', 'Y'], action: 'FX on / off' },
    ],
  },
  {
    group: 'Mixer',
    items: [
      { keys: ['G', 'H'], action: 'Headphone cue (PFL)' },
      { keys: ['← / →'], action: 'Crossfader (Shift = all the way)' },
      { keys: ['↓'], action: 'Crossfader to centre' },
    ],
  },
  {
    group: 'Booth',
    items: [
      { keys: ['Numpad 1 – 8'], action: 'Sampler pads' },
      { keys: ['Shift + R'], action: 'Start / stop recording' },
      { keys: ['Shift + D'], action: 'Auto DJ on / off' },
      { keys: ['?'], action: 'Show this cheat sheet' },
    ],
  },
];

type DeckKeys = {
  play: string;
  cue: string;
  sync: string;
  nudgeDown: string;
  nudgeUp: string;
  jumpBack: string;
  jumpFwd: string;
  loop: string;
  roll: string;
  brake: string;
  fx: string;
  pfl: string;
  hotCues: string[]; // Digit codes for cues 1–4
};

const DECK_KEYS: [DeckKeys, DeckKeys] = [
  { play: 'KeyW', cue: 'KeyQ', sync: 'KeyE', nudgeDown: 'KeyA', nudgeUp: 'KeyS', jumpBack: 'KeyD', jumpFwd: 'KeyF', loop: 'KeyR', roll: 'KeyZ', brake: 'KeyX', fx: 'KeyT', pfl: 'KeyG', hotCues: ['Digit1', 'Digit2', 'Digit3', 'Digit4'] },
  { play: 'KeyI', cue: 'KeyU', sync: 'KeyO', nudgeDown: 'KeyJ', nudgeUp: 'KeyK', jumpBack: 'KeyL', jumpFwd: 'Semicolon', loop: 'KeyP', roll: 'KeyM', brake: 'Comma', fx: 'KeyY', pfl: 'KeyH', hotCues: ['Digit7', 'Digit8', 'Digit9', 'Digit0'] },
];

const NUDGE = 0.04; // ±4 % pitch bend while held

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

export function useDJKeyboard(
  engine: DJEngine | null,
  auto: AutoDJ | null,
  handlers: { toggleRecording: () => void; showHelp: () => void; enabled: boolean }
) {
  const { enabled } = handlers;
  // handlers change every render; read them through a ref so listeners (and held keys) persist
  const h = useRef(handlers);
  h.current = handlers;

  useEffect(() => {
    if (!engine || !enabled) return;
    const held = new Set<string>();

    const manual = () => auto?.notifyManual();

    const press = (deck: Deck, k: DeckKeys, e: KeyboardEvent): boolean => {
      const code = e.code;
      const first = !e.repeat;
      // hot cues (Shift = 5–8)
      const hc = k.hotCues.indexOf(code);
      if (hc >= 0) {
        if (first) {
          manual();
          deck.hotCue(hc + (e.shiftKey ? 4 : 0));
        }
        return true;
      }
      if (e.shiftKey) return false; // remaining deck keys have no shifted meaning
      switch (code) {
        case k.play:
          if (first) {
            manual();
            deck.latchPreview();
            deck.togglePlay();
          }
          return true;
        case k.cue:
          if (first) {
            manual();
            deck.cueDown();
            held.add(code);
          }
          return true;
        case k.sync:
          if (first) {
            manual();
            deck.sync();
          }
          return true;
        case k.nudgeDown:
        case k.nudgeUp:
          if (first) {
            deck.nudge(code === k.nudgeUp ? NUDGE : -NUDGE);
            held.add(code);
          }
          return true;
        case k.jumpBack:
        case k.jumpFwd:
          manual();
          deck.beatJump(code === k.jumpFwd ? 4 : -4); // repeats while held, like hardware
          return true;
        case k.loop:
          if (first) {
            manual();
            deck.loop ? deck.exitLoop() : deck.setLoop(4);
          }
          return true;
        case k.roll:
          if (first) {
            manual();
            deck.rollStart(0.25);
            held.add(code);
          }
          return true;
        case k.brake:
          if (first) {
            manual();
            deck.brake();
          }
          return true;
        case k.fx:
          if (first) {
            manual();
            deck.setFx({ on: !deck.fx.on });
          }
          return true;
        case k.pfl:
          if (first) deck.setPfl(!deck.pfl);
          return true;
      }
      return false;
    };

    const release = (deck: Deck, k: DeckKeys, code: string) => {
      if (!held.has(code)) return;
      held.delete(code);
      if (code === k.cue) deck.cueUp();
      else if (code === k.nudgeDown || code === k.nudgeUp) deck.endNudge();
      else if (code === k.roll) deck.rollEnd();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      // a dialog is open: leave the keyboard to it (Esc is handled there)
      if (document.querySelector('[role="dialog"]')) return;

      let handled = false;
      if (e.key === '?') {
        h.current.showHelp();
        handled = true;
      } else if (e.shiftKey && e.code === 'KeyR' && !e.repeat) {
        h.current.toggleRecording();
        handled = true;
      } else if (e.shiftKey && e.code === 'KeyD' && !e.repeat) {
        if (auto) auto.enabled ? auto.stop() : auto.start();
        handled = true;
      } else if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
        manual();
        const dir = e.code === 'ArrowRight' ? 1 : -1;
        engine.setCrossfader(e.shiftKey ? dir : engine.crossfader + dir * 0.1);
        handled = true;
      } else if (e.code === 'ArrowDown') {
        manual();
        engine.setCrossfader(0);
        handled = true;
      } else if (/^Numpad[1-8]$/.test(e.code)) {
        if (!e.repeat) engine.triggerSample(engine.samples[Number(e.code.slice(6)) - 1].id);
        handled = true;
      } else {
        handled = press(engine.decks[0], DECK_KEYS[0], e) || press(engine.decks[1], DECK_KEYS[1], e);
      }
      if (handled) {
        e.preventDefault();
        engine.resume();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      release(engine.decks[0], DECK_KEYS[0], e.code);
      release(engine.decks[1], DECK_KEYS[1], e.code);
    };

    // switching windows mid-hold must not leave a deck nudged, rolling or previewing
    const releaseAll = () => {
      [...held].forEach((code) => {
        release(engine.decks[0], DECK_KEYS[0], code);
        release(engine.decks[1], DECK_KEYS[1], code);
      });
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', releaseAll);
    return () => {
      releaseAll();
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', releaseAll);
    };
  }, [engine, auto, enabled]);
}
