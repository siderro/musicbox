// Harmonická funkce akordu v tónině: T (tónika), S (subdominanta), D (dominanta), X (mimo).
// Pozná diatonické akordy v dur i moll, vedlejší dominanty, vypůjčené akordy z paralelní tóniny
// a blues (každý akord je dominantní septakord, ale I7 je pořád tónika).

import { keyScale, chordFamily } from './harmony.js';
import { mod, pcOf } from './notes.js';

const MAJOR_FN = { 0: 'T', 2: 'S', 4: 'T', 5: 'S', 7: 'D', 9: 'T', 11: 'D' };
const MINOR_FN = { 0: 'T', 2: 'S', 3: 'T', 5: 'S', 7: 'D', 8: 'S', 10: 'D', 11: 'D' };
const WEAK = { major: [4], minor: [10] };

export function keyContext(song) {
  const mode = song.progression.mode === 'minor' ? 'minor' : 'major';
  const tonicPc = pcOf(song.tonic);
  const chords = song.bars.flat();
  const blues = song.progression.style === 'blues'
    || (chords.length > 2 && chords.every((c) => chordFamily(c) === 'dom' || (mode === 'minor' && chordFamily(c) === 'min' && c.intervals.includes('b7'))));
  return {
    tonic: song.tonic,
    tonicPc,
    mode,
    blues,
    keyPcs: new Set(keyScale(song.tonic, mode).map((t) => t.pc)),
    otherPcs: new Set(keyScale(song.tonic, mode === 'major' ? 'minor' : 'major').map((t) => t.pc)),
  };
}

const fits = (chord, pcs) => chord.tones.every((t) => pcs.has(t.pc));

export function functionOf(chord, ctx) {
  const semis = mod(chord.rootPc - ctx.tonicPc, 12);
  const fam = chordFamily(chord);

  if (ctx.blues && [0, 5, 7, 8].includes(semis)) {
    const fn = semis === 0 ? 'T' : semis === 7 ? 'D' : 'S';
    return { fn, weak: false, kind: 'blues' };
  }

  // v moll patří k tónině i V, V7 a vii°7 z harmonické moll (vodicí tón)
  const pcs = new Set(ctx.keyPcs);
  if (ctx.mode === 'minor' && (semis === 7 || semis === 11)) pcs.add(mod(ctx.tonicPc + 11, 12));
  const table = ctx.mode === 'minor' ? MINOR_FN : MAJOR_FN;

  if (fits(chord, pcs) && table[semis]) {
    const weak = WEAK[ctx.mode].includes(semis) || (ctx.mode === 'minor' && semis === 7 && fam === 'min');
    return { fn: table[semis], weak, kind: 'diatonic' };
  }

  // vedlejší dominanta: durový/dominantní akord o kvintu nad jiným akordem tóniny
  if ((fam === 'dom' || fam === 'maj') && semis !== 7) {
    const target = mod(chord.rootPc + 5, 12);
    if (ctx.keyPcs.has(target) && target !== ctx.tonicPc || (fam === 'dom' && target === ctx.tonicPc)) {
      return { fn: 'D', weak: false, kind: 'secondary', targetPc: target };
    }
  }

  // vypůjčený z paralelní tóniny (v C dur: Fm, A♭, B♭, E♭)
  if (fits(chord, ctx.otherPcs)) {
    const other = ctx.mode === 'minor' ? MAJOR_FN : MINOR_FN;
    if (other[semis]) return { fn: other[semis], weak: true, kind: 'borrowed' };
  }
  return { fn: 'X', weak: false, kind: 'outside' };
}

// Rozbor celého kolečka: segmenty (takt / část taktu) s akordem a funkcí.
export function analyzeSong(song, beatsPerBar = song.progression.meter[0]) {
  const ctx = keyContext(song);
  const segments = [];
  let start = 0;
  song.bars.forEach((chords, bar) => chords.forEach((chord, seg) => {
    const beats = beatsPerBar / chords.length;
    segments.push({ index: segments.length, bar, seg, start, beats, chord, fn: functionOf(chord, ctx) });
    start += beats;
  }));
  const byBar = song.bars.map((chords, bar) => chords.map((_, seg) => segments.findIndex((s) => s.bar === bar && s.seg === seg)));
  return { ctx, segments, byBar, total: start, beatsPerBar };
}
