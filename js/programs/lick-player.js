// Přehrání licku. Když hraje groovebox, lick začne na příští první době v jeho tempu;
// jinak se před ním odpočítá jeden takt kliknutím.

import { ensureAudio, getCtx } from '../audio/engine.js';
import { pluck, warmUp } from '../audio/pluck.js';
import { click } from '../audio/clicks.js';
import { current } from '../audio/transport.js';
import { store } from '../state/store.js';

// Swing: osminy uvnitř doby v poměru 2 : 1.
function swingBeat(p) {
  const beat = Math.floor(p);
  const frac = p - beat;
  return beat + (frac < 0.5 ? frac * (4 / 3) : 2 / 3 + (frac - 0.5) * (2 / 3));
}

// at: přesný čas začátku (lick přes konkrétní akord kolečka); jinak příští „jedna“ / odpočet.
export function playLick(lick, resolved, startAt = null) {
  const ctx = ensureAudio();
  const groove = current()?.id === 'groove' ? current() : null;
  const beatDur = 60 / store.get().tempo;
  warmUp(resolved.events.flatMap((e) => e.notes.map((n) => n.midi)));

  let start;
  if (groove && startAt != null) {
    start = startAt;
  } else if (groove) {
    start = groove.nextDownbeat();
  } else {
    const t0 = ctx.currentTime + 0.1;
    for (let i = 0; i < 4; i++) click(t0 + i * beatDur, i === 0 ? 2 : 1, 'click');
    start = t0 + 4 * beatDur;
  }

  const swing = lick.feel === 'shuffle' || (lick.feel !== 'straight' && groove?.stepsPerBeat === 3);
  const at = (beats) => start + (swing ? swingBeat(beats) : beats) * beatDur;

  let prev = null; // { ev, voices, pitch }
  let pending = null; // utlumení předchozí noty, pokud na ni nenaváže slide nebo povolení bendu
  const flush = () => {
    pending?.voices.forEach((v) => v.release(pending.at, 0.06));
    pending = null;
  };
  const byString = new Map();

  for (const ev of resolved.events) {
    if (ev.rest) {
      flush();
      prev = null;
      continue;
    }
    const t = at(ev.start);
    const tEnd = at(ev.start + ev.d);
    const dur = tEnd - t;
    const single = ev.notes.length === 1 ? ev.notes[0] : null;
    const slide = single && prev?.voices.length === 1 && (prev.ev.t === '/' || prev.ev.t === '\\');
    const bendRelease = single && ev.t === 'r' && prev?.ev.t === 'b' && prev.voices.length === 1
      && prev.ev.notes[0].s === single.s && prev.ev.notes[0].f === single.f;

    let voices;
    if (slide) {
      // stejná struna zní dál, jen se posune výška
      const v = prev.voices[0];
      const to = single.midi - v.midi;
      v.rampPitch(prev.pitch, to, t - 0.02, 0.06);
      voices = [v];
      prev = { ev, voices, pitch: to };
      pending = null;
    } else if (bendRelease) {
      const v = prev.voices[0];
      v.rampPitch(ev.bend * 2, 0, t + dur * 0.15, Math.min(0.25, dur * 0.6));
      voices = [v];
      prev = { ev, voices, pitch: 0 };
      pending = null;
    } else {
      flush();
      const legato = prev && (prev.ev.t === 'h' || prev.ev.t === 'p');
      voices = ev.notes.map((n) => {
        byString.get(n.s)?.release(t, legato ? 0.004 : 0.012);
        const v = pluck(n.midi, t, { vel: legato ? 0.5 : 0.85 });
        byString.set(n.s, v);
        return v;
      });
      let pitch = 0;
      if (ev.t === 'b') {
        pitch = ev.bend * 2;
        voices.forEach((v) => v.rampPitch(0, pitch, t + 0.03, Math.min(0.22, dur * 0.45)));
      } else if (ev.t === 'r') {
        voices.forEach((v) => {
          v.holdPitch(ev.bend * 2, t);
          v.rampPitch(ev.bend * 2, 0, t + dur * 0.2, Math.min(0.25, dur * 0.6));
        });
      }
      prev = { ev, voices, pitch };
    }

    if (ev.t === '~') voices.forEach((v) => v.vibrato(t + Math.min(0.15, dur * 0.3), tEnd));
    pending = { voices, at: tEnd + 0.03 };
  }
  flush();

  return { start, beatDur, beats: resolved.beats, swing };
}

export const now = () => getCtx()?.currentTime ?? 0;
