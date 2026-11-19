// Rozmístění tónů nápadu na hmatník v okně kolem ruky.

import { notesOnNeck, MAX_FRET, TUNING } from '../fretboard/neck.js';
import { mod } from '../theory/notes.js';

export const SPAN = 5;

export function handWindow(centre, span = SPAN) {
  const lo = Math.max(0, Math.min(MAX_FRET - span, Math.round(centre - span / 2)));
  return { lo, hi: lo + span };
}

// tones: [{ pc, … }] → polohy v okně [{ s, f, midi, pc, tone }]
export function placeTones(tones, win) {
  const byPc = new Map(tones.map((t) => [t.pc, t]));
  return notesOnNeck(new Set(byPc.keys()), win.lo, win.hi).map((n) => ({ ...n, tone: byPc.get(n.pc) }));
}

// Druhý hlas: k horním tónům (tóny akordu v okně) diatonická tercie nebo sexta pod nimi,
// tercie na sousední nižší struně, sexta ob jednu strunu.
export function dyadPairs(upperTones, kind, scale, win) {
  const skip = kind === 'dyad6' ? 2 : 1;
  const back = kind === 'dyad6' ? 5 : 2;
  const pairs = [];
  for (const upper of placeTones(upperTones, win)) {
    const s2 = upper.s + skip;
    if (s2 > 6) continue;
    const lowerLetter = mod(upper.tone.note.letter - back, 7);
    const lowerTone = scale.find((t) => t.note.letter === lowerLetter);
    if (!lowerTone) continue;
    let midi = upper.midi - 1;
    while (mod(midi, 12) !== lowerTone.pc) midi--;
    const f = midi - TUNING[s2];
    if (f < Math.max(0, win.lo - 1) || f > win.hi + 1) continue;
    pairs.push({ upper, lower: { s: s2, f, midi, pc: lowerTone.pc, tone: lowerTone } });
  }
  return pairs;
}
