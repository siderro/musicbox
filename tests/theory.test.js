import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tonicNote, noteName, pcOf, parseNote } from '../js/theory/notes.js';
import { chordInKey, parseDegree } from '../js/theory/chords.js';
import { spellIntervals } from '../js/theory/intervals.js';
import { voiceChord } from '../js/theory/voicing.js';

const sym = (deg, key, mode = 'major') => chordInKey(deg, tonicNote(key, mode)).symbol;

test('stupně v A dur', () => {
  assert.equal(sym('I7', 9), 'A7');
  assert.equal(sym('IV7', 9), 'D7');
  assert.equal(sym('V7', 9), 'E7');
  assert.equal(sym('vi', 9), 'F♯m');
  assert.equal(sym('bVII', 9), 'G');
  assert.equal(sym('bIII', 9), 'C');
  assert.equal(sym('bVI7', 9, 'minor'), 'F7');
});

test('pravopis ve vzdálených tóninách', () => {
  assert.equal(sym('IV', 3), 'A♭');
  assert.equal(sym('vii°', 6), 'E♯°');
  assert.equal(sym('ii7', 1), 'E♭m7');
  assert.equal(sym('iv', 8, 'minor'), 'C♯m');
  assert.equal(sym('bVI', 8, 'minor'), 'E');
  assert.equal(sym('Imaj7', 0), 'Cmaj7');
  assert.equal(sym('iiø', 0), 'Dm7♭5');
});

test('tóny akordů', () => {
  const a7 = chordInKey('I7', tonicNote(9)).tones.map((t) => t.name);
  assert.deepEqual(a7, ['A', 'C♯', 'E', 'G']);
  const d7 = chordInKey('IV7', tonicNote(9)).tones.map((t) => t.name);
  assert.deepEqual(d7, ['D', 'F♯', 'A', 'C']);
});

test('stupnice se píše po písmenech', () => {
  const ebMajor = spellIntervals(parseNote('Eb'), ['1', '2', '3', '4', '5', '6', '7']).map((t) => t.name);
  assert.deepEqual(ebMajor, ['E♭', 'F', 'G', 'A♭', 'B♭', 'C', 'D']);
  const fsharpMinor = spellIntervals(parseNote('F#'), ['1', 'b3', '4', '5', 'b7']).map((t) => t.name);
  assert.deepEqual(fsharpMinor, ['F♯', 'A', 'B', 'C♯', 'E']);
});

test('všech 12 tónin bez dvojitých posuvek', () => {
  for (let k = 0; k < 12; k++) {
    for (const mode of ['major', 'minor']) {
      const tonic = tonicNote(k, mode);
      assert.equal(pcOf(tonic), k);
      for (const d of ['I', 'ii7', 'iii', 'IV', 'V7', 'vi', 'bVII', 'bIII', 'bVI', 'i7', 'iv7']) {
        const c = chordInKey(d, tonic);
        c.tones.forEach((t) => assert.ok(Math.abs(t.note.acc) <= 1, `${d} v ${noteName(tonic)}`));
      }
    }
  }
});

test('neplatný stupeň vyhodí chybu', () => {
  assert.throws(() => parseDegree('VIII'));
  assert.throws(() => parseDegree('Ixyz'));
});

test('voicing drží rozsah a plynulé vedení hlasů', () => {
  const t = tonicNote(9);
  const a = voiceChord(chordInKey('I7', t).tones);
  const d = voiceChord(chordInKey('IV7', t).tones, a);
  for (const v of [a, d]) v.forEach((m) => assert.ok(m >= 50 && m <= 72));
  const move = a.reduce((s, m, i) => s + Math.abs(m - d[i]), 0);
  assert.ok(move <= 8, `pohyb hlasů ${move}`);
});
