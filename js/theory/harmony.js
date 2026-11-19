// Harmonie pro výuku: stupnice tóniny, tóny akordu podle čísla (3, 5, 7, 9, 6…)
// s doplněním chybějících tónů ze stupnice tóniny, pojmenování odvozených akordů.

import { SCALES } from '../data/scales.js';
import { spellIntervals, parseInterval } from './intervals.js';
import { pcOf, noteName, transposeNote, mod } from './notes.js';

const MAJOR = [0, 2, 4, 5, 7, 9, 11];

// Interval mezi dvěma zapsanými tóny ('b3', '5', '#4' …), inverze k parseInterval.
export function intervalBetween(a, b) {
  const steps = mod(b.letter - a.letter, 7);
  const semis = mod(pcOf(b) - pcOf(a), 12);
  const diff = mod(semis - MAJOR[steps] + 6, 12) - 6;
  const acc = diff < 0 ? 'b'.repeat(-diff) : '#'.repeat(diff);
  return `${acc}${steps + 1}`;
}

export function keyScale(tonic, mode = 'major') {
  return spellIntervals(tonic, (mode === 'minor' ? SCALES.minor : SCALES.major).intervals);
}

// číslo intervalu bez posuvek, nony/undecimy/tercdecimy složené do oktávy
const plainNum = (iv) => {
  const n = Number(String(iv).replace(/[b#]/g, ''));
  return n > 7 ? n - 7 : n;
};
const foldNum = (num) => (num > 7 ? num - 7 : num);

const ALLOWED = { 3: [3, 4], 5: [6, 7, 8], 6: [8, 9], 7: [10, 11], 2: [1, 2, 3], 4: [5, 6] };
const FALLBACK = { 3: '3', 5: '5', 6: '6', 7: 'b7', 2: '9', 4: '4' };

// Tón akordu podle čísla. Když ho akord nemá, vezme se ze stupnice tóniny (podle písmene);
// když by tak vyšel nesmyslný interval, použije se běžný (b7, 9, 6 …).
// opts.colorSix = 'major' → šestka vždy velká (dórská barva).
export function degreeTone(chord, num, scale, opts = {}) {
  const f = foldNum(num);
  const own = chord.tones.find((t) => plainNum(t.interval) === f);
  let interval;
  let note;
  let filled = false;
  if (own && !(f === 6 && opts.colorSix === 'major')) {
    ({ interval, note } = own);
  } else {
    filled = true;
    const letter = mod(chord.root.letter + f - 1, 7);
    const fromScale = scale?.find((t) => t.note.letter === letter);
    interval = fromScale ? intervalBetween(chord.root, fromScale.note) : FALLBACK[f];
    if (f === 6 && opts.colorSix === 'major') interval = '6';
    const semis = parseInterval(interval).semis % 12;
    if (ALLOWED[f] && !ALLOWED[f].includes(semis)) interval = FALLBACK[f];
    const p = parseInterval(interval);
    note = transposeNote(chord.root, p.steps, p.semis);
  }
  if (num === 9) interval = interval.replace(/2$/, '9');
  return { num, interval, note, pc: pcOf(note), name: noteName(note), filled };
}

export const guideTones = (chord, scale) => [degreeTone(chord, 3, scale), degreeTone(chord, 7, scale)];

const TRIADS = { '1,3,5': '', '1,b3,5': 'm', '1,b3,b5': '°', '1,3,#5': '+' };
const SEVENTHS = { '1,3,5,7': 'maj7', '1,3,5,b7': '7', '1,b3,5,b7': 'm7', '1,b3,b5,b7': 'm7♭5', '1,b3,b5,bb7': '°7', '1,b3,5,7': 'm(maj7)' };

// Jméno akordu z tónů (první tón = kořen): [E, G, B] → 'Em'.
export function nameTones(tones) {
  const root = tones[0].note;
  const ivs = tones.map((t) => intervalBetween(root, t.note));
  const key = ivs.join(',');
  const sym = SEVENTHS[key] ?? TRIADS[ivs.slice(0, 3).join(',')];
  return sym == null ? null : noteName(root) + sym;
}

// Pohyb kořene v půltónech nahoru (5 = o kvartu nahoru / kvintu dolů, typické V → I).
export const rootMotion = (a, b) => mod(b.rootPc - a.rootPc, 12);

export function chordFamily(chord) {
  const ivs = new Set(chord.intervals);
  if (ivs.has('b3') && ivs.has('b5')) return ivs.has('b7') ? 'hdim' : 'dim';
  if (ivs.has('b3')) return 'min';
  if (!ivs.has('3')) return 'sus';
  if (ivs.has('b7')) return 'dom';
  return 'maj';
}
