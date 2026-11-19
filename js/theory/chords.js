// Stupně v římských číslicích → akordy v tónině.
// Velké písmeno = dur, malé = moll; přípona určuje typ (7, maj7, °, ø …).
// Stupeň se vždy počítá od durové stupnice tóniky (bIII, bVI, bVII pro moll).

import { transposeNote, pcOf, noteName } from './notes.js';
import { spellIntervals } from './intervals.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];
const ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7 };
const DEGREE_RE = /^([b#♭♯]?)(VII|VI|V|IV|III|II|I|vii|vi|v|iv|iii|ii|i)(.*)$/;

const q = (iv, sym) => ({ iv, sym });
// [dur (velké písmeno), moll (malé písmeno)] nebo jeden typ pro obojí.
const QUALITIES = {
  '': [q(['1', '3', '5'], ''), q(['1', 'b3', '5'], 'm')],
  '7': [q(['1', '3', '5', 'b7'], '7'), q(['1', 'b3', '5', 'b7'], 'm7')],
  maj7: [q(['1', '3', '5', '7'], 'maj7'), q(['1', 'b3', '5', '7'], 'm(maj7)')],
  '6': [q(['1', '3', '5', '6'], '6'), q(['1', 'b3', '5', '6'], 'm6')],
  '9': [q(['1', '3', '5', 'b7', '9'], '9'), q(['1', 'b3', '5', 'b7', '9'], 'm9')],
  add9: [q(['1', '3', '5', '9'], 'add9'), q(['1', 'b3', '5', '9'], 'm(add9)')],
  sus2: q(['1', '2', '5'], 'sus2'),
  sus4: q(['1', '4', '5'], 'sus4'),
  '7sus4': q(['1', '4', '5', 'b7'], '7sus4'),
  '°': q(['1', 'b3', 'b5'], '°'),
  dim: q(['1', 'b3', 'b5'], '°'),
  '°7': q(['1', 'b3', 'b5', 'bb7'], '°7'),
  dim7: q(['1', 'b3', 'b5', 'bb7'], '°7'),
  'ø': q(['1', 'b3', 'b5', 'b7'], 'm7♭5'),
  m7b5: q(['1', 'b3', 'b5', 'b7'], 'm7♭5'),
  '7#9': q(['1', '3', '5', 'b7', '#9'], '7♯9'),
  '7b9': q(['1', '3', '5', 'b7', 'b9'], '7♭9'),
  '+': q(['1', '3', '#5'], '+'),
  aug: q(['1', '3', '#5'], '+'),
  '7#5': q(['1', '3', '#5', 'b7'], '7♯5'),
};

export function parseDegree(str) {
  const m = DEGREE_RE.exec(String(str));
  if (!m) throw new Error(`Neplatný stupeň: ${str}`);
  const [, accStr, roman, suffix] = m;
  const quality = QUALITIES[suffix];
  if (!quality) throw new Error(`Neznámý typ akordu „${suffix}“ ve stupni ${str}`);
  const lower = roman === roman.toLowerCase();
  const num = ROMAN[roman.toUpperCase()];
  const acc = accStr === '' ? 0 : accStr === 'b' || accStr === '♭' ? -1 : 1;
  const { iv, sym } = Array.isArray(quality) ? quality[lower ? 1 : 0] : quality;
  return { steps: num - 1, semis: MAJOR[num - 1] + acc, intervals: iv, suffix: sym };
}

export function degreeRoot(degree, tonic) {
  const d = parseDegree(degree);
  return transposeNote(tonic, d.steps, d.semis);
}

export function chordInKey(degree, tonic) {
  const d = parseDegree(degree);
  const root = transposeNote(tonic, d.steps, d.semis);
  return {
    degree,
    root,
    rootPc: pcOf(root),
    symbol: noteName(root) + d.suffix,
    intervals: d.intervals,
    tones: spellIntervals(root, d.intervals),
  };
}

export const degreeLabel = (degree) => String(degree).replace(/^b/, '♭').replace(/^#/, '♯').replace(/b(\d)/g, '♭$1');
