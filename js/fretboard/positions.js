// Výpočet poloh (boxů) stupnic, oken arpeggií a ukotvení licků na hmatníku.

import { mod } from '../theory/notes.js';
import { parseInterval } from '../theory/intervals.js';
import { STRINGS, TUNING, MAX_FRET, notesOnNeck, fretMidi } from './neck.js';

const pcsOf = (rootPc, intervals) => new Set(intervals.map((iv) => mod(rootPc + parseInterval(iv).semis, 12)));

function finish(notes, index) {
  const frets = notes.map((n) => n.f);
  return { index, notes, lo: Math.min(...frets), hi: Math.max(...frets) };
}

// Polohy „N tónů na strunu“: start na k-tém tónu stupnice na basové E (k = 0 je kořen),
// pak se stoupá po tónech stupnice a na každou strunu připadne nps tónů.
// S nps = 2 vznikne pět klasických boxů pentatoniky, s nps = 3 prstoklady 3NPS.
export function npsPositions(rootPc, intervals, nps) {
  const pcs = pcsOf(rootPc, intervals);
  const pitches = [];
  for (let m = TUNING[6]; m <= TUNING[6] + 60; m++) if (pcs.has(mod(m, 12))) pitches.push(m);
  const rootIdx = pitches.indexOf(TUNING[6] + mod(rootPc - TUNING[6], 12));
  const positions = [];
  for (let k = 0; k < pcs.size; k++) {
    let idx = rootIdx + k;
    if (pitches[idx] - TUNING[6] > 12) idx = pitches.indexOf(pitches[idx] - 12);
    const notes = [];
    for (let s = 6; s >= 1; s--) {
      for (let j = 0; j < nps; j++) {
        const midi = pitches[idx++];
        notes.push({ s, f: midi - TUNING[s], midi, pc: mod(midi, 12) });
      }
    }
    const shift = Math.min(...notes.map((n) => n.f)) < 0 ? 12 : 0;
    if (shift) notes.forEach((n) => { n.f += shift; n.midi += shift; });
    positions.push(finish(notes, k + 1));
  }
  return positions;
}

// Stupnice odvozené z jiné (blues z pentatoniky): vezme boxy základní stupnice
// a doplní tóny navíc, které padnou do rozsahu boxu.
export function derivedPositions(rootPc, intervals, base) {
  const basePositions = npsPositions(rootPc, base.intervals, base.nps ?? 2);
  const extraPcs = pcsOf(rootPc, intervals.filter((iv) => !base.intervals.includes(iv)));
  return basePositions.map((p) => {
    const extra = notesOnNeck(extraPcs, p.lo, p.hi);
    return finish([...p.notes, ...extra], p.index);
  });
}

// Okna arpeggií: kolem každého akordového tónu na basové E (pražce 0–12)
// všechny akordové tóny v rozsahu `span` pražců.
export function windowPositions(rootPc, intervals, span = 4) {
  const pcs = pcsOf(rootPc, intervals);
  const seen = new Set();
  const positions = [];
  for (let f0 = 0; f0 <= 12; f0++) {
    if (!pcs.has(mod(TUNING[6] + f0, 12))) continue;
    const lo = Math.max(0, f0 - 1);
    const hi = Math.min(MAX_FRET, lo + span);
    const notes = notesOnNeck(pcs, lo, hi);
    const key = notes.map((n) => `${n.s}:${n.f}`).join(',');
    if (seen.has(key)) continue;
    seen.add(key);
    positions.push(finish(notes, positions.length + 1));
  }
  return positions;
}

export function positionsFor(def, rootPc, library) {
  if (def.positionsFrom) return derivedPositions(rootPc, def.intervals, library[def.positionsFrom]);
  if (def.nps) return npsPositions(rootPc, def.intervals, def.nps);
  return windowPositions(rootPc, def.intervals, def.span ?? 4);
}

export const centre = (p) => (p.lo + p.hi) / 2;

export function nearestPosition(positions, target) {
  if (target == null || !positions.length) return null;
  return positions.reduce((best, p) => (Math.abs(centre(p) - target) < Math.abs(centre(best) - target) ? p : best));
}

// Pražec kořene na kotevní struně: nejnižší možný, aby žádný tón licku nevyšel pod nultý pražec.
export function anchorFret(rootPc, anchorString, offsets) {
  const r0 = mod(rootPc - TUNING[anchorString], 12);
  const minOffset = Math.min(0, ...offsets);
  return r0 + minOffset >= 0 ? r0 : r0 + 12;
}

// Lick → události s absolutními pražci a časem v dobách.
// centre: ruka – lick se posune o oktávu, aby ležel co nejblíž (když se vejde na hmatník).
export function resolveLick(lick, rootPc, centre = null) {
  const offsets = lick.notes.flatMap((n) => (n.dbl ? n.dbl.map(([, f]) => f) : n.rest ? [] : [n.f]));
  let rootFret = anchorFret(rootPc, lick.anchor?.string ?? 6, offsets);
  if (centre != null && offsets.length) {
    const mid = (Math.min(...offsets) + Math.max(...offsets)) / 2;
    const up = rootFret + 12;
    if (up + Math.max(...offsets) <= MAX_FRET && Math.abs(up + mid - centre) < Math.abs(rootFret + mid - centre)) rootFret = up;
  }
  let start = 0;
  const events = lick.notes.map((n) => {
    const pairs = n.rest ? [] : n.dbl ?? [[n.s, n.f]];
    const notes = pairs.map(([s, f]) => ({ s, f: rootFret + f, midi: fretMidi(s, rootFret + f) }));
    const ev = { start, d: n.d, notes, t: n.t ?? null, bend: n.bend ?? 1, rest: !!n.rest };
    start += n.d;
    return ev;
  });
  return { rootFret, events, beats: start };
}

export { STRINGS };
