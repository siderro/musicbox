// Standardní ladění. Struny číslujeme jako v tabulatuře: 1 = tenká e, 6 = basová E.

import { mod } from '../theory/notes.js';

export const TUNING = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
export const STRINGS = [1, 2, 3, 4, 5, 6];
export const MAX_FRET = 17;

export const stringMidi = (s) => TUNING[s];
export const fretMidi = (s, f) => TUNING[s] + f;

// Všechny polohy tónů z množiny pcs na hmatníku v rozsahu pražců.
export function notesOnNeck(pcs, from = 0, to = MAX_FRET) {
  const out = [];
  for (const s of STRINGS) {
    for (let f = from; f <= to; f++) {
      const midi = fretMidi(s, f);
      if (pcs.has(mod(midi, 12))) out.push({ s, f, midi, pc: mod(midi, 12) });
    }
  }
  return out;
}
