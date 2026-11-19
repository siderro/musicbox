// Kolečko v konkrétní tónině – sdílí ho přehrávač i zobrazení.

import { PROGRESSIONS } from '../data/progressions.js';
import { GROOVES } from '../data/grooves.js';
import { tonicNote } from '../theory/notes.js';
import { chordInKey } from '../theory/chords.js';

export function progressionOf(id) {
  return PROGRESSIONS[id] ?? Object.values(PROGRESSIONS)[0];
}

// Groove musí mít stejné metrum jako kolečko; jinak se vezme první vhodný.
export function grooveFor(id, progression) {
  const g = GROOVES[id];
  const same = (x) => x.meter[0] === progression.meter[0] && x.meter[1] === progression.meter[1];
  if (g && same(g)) return g;
  return Object.values(GROOVES).find(same) ?? Object.values(GROOVES)[0];
}

export function buildSong(state) {
  const progression = progressionOf(state.progression);
  const tonic = tonicNote(state.key, progression.mode);
  const bars = progression.bars.map((bar) => (Array.isArray(bar) ? bar : [bar]).map((d) => chordInKey(d, tonic)));
  return { progression, tonic, bars };
}

// Další akord po pozici (takt, segment).
export function nextChordAfter(bars, bar, seg) {
  if (seg + 1 < bars[bar].length) return bars[bar][seg + 1];
  return bars[(bar + 1) % bars.length][0];
}
