import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tonicNote } from '../js/theory/notes.js';
import { chordInKey } from '../js/theory/chords.js';
import { functionOf, keyContext, analyzeSong } from '../js/theory/function.js';
import { buildSong } from '../js/programs/song.js';

const ctxOf = (key, mode, style) => keyContext({ tonic: tonicNote(key, mode), progression: { mode, style }, bars: [] });
const fn = (deg, key, mode, style) => {
  const ctx = ctxOf(key, mode, style);
  return functionOf(chordInKey(deg, ctx.tonic), ctx);
};

test('funkce v C dur', () => {
  const want = { I: 'T', ii: 'S', iii: 'T', IV: 'S', V7: 'D', vi: 'T', 'vii°': 'D', ii7: 'S', Imaj7: 'T' };
  for (const [d, f] of Object.entries(want)) assert.equal(fn(d, 0, 'major').fn, f, d);
});

test('funkce v a moll', () => {
  const want = { i: 'T', iv: 'S', V7: 'D', V: 'D', bVI: 'S', bVII: 'D', bIII: 'T', 'iiø': 'S', v: 'D' };
  for (const [d, f] of Object.entries(want)) assert.equal(fn(d, 9, 'minor').fn, f, d);
  assert.ok(fn('v', 9, 'minor').weak);
});

test('vedlejší dominanty a vypůjčené akordy v C dur', () => {
  const a7 = fn('VI7', 0, 'major');
  assert.equal(a7.kind, 'secondary');
  assert.equal(a7.fn, 'D');
  assert.equal(fn('II', 0, 'major').kind, 'secondary');
  const fm = fn('iv', 0, 'major');
  assert.equal(fm.kind, 'borrowed');
  assert.equal(fm.fn, 'S');
});

test('blues: I7 tónika, IV7 subdominanta, V7 dominanta', () => {
  const song = buildSong({ progression: 'blues12', key: 9 });
  const a = analyzeSong(song);
  assert.ok(a.ctx.blues);
  const bySym = Object.fromEntries(a.segments.map((s) => [s.chord.symbol, s.fn.fn]));
  assert.deepEqual(bySym, { A7: 'T', D7: 'S', E7: 'D' });
});

test('každé kolečko má rozbor bez neznámých akordů', () => {
  for (const id of ['folk1645', 'trampMinor', 'minorCircle', 'secDominants', 'iiVI', 'andalusian', 'mixoVamp', 'dorianVamp', 'pop1564', 'waltzMinor', 'polka']) {
    const a = analyzeSong(buildSong({ progression: id, key: 0 }));
    a.segments.forEach((s) => assert.ok(['T', 'S', 'D', 'X'].includes(s.fn.fn), `${id} ${s.chord.symbol}`));
  }
});
