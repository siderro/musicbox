import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tonicNote, parseNote } from '../js/theory/notes.js';
import { chordInKey } from '../js/theory/chords.js';
import { parseInterval } from '../js/theory/intervals.js';
import { keyScale, degreeTone, intervalBetween, nameTones, rootMotion, chordFamily } from '../js/theory/harmony.js';
import { ideaFor } from '../js/teaching/ideas.js';

const C = tonicNote(0, 'major');
const Am = tonicNote(9, 'minor');
const A = tonicNote(9, 'major');
const sC = keyScale(C, 'major');
const sAm = keyScale(Am, 'minor');
const sA = keyScale(A, 'major');

const third = (deg, tonic, scale) => {
  const idea = ideaFor(chordInKey(deg, tonic), 'third', scale);
  return [idea.symbol, idea.tones.map((t) => t.name).join(' ')];
};

test('arpeggio od tercie v C dur', () => {
  assert.deepEqual(third('I', C, sC), ['Em', 'E G B']);
  assert.deepEqual(third('IV', C, sC), ['Am', 'A C E']);
  assert.deepEqual(third('V7', C, sC), ['B°', 'B D F']);
  assert.deepEqual(third('V', C, sC), ['B°', 'B D F']);
});

test('arpeggio od tercie v blues a v moll', () => {
  assert.deepEqual(third('I7', A, sA), ['C♯°', 'C♯ E G']);
  assert.deepEqual(third('IV7', A, sA), ['F♯°', 'F♯ A C']);
  assert.deepEqual(third('i', Am, sAm), ['C', 'C E G']);
  assert.deepEqual(third('V', Am, sAm), ['G♯°', 'G♯ B D']);
});

test('vedlejší dominanty doplní správnou septimu', () => {
  assert.deepEqual(third('II', C, sC), ['F♯°', 'F♯ A C']);
  assert.deepEqual(third('III7', C, sC), ['G♯°', 'G♯ B D']);
});

test('arpeggio od kvinty', () => {
  const g = (deg) => ideaFor(chordInKey(deg, C), 'fifth', sC).tones.map((t) => t.name).join(' ');
  assert.equal(g('I'), 'G B D');
  assert.equal(g('V7'), 'D F A');
});

test('barevné tóny 6 a 9', () => {
  const am = chordInKey('i', Am);
  assert.equal(degreeTone(am, 6, sAm).name, 'F');
  assert.equal(degreeTone(am, 6, sAm).interval, 'b6');
  assert.equal(degreeTone(am, 6, sAm, { colorSix: 'major' }).name, 'F♯');
  assert.equal(degreeTone(am, 9, sAm).name, 'B');
  assert.equal(degreeTone(am, 9, sAm).interval, '9');
  const e7 = chordInKey('V7', Am);
  assert.equal(degreeTone(e7, 9, sAm).interval, 'b9');
});

test('všech 12 tónin bez dvojitých posuvek', () => {
  for (let k = 0; k < 12; k++) {
    for (const mode of ['major', 'minor']) {
      const tonic = tonicNote(k, mode);
      const scale = keyScale(tonic, mode);
      for (const d of ['I', 'ii7', 'IV', 'V7', 'vi', 'i', 'iv', 'bVI', 'bVII', 'VI7', 'iiø']) {
        const chord = chordInKey(d, tonic);
        for (const n of [3, 5, 6, 7, 9]) {
          const t = degreeTone(chord, n, scale);
          assert.ok(Math.abs(t.note.acc) <= 1, `${d} ${n} v ${k} ${mode}`);
        }
      }
    }
  }
});

test('intervalBetween je inverzí parseInterval', () => {
  const c = parseNote('C');
  for (const iv of ['1', 'b2', '2', 'b3', '3', '4', '#4', 'b5', '5', 'b6', '6', 'b7', '7']) {
    const p = parseInterval(iv);
    const n = { letter: (c.letter + p.steps) % 7, acc: 0 };
    n.acc = ((p.semis - [0, 2, 4, 5, 7, 9, 11][p.steps]) + 12) % 12;
    if (n.acc > 6) n.acc -= 12;
    assert.equal(intervalBetween(c, n), iv);
  }
});

test('pojmenování, pohyb kořene a rodina akordu', () => {
  const tones = ['E', 'G', 'B'].map((x) => ({ note: parseNote(x) }));
  assert.equal(nameTones(tones), 'Em');
  assert.equal(rootMotion(chordInKey('V7', C), chordInKey('I', C)), 5);
  assert.equal(chordFamily(chordInKey('V7', C)), 'dom');
  assert.equal(chordFamily(chordInKey('ii7', C)), 'min');
  assert.equal(chordFamily(chordInKey('iiø', C)), 'hdim');
});
